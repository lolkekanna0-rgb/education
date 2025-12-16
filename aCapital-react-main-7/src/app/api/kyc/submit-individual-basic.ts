import { httpWithAuth } from "../http";

export type TariffSelectionPayload = {
  stock: {
    selected: boolean;
    tariff_plan?: string;
  };
  derivatives: {
    selected: boolean;
    tariff_plan?: string;
  };
  fx: {
    selected: boolean;
    tariff_plan?: string;
  };
};

export type SubmitIndividualBasicRequest = {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  document_name: string;
  document_series: string;
  document_number: string;
  document_division_code?: string | null;
  document_issue_date: string;
  document_expiry_date?: string | null;
  document_issuing_authority: string;
  citizenship: string[];
  tariff_selection?: TariffSelectionPayload;
};

export type SubmitKycResponse = {
  success: boolean;
  data?: {
    form_id?: number;
  };
};

export const submitIndividualBasicApi = (payload: SubmitIndividualBasicRequest) =>
  httpWithAuth<SubmitKycResponse>("/kyc/submit_individual_basic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
