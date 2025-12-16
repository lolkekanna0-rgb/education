import { httpWithAuth } from "../../http";

export type AdminListData<T> = {
  items?: T[];
  data?: T[];
  list?: T[];
  result?: T[];
  rows?: T[];
  users?: T[];
  page?: number;
  per_page?: number;
  total?: number;
  [key: string]: unknown;
};

export type AdminListResponse<T> = {
  success: boolean;
  data?: AdminListData<T> | T[];
};

export const extractAdminListItems = <T>(response: AdminListResponse<T>): T[] => {
  const { data } = response;

  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  const candidates: Array<keyof AdminListData<T>> = [
    "items",
    "data",
    "list",
    "result",
    "rows",
    "users",
    "individual_forms",
    "legal_forms",
    "forms",
    "entries",
  ];

  for (const key of candidates) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (typeof data === "object") {
    const values = Object.values(data);
    for (const value of values) {
      if (Array.isArray(value)) {
        return value as unknown as T[];
      }
    }
  }

  return [];
};

export type AdminUserListItem = {
  id: number;
  phone?: string;
  email?: string;
  created_at?: string;
  status?: string;
  [key: string]: unknown;
};

export const adminUserListApi = (page = 1, perPage = 20) =>
  httpWithAuth<AdminListResponse<AdminUserListItem>>(
    `/admin/user/list?page=${page}&per_page=${perPage}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
