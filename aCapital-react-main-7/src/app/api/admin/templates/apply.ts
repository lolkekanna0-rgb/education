import { httpWithAuth } from "../../http";

export type AdminTemplateApplyResponse = {
  success: boolean;
  message?: string;
};

export const adminTemplateApplyApi = (
  templateId: number,
  formId: number,
  formType: "individual" | "legal" | "legal_pre"
) =>
  httpWithAuth<AdminTemplateApplyResponse>(`/admin/templates/${templateId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form_id: formId, form_type: formType }),
  });
