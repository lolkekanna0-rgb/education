import { httpWithAuth } from "../http";

export type UserBalanceItem = {
  currency_id?: number;
  currency_code?: string;
  amount?: number | string;
  balance?: number | string;
  value?: number | string;
  currency?: string;
  [key: string]: unknown;
};

type UserBalancesPayload = {
  balances?: UserBalanceItem[];
  items?: UserBalanceItem[];
  balance?: UserBalanceItem | UserBalanceItem[];
  [key: string]: unknown;
};

export type UserGetBalancesResponse = {
  success: boolean;
  data?: UserBalancesPayload | UserBalanceItem[];
  balances?: UserBalanceItem[];
  items?: UserBalanceItem[];
};

export const userGetBalancesApi = () =>
  httpWithAuth<UserGetBalancesResponse>("/user/get_balances", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
