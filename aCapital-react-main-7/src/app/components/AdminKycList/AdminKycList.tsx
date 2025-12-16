"use client";

import { useEffect, useMemo, useState, Fragment, useCallback } from "react";
import { Subscription, firstValueFrom } from "rxjs";
import { adminKycListApi, AdminKycListItem } from "@/app/api/admin/kyc/list";
import { adminKycGetApi } from "@/app/api/admin/kyc/get";
import { adminKycSetStatusApi } from "@/app/api/admin/kyc/set-status";
import { adminUserGetApi, AdminUserDetail } from "@/app/api/admin/user/get";
import { extractAdminListItems } from "@/app/api/admin/user/list";
import { adminTemplateListApi } from "@/app/api/admin/templates/list";
import { adminTemplateApplyApi } from "@/app/api/admin/templates/apply";
import { parseError } from "@/app/utils/parse-error";
import { API_URL } from "@/app/api/http";
import { authToken$ } from "@/app/services/authorization";
import { Loader } from "@/app/components/Loader";
import tableStyles from "../ClientsTable/clientsTable.module.scss";
import drawerStyles from "./adminKycList.module.scss";
import t from "./adminKycTable.module.scss";

type StatusState<T> = {
  items: T[];
  loading: boolean;
  error: string;
};

type DetailState<T> = {
  loading: boolean;
  error: string;
  data: T;
};

type TemplateOption = {
  id: number;
  name: string;
  type: "prekyc" | "kyc";
};

const initialState = <T,>(): StatusState<T> => ({
  items: [],
  loading: false,
  error: "",
});

const initialDetailState = <T,>(data: T): DetailState<T> => ({
  loading: false,
  error: "",
  data,
});

const formatLabel = (label: string) =>
  label
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (str) => str.toUpperCase());

const labelTranslations: Record<string, string> = {
  first_name: "Имя",
  last_name: "Фамилия",
  middle_name: "Отчество",
  document_name: "Документ",
  document_series: "Серия",
  document_number: "Номер документа",
  document_issue_date: "Дата выдачи",
  document_expiry_date: "Срок действия",
  document_issuing_authority: "Орган выдачи / код подразделения",
  citizenship: "Гражданство",
  tariff_selection: "Тарифы",
  tax_number: "ИНН",
  contact_info: "Контакты",
  phone_number: "Телефон",
  fax: "Факс",
  email: "Email",
  additional_contact_info: "Доп. контакты",
  tax_residence: "Налоговое резиденство",
  is_kyrgyzstan_resident: "Резидент КР",
  tax_residency_in_other_countries: "Резиденство в других странах",
  stay_permit: "Вид на жительство",
  document_basis: "Документ основание",
  representative: "Представитель",
  representative_without_power_of_attorney: "Представитель без доверенности",
  representative_with_power_of_attorney: "Представитель по доверенности",
  basis_document: "Основание полномочий",
  beneficial_owner: "Бенефициарный владелец",
  beneficiary: "Выгодоприобретатель",
  contract_number: "Номер договора",
  contract_date: "Дата договора",
  pep: "Публичное лицо (PEP)",
  pep_relative: "PEP среди родственников",
  position: "Должность",
  employer: "Работодатель",
  employer_address: "Адрес работодателя",
  relationship_degree: "Степень родства",
  us_taxpayer_indicators: "Признаки налогоплательщика США",
  business_relationship: "Деловые отношения",
  purpose_of_relationship: "Цели отношений",
  nature_of_relationship: "Характер отношений",
  financial_business_activity_goals: "Цели фин./бизнес активности",
  financial_status: "Финансовое состояние",
  business_reputation: "Деловая репутация",
  sources_of_funds: "Источники средств",
  user_consent_data: "Согласия",
  personal_data_processing_consent: "Согласие на обработку ПДн",
  information_accuracy_confirmation: "Подтверждение достоверности",
  fatca_consent: "Согласие FATCA",
  general_information: "Общие сведения",
  legal_form: "Орг.-прав. форма",
  client_code: "Код клиента",
  full_name_ru: "Полное наименование (RU)",
  short_name_ru: "Сокр. наименование (RU)",
  full_name_foreign: "Полное наименование (EN)",
  short_name_foreign: "Сокр. наименование (EN)",
  beneficiary_name: "Выгодоприобретатель",
  legal_status: "Правовое положение",
  addresses: "Адреса",
  contacts: "Контакты",
  website: "Сайт",
  license_data: "Лицензии",
  bank_info: "Банковские реквизиты",
  structure_and_assets: "Структура/имущество",
  registration_and_tax_info: "Регистрация и налоги",
  has_registration_before_2002: "Регистрация до 2002",
  consent: "Согласие",
};

