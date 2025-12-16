"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { firstValueFrom } from "rxjs";
import { adminKycListApi } from "@/app/api/admin/kyc/list";
import { extractAdminListItems } from "@/app/api/admin/user/list";
import { parseError } from "@/app/utils/parse-error";
import { Loader } from "@/app/components/Loader";
import s from "./adminNotificationsBell.module.scss";

type NotificationItem = {
  id: number;
  rawType?: string | null;
  userId?: number | null;
  createdAt?: string | null;
  typeLabel: "PRE-KYC" | "KYC" | "Другая заявка";
};

const DEFAULT_TYPES = ["individual_basic", "basic", "individual_full", "full", "individual", "legal", "legal_pre"];

const normalizeTypeKey = (value?: string | null) => (value ? value.trim().toLowerCase() : "");

const mapTypeForApi = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("legal_pre")) return "legal_pre";
  if (normalized.includes("legal") && normalized.includes("pre")) return "legal_pre";
  if (normalized.includes("legal")) return "legal";
  if (normalized === "individual_basic" || normalized === "basic") return "individual";
  if (normalized === "individual_full" || normalized === "full") return "individual";
  if (normalized === "individual") return "individual";
  return value.trim();
};

const detectTypeLabel = (value?: string | null): NotificationItem["typeLabel"] => {
  const normalized = normalizeTypeKey(value);
  if (!normalized) return "Другая заявка";
  if (normalized.includes("pre") || normalized.includes("basic")) return "PRE-KYC";
  if (normalized.includes("full") || normalized.includes("kyc") || normalized.includes("legal")) return "KYC";
  return "Другая заявка";
};

const deriveFormType = (value?: string | null): "basic" | "full" | undefined => {
  const normalized = normalizeTypeKey(value);
  if (!normalized) return undefined;
  if (normalized.includes("pre") || normalized.includes("basic")) return "basic";
  if (normalized.includes("full") || normalized.includes("kyc") || normalized.includes("legal")) return "full";
  return undefined;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

export default function AdminNotificationsBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const notificationTypes = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_TYPES.forEach((entry) => {
      const mapped = mapTypeForApi(entry) ?? entry;
      const normalized = normalizeTypeKey(mapped);
      if (normalized && !map.has(normalized)) {
        map.set(normalized, mapped);
      }
    });
    return Array.from(map.values());
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const fetchNotifications = async (showLoader: boolean) => {
      if (!isMounted) return;
      if (showLoader) setLoading(true);
      setError("");

      try {
        const responses = await Promise.all(
          notificationTypes.map((entry) => {
            const mappedType = mapTypeForApi(entry) ?? entry;
            const params: { statuses: string[]; page: number; perPage: number; form_type?: "basic" | "full" } = {
              statuses: ["new", "created"],
              page: 1,
              perPage: 10,
            };
            const derived = deriveFormType(entry);
            if (derived) params.form_type = derived;
            return firstValueFrom(adminKycListApi(mappedType, params));
          })
        );

        if (!isMounted) return;

        const collected: NotificationItem[] = [];

        responses.forEach((result, index) => {
          const sourceType = notificationTypes[index];
          const items = extractAdminListItems(result);
          items.forEach((item) => {
            const createdAt = item.created_at ?? item.createdAt ?? item.created ?? null;
            const rawType = item.type ?? item.kyc_type ?? item.form_type ?? sourceType;
            const userId = item.user_id ?? item.userId ?? item.user?.id ?? null;
            collected.push({
              id: item.id,
              rawType,
              userId,
              createdAt,
              typeLabel: detectTypeLabel(rawType),
            });
          });
        });

        const dedup = new Map<string, NotificationItem>();
        collected.forEach((item) => {
          const key = `${item.id}-${normalizeTypeKey(item.rawType)}`;
          const existing = dedup.get(key);
          if (!existing) {
            dedup.set(key, item);
            return;
          }
          const nextTs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
          const prevTs = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
          if (nextTs > prevTs) dedup.set(key, item);
        });

        const normalized = Array.from(dedup.values()).sort((a, b) => {
          const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTs - aTs;
        });

        setNotifications(normalized.slice(0, 20));
      } catch (err) {
        if (isMounted) setError(parseError(err as Error));
      } finally {
        if (isMounted) {
          if (showLoader) setLoading(false);
          timer = setTimeout(() => fetchNotifications(false), 15000);
        }
      }
    };

    fetchNotifications(true);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [notificationTypes]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current && target && !anchorRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const notificationCount = notifications.length;

  return (
    <div className={s.notificationBell} ref={anchorRef}>
      <button
        type="button"
        className={s.bellButton}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Уведомления о новых заявках"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M12 3.5C8.96243 3.5 6.5 5.96243 6.5 9V10.7041C6.5 11.409 6.26424 12.0941 5.8335 12.6483L4.75751 14.0029C3.8644 15.1366 4.67458 16.75 6.09996 16.75H17.9C19.3254 16.75 20.1356 15.1366 19.2425 14.0029L18.1665 12.6483C17.7358 12.0941 17.5 11.409 17.5 10.7041V9C17.5 5.96243 15.0376 3.5 12 3.5Z"
            stroke="#1F2937"
            strokeWidth="1.6"
          />
          <path
            d="M10 18C10.2761 18.7956 10.8954 19.5 12 19.5C13.1046 19.5 13.7239 18.7956 14 18"
            stroke="#1F2937"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className={s.bellLabel}>Новые заявки</span>
        <span className={`${s.bellBadge} ${notificationCount === 0 ? s.bellBadgeMuted : ""}`}>{notificationCount}</span>
      </button>

      {open && (
        <div className={s.notificationDropdown} role="dialog" aria-label="Список уведомлений">
          <div className={s.notificationHeader}>
            <span>Уведомления</span>
            {loading && <Loader size={14} />}
          </div>
          {error && <div className={s.notificationError}>{error}</div>}
          {!loading && notifications.length === 0 && <div className={s.notificationEmpty}>Новых заявок нет.</div>}
          {!loading && notifications.length > 0 && (
            <div className={s.notificationList}>
              {notifications.map((item) => (
                <div key={`${item.id}-${normalizeTypeKey(item.rawType)}`} className={s.notificationItem}>
                  <div className={s.notificationItemTop}>
                    <span className={s.notificationType}>{item.typeLabel}</span>
                    <span className={s.notificationDate}>{formatDateTime(item.createdAt)}</span>
                  </div>
                  <div className={s.notificationMeta}>
                    <span className={s.notificationStrong}>Заявка #{item.id}</span>
                    {item.userId ? (
                      <span className={s.notificationHint}>ID пользователя: {item.userId}</span>
                    ) : (
                      <span className={s.notificationHint}>ID пользователя не указан</span>
                    )}
                    {item.rawType && <span className={s.notificationHint}>Тип: {item.rawType}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
