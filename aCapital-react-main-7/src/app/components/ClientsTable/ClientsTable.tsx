"use client";

import { useEffect, useMemo, useState } from "react";
import Select, { SingleValue } from "react-select";
import s from "./clientsTable.module.scss";
import { data, Client } from "./dataClients";

type Option = {
  value: string;
  label: string;
};

const clientInfoConfig = [
  {
    title: "Клиент",
    fields: [
      { label: "Код клиента", key: "code" },
      { label: "ФИО", key: "client" },
      { label: "Дата рождения", key: "date" },
    ],
  },
  {
    title: "Контакты",
    fields: [
      { label: "Телефон", key: "phone" },
      { label: "Почта", key: "email" },
    ],
  },
  {
    title: "Документ, удостоверяющий личность",
    fields: [
      { label: "Наименование документа", key: "docName" },
      { label: "Серия", key: "docSeries" },
      { label: "Номер", key: "docNumber" },
      { label: "Дата выдачи", key: "docIssued" },
      { label: "Срок действия", key: "docValid" },
    ],
  },
  {
    title: "Документ о праве иностранного гражданина на пребывание в КР",
    fields: [],
    fallback: "Не имеет",
  },
  {
    title: "Адрес места жительства",
    fields: [
      { label: "Город", key: "city" },
      { label: "Улица", key: "street" },
      { label: "Дом", key: "house" },
      { label: "Квартира", key: "flat" },
    ],
  },
  {
    title: "Почтовый адрес",
    fields: [
      { label: "Город", key: "mailCity" },
      { label: "Улица", key: "mailStreet" },
      { label: "Дом", key: "mailHouse" },
      { label: "Квартира", key: "mailFlat" },
    ],
  },
  {
    title: "Доходы",
    fields: [
      { label: "ИНН", key: "inn" },
      { label: "ИНН (TIN)", key: "tin" },
    ],
  },
];

const statusOptions: Option[] = [
  { value: "all", label: "Все" },
  { value: "success", label: "Успех" },
  { value: "pending", label: "Ожидание" },
  { value: "error", label: "Отказ" },
  { value: "new", label: "Новый" },
];

const clientTypeOptions: Option[] = [
  { value: "all", label: "Все" },
  { value: "individual", label: "Физическое лицо" },
  { value: "legal", label: "Юридическое лицо" },
];

const statusLabels: Record<string, string> = {
  success: "Успех",
  pending: "Ожидание",
  error: "Отказ",
  new: "Новый",
};

const statusClasses: Record<string, string> = {
  success: s.item__success,
  pending: s.item__pending,
  error: s.item__error,
  new: s.item__new,
};

