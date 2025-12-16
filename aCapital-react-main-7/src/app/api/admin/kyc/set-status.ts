import { httpWithAuth } from "../../http";

export type AdminKycSetStatusPayload = {
  id: number;
  type: string;
  status: string;
};

export type AdminKycSetStatusResponse = {
  success: boolean;
  error?: unknown;
};

export const adminKycSetStatusApi = (payload: AdminKycSetStatusPayload) =>
  httpWithAuth<AdminKycSetStatusResponse>("/admin/kyc/set_status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
