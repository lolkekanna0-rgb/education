import { httpWithAuth } from "@/app/api/http";

export type InitiateDocumentSignResponse = {
  success: boolean;
  data: {
    code_id: string;
  };
};

export const initiateDocumentSignApi = (documentId: string) =>
  httpWithAuth<InitiateDocumentSignResponse>(`/user/documents/${documentId}/initiate_sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
