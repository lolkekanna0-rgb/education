"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select, { SingleValue } from "react-select";
import Image from "next/image";
import { useRouter } from "next/navigation";
import s from "./balansTable.module.scss";
import QRCode from "qrcode";
import { createPaymentApi } from "@/app/api/payment/create-payment";
import { parseError } from "@/app/utils/parse-error";
import { useUserBalances } from "@/app/hooks/use-user-balances";
import { Loader } from "@/app/components/Loader";
import { topUpModal$, openTopUpModal, closeTopUpModal } from "@/app/services/topup_modal";
import { createCardRequestApi } from "@/app/api/cards/create-request";
import { user$ } from "@/app/services/user";
import { TariffType } from "@/app/api/user/get-me";

const PREFERRED_CURRENCIES = ["KGS", "SOM", "SOMON"];

interface Option {
  value: string;
  label: string;
  symbol: string;
  isDisabled?: boolean;
}

type PaymentMethod = {
  id: string;
  label: string;
  available: boolean;
};

const currencyOptions: Option[] = [
  { value: "KGS", label: "Сомы (KGS)", symbol: "сом" },
  { value: "RUB", label: "Рубли (RUB)", symbol: "₽", isDisabled: true },
  { value: "USD", label: "Доллары (USD)", symbol: "$", isDisabled: true },
  { value: "EUR", label: "Евро (EUR)", symbol: "€", isDisabled: true },
];

const paymentMethods: PaymentMethod[] = [
  { id: "provider_a", label: "Провайдер А", available: false },
  { id: "provider_b", label: "Провайдер Б", available: false },
  { id: "bank_transfer", label: "Банковский перевод", available: false },
  { id: "qr", label: "QR-код", available: true },
];

const calculateCommission = (amount: number) => {
  if (!amount) return 0;
  const percent = 0.07; // 7%
  const result = Math.max(amount * percent, 50);
  return Math.round(result);
};

const ensureDataUrl = (value: string | undefined) => {
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `data:image/png;base64,${value}`;
};

