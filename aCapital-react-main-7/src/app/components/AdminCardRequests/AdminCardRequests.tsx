"use client";

import { useEffect, useMemo, useState } from "react";
import { adminCardRequestListApi, AdminCardRequestItem } from "@/app/api/admin/cards/list";
import { parseError } from "@/app/utils/parse-error";
import { Loader } from "@/app/components/Loader";
import tableStyles from "../ClientsTable/clientsTable.module.scss";
import AdminUserDrawer from "../AdminDashboard/AdminUserDrawer";
import s from "./adminCardRequests.module.scss";

type StatusState<T> = {
  items: T[];
  loading: boolean;
  error: string;
  total: number;
};

const initialState = <T,>(): StatusState<T> => ({
  items: [],
  loading: false,
  error: "",
  total: 0,
});

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatRequestType = (value?: string, comment?: string | null) => {
  if (!value) return "—";
  if (comment?.toLowerCase().includes("брокер")) return "Открытие брокерского счета";
  if (value === "card_issue") return "Выпуск карты";
  if (value === "withdrawal") return "Вывод средств";
  return value;
};

export default function AdminCardRequests() {
  const [state, setState] = useState<StatusState<AdminCardRequestItem>>(initialState);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    const sub = adminCardRequestListApi(page, perPage).subscribe({
      next: (result) => {
        if (result.success) {
          setState({
            items: result.data?.items ?? [],
            total: result.data?.total ?? result.data?.items?.length ?? 0,
            loading: false,
            error: "",
          });
        } else {
          setState({ items: [], total: 0, loading: false, error: "Не удалось получить заявки." });
        }
      },
      error: (err: Error) => {
        setState({ items: [], total: 0, loading: false, error: parseError(err) });
      },
    });
    return () => sub.unsubscribe();
  }, [page, perPage]);

  const normalizedItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return state.items;
    return state.items.filter((item) => {
      const user = item.user;
      const matchPhone = user?.phone?.toLowerCase().includes(term);
      const matchEmail = user?.email?.toLowerCase().includes(term);
      const matchId = String(item.id).includes(term);
      return Boolean(matchPhone || matchEmail || matchId);
    });
  }, [state.items, search]);

  const totalPages = Math.max(1, Math.ceil(Math.max(state.total, 0) / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className={s.wrapper}>
      <div className={tableStyles.table__block}>
        <div className={tableStyles.table__block__top}>
          <div className={tableStyles.table__block__filters}>
            <div className={s.perPageControl}>
              <span className={s.perPageLabel}>На странице</span>
              <select
                className={s.perPageSelect}
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 30].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={tableStyles.table__search}>
            <input
              placeholder="Поиск по ID, телефону или e-mail"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button className={tableStyles.table__filter__mob} type="button" aria-label="Открыть фильтры">
              <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.66803 10.0367L1.66803 13.4901C1.66803 13.6669 1.73826 13.8365 1.86329 13.9615C1.98831 14.0865 2.15788 14.1567 2.33469 14.1567C2.5115 14.1567 2.68107 14.0865 2.8061 13.9615C2.93112 13.8365 3.00136 13.6669 3.00136 13.4901L3.00136 10.0367C3.38746 9.8966 3.72105 9.64099 3.9568 9.30463C4.19254 8.96827 4.31901 8.56748 4.31901 8.15674C4.31901 7.74599 4.19254 7.34521 3.9568 7.00885C3.72105 6.67249 3.38746 6.41687 3.00136 6.27674L3.00136 1.49007C3.00136 1.31326 2.93112 1.14369 2.8061 1.01867C2.68107 0.893642 2.5115 0.823405 2.33469 0.823405C2.15788 0.823405 1.98831 0.893642 1.86329 1.01867C1.73826 1.14369 1.66803 1.31326 1.66803 1.49007L1.66803 6.27674C1.28192 6.41687 0.948332 6.67249 0.712586 7.00885C0.47684 7.34521 0.350374 7.74599 0.350374 8.15674C0.350374 8.56748 0.47684 8.96827 0.712586 9.30463C0.948331 9.64099 1.28192 9.8966 1.66803 10.0367ZM2.33469 7.49007C2.46655 7.49007 2.59544 7.52917 2.70507 7.60242C2.81471 7.67568 2.90015 7.7798 2.95061 7.90162C3.00107 8.02343 3.01427 8.15748 2.98855 8.2868C2.96283 8.41612 2.89933 8.53491 2.8061 8.62814C2.71286 8.72138 2.59407 8.78487 2.46475 8.81059C2.33543 8.83632 2.20139 8.82312 2.07957 8.77266C1.95775 8.7222 1.85363 8.63675 1.78038 8.52712C1.70712 8.41749 1.66803 8.28859 1.66803 8.15674C1.66803 7.97993 1.73826 7.81036 1.86329 7.68533C1.98831 7.56031 2.15788 7.49007 2.33469 7.49007ZM6.33469 6.03674L6.33469 13.4901C6.33469 13.6669 6.40493 13.8365 6.52995 13.9615C6.65498 14.0865 6.82455 14.1567 7.00136 14.1567C7.17817 14.1567 7.34774 14.0865 7.47276 13.9615C7.59779 13.8365 7.66803 13.6669 7.66803 13.4901L7.66803 6.03674C8.05413 5.8966 8.38772 5.64099 8.62346 5.30463C8.85921 4.96827 8.98568 4.56748 8.98568 4.15674C8.98568 3.74599 8.85921 3.34521 8.62347 3.00885C8.38772 2.67249 8.05413 2.41687 7.66803 2.27674L7.66803 1.49007C7.66803 1.31326 7.59779 1.14369 7.47276 1.01867C7.34774 0.893643 7.17817 0.823406 7.00136 0.823406C6.82455 0.823406 6.65498 0.893643 6.52996 1.01867C6.40493 1.14369 6.33469 1.31326 6.33469 1.49007L6.33469 2.27674C5.94859 2.41687 5.615 2.67249 5.37925 3.00885C5.14351 3.34521 5.01704 3.74599 5.01704 4.15674C5.01704 4.56748 5.14351 4.96827 5.37925 5.30463C5.615 5.64099 5.94859 5.8966 6.33469 6.03674ZM7.00136 3.49007C7.13321 3.49007 7.26211 3.52917 7.37174 3.60243C7.48137 3.67568 7.56682 3.7798 7.61728 3.90162C7.66774 4.02343 7.68094 4.15748 7.65522 4.2868C7.62949 4.41612 7.566 4.53491 7.47276 4.62814C7.37953 4.72138 7.26074 4.78487 7.13142 4.81059C7.0021 4.83632 6.86805 4.82312 6.74624 4.77266C6.62442 4.7222 6.5203 4.63675 6.44705 4.52712C6.37379 4.41749 6.33469 4.28859 6.33469 4.15674C6.33469 3.97993 6.40493 3.81036 6.52995 3.68533C6.65498 3.56031 6.82455 3.49007 7.00136 3.49007ZM11.0014 11.3701L11.0014 13.4901C11.0014 13.6669 11.0716 13.8365 11.1966 13.9615C11.3216 14.0865 11.4912 14.1567 11.668 14.1567C11.8448 14.1567 12.0144 14.0865 12.1394 13.9615C12.2645 13.8365 12.3347 13.6669 12.3347 13.4901L12.3347 11.3701C12.7208 11.2299 13.0544 10.9743 13.2901 10.638C13.5259 10.3016 13.6523 9.90082 13.6523 9.49007C13.6523 9.07933 13.5259 8.67854 13.2901 8.34218C13.0544 8.00582 12.7208 7.75021 12.3347 7.61007L12.3347 1.49007C12.3347 1.31326 12.2645 1.14369 12.1394 1.01867C12.0144 0.893643 11.8448 0.823406 11.668 0.823406C11.4912 0.823406 11.3216 0.893643 11.1966 1.01867C11.0716 1.14369 11.0014 1.31326 11.0014 1.49007L11.0014 7.61007C10.6153 7.75021 10.2817 8.00582 10.0459 8.34218C9.81017 8.67854 9.68371 9.07933 9.68371 9.49007C9.68371 9.90082 9.81017 10.3016 10.0459 10.638C10.2817 10.9743 10.6153 11.2299 11.0014 11.3701ZM11.668 8.82341C11.7999 8.82341 11.9288 8.8625 12.0384 8.93576C12.148 9.00901 12.2335 9.11313 12.2839 9.23495C12.3344 9.35677 12.3476 9.49081 12.3219 9.62013C12.2962 9.74945 12.2327 9.86824 12.1394 9.96148C12.0462 10.0547 11.9274 10.1182 11.7981 10.1439C11.6688 10.1697 11.5347 10.1564 11.4129 10.106C11.2911 10.0555 11.187 9.97008 11.1137 9.86045C11.0405 9.75082 11.0014 9.62193 11.0014 9.49007C11.0014 9.31326 11.0716 9.14369 11.1966 9.01867C11.3216 8.89364 11.4912 8.82341 11.668 8.82341Z" fill="#292929" />
              </svg>
            </button>
          </div>
        </div>

        <div className={tableStyles.table__borders}>
          <table className={tableStyles.table__border}>
            <thead>
              <tr className={tableStyles.table__head}>
                <th className={tableStyles.table__head__col}>ID</th>
                <th className={tableStyles.table__head__col}>Клиент</th>
                <th className={tableStyles.table__head__col}>Контакты</th>
                <th className={tableStyles.table__head__col}>Тип</th>
                <th className={tableStyles.table__head__col}>Статус</th>
                <th className={tableStyles.table__head__col}>Создано</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td colSpan={6} className={tableStyles.table__loader}>
                    <Loader />
                  </td>
                </tr>
              ) : normalizedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className={tableStyles.table__loader}>
                    Заявки отсутствуют
                  </td>
                </tr>
              ) : (
                normalizedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={tableStyles.table__row}
                    onClick={() => item.user?.id && setSelectedUserId(item.user.id)}
                  >
                    <td className={tableStyles.table__row__col}>{item.id}</td>
                    <td className={tableStyles.table__row__col}>
                      {item.user?.profile
                        ? `${item.user.profile.first_name ?? ""} ${item.user.profile.last_name ?? ""}`.trim() || "—"
                        : "—"}
                    </td>
                <td className={tableStyles.table__row__col}>
                  <div className={s.contacts}>
                    <span>{item.user?.phone || "—"}</span>
                    <span>{item.user?.email || "—"}</span>
                  </div>
                </td>
                <td className={tableStyles.table__row__col}>{formatRequestType(item.type, item.comment)}</td>
                <td className={tableStyles.table__row__col}>{item.status || "pending"}</td>
                <td className={tableStyles.table__row__col}>{formatDateTime(item.created_at)}</td>
              </tr>
            ))
          )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminUserDrawer userId={selectedUserId} open={Boolean(selectedUserId)} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
