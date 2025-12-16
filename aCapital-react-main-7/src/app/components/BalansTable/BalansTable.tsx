"use client";

import { useEffect, useMemo, useState } from "react";
import Select, { SingleValue } from "react-select";
import s from "./balansTable.module.scss";
import { useUserTransactions } from "@/app/hooks/use-user-transactions";
import { Loader } from "@/app/components/Loader";

type Option = {
  value: string;
  label: string;
};

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const OPERATION_LABELS: Record<string, { label: string; badge: "success" | "pending" | "error" }> = {
  deposit: { label: "Пополнение", badge: "success" },
  withdraw: { label: "Списание", badge: "error" },
  admin_action: { label: "Изменение администратором", badge: "pending" },
  adjustment: { label: "Корректировка", badge: "pending" },
  transfer: { label: "Перевод", badge: "pending" },
};

const getOperationPresentation = (type: string | undefined) => {
  if (!type) {
    return { label: "Неизвестно", badge: "pending" as const };
  }
  const normalized = type.toLowerCase();
  return (
    OPERATION_LABELS[normalized] ?? {
      label: normalized.replace(/_/g, " "),
      badge: "pending" as const,
    }
  );
};

const getBadgeClassName = (badge: "success" | "pending" | "error") => {
  switch (badge) {
    case "success":
      return s.item__sucess;
    case "error":
      return s.item__error;
    default:
      return s.item__pending;
  }
};

