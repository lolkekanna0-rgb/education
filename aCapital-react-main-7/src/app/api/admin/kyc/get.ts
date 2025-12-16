import { httpWithAuth } from "../../http";
import { AdminKycListItem } from "./list";

export type AdminKycGetResponse = {
  success: boolean;
  data?: {
    item?: AdminKycListItem;
    kyc?: AdminKycListItem;
    attachments?: Array<{
      id: number;
      name: string;
      mime_type?: string;
      size?: number | null;
      uploaded_at?: string;
      download_url: string;
    }>;
    [key: string]: unknown;
  };
};

export const adminKycGetApi = (type: string, id: number) =>
  httpWithAuth<AdminKycGetResponse>(`/admin/kyc/get?type=${encodeURIComponent(type)}&id=${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
