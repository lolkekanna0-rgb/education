import { httpWithAuth } from "../http";

export type TariffType = "default" | "professional" | "vip";

export const tariffTitles: Record<TariffType, string> = {
  default: "Базовый",
  professional: "Профессиональный",
  vip: "VIP",
};

export type GetMeResponse = {
  success: boolean;
  data: {
    user: CurrentUser;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type CurrentUser = {
  id: number;
  phone: string;
  email: string;
  email_is_verified: boolean;
  telegram_id: number | null;
  current_two_factor_provider: string | null;
  available_two_factor_providers: Array<string>;
  profile: CurrentUserProfile | null;
  tariff_type?: TariffType | null;
  type?: string | null;
  [key: string]: unknown;
};

export type CurrentUserProfile = {
  first_name: string;
  last_name: string;
  patronymic: string | null;
  timezone: string;
  contact_info: string;
};

export const getMeApi = () =>
  httpWithAuth<GetMeResponse>("/user/get_me", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