export default function TransactionsTable() {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const { transactions, total, pages, loading, error } = useUserTransactions({
    page,
    per_page: pageSize,
  });

  const currencyOptions = useMemo<Option[]>(() => {
    const entries = new Map<string, string>();
    transactions.forEach((tx) => {
      if (tx.currencyCode) {
        entries.set(tx.currencyCode, `${tx.currencySymbol || tx.currencyCode} (${tx.currencyCode})`);
      }
    });
    return [
      { value: "all", label: "Все валюты" },
      ...Array.from(entries.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [transactions]);

  const statusOptions = useMemo<Option[]>(() => {
    const entries = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.operationType) {
        entries.add(tx.operationType);
      }
    });
    return [
      { value: "all", label: "Все типы" },
      ...Array.from(entries.values()).map((value) => ({
        value,
        label: getOperationPresentation(value).label,
      })),
    ];
  }, [transactions]);

  const hasFilters = currencyFilter !== "all" || statusFilter !== "all" || Boolean(selectedDate);

  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesCurrency = currencyFilter === "all" ? true : tx.currencyCode === currencyFilter;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : tx.operationType.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = selectedDate ? tx.createdAt.slice(0, 10) === selectedDate : true;
      return matchesCurrency && matchesStatus && matchesDate;
    });
  }, [transactions, currencyFilter, statusFilter, selectedDate]);

  const effectiveTotalPages = useMemo(() => {
    if (!hasFilters) {
      return pages || 1;
    }
    return Math.max(1, Math.ceil(filteredData.length / pageSize));
  }, [filteredData.length, hasFilters, pages, pageSize]);

  useEffect(() => {
    if (page > effectiveTotalPages) {
      setPage(effectiveTotalPages);
    }
  }, [effectiveTotalPages, page]);

  const displayedData = useMemo(() => {
    if (!hasFilters) {
      return filteredData;
    }
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, hasFilters, page, pageSize]);

  const totalForInfo = hasFilters ? filteredData.length : total;
  const startIndex = displayedData.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIndex = displayedData.length > 0 ? startIndex + displayedData.length - 1 : 0;

  const handleResetFilters = () => {
    setCurrencyFilter("all");
    setStatusFilter("all");
    setSelectedDate("");
    setPage(1);
  };

  const handleCurrencyChange = (option: SingleValue<Option>) => {
    setCurrencyFilter(option?.value ?? "all");
    setPage(1);
  };

  const handleStatusChange = (option: SingleValue<Option>) => {
    setStatusFilter(option?.value ?? "all");
    setPage(1);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setPage(1);
  };

  const renderAmount = (amount: number, currencySymbol: string, currencyCode: string) => {
    const isPositive = amount >= 0;
    const formattedValue = numberFormatter.format(Math.abs(amount));
    const label =
      currencySymbol && currencyCode
        ? `${currencySymbol} (${currencyCode})`
        : currencySymbol || currencyCode || "";
    return `${isPositive ? "+" : "-"}${formattedValue}${label ? ` ${label}` : ""}`;
  };

  const renderStatusBadge = (operationType: string) => {
    const { label, badge } = getOperationPresentation(operationType);
    return <span className={getBadgeClassName(badge)}>{label}</span>;
  };

  const renderFilters = (variant: "desktop" | "mobile") => (
    <>
      <div className={variant === "desktop" ? s.table__block__filter : s.mob__block__filter}>
        <label>Тип операции</label>
        <Select
          value={statusOptions.find((option) => option.value === statusFilter) ?? null}
          options={statusOptions}
          classNamePrefix="custom__select"
          onChange={handleStatusChange}
          styles={{
            control: (base) => ({
              ...base,
              border: "1.5px solid var(--border-light-gray)",
              borderRadius: "6px",
              height: "44px",
              boxShadow: "none",
              fontSize: "13px",
              "&:hover": { borderColor: "var(--border-light-gray)" },
            }),
            placeholder: (base) => ({
              ...base,
              color: "var(--text-light-gray)",
              fontSize: "13px",
            }),
            singleValue: (base) => ({
              ...base,
              color: "var(--text-light-gray)",
              fontSize: "13px",
            }),
          }}
        />
      </div>
      <div className={variant === "desktop" ? s.table__block__filter : s.mob__block__filter}>
        <label>Валюта</label>
        <Select
          value={currencyOptions.find((option) => option.value === currencyFilter) ?? null}
          options={currencyOptions}
          classNamePrefix="custom__select"
          onChange={handleCurrencyChange}
          styles={{
            control: (base) => ({
              ...base,
              border: "1.5px solid var(--border-light-gray)",
              borderRadius: "6px",
              height: "44px",
              boxShadow: "none",
              fontSize: "13px",
              "&:hover": { borderColor: "var(--border-light-gray)" },
            }),
            placeholder: (base) => ({
              ...base,
              color: "var(--text-light-gray)",
              fontSize: "13px",
            }),
            singleValue: (base) => ({
              ...base,
              color: "var(--text-light-gray)",
              fontSize: "13px",
            }),
          }}
        />
      </div>
      <div className={variant === "desktop" ? s.table__block__filter : s.mob__block__filter}>
        <label>Дата</label>
        <div className={variant === "desktop" ? s.dateInputsRow : ""}>
          <input
            type="date"
            className={variant === "desktop" ? s.activateForm__input__date : s.activateForm__input}
            value={selectedDate}
            style={{ height: "44px", fontSize: "13px" }}
            onChange={(event) => handleDateChange(event.target.value)}
          />
        </div>
      </div>
      {variant === "mobile" && (
        <div className={s.mob__block__filter}>
          <button onClick={handleResetFilters} className={s.filter__refresh}>
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3.75V0.75L2.25 4.5L6 8.25V5.25C8.4825 5.25 10.5 7.2675 10.5 9.75C10.5 12.2325 8.4825 14.25 6 14.25C3.5175 14.25 1.5 12.2325 1.5 9.75H0C0 13.065 2.685 15.75 6 15.75C9.315 15.75 12 13.065 12 9.75C12 6.435 9.315 3.75 6 3.75Z" fill="#30353A" />
            </svg>{" "}
            Сбросить фильтры
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={s.table__block__wrapper}>
      {isOpen && (
        <div className={s.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={s.mobFilter__block} onClick={(event) => event.stopPropagation()}>
            <div className={s.mobFilter__block__top}>
              <span>История операций</span>
              <button className={s.table__filter__mob} onClick={() => setIsOpen(false)} aria-label="Закрыть фильтры">
                ×
              </button>
            </div>
            <div className={s.mob__block__filters}>{renderFilters("mobile")}</div>
          </div>
        </div>
      )}

      <div className={s.table__block}>
        {/* Фильтры */}
        <div className={s.table__block__head}>
          <div className={s.table__headActions}>
            <button onClick={handleResetFilters} className={`${s.filter__refresh} ${s.filter__refresh_head}`}>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3.75V0.75L2.25 4.5L6 8.25V5.25C8.4825 5.25 10.5 7.2675 10.5 9.75C10.5 12.2325 8.4825 14.25 6 14.25C3.5175 14.25 1.5 12.2325 1.5 9.75H0C0 13.065 2.685 15.75 6 15.75C9.315 15.75 12 13.065 12 9.75C12 6.435 9.315 3.75 6 3.75Z" fill="#30353A" />
              </svg>
              Сбросить фильтры
            </button>
          </div>
          <button className={s.table__filter__mob} onClick={() => setIsOpen(true)} aria-label="Открыть фильтры">
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.66803 10.0367L1.66803 13.4901C1.66803 13.6669 1.73826 13.8365 1.86329 13.9615C1.98831 14.0865 2.15788 14.1567 2.33469 14.1567C2.5115 14.1567 2.68107 14.0865 2.8061 13.9615C2.93112 13.8365 3.00136 13.6669 3.00136 13.4901L3.00136 10.0367C3.38746 9.8966 3.72105 9.64099 3.9568 9.30463C4.19254 8.96827 4.31901 8.56748 4.31901 8.15674C4.31901 7.74599 4.19254 7.34521 3.9568 7.00885C3.72105 6.67249 3.38746 6.41687 3.00136 6.27674L3.00136 1.49007C3.00136 1.31326 2.93112 1.14369 2.8061 1.01867C2.68107 0.893642 2.5115 0.823405 2.33469 0.823405C2.15788 0.823405 1.98831 0.893642 1.86329 1.01867C1.73826 1.14369 1.66803 1.31326 1.66803 1.49007L1.66803 6.27674C1.28192 6.41687 0.948332 6.67249 0.712586 7.00885C0.47684 7.34521 0.350374 7.74599 0.350374 8.15674C0.350374 8.56748 0.47684 8.96827 0.712586 9.30463C0.948331 9.64099 1.28192 9.8966 1.66803 10.0367ZM2.33469 7.49007C2.46655 7.49007 2.59544 7.52917 2.70507 7.60242C2.81471 7.67568 2.90015 7.7798 2.95061 7.90162C3.00107 8.02343 3.01427 8.15748 2.98855 8.2868C2.96283 8.41612 2.89933 8.53491 2.8061 8.62814C2.71286 8.72138 2.59407 8.78487 2.46475 8.81059C2.33543 8.83632 2.20139 8.82312 2.07957 8.77266C1.95775 8.7222 1.85363 8.63675 1.78038 8.52712C1.70712 8.41749 1.66803 8.28859 1.66803 8.15674C1.66803 7.97993 1.73826 7.81036 1.86329 7.68533C1.98831 7.56031 2.15788 7.49007 2.33469 7.49007ZM6.33469 6.03674L6.33469 13.4901C6.33469 13.6669 6.40493 13.8365 6.52995 13.9615C6.65498 14.0865 6.82455 14.1567 7.00136 14.1567C7.17817 14.1567 7.34774 14.0865 7.47276 13.9615C7.59779 13.8365 7.66803 13.6669 7.66803 13.4901L7.66803 6.03674C8.05413 5.8966 8.38772 5.64099 8.62346 5.30463C8.85921 4.96827 8.98568 4.56748 8.98568 4.15674C8.98568 3.74599 8.85921 3.34521 8.62347 3.00885C8.38772 2.67249 8.05413 2.41687 7.66803 2.27674L7.66803 1.49007C7.66803 1.31326 7.59779 1.14369 7.47276 1.01867C7.34774 0.893643 7.17817 0.823406 7.00136 0.823406C6.82455 0.823406 6.65498 0.893643 6.52996 1.01867C6.40493 1.14369 6.33469 1.31326 6.33469 1.49007L6.33469 2.27674C5.94859 2.41687 5.615 2.67249 5.37925 3.00885C5.14351 3.34521 5.01704 3.74599 5.01704 4.15674C5.01704 4.56748 5.14351 4.96827 5.37925 5.30463C5.615 5.64099 5.94859 5.8966 6.33469 6.03674ZM7.00136 3.49007C7.13321 3.49007 7.26211 3.52917 7.37174 3.60243C7.48137 3.67568 7.56682 3.7798 7.61728 3.90162C7.66774 4.02343 7.68094 4.15748 7.65522 4.2868C7.62949 4.41612 7.566 4.53491 7.47276 4.62814C7.37953 4.72138 7.26074 4.78487 7.13142 4.81059C7.0021 4.83632 6.86805 4.82312 6.74624 4.77266C6.62442 4.7222 6.5203 4.63675 6.44705 4.52712C6.37379 4.41749 6.33469 4.28859 6.33469 4.15674C6.33469 3.97993 6.40493 3.81036 6.52995 3.68533C6.65498 3.56031 6.82455 3.49007 7.00136 3.49007ZM11.0014 11.3701L11.0014 13.4901C11.0014 13.6669 11.0716 13.8365 11.1966 13.9615C11.3216 14.0865 11.4912 14.1567 11.668 14.1567C11.8448 14.1567 12.0144 14.0865 12.1394 13.9615C12.2645 13.8365 12.3347 13.6669 12.3347 13.4901L12.3347 11.3701C12.7208 11.2299 13.0544 10.9743 13.2901 10.638C13.5259 10.3016 13.6523 9.90082 13.6523 9.49007C13.6523 9.07933 13.5259 8.67854 13.2901 8.34218C13.0544 8.00582 12.7208 7.75021 12.3347 7.61007L12.3347 1.49007C12.3347 1.31326 12.2645 1.14369 12.1394 1.01867C12.0144 0.893643 11.8448 0.823406 11.668 0.823406C11.4912 0.823406 11.3216 0.893643 11.1966 1.01867C11.0716 1.14369 11.0014 1.31326 11.0014 1.49007L11.0014 7.61007C10.6153 7.75021 10.2817 8.00582 10.0459 8.34218C9.81017 8.67854 9.68371 9.07933 9.68371 9.49007C9.68371 9.90082 9.81017 10.3016 10.0459 10.638C10.2817 10.9743 10.6153 11.2299 11.0014 11.3701ZM11.668 8.82341C11.7999 8.82341 11.9288 8.8625 12.0384 8.93576C12.148 9.00901 12.2335 9.11313 12.2839 9.23495C12.3344 9.35677 12.3476 9.49081 12.3219 9.62013C12.2962 9.74945 12.2327 9.86824 12.1394 9.96148C12.0462 10.0547 11.9274 10.1182 11.7981 10.1439C11.6688 10.1697 11.5347 10.1564 11.4129 10.106C11.2911 10.0555 11.187 9.97008 11.1137 9.86045C11.0405 9.75082 11.0014 9.62193 11.0014 9.49007C11.0014 9.31326 11.0716 9.14369 11.1966 9.01867C11.3216 8.89364 11.4912 8.82341 11.668 8.82341" fill="#292929" />
            </svg>
          </button>
          <div className={s.table__block__filters}>{renderFilters("desktop")}</div>
        </div>

        {/* Таблица */}
        <div className={s.table__borders}>
          <table className={s.table__border}>
            <thead>
              <tr className={s.table__head}>
                <th className={s.table__head__col}>Дата</th>
                <th className={s.table__head__col}>Сумма</th>
                <th className={s.table__head__col}>Валюта</th>
                <th className={s.table__head__col}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className={s.table__loader} colSpan={4}>
                    <Loader size={20} />
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className={s.table__error} colSpan={4}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && displayedData.length === 0 && (
                <tr>
                  <td className={s.table__empty} colSpan={4}>
                    Нет операций за выбранный период.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                displayedData.map((tx) => (
                  <tr key={tx.id} className={s.table__row}>
                    <td className={s.table__row__col}>{tx.createdAtLabel}</td>
                    <td
                      className={`${s.table__row__col} ${
                        tx.amount >= 0 ? s.table__row__green : s.table__row__red
                      }`}
                    >
                      {renderAmount(tx.amount, tx.currencySymbol, tx.currencyCode)}
                    </td>
                    <td className={s.table__row__col}>
                      {tx.currencySymbol && tx.currencyCode
                        ? `${tx.currencySymbol} (${tx.currencyCode})`
                        : tx.currencySymbol || tx.currencyCode || "—"}
                    </td>
                    <td className={s.table__row__col}>{renderStatusBadge(tx.operationType)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        <div className={s.paginationRow}>
          <div className={s.pagination}>
            <button
              className={s.btn__gray}
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Предыдущая страница"
            >
              «
            </button>
            {Array.from({ length: effectiveTotalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={page === pageNumber ? s.btn__red : s.btn__gray}
                aria-current={page === pageNumber ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className={s.btn__gray}
              disabled={page === effectiveTotalPages}
              onClick={() => setPage((current) => Math.min(effectiveTotalPages, current + 1))}
              aria-label="Следующая страница"
            >
              »
            </button>
          </div>

          <div className={s.paginationInfo}>
            Показано: {startIndex}-{endIndex} из {totalForInfo} элементов
          </div>
        </div>
      </div>
    </div>
  );
}
