"use client";

import { useEffect, useMemo, useState } from "react";
import { Subscription } from "rxjs";
import tableStyles from "../ClientsTable/clientsTable.module.scss";
import { parseError } from "@/app/utils/parse-error";
import { Loader } from "@/app/components/Loader";
import { adminUserGetApi, AdminUserDetail } from "@/app/api/admin/user/get";
import { adminUserGetBalancesApi, AdminUserBalanceItem } from "@/app/api/admin/user/get-balances";
import { adminUserListTransactionsApi, AdminUserTransactionItem } from "@/app/api/admin/user/list-transactions";
import { extractAdminListItems } from "@/app/api/admin/user/list";
import { adminUserBanApi } from "@/app/api/admin/user/ban";
import { adminUserCreateTransactionApi } from "@/app/api/admin/user/create-transaction";
import { adminUserSetTariffTypeApi } from "@/app/api/admin/user/set-tariff-type";
import { adminUserGrantAdminApi } from "@/app/api/admin/user/grant-admin";
import { adminSendEmailApi } from "@/app/api/admin/user/send-email";
import { tariffTitles, TariffType } from "@/app/api/user/get-me";
import { currencyListApi, CurrencyListItem } from "@/app/api/currency/list";

type AdminUserDrawerProps = {
  userId: number | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

type RequestState<T> = {
  loading: boolean;
  error: string;
  data: T;
};

const initialRequestState = <T,>(data: T): RequestState<T> => ({
  loading: false,
  error: "",
  data,
});

const userTypeTitles: Record<string, string> = {
  admin: "Администратор",
  individual: "Физическое лицо",
  legal: "Юридическое лицо",
  system: "Системный пользователь",
};

const getUserTypeTitle = (type?: string | null) => {
  if (!type) return "—";
  return userTypeTitles[type] ?? type;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const parseAmount = (rawValue: string | number | null | undefined): number => {
  if (rawValue === null || rawValue === undefined) return Number.NaN;
  const value = typeof rawValue === "number" ? rawValue.toString() : rawValue;
  if (!value) return Number.NaN;
  const normalized = value.replace(/\s+/g, "").replace(",", ".").trim();
  if (!normalized) return Number.NaN;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const collectBalances = (source: unknown): AdminUserBalanceItem[] => {
  const buckets: unknown[] = [];
  if (!source) return [];
  if (Array.isArray(source)) buckets.push(...source);
  if (typeof source === "object") {
    const record = source as Record<string, unknown>;
    if (Array.isArray(record.balances)) buckets.push(...record.balances);
    if (Array.isArray(record.items)) buckets.push(...record.items);
    if (Array.isArray(record.data)) buckets.push(...record.data);
  }

  const numericFromRecord = (record: Record<string, unknown>): number | null => {
    const candidateKeys = [
      "amount",
      "balance",
      "available",
      "available_balance",
      "availableAmount",
      "value",
      "total",
    ];
    for (const key of candidateKeys) {
      const raw = record[key];
      const parsed = parseAmount(raw as string | number | null | undefined);
      if (Number.isFinite(parsed)) return parsed;
    }
    // в крайнем случае ищем первое число среди значений
    const firstNumber = Object.values(record).find((v) => typeof v === "number" && Number.isFinite(v));
    if (typeof firstNumber === "number" && Number.isFinite(firstNumber)) return firstNumber;
    return null;
  };

  const codeFromRecord = (record: Record<string, unknown>): string | undefined => {
    const codeKeys = ["currency_code", "currency", "code", "symbol"];
    for (const key of codeKeys) {
      const raw = record[key];
      if (typeof raw === "string" && raw.trim()) return raw.trim().toUpperCase();
    }
    return undefined;
  };

  return buckets
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const currencyIdRaw = (item as Record<string, unknown>).currency_id;
      const amountParsed = numericFromRecord(item as Record<string, unknown>);
      return {
        currency_id: typeof currencyIdRaw === "number" ? currencyIdRaw : Number(currencyIdRaw ?? 0),
        currency_code: codeFromRecord(item as Record<string, unknown>),
        amount: amountParsed ?? 0,
      };
    });
};

export default function AdminUserDrawer({ userId, open, onClose, onRefresh }: AdminUserDrawerProps) {
  const [detailState, setDetailState] = useState<RequestState<AdminUserDetail | null>>(initialRequestState<AdminUserDetail | null>(null));
  const [balancesState, setBalancesState] = useState<RequestState<AdminUserBalanceItem[]>>(initialRequestState<AdminUserBalanceItem[]>([]));
  const [transactionsState, setTransactionsState] = useState<RequestState<AdminUserTransactionItem[]>>(initialRequestState<AdminUserTransactionItem[]>([]));

  const [banReason, setBanReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [transactionPayload, setTransactionPayload] = useState({ currency_id: 0, amount: "", description: "" });
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [pendingTariffType, setPendingTariffType] = useState<TariffType>("default");
  const [tariffLoading, setTariffLoading] = useState(false);
  const [tariffError, setTariffError] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [grantAdminStatus, setGrantAdminStatus] = useState("");
  const [grantAdminLoading, setGrantAdminLoading] = useState(false);
  const [currenciesState, setCurrenciesState] = useState<RequestState<CurrencyListItem[]>>(initialRequestState<CurrencyListItem[]>([]));

  const tariffOptions = useMemo(
    () => (Object.entries(tariffTitles) as Array<[TariffType, string]>).map(([value, label]) => ({ value, label })),
    []
  );

  const currentTariffType = useMemo<TariffType>(
    () => ((detailState.data?.tariff_type ?? "default") as TariffType | null) ?? "default",
    [detailState.data?.tariff_type]
  );

  const currencyOptions = useMemo(
    () =>
      currenciesState.data.map((currency) => ({
        value: currency.id,
        label: currency.code?.toUpperCase() ?? `ID ${currency.id}`,
      })),
    [currenciesState.data]
  );

  const parsedTransactionAmount = useMemo(() => parseAmount(transactionPayload.amount), [transactionPayload.amount]);
  const isTransactionAmountInvalid = Number.isNaN(parsedTransactionAmount) || parsedTransactionAmount <= 0;

  useEffect(() => {
    if (!open || !currencyOptions.length) return;
    setTransactionPayload((prev) => {
      if (prev.currency_id) return prev;
      return { ...prev, currency_id: currencyOptions[0].value };
    });
  }, [open, currencyOptions]);

  const currencyLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    currencyOptions.forEach((currency) => {
      map.set(currency.value, currency.label);
    });
    return map;
  }, [currencyOptions]);

  const getCurrencyLabel = (id?: number | null, fallbackCode?: string | null) => {
    if (fallbackCode && fallbackCode.trim().length > 0) {
      return fallbackCode.trim().toUpperCase();
    }
    if (typeof id === "number") {
      return currencyLabelMap.get(id) ?? `ID ${id}`;
    }
    return "—";
  };

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    setBanReason("");
    setTransactionPayload({ currency_id: 0, amount: "", description: "" });
    setTransactionError("");
    setTariffError("");
    setTariffLoading(false);
    setEmailSubject("");
    setEmailMessage("");
    setEmailStatus("");
    setEmailLoading(false);
    setGrantAdminStatus("");
    setGrantAdminLoading(false);

    const subscriptions: Subscription[] = [];

    setDetailState((prev) => ({ ...prev, loading: true, error: "" }));
    const userSub = adminUserGetApi(userId).subscribe({
      next: (result) => {
        const data = result.data ?? {};
        const user = (data.user as AdminUserDetail) ?? (data as unknown as AdminUserDetail) ?? null;
        setDetailState({ loading: false, error: "", data: user ?? null });
      },
      error: (error: Error) => {
        setDetailState({ loading: false, error: parseError(error), data: null });
      },
    });
    subscriptions.push(userSub);

    setBalancesState((prev) => ({ ...prev, loading: true, error: "" }));
    const balanceSub = adminUserGetBalancesApi(userId).subscribe({
      next: (result) => {
        const raw = result.data ?? result;
        const balances = collectBalances(raw);
        setBalancesState({ loading: false, error: "", data: balances });
      },
      error: (error: Error) => {
        setBalancesState({ loading: false, error: parseError(error), data: [] });
      },
    });
    subscriptions.push(balanceSub);

    setTransactionsState((prev) => ({ ...prev, loading: true, error: "" }));
    const transactionsSub = adminUserListTransactionsApi(userId, 1, 20).subscribe({
      next: (result) => {
        setTransactionsState({
          loading: false,
          error: "",
          data: extractAdminListItems(result),
        });
      },
      error: (error: Error) => {
        setTransactionsState({ loading: false, error: parseError(error), data: [] });
      },
    });
    subscriptions.push(transactionsSub);

    setCurrenciesState((prev) => ({ ...prev, loading: true, error: "" }));
    const currencySub = currencyListApi().subscribe({
      next: (result) => {
        setCurrenciesState({ loading: false, error: "", data: result.data ?? [] });
      },
      error: (error: Error) => {
        setCurrenciesState({ loading: false, error: parseError(error), data: [] });
      },
    });
    subscriptions.push(currencySub);

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [open, userId, refreshToken]);

  useEffect(() => {
    const nextTariff = ((detailState.data?.tariff_type ?? "default") as TariffType | null) ?? "default";
    setPendingTariffType(nextTariff);
  }, [detailState.data?.tariff_type]);

  const handleTariffSave = () => {
    if (!userId) {
      return;
    }
    if (pendingTariffType === currentTariffType) {
      return;
    }

    setTariffLoading(true);
    setTariffError("");

    adminUserSetTariffTypeApi({ user_id: userId, tariff_type: pendingTariffType }).subscribe({
      next: (result) => {
        if (!result.success) {
          throw new Error(JSON.stringify(result));
        }
        setDetailState((prev) => ({
          ...prev,
          data: prev.data ? { ...prev.data, tariff_type: pendingTariffType } : prev.data,
        }));
        setTariffLoading(false);
        onRefresh?.();
        setRefreshToken((prev) => prev + 1);
      },
      error: (error: Error) => {
        setTariffLoading(false);
        setTariffError(parseError(error));
      },
    });
  };

  const handleBan = () => {
    if (!userId || !banReason.trim()) {
      return;
    }
    setBanLoading(true);
    adminUserBanApi({ id: userId, reason: banReason }).subscribe({
      next: (result) => {
        if (!result.success) {
          throw new Error(JSON.stringify(result));
        }
        setBanReason("");
        onRefresh?.();
        setRefreshToken((prev) => prev + 1);
      },
      error: (error: Error) => {
        alert(parseError(error));
        setBanLoading(false);
      },
      complete: () => {
        setBanLoading(false);
      },
    });
  };

  const handleCreateTransaction = (direction: "add" | "subtract") => {
    if (!userId) return;
    if (!transactionPayload.currency_id) {
      setTransactionError("Выберите валюту.");
      return;
    }
    const absoluteAmount = parsedTransactionAmount;
    if (isTransactionAmountInvalid) {
      setTransactionError("Введите сумму больше 0.");
      return;
    }
    setTransactionError("");
    setTransactionLoading(true);
    const signedAmount = direction === "subtract" ? -absoluteAmount : absoluteAmount;
    const payload = {
      user_id: userId,
      currency_id: transactionPayload.currency_id,
      amount: signedAmount,
      description: transactionPayload.description?.trim() || undefined,
    };

    adminUserCreateTransactionApi(payload).subscribe({
      next: (result) => {
        if (!result.success) {
          throw new Error(JSON.stringify(result));
        }
        onRefresh?.();
        setTransactionPayload((prev) => ({ ...prev, amount: "", description: "" }));
        setRefreshToken((prev) => prev + 1);
      },
      error: (error: Error) => {
        alert(parseError(error));
        setTransactionLoading(false);
      },
      complete: () => {
        setTransactionLoading(false);
      },
    });
  };

  const handleSendEmail = () => {
    if (!userId) return;
    if (!detailState.data?.email) {
      setEmailStatus("У пользователя отсутствует e-mail.");
      return;
    }
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailStatus("Заполните тему и текст письма.");
      return;
    }
    setEmailLoading(true);
    setEmailStatus("");
    adminSendEmailApi(userId, emailSubject.trim(), emailMessage.trim()).subscribe({
      next: (result) => {
        setEmailLoading(false);
        if (result.success) {
          setEmailStatus("Письмо отправлено.");
          setEmailSubject("");
          setEmailMessage("");
        } else {
          setEmailStatus("Не удалось отправить письмо. Попробуйте позже.");
        }
      },
      error: (error: Error) => {
        setEmailLoading(false);
        setEmailStatus(parseError(error));
      },
    });
  };

  const handleGrantAdmin = () => {
    if (!userId) return;
    setGrantAdminLoading(true);
    setGrantAdminStatus("");
    adminUserGrantAdminApi(userId).subscribe({
      next: (result) => {
        if (!result.success) {
          throw new Error(JSON.stringify(result));
        }
        setGrantAdminLoading(false);
        setGrantAdminStatus("Пользователь назначен администратором.");
        setDetailState((prev) => ({
          ...prev,
          data: prev.data ? { ...prev.data, type: "admin" } : prev.data,
        }));
        onRefresh?.();
      },
      error: (error: Error) => {
        setGrantAdminLoading(false);
        setGrantAdminStatus(parseError(error));
      },
    });
  };

  const detailEntries = useMemo(() => {
    if (!detailState.data) return [] as Array<{ label: string; value: string }>;
    const entries: Array<{ label: string; value: string }> = [];
    const user = detailState.data;
    entries.push({ label: "ID", value: String(user.id) });
    entries.push({ label: "Телефон", value: user.phone ? String(user.phone) : "—" });
    entries.push({ label: "E-mail", value: user.email ? String(user.email) : "—" });
    entries.push({ label: "E-mail подтверждён", value: user.email_is_verified ? "Да" : "Нет" });
    entries.push({ label: "Тип пользователя", value: getUserTypeTitle((user.type as string | null) ?? null) });
    const userTariffType = ((user.tariff_type ?? "default") as TariffType | null) ?? "default";
    entries.push({ label: "Тариф", value: tariffTitles[userTariffType] ?? userTariffType });
    entries.push({ label: "Статус", value: user.status ? String(user.status) : "—" });
    entries.push({ label: "Создан", value: formatDateTime(user.created_at) });
    entries.push({ label: "Обновлен", value: formatDateTime(user.updated_at) });
    return entries;
  }, [detailState.data]);

  const isAdmin = detailState.data?.type === "admin";

  const drawerClassName = useMemo(() => {
    const classes = [tableStyles.sidePanel];
    if (open) {
      classes.push(tableStyles.sidePanelOpen);
    }
    return classes.join(" ");
  }, [open]);

  if (!open || !userId) {
    return null;
  }

  return (
    <>
      <div className={tableStyles.overlay} onClick={onClose} role="presentation" />
      <aside className={drawerClassName}>
        <div className={tableStyles.sidePanel__header}>
          <h2>{detailState.data?.phone || detailState.data?.email || `Пользователь #${userId}`}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={tableStyles.sidePanel__content}>
          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Основная информация</h3>
            {detailState.loading && (
              <div className={tableStyles.sidePanel__loader}>
                <Loader size={18} />
              </div>
            )}
            {detailState.error && <p>{detailState.error}</p>}
            {!detailState.loading && !detailState.error && detailEntries.length > 0 && (
              <div className={tableStyles.sidePanel__infos}>
                {detailEntries.map((item) => (
                  <div key={item.label} className={tableStyles.sidePanel__info}>
                    <div className={tableStyles.sidePanel__info__label}>{item.label}</div>
                    <div className={tableStyles.sidePanel__info__value}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Права доступа</h3>
            <p className={tableStyles.sidePanel__info__value}>
              Текущий тип: {getUserTypeTitle(detailState.data?.type as string | null)}
            </p>
            {grantAdminStatus && <p className={tableStyles.sidePanel__info__value}>{grantAdminStatus}</p>}
            <button
              type="button"
              className={tableStyles.tariffButton}
              onClick={handleGrantAdmin}
              disabled={grantAdminLoading || isAdmin}
            >
              {isAdmin ? "Уже администратор" : grantAdminLoading ? "Назначаем…" : "Назначить администратором"}
            </button>
          </section>

          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Тариф</h3>
            <p>Текущий тариф: {tariffTitles[currentTariffType]}</p>
            <div className={tableStyles.tariffControls}>
              <div className={tableStyles.selectContainer}>
                <label htmlFor={`admin-tariff-${userId ?? "unknown"}`}>Выберите тариф</label>
                <select
                  id={`admin-tariff-${userId ?? "unknown"}`}
                  className={tableStyles.table__select}
                  value={pendingTariffType}
                  onChange={(event) => setPendingTariffType(event.target.value as TariffType)}
                  disabled={tariffLoading}
                >
                  {tariffOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={tableStyles.tariffButton}
                onClick={handleTariffSave}
                disabled={tariffLoading || pendingTariffType === currentTariffType}
              >
                {tariffLoading ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>
            {tariffError && <p className={tableStyles.tariffError}>{tariffError}</p>}
          </section>

          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Отправить письмо</h3>
            <p className={tableStyles.sidePanel__info__value}>Получатель: {detailState.data?.email || "—"}</p>
            <div className={tableStyles.sidePanel__infos}>
              <div className={tableStyles.sidePanel__info}>
                <div className={tableStyles.sidePanel__info__label}>Тема</div>
                <div className={tableStyles.sidePanel__info__value}>
                  <input
                    type="text"
                    className={tableStyles.table__select}
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                    placeholder="Тема письма"
                  />
                </div>
              </div>
              <div className={tableStyles.sidePanel__info}>
                <div className={tableStyles.sidePanel__info__label}>Сообщение</div>
                <div className={tableStyles.sidePanel__info__value}>
                  <textarea
                    className={tableStyles.sidePanel__content__textarea}
                    value={emailMessage}
                    onChange={(event) => setEmailMessage(event.target.value)}
                    placeholder="Текст сообщения"
                    rows={5}
                  />
                </div>
              </div>
            </div>
            {emailStatus && <p className={tableStyles.sidePanel__info__value}>{emailStatus}</p>}
            <button
              type="button"
              className={tableStyles.tariffButton}
              onClick={handleSendEmail}
              disabled={emailLoading}
            >
              {emailLoading ? "Отправляем…" : "Отправить"}
            </button>
          </section>

          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Балансы</h3>
            {balancesState.loading && (
              <div className={tableStyles.sidePanel__loader}>
                <Loader size={18} />
              </div>
            )}
            {balancesState.error && <p>{balancesState.error}</p>}
            {!balancesState.loading && balancesState.data.length === 0 && <p>Нет данных по балансам.</p>}
            {!balancesState.loading && balancesState.data.length > 0 && (
              <div className={tableStyles.sidePanel__infos}>
                {balancesState.data.map((balance) => {
                  const label = getCurrencyLabel(balance.currency_id, balance.currency_code as string | undefined);
                  return (
                    <div key={`${balance.currency_id}-${balance.currency_code ?? "unknown"}`} className={tableStyles.sidePanel__info}>
                      <div className={tableStyles.sidePanel__info__label}>{label}</div>
                      <div className={tableStyles.sidePanel__info__value}>{balance.amount ?? 0}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Транзакции</h3>
            {transactionsState.loading && (
              <div className={tableStyles.sidePanel__loader}>
                <Loader size={18} />
              </div>
            )}
            {transactionsState.error && <p>{transactionsState.error}</p>}
            {!transactionsState.loading && transactionsState.data.length === 0 && <p>Транзакции не найдены.</p>}
            {!transactionsState.loading && transactionsState.data.length > 0 && (
              <div className={tableStyles.sidePanel__infos}>
                {transactionsState.data.map((transaction) => (
                  <div key={transaction.id} className={tableStyles.sidePanel__info}>
                    <div className={tableStyles.sidePanel__info__label}>{formatDateTime(transaction.created_at)}</div>
                    <div className={tableStyles.sidePanel__info__value}>
                      {transaction.amount} ({getCurrencyLabel(transaction.currency_id as number | undefined, transaction.currency_code as string | undefined)})
                      {transaction.description ? ` — ${transaction.description}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={tableStyles.sidePanel__block}>
            <h3 className={tableStyles.sidePanel__block__title}>Действия</h3>
            <div className={tableStyles.sidePanel__infos}>
              <div className={tableStyles.sidePanel__info}>
                <div className={tableStyles.sidePanel__info__label}>Причина блокировки</div>
                <div className={tableStyles.sidePanel__info__value}>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(event) => setBanReason(event.target.value)}
                    placeholder="Укажите причину"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-light-gray)" }}
                  />
                  <button
                    type="button"
                    className={`${tableStyles.btn__red}`}
                    style={{ marginTop: "12px", width: "auto", padding: "8px 16px" }}
                    onClick={handleBan}
                    disabled={banLoading || !banReason.trim()}
                  >
                    {banLoading ? "Блокировка…" : "Заблокировать"}
                  </button>
                </div>
              </div>

              <div className={tableStyles.sidePanel__info}>
                <div className={tableStyles.sidePanel__info__label}>Создать транзакцию</div>
                <div className={tableStyles.sidePanel__info__value}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>Валюта</span>
                      <select
                        className={tableStyles.table__select}
                        style={{ width: "100%" }}
                        value={transactionPayload.currency_id ? String(transactionPayload.currency_id) : ""}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          setTransactionPayload((prev) => ({
                            ...prev,
                            currency_id: Number.isNaN(nextValue) ? 0 : nextValue,
                          }));
                        }}
                        disabled={currenciesState.loading}
                      >
                        <option value="" disabled>
                          {currenciesState.loading ? "Загружаем список…" : "Выберите валюту"}
                        </option>
                        {currencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>Сумма</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={transactionPayload.amount}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          if (!/^[\d.,]*$/.test(nextValue)) return;
                          setTransactionPayload((prev) => ({ ...prev, amount: nextValue }));
                        }}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-light-gray)" }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>Описание (необязательно)</span>
                      <input
                        type="text"
                        value={transactionPayload.description}
                        onChange={(event) => setTransactionPayload((prev) => ({ ...prev, description: event.target.value }))}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-light-gray)" }}
                      />
                    </label>
                    {currenciesState.error && <p className={tableStyles.tariffError}>{currenciesState.error}</p>}
                    {transactionError && <p className={tableStyles.tariffError}>{transactionError}</p>}
                    <div className={tableStyles.transactionActions}>
                      <button
                        type="button"
                        className={`${tableStyles.transactionButton} ${tableStyles.transactionButtonSubtract}`}
                        onClick={() => handleCreateTransaction("subtract")}
                        disabled={transactionLoading || isTransactionAmountInvalid}
                      >
                        {transactionLoading ? "Обработка…" : "Вычесть"}
                      </button>
                      <button
                        type="button"
                        className={`${tableStyles.transactionButton} ${tableStyles.transactionButtonAdd}`}
                        onClick={() => handleCreateTransaction("add")}
                        disabled={transactionLoading || isTransactionAmountInvalid}
                      >
                        {transactionLoading ? "Обработка…" : "Добавить"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
