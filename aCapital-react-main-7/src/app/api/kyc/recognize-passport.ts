import { httpWithAuth } from "../http";

export const PASSPORT_RECOGNIZE_ENDPOINT = "/kyc/passport/recognize";

export type PassportRecognitionPayload = {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  document_series?: string | null;
  document_number?: string | null;
  division_code?: string | null;
  document_issue_date?: string | null; // ISO-8601, YYYY-MM-DD
  document_expiry_date?: string | null; // ISO-8601, YYYY-MM-DD
  document_issuing_authority?: string | null;
  citizenship?: string | null; // ISO code или человекочитаемое название
};

export type PassportRecognitionResponse = {
  success: boolean;
  data?: PassportRecognitionPayload;
  error?: string;
};

export const recognizePassportApi = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return httpWithAuth<PassportRecognitionResponse>(PASSPORT_RECOGNIZE_ENDPOINT, {
    method: "POST",
    body: formData,
  });
};
