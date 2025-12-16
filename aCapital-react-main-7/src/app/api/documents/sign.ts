import { httpWithAuth } from "@/app/api/http";

export type SignDocumentResponse = {
  success: boolean;
  data: null;
};

export const signDocumentApi = (documentId: string, code_id: string, code: string) =>
  httpWithAuth<SignDocumentResponse>(`/user/documents/${documentId}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code_id, code: Number(code) }),
  });
