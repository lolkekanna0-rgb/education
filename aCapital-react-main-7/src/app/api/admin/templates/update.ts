import { httpWithAuth } from "../../http";

export type AdminTemplateUpdateBody = {
  type?: "prekyc" | "kyc";
  name?: string;
};

export type AdminTemplateUpdateResponse = {
  success: boolean;
  data?: {
    id: number;
    name: string;
    type: "prekyc" | "kyc";
    updated_at?: string;
  };
  message?: string;
};

export const adminTemplateUpdateApi = (id: number, body: AdminTemplateUpdateBody) =>
  httpWithAuth<AdminTemplateUpdateResponse>(`/admin/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
