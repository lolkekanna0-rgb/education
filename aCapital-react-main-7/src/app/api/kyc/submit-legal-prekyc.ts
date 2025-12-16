import { httpWithAuth } from "../http";
import { SubmitKycResponse } from "./submit-individual-basic";

export type SubmitLegalPreKycRequest = {
  representative_first_name?: string;
  representative_last_name?: string;
  representative_patronymic?: string;
  organization_name_rus: string;
  organization_shortname_rus?: string;
  organization_name_foreign?: string;
  organization_shortname_foreign?: string;
  registration_country: string;
  registration_authority?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  okpo?: string;
  kio?: string;
  tin?: string;
  legal_address: string;
  legal_postal_address?: string;
  activity_address?: string;
  site_address?: string;
  legal_email?: string;
  phone?: string;
  fax?: string;
};

export const submitLegalPreKycApi = (payload: SubmitLegalPreKycRequest) =>
  httpWithAuth<SubmitKycResponse>("/kyc/submit_legal_pre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