const extractPaymentResources = (data: Record<string, unknown> | undefined) => {
  if (!data) return { qr: "", link: "" };
  const payment = (data.payment as Record<string, unknown>) || data;

  const qrCandidates = [
    payment?.qr,
    payment?.qr_code,
    payment?.qrCode,
    payment?.qr_image,
    payment?.qrImage,
    payment?.qr_base64,
    payment?.qrBase64,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  const linkCandidates = [
    payment?.payment_url,
    payment?.paymentUrl,
    payment?.payment_link,
    payment?.paymentLink,
    payment?.link,
    payment?.url,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return {
    qr: ensureDataUrl(qrCandidates[0]),
    link: linkCandidates[0] ?? "",
  };
};

export default function BalansTop() {
  const router = useRouter();
  const [tariffType, setTariffType] = useState<TariffType>("default");
  const [profileStatuses, setProfileStatuses] = useState<string[]>([]);
  const isVip = profileStatuses.includes("vip") || tariffType === "vip";
  const {
    formattedBalances,
    loading: balancesLoading,
    error: balancesError,
    refresh: refreshBalances,
  } = useUserBalances();

  const primaryBalance = useMemo(() => {
    if (formattedBalances.length === 0) return null;
    const preferred = formattedBalances.find((balance) => PREFERRED_CURRENCIES.includes(balance.code));
    return preferred ?? formattedBalances[0];
  }, [formattedBalances]);

  const balanceDisplay = useMemo<ReactNode>(() => {
    if (balancesLoading) {
      return <Loader size={18} />;
    }
    if (balancesError) return "Ошибка загрузки";
    if (!primaryBalance) return "—";
    return primaryBalance.display;
  }, [primaryBalance, balancesLoading, balancesError]);

  const balanceTitle = useMemo(() => {
    if (formattedBalances.length > 0) {
      return formattedBalances.map((balance) => balance.display).join(", ");
    }
    return balancesError || undefined;
  }, [formattedBalances, balancesError]);

  const initialMethodId = useMemo(() => {
    const available = paymentMethods.find((method) => method.available);
    return available ? available.id : "";
  }, []);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(initialMethodId);
  const [selectedCurrency, setSelectedCurrency] = useState<Option | null>(currencyOptions[0]);
  const [price, setPrice] = useState<number | "">("");
  const [commission, setCommission] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string>("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    amount: number;
    currency: string;
    qr?: string;
    link?: string;
    raw?: Record<string, unknown>;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | null>(null);
  const [paymentWatchCurrency, setPaymentWatchCurrency] = useState<string | null>(null);
  const [balanceSnapshot, setBalanceSnapshot] = useState<number | null>(null);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [cardRequestLoading, setCardRequestLoading] = useState(false);
  const [cardRequestError, setCardRequestError] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<"success" | "error" | null>(null);
  const [brokerRequestLoading, setBrokerRequestLoading] = useState(false);
  const [brokerRequestError, setBrokerRequestError] = useState("");
  const [isBrokerSuccessModalOpen, setIsBrokerSuccessModalOpen] = useState(false);

  const formattedPrice = useMemo(() => {
    if (typeof price !== "number" || Number.isNaN(price) || price === 0) return "";
    return price.toLocaleString("ru-RU");
  }, [price]);

const formattedTotal = useMemo(() => {
  if (typeof price !== "number" || Number.isNaN(price) || price <= 0) return "";
  return price.toLocaleString("ru-RU");
}, [price]);

  const selectedMethod = paymentMethods.find((method) => method.id === selectedMethodId);

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/[^\d]/g, "");
    if (!digits) {
      setPrice("");
      setCommission(0);
      setTotal(0);
      return;
    }

    const value = parseInt(digits, 10);
    setPrice(value);
    const hasCommission = selectedMethod?.id === "provider_a";
    const calculatedCommission = hasCommission ? calculateCommission(value) : 0;
    setCommission(calculatedCommission);
    setTotal(value + calculatedCommission);
  };

  const resetForm = useCallback(() => {
    setPrice("");
    setCommission(0);
    setTotal(0);
    setSelectedMethodId(initialMethodId);
    setSelectedCurrency(currencyOptions[0]);
  }, [initialMethodId]);

  useEffect(() => {
    const subscription = topUpModal$.subscribe(({ open }) => {
      setIsTopUpOpen(open);
      if (open) {
        resetForm();
        setPaymentError("");
        setPaymentLoading(false);
        setPaymentStatus(null);
        setPaymentWatchCurrency(null);
        setBalanceSnapshot(null);
      } else {
        setPaymentLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [resetForm]);

  useEffect(() => {
    const subscription = user$.subscribe((next) => {
      setTariffType(((next?.tariff_type ?? "default") as TariffType) ?? "default");
      const statuses =
        (next?.profile as { statuses?: unknown } | null | undefined)?.statuses ??
        (next as { statuses?: unknown } | null | undefined)?.statuses;
      if (Array.isArray(statuses)) {
        setProfileStatuses(statuses.filter((item) => typeof item === "string") as string[]);
      } else {
        setProfileStatuses([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const resolveBalanceByCode = useCallback(
    (code?: string | null): number | null => {
      if (!code) return null;
      const normalized = code.trim().toUpperCase();
      const found = formattedBalances.find((item) => item.code.trim().toUpperCase() === normalized);
      return found?.amount ?? null;
    },
    [formattedBalances]
  );

  useEffect(() => {
    if (!pushMessage) return;
    const timer = setTimeout(() => setPushMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [pushMessage]);

  useEffect(() => {
    if (paymentStatus !== "pending") return;
    const intervalId = setInterval(() => {
      refreshBalances();
    }, 6000);
    return () => clearInterval(intervalId);
  }, [paymentStatus, refreshBalances]);

  useEffect(() => {
    if (paymentStatus !== "pending") return;
    if (!paymentWatchCurrency) return;
    if (balanceSnapshot === null) return;

    const current = resolveBalanceByCode(paymentWatchCurrency);
    if (current !== null && current > balanceSnapshot) {
      setPaymentStatus("paid");
      setPushMessage("Платеж получен");
    }
  }, [formattedBalances, paymentStatus, paymentWatchCurrency, balanceSnapshot, resolveBalanceByCode]);

  const handlePayment = () => {
    if (paymentLoading) return;

    const amount = typeof price === "number" ? price : 0;
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setPaymentError("Введите корректную сумму пополнения.");
      setIsErrorModalOpen(true);
      return;
    }

    if (!selectedMethod || !selectedMethod.available) {
      setPaymentError("Сейчас доступен только способ оплаты через QR-код.");
      setIsErrorModalOpen(true);
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");

    createPaymentApi(amount).subscribe({
      next: (result) => {
        setPaymentLoading(false);
        if (!result.success || !result.data) {
          setPaymentError("Не удалось создать платеж. Попробуйте позже.");
          setIsErrorModalOpen(true);
          return;
        }

        const payload = result.data as Record<string, unknown>;

        const resources = extractPaymentResources(payload);
        const token = (() => {
          const rawToken =
            typeof (payload as Record<string, unknown>).token === "string"
              ? (payload as Record<string, unknown>).token
              : typeof (payload as Record<string, unknown>).data === "object" && payload.data
                ? (payload.data as Record<string, unknown>).token
                : undefined;
          return typeof rawToken === "string" && rawToken.trim().length > 0 ? rawToken : undefined;
        })();

        const paymentUrlField = (payload as Record<string, unknown>).payment_url;
        const paymentUrl: string | undefined =
          typeof paymentUrlField === "string" ? paymentUrlField : resources.link || token;

        const resolveQr = async (): Promise<string | undefined> => {

          const displayElements =
            (payload.displayDetails as { elements?: unknown[] } | undefined)?.elements ?? null;

          const elementQr =
            Array.isArray(displayElements) &&
            displayElements
              .map((element) => {
                if (!element || typeof element !== "object") return null;
                const icon = (element as Record<string, unknown>).icon;
                return typeof icon === "string" && icon.trim().length > 0 ? icon : null;
              })
              .find((value): value is string => Boolean(value));

          const directQr =
            typeof (payload as Record<string, unknown>).qrImage === "string"
              ? (payload as Record<string, unknown>).qrImage
              : typeof (payload as Record<string, unknown>).qr === "string"
                ? (payload as Record<string, unknown>).qr
                : undefined;

          const candidate = resources.qr || elementQr || directQr;
          if (typeof candidate === "string" && candidate.trim().length > 0) {
            return ensureDataUrl(candidate);
          }

          if (!paymentUrl || typeof paymentUrl !== "string") return undefined;

          const safePaymentUrl = paymentUrl;

          try {
            const qrDataUrl = (await QRCode.toDataURL(safePaymentUrl, { margin: 1, width: 256 })) as unknown as string;
            return qrDataUrl;
          } catch {
            return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(safePaymentUrl)}`;
          }
        };

        void (async () => {
          const qr = await resolveQr();

          setPaymentResult({
            amount,
            currency: selectedCurrency?.symbol ?? selectedCurrency?.value ?? "сом",
            qr: qr || undefined,
            link: paymentUrl || undefined,
            raw: payload,
          });
          setPaymentStatus("pending");
          setPaymentWatchCurrency(selectedCurrency?.value ?? null);
          setBalanceSnapshot(resolveBalanceByCode(selectedCurrency?.value ?? null));
          setPushMessage(null);

          closeTopUpModal();
          setIsSuccessModalOpen(true);
          refreshBalances();
          resetForm();
        })();
      },
      error: (error: Error) => {
        setPaymentLoading(false);
        setPaymentError(parseError(error));
        setIsErrorModalOpen(true);
      },
    });
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setPaymentStatus(null);
    setPaymentWatchCurrency(null);
    setBalanceSnapshot(null);
    setPushMessage(null);
    setPaymentResult(null);
    closeTopUpModal();
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setPaymentError("");
  };

  const handleCurrencyChange = (option: SingleValue<Option>) => {
    if (option?.isDisabled) return;
    setSelectedCurrency(option ?? currencyOptions[0]);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    if (!method.available) {
      setPaymentError("Этот способ оплаты пока недоступен.");
      setIsErrorModalOpen(true);
      return;
    }
    setSelectedMethodId(method.id);
    const numericAmount = typeof price === "number" ? price : 0;
    if (method.id === "provider_a" && numericAmount > 0) {
      const calculatedCommission = calculateCommission(numericAmount);
      setCommission(calculatedCommission);
      setTotal(numericAmount + calculatedCommission);
    } else {
      setCommission(0);
      setTotal(numericAmount);
    }
  };

  const handleTransferAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/[^\d]/g, "");
    setTransferAmount(digits);
    setWithdrawMessage(null);
    setWithdrawStatus(null);
  };

  const handleWithdrawRequest = () => {
    if (withdrawLoading) return;
    const amountNumber = Number(transferAmount);
    if (!amountNumber || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setWithdrawMessage("Введите сумму для вывода.");
      setWithdrawStatus("error");
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMessage(null);
    setWithdrawStatus(null);
    createCardRequestApi({
      type: "withdrawal",
      amount: amountNumber,
      comment: selectedCurrency ? `Вывод ${amountNumber} ${selectedCurrency.value}` : undefined,
    }).subscribe({
      next: (result) => {
        setWithdrawLoading(false);
        if (result.success) {
          setWithdrawMessage("Заявка на вывод отправлена.");
          setWithdrawStatus("success");
          setTransferAmount("");
        } else {
          setWithdrawMessage("Не удалось отправить заявку. Попробуйте позже.");
          setWithdrawStatus("error");
        }
      },
      error: (error: Error) => {
        setWithdrawLoading(false);
        setWithdrawMessage(parseError(error));
        setWithdrawStatus("error");
      },
    });
  };

  const handleSubmitCardRequest = () => {
    if (cardRequestLoading) return;
    setCardRequestLoading(true);
    setCardRequestError("");
    createCardRequestApi({ type: "card_issue" }).subscribe({
      next: (result) => {
        setCardRequestLoading(false);
        if (result.success) {
          setIsCardModalOpen(false);
        } else {
          setCardRequestError("Не удалось отправить заявку. Попробуйте позже.");
        }
      },
      error: (error: Error) => {
        setCardRequestLoading(false);
        setCardRequestError(parseError(error));
      },
    });
  };

  const handleOpenBroker = () => {
    if (brokerRequestLoading) return;
    setBrokerRequestError("");
    setBrokerRequestLoading(true);

    // Бэкенд принимает только card_issue/withdrawal, поэтому используем card_issue и передаем комментарий.
    createCardRequestApi({
      type: "card_issue",
      comment: "Заявка на открытие брокерского счета",
    }).subscribe({
      next: (result) => {
        setBrokerRequestLoading(false);
        if (result.success) {
          setIsBrokerSuccessModalOpen(true);
        } else {
          setBrokerRequestError("Не удалось отправить заявку. Попробуйте позже.");
        }
      },
      error: (error: Error) => {
        setBrokerRequestLoading(false);
        setBrokerRequestError(parseError(error));
      },
    });
  };

  return (
    <div className={`${s.dashbord__top} ${isVip ? s.dashbord__topScrollable : ""}`}>
      {pushMessage && (
        <div className={s.pushToast} role="status" aria-live="polite">
          <div className={s.pushIcon} aria-hidden>
            ✓
          </div>
          <div className={s.pushText}>{pushMessage}</div>
        </div>
      )}
      <div className={s.dashbord__white}>
        <div className={s.dashbord__white__info}>
          <p className={s.dashbord__white__text}>Мой баланс</p>
          <span className={s.dashbord__white__sum} title={balanceTitle}>
            {balanceDisplay}
          </span>
          <div className={s.dashbord__btns}>
            <button type="button" className={s.dashbord__btn__bg} onClick={() => setIsTransferOpen(true)}>
              Перевести
            </button>
            <button
              type="button"
              className={s.dashbord__btn__border}
              onClick={() => {
                if (paymentLoading) return;
                openTopUpModal();
              }}
            >
              + Пополнить баланс
            </button>
              {isTransferOpen && (
                <div className={s.modalOverlays} onClick={() => setIsTransferOpen(false)}>
                  <div className={s.modals} onClick={(event) => event.stopPropagation()}>
                    <div className={s.balans__block__top}>
                      <span>Перевести</span>
                      <button className={s.closeButton} onClick={() => setIsTransferOpen(false)} aria-label="Закрыть">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 3l8 8M11 3l-8 8" stroke="#292929" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  <div className={s.form__block__balans}>
                    <div className={s.form__block__balan}>
                      <label htmlFor="transfer-amount">Сумма</label>
                      <input
                        id="transfer-amount"
                        type="text"
                        name="amount"
                        className={s.authForm__input}
                        placeholder="Введите сумму"
                        value={transferAmount}
                        onChange={handleTransferAmountChange}
                      />
                    </div>
                    <div className={s.form__block__balan}>
                      <label htmlFor="transfer-currency">Валюта</label>
                      <div className={s.selectContainer__top}>
                        <Select
                          inputId="transfer-currency"
                          value={null}
                          options={currencyOptions}
                          isDisabled
                          classNamePrefix="custom__select"
                          placeholder="Выберите валюту"
                        />
                      </div>
                    </div>
                    <div className={s.form__block__balan}>
                      <label htmlFor="transfer-account">Счет для списания</label>
                      <div className={s.selectContainer__top}>
                        <Select
                          inputId="transfer-account"
                          value={null}
                          options={[]}
                          isDisabled
                          classNamePrefix="custom__select"
                          placeholder="Счета недоступны"
                        />
                      </div>
                    </div>
                  </div>
                  <div className={s.dashbord__btns}>
                    <button type="button" className={s.dashbord__btn__bg} disabled>
                      Перевести
                    </button>
                    <button
                      type="button"
                      className={s.dashbord__btn__border}
                      onClick={handleWithdrawRequest}
                      disabled={withdrawLoading}
                    >
                      {withdrawLoading ? "Отправляем..." : "Вывести"}
                    </button>
                  </div>
                  {withdrawMessage && (
                    <div
                      className={`${s.withdrawMessage} ${withdrawStatus === "success" ? s.withdrawMessageSuccess : s.withdrawMessageError}`}
                    >
                      {withdrawMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
            {isTopUpOpen && (
              <div
                className={s.modalOverlays}
                onClick={() => {
                  if (!paymentLoading) closeTopUpModal();
                }}
              >
                <div className={s.modals} onClick={(event) => event.stopPropagation()}>
                  <div className={s.balans__block__top}>
                    <span>Пополнить счет</span>
                      <button
                        className={s.closeButton}
                        onClick={() => {
                          if (!paymentLoading) closeTopUpModal();
                        }}
                        aria-label="Закрыть"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 3l8 8M11 3l-8 8" stroke="#292929" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                  </div>
                  <div className={s.form__block__balans}>
                    <div className={s.form__block__balan}>
                      <label htmlFor="topup-amount">Введите сумму</label>
                      <input
                        id="topup-amount"
                        type="text"
                        name="amount"
                        className={s.authForm__input}
                        value={formattedPrice}
                        onChange={handlePriceChange}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>

                    <div className={s.form__block__balan}>
                      <label htmlFor="topup-currency">Выберите валюту</label>
                      <div className={s.selectContainer__top}>
                        <Select
                          inputId="topup-currency"
                          value={selectedCurrency}
                          options={currencyOptions}
                          onChange={handleCurrencyChange}
                          classNamePrefix="custom__select"
                          placeholder="Выберите валюту"
                          isOptionDisabled={(option) => option.isDisabled ?? false}
                          styles={{
                            control: (base) => ({
                              ...base,
                              border: "1.5px solid var(--border-light-gray)",
                              borderRadius: "6px",
                              height: "52px",
                              boxShadow: "none",
                              cursor: "pointer",
                            }),
                            option: (base, state) => ({
                              ...base,
                              opacity: state.isDisabled ? 0.4 : 1,
                              cursor: state.isDisabled ? "not-allowed" : "pointer",
                            }),
                          }}
                        />
                      </div>
                    </div>

                    <div className={s.form__block__balan}>
                      <div className={s.authForm__group__list}>
                        <h3 className={s.authForm__group__titles}>Выберите способ оплаты</h3>
                        {paymentMethods.map((method) => (
                          <div key={method.id} className={s.authForm__group__radio}>
                            <label
                              className={`${s.radio__option} ${!method.available ? s.radio__optionDisabled : ""}`}
                            >
                              <input
                                type="radio"
                                name="payment-method"
                                value={method.id}
                                checked={selectedMethodId === method.id}
                                disabled={!method.available || paymentLoading}
                                onChange={() => handleMethodSelect(method)}
                              />
                              <div className={s.radio__label}>
                                {method.label}
                                {!method.available && <span className={s.soonBadge}>Скоро</span>}
                              </div>
                            </label>

                            {selectedMethodId === method.id && method.id === "bank_transfer" && (
                              <div className={s.pays__info}>
                                <p>Счет получателя: 40178100000000000000</p>
                                <p>СБИК: 000000000</p>
                                <p>Наименование банка: Банк ВТБ (ПАО)</p>
                                <p>Корреспондентский счет: 30101000000000000000</p>
                                <p>ИНН: 0000000000</p>
                                <p>КПП: 000000000</p>
                              </div>
                            )}

                            {selectedMethodId === method.id && method.id === "provider_a" && (
                              <div className={s.pays__info__gray}>
                                <div className={s.pays__info__item}>
                                  <div className={s.pays__info__label}>Сумма:</div>
                                  <div className={s.pays__info__value}>
                                    {(typeof price === "number" ? price : 0).toLocaleString("ru-RU")}{" "}
                                    {selectedCurrency?.symbol}
                                  </div>
                                </div>
                                <div className={s.pays__info__item}>
                                  <div className={s.pays__info__label}>Комиссия банка</div>
                                  <div className={s.pays__info__value}>
                                    {commission.toLocaleString("ru-RU")} {selectedCurrency?.symbol}
                                  </div>
                                </div>
                                <span>Комиссия банка 7%, но не менее 50 рублей.</span>
                                <div className={s.pays__info__item}>
                                  <div className={s.pays__info__label}>Итого:</div>
                                  <div className={s.pays__info__value}>
                                    {total.toLocaleString("ru-RU")} {selectedCurrency?.symbol}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={s.authForm__btnPay}
                      onClick={handlePayment}
                      disabled={paymentLoading}
                    >
                      {paymentLoading
                        ? "Создаем платеж..."
                        : `Пополнить ${formattedTotal ? `на ${formattedTotal} ${selectedCurrency?.symbol || ""}` : ""}`.trim()}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isSuccessModalOpen && (
              <div className={s.modalOverlays} onClick={closeSuccessModal}>
                <div className={s.modals} onClick={(event) => event.stopPropagation()}>
                  <div className={s.success__modal}>
                    <Image aria-hidden src="/check.svg" alt="Успех" width={80} height={80} />
                    <h2>Запрос на пополнение создан</h2>
                    {paymentResult && (
                      <>
                        <p>
                          Сумма к оплате:{" "}
                          {paymentResult.amount.toLocaleString("ru-RU")} {paymentResult.currency}
                        </p>
                        {paymentStatus === "paid" ? (
                          <div className={s.qrWrapper}>
                            <div className={s.qrSuccessIcon} aria-hidden>
                              <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="44" cy="44" r="44" fill="#00B69B" fillOpacity="0.12" />
                                <circle cx="44" cy="44" r="32" fill="#00B69B" />
                                <path
                                  d="M32 44.5L40 52.5L56 36.5"
                                  stroke="white"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <span className={s.qrHint}>Платеж получен. Спасибо!</span>
                          </div>
                        ) : paymentResult.qr ? (
                          <div className={s.qrWrapper}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className={s.qrImage} src={paymentResult.qr} alt="QR-код для оплаты" />
                            <span className={s.qrHint}>
                              Отсканируйте QR-код в приложении банка, чтобы завершить оплату.
                            </span>
                          </div>
                        ) : (
                          <p className={s.qrFallback}>
                            QR-код недоступен. Попробуйте открыть ссылку на оплату ниже.
                          </p>
                        )}

                        {paymentResult.link && (
                          <a
                            className={`${s.authForm__btnPay} ${s.paymentLinkButton}`}
                            href={paymentResult.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Открыть ссылку на оплату
                          </a>
                        )}
                      </>
                    )}
                    <button className={s.authForm__btnPay} onClick={closeSuccessModal}>
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isErrorModalOpen && (
              <div className={s.modalOverlays} onClick={closeErrorModal}>
                <div className={s.modals} onClick={(event) => event.stopPropagation()}>
                  <div className={s.error__modal}>
                    <Image aria-hidden src="/error.png" alt="Ошибка" width={80} height={80} />
                    <h2>Упс! Что-то пошло не так</h2>
                    <p>{paymentError || "Подождите немного и попробуйте снова."}</p>
                    <button className={s.authForm__btnPay} onClick={closeErrorModal}>
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={s.dashbord__white__image}>
          <Image aria-hidden src="/carts.png" alt="Банковские карты" width={440} height={240} />
        </div>
      </div>
      <div className={`${s.dashbord__red} ${s.brokerCard}`}>
        <h3>Брокерский счет</h3>
        <div className={s.cardPreview}>
          <Image aria-hidden src="/card.png" alt="Брокерский счет" width={220} height={140} />
        </div>
        <button
          type="button"
          className={s.dashbord__btn__bg}
          onClick={handleOpenBroker}
          disabled={brokerRequestLoading}
        >
          {brokerRequestLoading ? "Отправляем..." : "Открыть"}
        </button>
        {brokerRequestError && <p className={s.errorText}>{brokerRequestError}</p>}
      </div>
      {isBrokerSuccessModalOpen && (
        <div className={s.modalOverlays} onClick={() => setIsBrokerSuccessModalOpen(false)}>
          <div className={s.modals} onClick={(event) => event.stopPropagation()}>
            <div className={s.success__modal}>
              <Image aria-hidden src="/check.svg" alt="Успех" width={80} height={80} />
              <h2>Ваша заявка на открытие отправлена</h2>
              <p>Скоро свяжется менеджер.</p>
              <button className={s.authForm__btnPay} onClick={() => setIsBrokerSuccessModalOpen(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      {isVip && (
        <div className={s.dashbord__red}>
          <h3>Мои карты</h3>
          <div className={s.cardPreview}>
            <Image aria-hidden src="/card.png" alt="Пластиковая карта" width={220} height={140} />
          </div>
          <button type="button" className={s.dashbord__btn__bg} onClick={() => setIsCardModalOpen(true)}>
            Выпустить карту
          </button>
        </div>
      )}
      {isVip && isCardModalOpen && (
        <div className={s.modalOverlays} onClick={() => setIsCardModalOpen(false)}>
          <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalCard__top}>
              <h4>Выпустить карту</h4>
              <button className={s.modalCard__close} onClick={() => setIsCardModalOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <p className={s.modalCard__text}>Отправить заявку на выпуск карты?</p>
            {cardRequestError && <p className={s.errorText}>{cardRequestError}</p>}
            <div className={s.modal__actions}>
              <button
                type="button"
                className={s.dashbord__btn__bg}
                onClick={handleSubmitCardRequest}
                disabled={cardRequestLoading}
              >
                Подтвердить
              </button>
              <button type="button" className={s.dashbord__btn__border} onClick={() => setIsCardModalOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
