import { httpWithAuth } from "../../http";
import { TariffType } from "@/app/api/user/get-me";

export type AdminUserDetailResponse = {
  success: boolean;
  data?: {
    user?: AdminUserDetail;
    [key: string]: unknown;
  };
};

export type AdminUserDetail = {
  id: number;
  phone?: string | null;
  email?: string | null;
  email_is_verified?: boolean | null;
  type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profile?: Record<string, unknown> | null;
  tariff_type?: TariffType | null;
  [key: string]: unknown;
};

export const adminUserGetApi = (id: number) =>
  httpWithAuth<AdminUserDetailResponse>(`/admin/user/get?id=${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
