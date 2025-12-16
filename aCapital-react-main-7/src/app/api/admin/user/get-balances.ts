import { httpWithAuth } from "../../http";

export type AdminUserBalanceItem = {
  currency_id: number;
  currency_code?: string;
  amount?: number;
  [key: string]: unknown;
};

export type AdminUserGetBalancesResponse = {
  success: boolean;
  data?: {
    balances?: AdminUserBalanceItem[];
    items?: AdminUserBalanceItem[];
    [key: string]: unknown;
  };
};

export const adminUserGetBalancesApi = (id: number) =>
  httpWithAuth<AdminUserGetBalancesResponse>(`/admin/user/get_balances?id=${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
