import { httpWithAuth } from "../../http";

export type DeleteTemplateResponse = {
  success: boolean;
};

export const adminTemplateDeleteApi = (id: number) =>
  httpWithAuth<DeleteTemplateResponse>(`/admin/templates/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