const translateLabel = (raw: string): string => {
  const normalized = raw.toLowerCase();
  if (labelTranslations[normalized]) return labelTranslations[normalized];
  const segments = normalized.split(".");
  const translatedSegments = segments.map((seg) => labelTranslations[seg] ?? formatLabel(seg));
  return translatedSegments.join(" • ");
};

const statusLabels: Record<string, string> = {
  new: "Новая",
  created: "Новая",
  checking: "Проверка",
  extra_data_review: "Проверка",
  signing: "Подписание",
  done: "Готово",
  approved: "Готово",
  rejected: "Отказ",
  returned_for_corrections: "Возврат на доработку",
  extra_data_requested: "Запрос доп. данных",
  manual_review: "Ручная проверка",
  processing: "Проверка",
};

const translateStatus = (status?: string | null) => {
  if (!status) return "—";
  const normalized = status.toLowerCase();
  return statusLabels[normalized] ?? status;
};

const renderValue = (value: unknown): React.ReactNode => {
  if (value === null || typeof value === "undefined") return "—";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (value.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")) {
      return value.map((item) => (typeof item === "boolean" ? (item ? "Да" : "Нет") : String(item))).join(", ");
    }
    return (
      <pre className={drawerStyles.pre}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className={drawerStyles.pre}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
};

const flattenPayload = (value: unknown, prefix = ""): Array<{ label: string; value: string }> => {
  const entries: Array<{ label: string; value: string }> = [];
  if (value === null || typeof value === "undefined") return entries;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    entries.push({ label: translateLabel(prefix), value: String(renderValue(value)) });
    return entries;
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")) {
      entries.push({
        label: translateLabel(prefix),
        value: value
          .map((item) => (typeof item === "boolean" ? (item ? "Да" : "Нет") : String(item)))
          .join(", "),
      });
      return entries;
    }
    // массив объектов — отдельные строки с индексом
    value.forEach((item, index) => {
      const nestedPrefix = prefix ? `${prefix} [${index + 1}]` : `[${index + 1}]`;
      entries.push(...flattenPayload(item, nestedPrefix));
    });
    return entries;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, val]: [string, unknown]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      entries.push(...flattenPayload(val, nextPrefix));
    });
    return entries;
  }

  entries.push({ label: formatLabel(prefix), value: String(value) });
  return entries;
};

const formatDateTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

type AdminKycListProps = {
  type: string | string[];
  title: string;
  hint: string;
  status?: string | string[];
  perPage?: number;
  filterTypes?: string[];
  fallbackTypes?: string[];
  formType?: "basic" | "full";
};

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

const normalizeTypeKey = (value?: string | null) => (value ? value.trim().toLowerCase() : "");

const extractObject = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

const extractPayload = (item?: AdminKycListItem | null): Record<string, unknown> | null => {
  if (!item) return null;
  return (
    extractObject(item.payload) ??
    extractObject((item as { kyc_data?: unknown }).kyc_data) ??
    extractObject(item.kyc) ??
    extractObject((item as { kycData?: unknown }).kycData) ??
    extractObject((item as { additional_data?: unknown }).additional_data) ??
    extractObject((item as { additionalData?: unknown }).additionalData) ??
    null
  );
};

const expandTypeVariants = (value?: string | null): string[] => {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  const normalized = trimmed.toLowerCase();
  const variants = new Set<string>([trimmed]);

  if (normalized.includes("basic")) {
    variants.add("basic");
    variants.add("individual_basic");
    variants.add("individual");
  }

  if (normalized.includes("full")) {
    variants.add("full");
    variants.add("individual_full");
    variants.add("individual");
  }

  if (normalized.includes("legal")) {
    if (normalized.includes("pre")) {
      variants.add("legal_pre");
    } else {
      variants.add("legal");
    }
  }

  if (normalized === "individual") {
    variants.add("individual");
  }

  const mapped = mapTypeForApi(trimmed);
  if (mapped) {
    variants.add(mapped);
  }

  return Array.from(variants);
};

const pickTypeString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

const mergeStatuses = (...groups: Array<string[] | undefined>) => {
  const map = new Map<string, string>();
  groups.forEach((group) => {
    group?.forEach((status) => {
      if (typeof status !== "string") return;
      const trimmed = status.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!map.has(key)) {
        map.set(key, trimmed);
      }
    });
  });
  return Array.from(map.values());
};

type SelectedEntry = { id: number; type?: string | null };

