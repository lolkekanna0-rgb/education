import { httpWithAuth } from "../../http";

export type AdminUserBanPayload = {
  id: number;
  reason: string;
};

export type AdminUserBanResponse = {
  success: boolean;
  error?: unknown;
};

export const adminUserBanApi = (payload: AdminUserBanPayload) =>
  httpWithAuth<AdminUserBanResponse>("/admin/user/ban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
