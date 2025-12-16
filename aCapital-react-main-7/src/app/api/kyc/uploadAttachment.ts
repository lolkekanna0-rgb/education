import { httpWithAuth } from "../http";

export type UploadAttachmentResponse = {
  success: boolean;
  message?: string;
};

export const uploadAttachmentApi = (
  formId: number,
  formType: "individual" | "legal" | "legal_pre",
  file: File
) => {
  const formData = new FormData();
  formData.append("form_id", String(formId));
  formData.append("form_type", formType);
  formData.append("file", file);

  return httpWithAuth<UploadAttachmentResponse>("/kyc/upload_attachment", {
    method: "POST",
    body: formData,
  });
};
