import { httpWithAuth } from "../../http";

export type AdminTemplateItem = {
  id: number;
  name: string;
  type: "prekyc" | "kyc";
  updated_at?: string;
};

export type AdminTemplateListResponse = {
  success: boolean;
  data?: {
    items?: AdminTemplateItem[];
  };
};

export const adminTemplateListApi = () =>
  httpWithAuth<AdminTemplateListResponse>("/admin/templates", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
