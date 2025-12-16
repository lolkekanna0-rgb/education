import { httpWithAuth } from "../../http";
import { TariffType } from "@/app/api/user/get-me";

export type AdminUserSetTariffTypePayload = {
  user_id: number;
  tariff_type: TariffType;
};

export type AdminUserSetTariffTypeResponse = {
  success: boolean;
  [key: string]: unknown;
};

export const adminUserSetTariffTypeApi = (payload: AdminUserSetTariffTypePayload) =>
  httpWithAuth<AdminUserSetTariffTypeResponse>("/admin/user/set_tariff_type", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
