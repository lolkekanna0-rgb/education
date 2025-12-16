import { httpWithAuth } from "@/app/api/http";

export type AdminSendEmailResponse = {
  success: boolean;
  data: null;
};

export const adminSendEmailApi = (userId: number, subject: string, message: string) =>
  httpWithAuth<AdminSendEmailResponse>("/admin/user/send_email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, subject, message }),
  });
