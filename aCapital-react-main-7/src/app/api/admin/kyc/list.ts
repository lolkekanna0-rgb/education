import { httpWithAuth } from "../../http";
import { AdminListResponse } from "../user/list";

export type AdminKycListItem = {
  id: number;
  type?: string;
  kyc_type?: string;
  form_type?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  created?: string;
  updated_at?: string;
  updatedAt?: string;
  updated?: string;
  user_id?: number;
  userId?: number;
  user?: {
    id: number;
    phone?: string;
    email?: string;
  } | null;
  payload?: Record<string, unknown> | null;
  kyc_data?: Record<string, unknown> | null;
  kyc?: Record<string, unknown> | null;
  available_statuses?: string[];
  availableStatuses?: string[];
  api_type?: string;
  [key: string]: unknown;
};

export type AdminKycListParams = {
  statuses?: string[];
  page?: number;
  perPage?: number;
  form_type?: "basic" | "full";
};

export const adminKycListApi = (
  type?: string,
  params: AdminKycListParams = {}
) => {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const query: string[] = [`page=${page}`, `per_page=${perPage}`];

  if (type) {
    query.unshift(`type=${encodeURIComponent(type)}`);
  }

  if (params.form_type) {
    query.push(`form_type=${encodeURIComponent(params.form_type)}`);
  }

  if (params.statuses && params.statuses.length > 0) {
    params.statuses.forEach((value, index) => {
      query.push(`statuses[${index}]=${encodeURIComponent(value)}`);
    });
  }

  return httpWithAuth<AdminListResponse<AdminKycListItem>>(
    `/admin/kyc/list?${query.join("&")}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
};
