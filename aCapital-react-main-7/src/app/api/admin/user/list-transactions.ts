import { httpWithAuth } from "../../http";
import { AdminListResponse } from "./list";

export type AdminUserTransactionItem = {
  id: number;
  amount: number;
  currency_id: number;
  currency_code?: string;
  description?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

export const adminUserListTransactionsApi = (userId: number, page = 1, perPage = 10) =>
  httpWithAuth<AdminListResponse<AdminUserTransactionItem>>(
    `/admin/user/list_transactions?user_id=${userId}&page=${page}&per_page=${perPage}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
