import { httpWithAuth } from "../http";
import { SubmitKycResponse } from "./submit-individual-basic";

export type SubmitLegalRequest = {
  general_information: {
    client_code?: string;
    full_name_ru?: string;
    short_name_ru?: string;
    full_name_foreign?: string;
    short_name_foreign?: string;
    legal_form?: string;
  };
  representative_without_power_of_attorney?: {
    name?: string;
    position?: string;
    document_basis?: string;
    start_date?: string;
  } | null;
  representative_with_power_of_attorney?: {
    name?: string;
    document_basis?: string;
    start_date?: string;
    end_date?: string;
  } | null;
  beneficiary?: {
    name?: string;
    contract_number?: string;
    contract_date?: string;
  } | null;
  beneficial_owner?: string | null;
  registration_and_tax_info?: {
    country_of_registration?: string;
    inn_or_kpp?: string;
    ogrn?: string;
    registration_date?: string;
    issuing_authority?: string;
    okpo?: string;
    bic?: string;
    tin?: string;
    kio?: string;
  };
  has_registration_before_2002?: boolean;
  addresses?: {
    legal_address?: string;
    postal_address?: string;
    activity_location?: string;
  };
  contacts?: {
    phone?: string;
    fax?: string;
    email?: string;
    website?: string;
  };
  license_data?: {
    license_activity_type?: string;
    license_details?: string;
  };
  structure_and_assets?: {
    management_structure_info?: string;
    assets_founders_trustees_info?: string;
  };
  bank_info?: {
    bank_details?: string;
    has_accounts_in_terror_sponsor_banks?: boolean;
    has_relations_with_non_managed_banks?: boolean;
    is_info_disclosure_issuer?: boolean;
  };
  fatca?: {
    is_us_tax_resident?: boolean;
    has_us_registration_or_postal_address?: boolean;
    has_us_taxpayer_beneficiaries_or_controllers?: boolean;
    has_us_phone_number?: boolean;
    has_us_address_power_of_attorney?: boolean;
    has_us_long_term_payment_instructions?: boolean;
  };
  business_relationships?: {
    relationship_purpose?: string;
    relationship_type?: string;
    source_of_funds?: string;
    business_reputation?: string;
    financial_condition?: string;
  };
  legal_status?: {
    liquidation_in_process?: boolean;
    bankruptcy_in_process?: boolean;
    has_court_bankruptcy_decisions?: boolean;
    has_default_facts?: boolean;
    agency_ratings?: string;
  };
  consents?: {
    personal_data_processing_consent?: boolean;
    information_veracity_confirmation?: boolean;
    fatca_consent?: boolean;
  };
};

export const submitLegalKycApi = (payload: SubmitLegalRequest) =>
  httpWithAuth<SubmitKycResponse>("/kyc/submit_legal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
