import { httpWithAuth } from "../../http";

export type AdminUserGrantAdminResponse = {
  success: boolean;
  data?: unknown;
  error?: unknown;
};

export const adminUserGrantAdminApi = (userId: number) =>
  httpWithAuth<AdminUserGrantAdminResponse>("/admin/user/grant_admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