export default function ClientsTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Option>(statusOptions[0]);
  const [clientTypeFilter, setClientTypeFilter] = useState<Option>(clientTypeOptions[0]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const pageSize = 10;

  const filteredData = data
    .filter((row) => (search ? row.client.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((row) => (statusFilter.value === "all" ? true : row.status === statusFilter.value))
    .filter((row) => (clientTypeFilter.value === "all" ? true : row.type === clientTypeFilter.value));

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageButtons = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const buttons: Array<number | string> = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) buttons.push("…");
    for (let p = start; p <= end; p += 1) buttons.push(p);
    if (end < totalPages - 1) buttons.push("…");
    buttons.push(totalPages);
    return buttons;
  }, [page, totalPages]);

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const renderStatus = (status: string) => {
    const className = statusClasses[status] || s.item__pending;
    const label = statusLabels[status] || status;
    return <span className={className}>{label}</span>;
  };

  return (
    <div className={s.table__block__wrapper}>
      <div className={s.toolbar}>
        <div className={s.toolbarHeader}>
          <div>
            <p className={s.toolbarTitle}>Клиенты</p>
            <span className={s.toolbarSubtitle}>Полный список клиентов и их статусы</span>
          </div>
          <span className={s.totalBadge}>{filteredData.length}</span>
        </div>

        <div className={s.filterBar}>
          <div className={s.filterGroup}>
            <label>Тип клиента</label>
            <Select
              value={clientTypeFilter}
              options={clientTypeOptions}
              classNamePrefix={s.custom__select}
              onChange={(option: SingleValue<Option>) => {
                if (option) {
                  setClientTypeFilter(option);
                  setPage(1);
                }
              }}
            />
          </div>

          <div className={s.filterGroup}>
            <label>Статус</label>
            <Select
              value={statusFilter}
              options={statusOptions}
              classNamePrefix={s.custom__select}
              onChange={(option: SingleValue<Option>) => {
                if (option) {
                  setStatusFilter(option);
                  setPage(1);
                }
              }}
            />
          </div>

          <div className={s.searchGroup}>
            <label>Поиск</label>
            <div className={s.searchInput}>
              <input
                type="text"
                placeholder="ФИО, телефон, почта"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <button
            className={s.resetButton}
            onClick={() => {
              setClientTypeFilter(clientTypeOptions[0]);
              setStatusFilter(statusOptions[0]);
              setSearch("");
              setPage(1);
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className={s.table__block}>
        <div className={s.table__borders}>
          <table className={s.table__border}>
            <thead>
              <tr className={s.table__head}>
                <th className={s.table__head__col}>Код клиента</th>
                <th className={s.table__head__col}>Дата</th>
                <th className={s.table__head__col}>Клиент</th>
                <th className={s.table__head__col}>Статус</th>
                <th className={s.table__head__col}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => (
                <tr
                  key={row.code}
                  className={s.table__row}
                  onClick={() => setSelectedClient(row)}
                >
                  <td className={s.table__row__col}>{row.code}</td>
                  <td className={s.table__row__col}>{row.date}</td>
                  <td className={s.table__row__col}>{row.client}</td>
                  <td className={s.table__row__col}>{renderStatus(row.status)}</td>
                  <td className={s.table__row__col}>
                    <button className={s.table__row__btn}>
                      <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="9.969" cy="9.5" r="3.5" stroke="#94A3B8" strokeWidth="1.5" />
                        <path d="M15.3 15.1176L17.9 17.2059" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className={s.emptyRow}>
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={s.paginationRow}>
          <div className={s.pagination}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={s.pageButton}
            >
              «
            </button>

            {pageButtons.map((p, idx) =>
              typeof p === "number" ? (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`${s.pageButton} ${page === p ? s.pageButtonActive : ""}`}
                >
                  {p}
                </button>
              ) : (
                <span key={`${p}-${idx}`} className={s.pageEllipsis}>
                  {p}
                </span>
              )
            )}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={s.pageButton}
            >
              »
            </button>
          </div>

          <div className={s.paginationInfo}>
            Показано: {paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0}-
            {(page - 1) * pageSize + paginatedData.length} из {filteredData.length}
          </div>
        </div>
      </div>

      <div className={`${s.sidePanel} ${selectedClient ? s.sidePanelOpen : ""}`}>
        {selectedClient && (
          <>
            <div className={s.sidePanel__header}>
              <h2>{selectedClient.client}</h2>
              <button onClick={() => setSelectedClient(null)} className={s.activateFormClose}>
                ×
              </button>
            </div>

            <div className={s.sidePanel__content}>
              <div className={s.sidePanel__status}>{renderStatus(selectedClient.status)}</div>
              <div className={s.sidePanel__contacts}>
                <span>Телефон: {selectedClient.phone}</span>
                <span>Email: {selectedClient.email}</span>
              </div>

              {clientInfoConfig.map((section) => {
                const hasData = section.fields.some((field) => selectedClient[field.key as keyof Client]);
                return (
                  <div key={section.title} className={s.sidePanel__box}>
                    <h3>{section.title}</h3>
                    {section.fields.length === 0 && !hasData && <p>{section.fallback || "—"}</p>}
                    {section.fields.map((field) => (
                      <div key={field.key} className={s.sidePanel__row}>
                        <span>{field.label}</span>
                        <span className={s.sidePanel__value}>
                          {(selectedClient as any)[field.key] || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
