import { httpWithAuth } from "../../http";

export type AdminCardRequestItem = {
  id: number;
  status?: string;
  comment?: string | null;
  type?: "card_issue" | "withdrawal" | string;
  amount?: number | null;
  created_at?: string;
  user?: {
    id: number;
    phone?: string;
    email?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
    } | null;
  } | null;
};

export type AdminCardRequestListResponse = {
  success: boolean;
  data?: {
    items?: AdminCardRequestItem[];
    total?: number;
  };
};

export const adminCardRequestListApi = (page = 1, perPage = 20) =>
  httpWithAuth<AdminCardRequestListResponse>(`/admin/cards/card_requests?page=${page}&per_page=${perPage}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
