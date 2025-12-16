import { httpWithAuth } from "../../http";

export type AdminUserCreateTransactionPayload = {
  user_id: number;
  currency_id: number;
  amount: number;
  description?: string;
};

export type AdminUserCreateTransactionResponse = {
  success: boolean;
  error?: unknown;
};

export const adminUserCreateTransactionApi = (payload: AdminUserCreateTransactionPayload) =>
  httpWithAuth<AdminUserCreateTransactionResponse>("/admin/user/create_transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
