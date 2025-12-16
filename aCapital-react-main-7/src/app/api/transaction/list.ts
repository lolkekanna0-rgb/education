import { httpWithAuth } from "../http";

export type UserTransactionCurrency = {
  id?: number | string;
  code?: string;
  symbol?: string;
  [key: string]: unknown;
};

export type UserTransaction = {
  id: number | string;
  amount: number | string;
  created_at: string;
  type?: string;
  status?: string;
  currency?: UserTransactionCurrency | null;
  operation?: {
    id?: number | string;
    type?: string;
    created_at?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type UserTransactionListParams = {
  page?: number;
  per_page?: number;
  [key: string]: unknown;
};

export type UserTransactionListResponse = {
  success: boolean;
  data?: {
    total?: number;
    page?: number;
    per_page?: number;
    pages?: number;
    transactions?: UserTransaction[];
    items?: UserTransaction[];
    [key: string]: unknown;
  };
  total?: number;
  page?: number;
  per_page?: number;
  pages?: number;
  transactions?: UserTransaction[];
  items?: UserTransaction[];
  [key: string]: unknown;
};

const buildQuery = (params?: UserTransactionListParams): string => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const userTransactionListApi = (params?: UserTransactionListParams) =>
  httpWithAuth<UserTransactionListResponse>(`/transaction/list${buildQuery(params)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
