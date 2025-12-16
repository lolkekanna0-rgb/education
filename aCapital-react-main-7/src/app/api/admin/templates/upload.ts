import { httpWithAuth } from "../../http";

export type UploadTemplateResponse = {
  success: boolean;
  data?: { id: number };
};

export const adminTemplateUploadApi = (file: File, type: "prekyc" | "kyc", name?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  if (name) formData.append("name", name);

  return httpWithAuth<UploadTemplateResponse>("/admin/templates/upload", {
    method: "POST",
    body: formData,
  });
};
