import { httpWithAuth } from "@/app/api/http";

export type DocumentItemDto = {
  id: string;
  name: string;
  created_at?: string | null;
  mime_type?: string;
  signed_at?: string | null;
};

export type ListDocumentsResponse = {
  success: boolean;
  data: {
    documents: DocumentItemDto[];
  };
};

export const listDocumentsApi = () =>
  httpWithAuth<ListDocumentsResponse>("/user/documents", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