export default function AdminKycList({
  type,
  hint,
  title,
  status,
  perPage = 20,
  filterTypes,
  fallbackTypes = [],
  formType,
}: AdminKycListProps) {
  const primaryType = useMemo(() => {
    if (Array.isArray(type)) {
      const preferred = type.find((value) => value && value.toLowerCase().includes("individual"));
      return preferred ?? type[0] ?? "individual";
    }
    return type ?? "individual";
  }, [type]);
  const contextTemplateType = useMemo<"prekyc" | "kyc" | undefined>(() => {
    const candidates: string[] = [];
    const push = (v?: string | string[]) => {
      if (!v) return;
      if (Array.isArray(v)) candidates.push(...v);
      else candidates.push(v);
    };
    push(type);
    push(filterTypes);
    push(fallbackTypes);
    const normalized = candidates
      .filter(Boolean)
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
    if (normalized.some((v) => v.includes("pre") || v.includes("basic"))) return "prekyc";
    if (normalized.some((v) => v.includes("kyc") || v.includes("full"))) return "kyc";
    return undefined;
  }, [type, filterTypes, fallbackTypes]);
  const [state, setState] = useState<StatusState<AdminKycListItem>>(initialState);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry | null>(null);
  const [drawerRefreshToken, setDrawerRefreshToken] = useState(0);
  const [detailState, setDetailState] = useState<DetailState<AdminKycListItem | null>>(initialDetailState<AdminKycListItem | null>(null));
  const [attachments, setAttachments] = useState<
    Array<{ id: number; name: string; download_url: string; uploaded_at?: string }>
  >([]);
  const [statusInput, setStatusInput] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const drawerOpen = selectedEntry !== null;
  const [activeType, setActiveType] = useState<string | null>(() => {
    return primaryType ?? null;
  });

  const handleDownload = useCallback((url: string, filename: string) => {
    const absoluteUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
    firstValueFrom(authToken$).then(async (token) => {
      if (!token) {
        window.open(absoluteUrl, "_blank");
        return;
      }
      try {
        const res = await fetch(absoluteUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("download_failed");
        const blob = await res.blob();
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename || "attachment";
        link.style.display = "none";
        
        // Проверяем, что document.body существует
        if (!document.body) {
          URL.revokeObjectURL(url);
          throw new Error("Document body not available");
        }
        
        document.body.appendChild(link);
        
        // Используем requestAnimationFrame для гарантии, что элемент добавлен
        requestAnimationFrame(() => {
          link.click();
          
          // Удаляем элемент асинхронно после клика
          setTimeout(() => {
            try {
              // Проверяем, что элемент все еще существует и находится в DOM
              if (link && link.parentNode && link.parentNode === document.body) {
                document.body.removeChild(link);
              } else if (link && link.parentNode) {
                link.remove();
              }
            } catch (error) {
              // Игнорируем ошибки при удалении элемента
              console.warn("Failed to remove download link:", error);
            } finally {
              URL.revokeObjectURL(url);
            }
          }, 200);
        });
      } catch {
        window.open(absoluteUrl, "_blank");
      }
    });
  }, []);

  const statusesFilter = useMemo(() => {
    if (status === undefined) return undefined;
    if (status === null) return undefined;
    return Array.isArray(status) ? status : [status];
  }, [status]);

  const typesToRequest = useMemo(() => {
    const base = Array.isArray(type) ? type : type ? [type] : [];
    const combined = [...base, ...fallbackTypes];
    const unique = combined.filter((value, index) => value && combined.indexOf(value) === index) as string[];
    return unique.length > 0 ? unique : ["individual_basic", "individual", "legal"];
  }, [type, fallbackTypes]);

  const closeDrawer = () => {
    setSelectedEntry(null);
    setStatusInput("");
    setStatusLoading(false);
    setDetailState(initialDetailState<AdminKycListItem | null>(null));
  };

  const selectedItem = useMemo(() => {
    if (!selectedEntry) return null;
    const normalizedType = normalizeTypeKey(selectedEntry.type);
    const byIdAndType = state.items.find(
      (entry) =>
        entry.id === selectedEntry.id &&
        (normalizedType ? normalizeTypeKey(entry.api_type ?? entry.type) === normalizedType : true),
    );
    if (byIdAndType) return byIdAndType;
    return state.items.find((entry) => entry.id === selectedEntry.id) ?? null;
  }, [state.items, selectedEntry]);

  const typeCandidates = useMemo<string[]>(() => {
    const sources: Array<string | null | undefined> = [
      detailState.data?.api_type,
      detailState.data?.type,
      selectedItem?.api_type,
      selectedItem?.type,
      selectedEntry?.type,
      activeType,
      primaryType,
      "individual",
      "basic",
      "full",
      "individual_basic",
      "individual_full",
    ];

    const map = new Map<string, string>();

    sources.forEach((value) => {
      expandTypeVariants(value ?? undefined).forEach((variant) => {
        const lower = variant.toLowerCase();
        if (!map.has(lower)) {
          map.set(lower, variant);
        }
      });
    });

    return Array.from(map.values());
  }, [detailState.data?.api_type, detailState.data?.type, selectedItem?.api_type, selectedItem?.type, selectedEntry?.type, activeType, primaryType]);

  const typeCandidatesKey = useMemo(() => typeCandidates.join("|"), [typeCandidates]);

  const handleStatusUpdate = () => {
  if (!selectedEntry?.id || !statusInput.trim()) {
      return;
    }

    const nextStatus = statusInput.trim();
    setStatusLoading(true);

    const statusVariants = mergeStatuses([nextStatus], [nextStatus.toUpperCase()], [nextStatus.toLowerCase()]);

    const attemptUpdate = (typeIndex: number, statusVariantIndex: number) => {
      if (typeIndex >= typeCandidates.length) {
        alert("Не удалось изменить статус: неподдерживаемый тип заявки.");
        setStatusLoading(false);
        return;
      }

      if (statusVariantIndex >= statusVariants.length) {
        attemptUpdate(typeIndex + 1, 0);
        return;
      }

      const candidate = typeCandidates[typeIndex];
      const candidateTrimmed = candidate?.trim() || "individual";
      const mappedCandidate = mapTypeForApi(candidateTrimmed) ?? candidateTrimmed;
      const statusToSend = statusVariants[statusVariantIndex];

      adminKycSetStatusApi({ id: selectedEntry.id, type: mappedCandidate, status: statusToSend }).subscribe({
        next: (result) => {
          if (!result.success) {
            const message = typeof result === "object" ? JSON.stringify(result) : "Не удалось изменить статус.";
            alert(message);
            setStatusLoading(false);
            return;
          }

          setStatusInput(statusToSend);
          setDetailState((prev) =>
            prev.data
              ? {
                  loading: prev.loading,
                  error: prev.error,
                  data: {
                    ...prev.data,
                    status: statusToSend,
                    available_statuses: mergeStatuses(prev.data.available_statuses as string[] | undefined, [statusToSend]),
                    api_type: mappedCandidate,
                  },
                }
              : prev
          );
          setState((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
              item.id === selectedEntry.id
                ? {
                    ...item,
                    status: statusToSend,
                    api_type: mappedCandidate,
                    available_statuses: mergeStatuses(item.available_statuses as string[] | undefined, [statusToSend]),
                  }
                : item
            ),
          }));
          setStatusLoading(false);
          setDrawerRefreshToken((prev) => prev + 1);
          setReloadToken((prev) => prev + 1);
        },
        error: (error: Error) => {
          const message = parseError(error);
          const lowerMessage = message.toLowerCase();
          if (lowerMessage.includes("status") && statusVariantIndex + 1 < statusVariants.length) {
            attemptUpdate(typeIndex, statusVariantIndex + 1);
            return;
          }
          if (lowerMessage.includes("type") && typeIndex + 1 < typeCandidates.length) {
            attemptUpdate(typeIndex + 1, 0);
            return;
          }
          alert(message);
          setStatusLoading(false);
        },
      });
    };

    attemptUpdate(0, 0);
  };

  const detailEntries = useMemo(() => {
    const source = detailState.data ?? selectedItem ?? null;
    if (!source) return [] as Array<{ label: string; value: string }>;

    return [
      { label: "ID", value: String(source.id) },
      {
        label: "Пользователь",
        value:
          source.user?.phone ||
          userDetail?.phone ||
          source.user?.email ||
          userDetail?.email ||
          (source.user?.id ? `ID ${source.user.id}` : "—"),
      },
      { label: "Тип", value: source.type || activeType || (Array.isArray(type) ? type[0] : type) || "—" },
      { label: "Статус", value: source.status || "—" },
      { label: "Создано", value: formatDateTime(source.created_at) ?? "—" },
      { label: "Обновлено", value: formatDateTime(source.updated_at) ?? "—" },
    ];
  }, [detailState.data, selectedItem, activeType, type, userDetail]);

  const payloadEntries = useMemo(() => {
    const source = detailState.data ?? selectedItem ?? null;
    if (!source) return [];

    const basePayload = extractPayload(source);

    if (!basePayload) return [];

    return flattenPayload(basePayload);
  }, [detailState.data, selectedItem, typeCandidatesKey]);

  const templateType = useMemo<"prekyc" | "kyc">(() => {
    if (contextTemplateType) return contextTemplateType;
    const sourceType =
      detailState.data?.type || detailState.data?.api_type || selectedItem?.type || activeType || primaryType;
    if (!sourceType) return "prekyc";
    const normalized = sourceType.trim().toLowerCase();
    if (
      normalized.includes("pre") ||
      normalized.includes("pre-kyc") ||
      normalized.includes("pre_kyc") ||
      normalized.includes("prekyc") ||
      normalized.includes("basic")
    ) {
      return "prekyc";
    }
    return "kyc";
  }, [contextTemplateType, detailState.data?.type, detailState.data?.api_type, selectedItem?.type, activeType, primaryType]);

  const formTypeForApi = useMemo<"individual" | "legal" | "legal_pre">(() => {
    const sourceType =
      detailState.data?.type || detailState.data?.api_type || selectedItem?.type || activeType || primaryType || "";
    const normalized = sourceType.trim().toLowerCase();
    if (normalized.includes("legal") && normalized.includes("pre")) return "legal_pre";
    if (normalized.includes("legal")) return "legal";
    return "individual";
  }, [detailState.data?.type, detailState.data?.api_type, selectedItem?.type, activeType, primaryType]);

  const filteredTemplates = useMemo(
    () => templateOptions.filter((tpl) => tpl.type === templateType),
    [templateOptions, templateType]
  );

  const statusOptions = useMemo(() => {
    const defaults = ["new", "checking", "signing", "done", "rejected"];
    return mergeStatuses(
      defaults,
      detailState.data?.available_statuses as string[] | undefined,
      selectedItem?.available_statuses as string[] | undefined,
      detailState.data?.status ? [detailState.data.status] : undefined,
      selectedItem?.status ? [selectedItem.status] : undefined
    );
  }, [detailState.data?.status, detailState.data?.available_statuses, selectedItem?.status, selectedItem?.available_statuses]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReloadToken((prev) => prev + 1);
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    const subscriptions: Subscription[] = [];

    const initialTypes = typesToRequest.length > 0 ? typesToRequest : ["individual"];
    const normalizedTypes: Array<string> = [];
    const seen = new Set<string>();

    const pushType = (value?: string | null) => {
      if (!value) return;
      const trimmed = value.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        normalizedTypes.push(trimmed);
      }
    };

    initialTypes.forEach((entry) => {
      expandTypeVariants(entry).forEach((variant) => {
        pushType(mapTypeForApi(variant) ?? variant);
      });
    });

    const collected: AdminKycListItem[] = [];

    const tryType = (index: number) => {
      if (!isMounted) return;
      if (index >= normalizedTypes.length) {
        setState({
          items: collected,
          loading: false,
          error: collected.length === 0 ? "Нет данных." : "",
        });
        return;
      }

      const currentType = normalizedTypes[index];

      const sub = adminKycListApi(currentType ?? undefined, {
        statuses: statusesFilter,
        page: 1,
        perPage,
        form_type: formType,
      }).subscribe({
        next: (result) => {
          if (!isMounted) return;

          const items = extractAdminListItems(result);

          if (items.length > 0) {
            const normalizedItems = items.map<AdminKycListItem>((item) => {
              const itemEntry = item as AdminKycListItem;

              const payload = extractPayload(itemEntry);
              const createdAt = itemEntry.created_at ?? itemEntry.createdAt ?? itemEntry.created ?? null;
              const updatedAt = itemEntry.updated_at ?? itemEntry.updatedAt ?? itemEntry.updated ?? null;
              const rawType = itemEntry.type ?? itemEntry.kyc_type ?? itemEntry.form_type ?? currentType ?? null;
              const typeValue = typeof rawType === "string" ? rawType : undefined;
              const apiType = mapTypeForApi(typeValue) ?? mapTypeForApi(currentType ?? undefined);
              const userId = itemEntry.user_id ?? itemEntry.userId ?? payload?.user_id ?? null;
              const userEntry = itemEntry.user ?? (userId ? { id: userId } : null);
              const availableStatuses = mergeStatuses(
                itemEntry.available_statuses as string[] | undefined,
                itemEntry.availableStatuses as string[] | undefined
              );

              const { id, ...restItem } = itemEntry;

              return {
                ...restItem,
                id,
                type: typeValue ?? apiType ?? currentType ?? undefined,
                api_type: apiType,
                status: itemEntry.status ?? null,
                available_statuses: availableStatuses,
                created_at: createdAt ?? undefined,
                updated_at: updatedAt ?? undefined,
                user: userEntry,
                payload,
              } as AdminKycListItem & { api_type?: string; available_statuses?: string[] };
            });

            let filteredItems = normalizedItems;
            const normalizedFilters = (filterTypes || []).map((v) => v.toLowerCase());
            if (normalizedFilters.length > 0) {
              filteredItems = normalizedItems.filter((item) => {
                const variants = new Set<string>();
                const base = (item.type || item.api_type || currentType || "").toLowerCase();
                variants.add(base);
                if (base.includes("basic")) variants.add("individual_basic");
                if (base.includes("full")) variants.add("individual_full");
                if (base.includes("legal")) {
                  if (base.includes("pre")) variants.add("legal_pre");
                  variants.add("legal");
                }
                return normalizedFilters.some((needle) => variants.has(needle));
              });
              if (filteredItems.length === 0) filteredItems = normalizedItems;
            }

            collected.push(...filteredItems);
            setActiveType(mapTypeForApi(currentType) ?? activeType ?? null);
          }

          tryType(index + 1);
        },
        error: (error: Error) => {
          if (!isMounted) return;
          const message = parseError(error);
          if (index === normalizedTypes.length - 1) {
            setState({
              items: collected,
              loading: false,
              error: collected.length === 0 ? message : "",
            });
            setActiveType(null);
          } else {
            tryType(index + 1);
          }
        },
      });

      subscriptions.push(sub);
    };

    tryType(0);

    return () => {
      isMounted = false;
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [typesToRequest, perPage, reloadToken, statusesFilter, filterTypes]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    setStatusInput((prev) => selectedItem.status ?? prev ?? "created");
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedEntry) {
      setDetailState(initialDetailState<AdminKycListItem | null>(null));
      setUserDetail(null);
      return;
    }

    let isMounted = true;
    setDetailState((prev) => ({ ...prev, loading: true, error: "" }));

    const subscriptions: Subscription[] = [];

    const attemptFetch = (index: number) => {
      if (!isMounted) return;
      if (index >= typeCandidates.length) {
        setDetailState({ loading: false, error: "Не удалось загрузить данные заявки.", data: null });
        return;
      }

      const candidate = typeCandidates[index];
      const candidateTrimmed = candidate?.trim() || "individual";
      const mappedCandidate = mapTypeForApi(candidateTrimmed) ?? candidateTrimmed;

      const sub = adminKycGetApi(mappedCandidate, selectedEntry.id).subscribe({
        next: (result) => {
          if (!isMounted) return;
          const data = result.data ?? {};

          const attachmentsRaw =
            Array.isArray(data.attachments) && data.attachments.length > 0
              ? data.attachments
              : (Array.isArray((data.form as { attachments?: unknown }).attachments)
                  ? ((data.form as { attachments?: unknown }).attachments as typeof data.attachments)
                  : []);

          const itemRaw =
            (data.item as AdminKycListItem) ??
            (data.kyc as AdminKycListItem) ??
            ((data.form as AdminKycListItem) ?? (data as AdminKycListItem));
          if (itemRaw) {
            const apiType = mapTypeForApi(
              pickTypeString(itemRaw.type, itemRaw.kyc_type, itemRaw.form_type, mappedCandidate),
            ) ?? mappedCandidate;
            const payload = extractPayload(itemRaw) ?? extractPayload(detailState.data ?? null) ?? extractPayload(selectedItem);
            const enriched: AdminKycListItem & { api_type?: string; available_statuses?: string[] } = {
              ...itemRaw,
              api_type: apiType,
              available_statuses: mergeStatuses(
                itemRaw.available_statuses as string[] | undefined,
                itemRaw.availableStatuses as string[] | undefined
              ),
              payload,
            };
            setDetailState(() => ({ loading: false, error: "", data: enriched }));
            const normalizedAttachments = Array.isArray(attachmentsRaw)
              ? (attachmentsRaw as Array<{
                  id?: string | number;
                  name?: string;
                  download_url?: string;
                  uploaded_at?: string;
                }>)
              : [];
            setAttachments(
              normalizedAttachments.map((item) => ({
                id: Number(item.id ?? 0),
                name: item.name ?? "Файл",
                download_url: item.download_url?.startsWith("http")
                  ? item.download_url
                  : `${API_URL}${item.download_url ?? ""}`,
                uploaded_at: item.uploaded_at,
              }))
            );
            setStatusInput(enriched.status ?? selectedItem?.status ?? "created");
          } else {
            setDetailState((prev) => ({ ...prev, loading: false, error: "", data: prev.data ?? null }));
          }
        },
        error: (error: Error) => {
          if (!isMounted) return;
          const message = parseError(error);
          if (message.toLowerCase().includes("type") && index + 1 < typeCandidates.length) {
            attemptFetch(index + 1);
          } else {
            setDetailState((prev) => ({ ...prev, loading: false, error: message || prev.error, data: prev.data ?? null }));
            attemptFetch(index + 1);
          }
        },
      });

      subscriptions.push(sub);
    };

    attemptFetch(0);

    return () => {
      isMounted = false;
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [selectedEntry, typeCandidatesKey, selectedItem?.status, selectedItem, drawerRefreshToken]);

  useEffect(() => {
    const userId = detailState.data?.user?.id ?? selectedItem?.user?.id;
    if (!userId) {
      setUserDetail(null);
      return;
    }

    const subscription = adminUserGetApi(userId).subscribe({
      next: (result) => {
        const data = result.data ?? {};
        const user = (data.user as AdminUserDetail) ?? (data as AdminUserDetail) ?? null;
        setUserDetail(user);
      },
      error: () => {
        setUserDetail(null);
      },
    });

    return () => subscription.unsubscribe();
  }, [detailState.data?.user?.id, selectedItem?.user?.id, selectedItem]);

  useEffect(() => {
    setTemplatesLoading(true);
    setTemplatesError("");
    const sub = adminTemplateListApi().subscribe({
      next: (result) => {
        const items = result.data?.items ?? [];
        setTemplateOptions(
          items.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
          }))
        );
        setTemplatesLoading(false);
      },
      error: (err: Error) => {
        setTemplatesError(parseError(err));
        setTemplatesLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <section className={drawerStyles.section}>
      <header className={drawerStyles.sectionHeader}>
        <h2 className={drawerStyles.sectionTitle}>{title}</h2>
        <p className={drawerStyles.sectionHint}>{hint}</p>
      </header>

      {state.loading && (
        <div className={drawerStyles.loader}>
          <Loader size={20} />
        </div>
      )}
      {state.error && <p className={drawerStyles.error}>{state.error}</p>}

      {!state.loading && !state.error && state.items.length === 0 && <p className={drawerStyles.empty}>Нет данных.</p>}

      {!state.loading && state.items.length > 0 && (
        <div className={t.listWrapper}>
          <table className={t.table}>
            <thead>
              <tr className={t.headRow}>
                <th className={t.headCell}>ID</th>
                <th className={t.headCell}>Пользователь</th>
                <th className={t.headCell}>Тип</th>
                <th className={t.headCell}>Статус</th>
                <th className={t.headCell}>Создано</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item, index) => {
                const statusLower = item.status?.toLowerCase();
                const statusClass =
                  statusLower === "new" || statusLower === "created"
                    ? t.statusCreated
                    : statusLower === "done" || statusLower === "approved"
                      ? t.statusApproved
                      : statusLower === "rejected"
                        ? t.statusRejected
                        : t.statusDefault;

                const rowKey = item.id ?? `item-${index}`;

                return (
                  <tr
                    key={rowKey}
                    className={t.row}
                    onClick={() => {
      const nextType = mapTypeForApi(pickTypeString(item.api_type, item.type, activeType, primaryType));
      const nextIdentity: SelectedEntry = { id: item.id, type: nextType ?? item.type ?? activeType ?? primaryType };
      if (
        selectedEntry &&
        selectedEntry.id === nextIdentity.id &&
        normalizeTypeKey(selectedEntry.type) === normalizeTypeKey(nextIdentity.type)
      ) {
        setDrawerRefreshToken((prev) => prev + 1);
      } else {
        setSelectedEntry(nextIdentity);
      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        const nextType = mapTypeForApi(pickTypeString(item.api_type, item.type, activeType, primaryType));
                        const nextIdentity: SelectedEntry = {
                          id: item.id,
                          type: nextType ?? item.type ?? activeType ?? primaryType,
                        };
                        if (
                          selectedEntry &&
                          selectedEntry.id === nextIdentity.id &&
                          normalizeTypeKey(selectedEntry.type) === normalizeTypeKey(nextIdentity.type)
                        ) {
                          setDrawerRefreshToken((prev) => prev + 1);
                        } else {
                          setSelectedEntry(nextIdentity);
                        }
                      }
                    }}
                  >
                    <td className={t.cell}>{item.id}</td>
                    <td className={t.cell}>{item.user?.phone || item.user?.email || (item.user?.id ? `ID ${item.user.id}` : "—")}</td>
                    <td className={t.cell}>
                      {item.type?.toLowerCase().includes("legal")
                        ? item.type.toLowerCase().includes("pre")
                          ? "Юр. лицо (Pre-KYC)"
                          : "Юр. лицо"
                        : item.type?.toLowerCase().includes("basic")
                          ? "Физ. лицо (Pre-KYC)"
                          : item.type?.toLowerCase().includes("full")
                            ? "Физ. лицо (KYC)"
                            : item.type || "—"}
                    </td>
                    <td className={t.cell}>
                      <span className={`${t.statusBadge} ${statusClass}`}>{translateStatus(item.status)}</span>
                      </td>
                    <td className={t.cell}>{formatDateTime(item.created_at) || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawerOpen && selectedEntry !== null && (
        <>
          <div className={tableStyles.overlay} onClick={closeDrawer} role="presentation" />
          <aside className={`${tableStyles.sidePanel} ${tableStyles.sidePanelOpen}`}>
            <div className={tableStyles.sidePanel__header}>
              <h2>{detailState.data?.user?.phone || detailState.data?.user?.email || `Заявка #${selectedEntry.id}`}</h2>
              <button type="button" onClick={closeDrawer} aria-label="Закрыть">
                ×
              </button>
            </div>

            <div className={tableStyles.sidePanel__content}>
              <section className={tableStyles.sidePanel__block}>
                <h3 className={tableStyles.sidePanel__block__title}>Основные данные</h3>
                {detailState.loading && (
                  <div className={drawerStyles.loader}>
                    <Loader size={18} />
                  </div>
                )}
                {detailState.error && <p className={drawerStyles.error}>{detailState.error}</p>}
                {!detailState.loading && !detailState.error && detailEntries.length > 0 && (
                  <div className={t.drawerGrid}>
                    {detailEntries.map((item) => (
                      <Fragment key={item.label}>
                        <div className={t.drawerKey}>{item.label}</div>
                        <div className={t.drawerValue}>{item.value}</div>
                      </Fragment>
                    ))}
                  </div>
                )}
              </section>

              {payloadEntries.length > 0 && (
                <section className={tableStyles.sidePanel__block}>
                  <h3 className={tableStyles.sidePanel__block__title}>Анкета</h3>
                  <div className={t.payloadBlock}>
                    {payloadEntries.map(({ label, value }) => (
                      <div key={label} className={t.payloadItem}>
                        <div className={t.drawerKey}>{label}</div>
                        <div className={t.drawerValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {attachments.length > 0 && (
                <section className={tableStyles.sidePanel__block}>
                  <h3 className={tableStyles.sidePanel__block__title}>Файлы</h3>
                  <div className={t.payloadBlock}>
                    {attachments.map((file) => (
                      <div key={file.id} className={t.payloadItem}>
                        <div className={t.drawerKey}>{file.name}</div>
                        <div className={t.drawerValue}>
                          <button className={t.downloadLink} onClick={() => handleDownload(file.download_url, file.name)}>
                            Скачать
                          </button>
                          {file.uploaded_at && <span className={t.drawerHint}>{formatDateTime(file.uploaded_at)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className={tableStyles.sidePanel__block}>
                <h3 className={tableStyles.sidePanel__block__title}>Шаблоны документов</h3>
                <div className={t.payloadBlock}>
                  <div className={t.payloadItem}>
                    <div className={t.drawerKey}>Подходят для {templateType === "prekyc" ? "Pre-KYC" : "KYC"}</div>
                    <div className={t.drawerValue}>
                      <select
                        className={t.statusSelect}
                        value={selectedTemplate}
                        onChange={(event) => setSelectedTemplate(event.target.value)}
                        disabled={templatesLoading || filteredTemplates.length === 0}
                      >
                        <option value="">
                          {templatesLoading ? "Загрузка…" : "Выберите шаблон…"}
                        </option>
                        {filteredTemplates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name}
                          </option>
                        ))}
                      </select>
                      {templatesError && <div className={drawerStyles.error}>{templatesError}</div>}
                      {!templatesLoading && filteredTemplates.length === 0 && (
                        <div className={drawerStyles.error}>Нет шаблонов для этого типа.</div>
                      )}
                      <div className={t.actionsRow}>
                        <button
                          type="button"
                          className={t.primaryBtn}
                          disabled={!selectedTemplate || applyLoading}
                          onClick={() => {
                            if (!selectedTemplate || !selectedEntry?.id) return;
                            setApplyLoading(true);
                            adminTemplateApplyApi(
                              Number(selectedTemplate),
                              selectedEntry.id,
                              formTypeForApi === "legal_pre" ? "legal_pre" : formTypeForApi
                            ).subscribe({
                              next: (result) => {
                                setApplyLoading(false);
                                if (!result.success) {
                                  setTemplatesError(result.message || "Не удалось отправить документ");
                                }
                              },
                              error: (err: Error) => {
                                setApplyLoading(false);
                                setTemplatesError(parseError(err));
                              },
                            });
                          }}
                        >
                          {applyLoading ? "Отправляем..." : "Отправить в документы"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={tableStyles.sidePanel__block}>
                <h3 className={tableStyles.sidePanel__block__title}>Изменение статуса</h3>
                <div className={t.payloadBlock}>
                  <div className={t.payloadItem}>
                    <div className={t.drawerKey}>Новый статус</div>
                    <div className={t.drawerValue}>
                      <select
                        className={t.statusSelect}
                        value={statusInput}
                        onChange={(event) => setStatusInput(event.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {translateStatus(option)}
                          </option>
                        ))}
                      </select>
                      <div className={t.actionsRow}>
                        <button
                          type="button"
                          className={t.primaryBtn}
                          onClick={handleStatusUpdate}
                          disabled={statusLoading || !statusInput.trim()}
                        >
                          {statusLoading ? "Сохранение…" : "Сохранить"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
