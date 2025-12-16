import { httpWithAuth } from "../http";

export type CurrencyListItem = {
  id: number;
  code: string;
};

export type CurrencyListResponse = {
  success: boolean;
  data: CurrencyListItem[];
};

export const currencyListApi = () =>
  httpWithAuth<CurrencyListResponse>("/currency/all", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
