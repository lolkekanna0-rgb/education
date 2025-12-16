import { httpWithAuth } from "../http";
import { SubmitKycResponse } from "./submit-individual-basic";

export type SubmitIndividualFullRequest = {
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
  contact_info?: {
    phone_number?: string;
    fax?: string;
    email?: string;
    additional_contact_info?: string;
  };
  stay_permit?: {
    document_name?: string;
    series?: string;
    number?: string;
    start_date?: string;
    end_date?: string;
  } | null;
  representative?: {
    full_name_or_entity?: string;
    basis_document?: string;
    start_of_authority?: string;
    end_of_authority?: string;
  } | null;
  beneficial_owner?: {
    full_name?: string;
  } | null;
  beneficiary?: {
    full_name_or_entity?: string;
    contract_number?: string;
    contract_date?: string;
  } | null;
  pep?: {
    position?: string;
    employer?: string;
    employer_address?: string;
  } | null;
  pep_relative?: {
    relationship_degree?: string;
    full_name?: string;
    position?: string;
  } | null;
  us_taxpayer_indicators?: {
    us_citizenship?: boolean;
    has_green_card?: boolean;
    birth_country_is_us?: boolean;
    physical_or_registered_or_mailing_address_in_us?: boolean;
    care_of_or_held_mail_address_in_us?: boolean;
    contact_phone_in_us?: boolean;
    long_term_payment_instructions_to_us_account?: boolean;
    power_of_attorney_to_person_with_us_address?: boolean;
  };
  business_relationship?: {
    purpose_of_relationship?: string[];
    nature_of_relationship?: string;
    financial_business_activity_goals?: string;
    financial_status?: string;
    business_reputation?: string;
    sources_of_funds?: string[];
  };
  user_consent_data?: {
    personal_data_processing_consent?: boolean;
    information_accuracy_confirmation?: boolean;
    fatca_consent?: boolean;
  };
  tax_number?: string;
  tax_residence?: {
    is_kyrgyzstan_resident: boolean;
    tax_residency_in_other_countries?: Array<{
      country: string;
      tax_number: string;
    }>;
  };
};

export const submitIndividualFullApi = (payload: SubmitIndividualFullRequest) =>
  httpWithAuth<SubmitKycResponse>("/kyc/submit_individual_full", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
