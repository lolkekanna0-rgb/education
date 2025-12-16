# API Documentation

Generated at 2025-10-14T12:52:58.265Z.
Success rate: 100.00% (27/27).

## Table of Contents

- [3_epic / auth / get_registaration_code](#3-epic-auth-get-registaration-code)
- [3_epic / auth / register](#3-epic-auth-register)
- [3_epic / auth / login](#3-epic-auth-login)
- [3_epic / auth / submit_two_factor_login](#3-epic-auth-submit-two-factor-login)
- [3_epic / auth / initiate_password_reset](#3-epic-auth-initiate-password-reset)
- [3_epic / auth / set_new_password](#3-epic-auth-set-new-password)
- [3_epic / user / get_me](#3-epic-user-get-me)
- [3_epic / user / set_two_factor_provider](#3-epic-user-set-two-factor-provider)
- [3_epic / user / initiate_two_factor_disable](#3-epic-user-initiate-two-factor-disable)
- [3_epic / user / disable_two_factor](#3-epic-user-disable-two-factor)
- [3_epic / user / change_password](#3-epic-user-change-password)
- [3_epic / user / initiate_email_verification](#3-epic-user-initiate-email-verification)
- [3_epic / user / verify_email](#3-epic-user-verify-email)
- [3_epic / user / logout](#3-epic-user-logout)
- [3_epic / profile / update](#3-epic-profile-update)
- [3_epic / payment / create](#3-epic-payment-create)
- [3_epic / namba_one / webhook](#3-epic-namba-one-webhook)
- [3_epic / kyc / submit_legal](#3-epic-kyc-submit-legal)
- [3_epic / kyc / submit_individual_basic](#3-epic-kyc-submit-individual-basic)
- [3_epic / kyc / submit_individual_full](#3-epic-kyc-submit-individual-full)
- [3_epic / admin / user / list](#3-epic-admin-user-list)
- [3_epic / admin / user / get](#3-epic-admin-user-get)
- [3_epic / admin / user / ban](#3-epic-admin-user-ban)
- [3_epic / admin / user / unban](#3-epic-admin-user-unban)
- [3_epic / admin / kyc / list](#3-epic-admin-kyc-list)
- [3_epic / admin / kyc / get](#3-epic-admin-kyc-get)
- [3_epic / admin / kyc / set_status](#3-epic-admin-kyc-set-status)

## 3_epic / auth / get_registaration_code
<a id="3-epic-auth-get-registaration-code"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/auth/get_registration_code
- **Example file:** api_examples/001_get_registaration_code_post.json

**Request Body:**
```json
{
  "phone": "+79996663311"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "code_id": "f033d5a5-70e4-4a0d-bb9a-105fb8487c78"
  }
}
```

---

## 3_epic / auth / register
<a id="3-epic-auth-register"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/auth/register
- **Example file:** api_examples/002_register_post.json

**Request Body:**
```json
{
  "email": "api_mgqkbc51_ay4mlz@example.com",
  "password": "***hidden***",
  "code_id": "f033d5a5-70e4-4a0d-bb9a-105fb8487c78",
  "code": 111111
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "***hidden***"
  }
}
```

---

## 3_epic / auth / login
<a id="3-epic-auth-login"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/auth/login
- **Example file:** api_examples/003_login_post.json

**Request Body:**
```json
{
  "phone": "+79996663311",
  "password": "***hidden***"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_INVALID_CREDENTIALS",
    "messages": [
      "Invalid credentials"
    ]
  }
}
```

---

## 3_epic / auth / submit_two_factor_login
<a id="3-epic-auth-submit-two-factor-login"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/auth/submit_two_factor_login
- **Example file:** api_examples/004_submit_two_factor_login_post.json

**Request Body:**
```json
{
  "phone": "+79996663311",
  "code_id": "",
  "code": 111111
}
```

**Response (422):**
```json
{
  "success": false,
  "error": {
    "code": "E_VALIDATION_ERROR",
    "messages": [
      "The code_id field must be defined"
    ]
  }
}
```

---

## 3_epic / auth / initiate_password_reset
<a id="3-epic-auth-initiate-password-reset"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/auth/initiate_password_reset
- **Example file:** api_examples/005_initiate_password_reset_post.json

**Request Body:**
```json
{
  "phone": "+79996663311"
}
```

**Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "E_FLOOD_CONTROL",
    "messages": [
      "Try after 59 seconds"
    ]
  }
}
```

---

## 3_epic / auth / set_new_password
<a id="3-epic-auth-set-new-password"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/auth/set_new_password
- **Example file:** api_examples/006_set_new_password_post.json

**Request Body:**
```json
{
  "code_id": "060585fb-e818-4e75-8e47-7473581833c2",
  "code": 111111,
  "password": "***hidden***"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "E_WRONG_CODE",
    "messages": [
      "Wrong one time code"
    ]
  }
}
```

---

## 3_epic / user / get_me
<a id="3-epic-user-get-me"></a>

- **Method:** GET
- **URL:** https://api.ackgt.ru/user/get_me
- **Example file:** api_examples/007_get_me_get.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / set_two_factor_provider
<a id="3-epic-user-set-two-factor-provider"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/set_two_factor_provider
- **Example file:** api_examples/008_set_two_factor_provider_post.json

**Request Body:**
```json
{
  "provider": "telegram"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / initiate_two_factor_disable
<a id="3-epic-user-initiate-two-factor-disable"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/initiate_two_factor_disable
- **Example file:** api_examples/009_initiate_two_factor_disable_post.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / disable_two_factor
<a id="3-epic-user-disable-two-factor"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/disable_two_factor
- **Example file:** api_examples/010_disable_two_factor_post.json

**Request Body:**
```json
{
  "code_id": "b70a386a-e4c9-4bc8-8b13-846308c4016f",
  "code": 111111
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / change_password
<a id="3-epic-user-change-password"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/change_password
- **Example file:** api_examples/011_change_password_post.json

**Request Body:**
```json
{
  "current_password": "***hidden***",
  "new_password": "***hidden***"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / initiate_email_verification
<a id="3-epic-user-initiate-email-verification"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/initiate_email_verification
- **Example file:** api_examples/012_initiate_email_verification_post.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / verify_email
<a id="3-epic-user-verify-email"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/verify_email
- **Example file:** api_examples/013_verify_email_post.json

**Request Body:**
```json
{
  "code_id": "eb3b185a-bd7c-4687-8c9c-9b5111bcda73",
  "code": 111111
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / user / logout
<a id="3-epic-user-logout"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/user/logout
- **Example file:** api_examples/014_logout_post.json

**Request Body:**
```json
{
  "logout_other_devices": true
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / profile / update
<a id="3-epic-profile-update"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/profile/update
- **Example file:** api_examples/015_update_post.json

**Request Body:**
```json
{
  "first_name": "Алексей",
  "last_name": "Смирнов",
  "patronymic": "Васильевич",
  "timezone": "Asia/Tbilisi",
  "contact_info": "test"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / payment / create
<a id="3-epic-payment-create"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/payment/create
- **Example file:** api_examples/016_create_post.json

**Request Body:**
```json
{
  "amount": 10000
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / namba_one / webhook
<a id="3-epic-namba-one-webhook"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/namba_one/webhook
- **Example file:** api_examples/017_webhook_post.json

**Request Body:**
```json
{
  "createdAt": "2025-10-08T13:56:13.951Z",
  "type": "PAYMENT_ORDER",
  "version": "string",
  "data": {
    "guid": "string",
    "externalId": "string",
    "channel": "string",
    "paymentLinkGuid": "string",
    "merchantAccountGuid": "string",
    "currency": "KGS",
    "amount": "string",
    "paymentAmount": "string",
    "refundAmount": "0",
    "remark": "string",
    "customerGuid": "string",
    "maskedPhoneNumber": "string",
    "status": "string",
    "createdAt": "string",
    "settledAt": "string"
  }
}
```

**Response (422):**
```json
{
  "success": false,
  "error": {
    "code": "E_VALIDATION_ERROR",
    "messages": [
      "The selected status is invalid",
      "The externalId field must be a valid UUID"
    ]
  }
}
```

---

## 3_epic / kyc / submit_legal
<a id="3-epic-kyc-submit-legal"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/kyc/submit_legal
- **Example file:** api_examples/018_submit_legal_post.json

**Request Body:**
```json
{
  "general_information": {
    "client_code": "123456",
    "full_name_ru": "ООО \"Пример\"",
    "short_name_ru": "ООО \"Пример\"",
    "full_name_foreign": "Example LLC",
    "short_name_foreign": "Example",
    "legal_form": "ООО"
  },
  "representative_without_power_of_attorney": {
    "name": "Иванов Иван Иванович",
    "position": "Генеральный директор",
    "document_basis": "Приказ №1",
    "start_date": "2023-01-01"
  },
  "representative_with_power_of_attorney": {
    "name": "Петров Петр Петрович",
    "document_basis": "Доверенность №2",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01"
  },
  "beneficiary": {
    "name": "Сидоров Сергей Сергеевич",
    "contract_number": "Д-12345",
    "contract_date": "2022-06-15"
  },
  "beneficial_owner": "Сидоров Сергей Сергеевич",
  "registration_and_tax_info": {
    "country_of_registration": "Россия",
    "inn_or_kpp": "7701234567",
    "ogrn": "1122334455667",
    "registration_date": "2010-05-12",
    "issuing_authority": "***hidden***",
    "okpo": "12345678",
    "bic": "044525225"
  },
  "has_registration_before_2002": false,
  "addresses": {
    "legal_address": "г. Москва, ул. Ленина, д. 1",
    "postal_address": "г. Москва, ул. Ленина, д. 1",
    "activity_location": "г. Москва, ул. Ленина, д. 1"
  },
  "contacts": {
    "phone": "+7 (495) 123-45-67",
    "fax": "+7 (495) 123-45-68",
    "email": "contact@example.com",
    "website": "https://www.example.com"
  },
  "license_data": {
    "license_activity_type": "Брокерская деятельность",
    "license_details": "Лицензия №12345 от 01.01.2020"
  },
  "structure_and_assets": {
    "management_structure_info": "Совет директоров: Иванов И.И., Петров П.П.",
    "assets_founders_trustees_info": "Учредители: Иванов И.И."
  },
  "bank_info": {
    "bank_details": "Банк \"Пример\" Р/с 40702810400000000001",
    "has_accounts_in_terror_sponsor_banks": false,
    "has_relations_with_non_managed_banks": false,
    "is_info_disclosure_issuer": true
  },
  "fatca": {
    "is_us_tax_resident": false,
    "has_us_registration_or_postal_address": false,
    "has_us_taxpayer_beneficiaries_or_controllers": false,
    "has_us_phone_number": false,
    "has_us_address_power_of_attorney": false,
    "has_us_long_term_payment_instructions": false
  },
  "business_relationships": {
    "relationship_purpose": "BROKER_SERVICE",
    "relationship_type": "LONG_TERM",
    "source_of_funds": "Вложение акционеров",
    "business_reputation": "POSITIVE",
    "financial_condition": "Устойчивое"
  },
  "legal_status": {
    "liquidation_in_process": false,
    "bankruptcy_in_process": false,
    "has_court_bankruptcy_decisions": false,
    "has_default_facts": false,
    "agency_ratings": "AAA"
  },
  "consents": {
    "personal_data_processing_consent": true,
    "information_veracity_confirmation": true,
    "fatca_consent": false
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / kyc / submit_individual_basic
<a id="3-epic-kyc-submit-individual-basic"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/kyc/submit_individual_basic
- **Example file:** api_examples/019_submit_individual_basic_post.json

**Request Body:**
```json
{
  "first_name": "Иван",
  "last_name": "Петров",
  "middle_name": "Алексеевич",
  "document_name": "Паспорт",
  "document_series": "1234",
  "document_number": "567890",
  "document_issue_date": "2020-01-15",
  "document_expiry_date": "2030-01-15",
  "document_issuing_authority": "***hidden***",
  "citizenship": [
    "Россия"
  ]
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / kyc / submit_individual_full
<a id="3-epic-kyc-submit-individual-full"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/kyc/submit_individual_full
- **Example file:** api_examples/020_submit_individual_full_post.json

**Request Body:**
```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "middle_name": "Иванович",
  "document_name": "Паспорт гражданина Российской Федерации",
  "document_series": "4509",
  "document_number": "123456",
  "document_issue_date": "2015-05-20",
  "document_expiry_date": "2025-05-20",
  "document_issuing_authority": "***hidden***",
  "citizenship": [
    "Россия"
  ],
  "contact_info": {
    "phone_number": "+7 (495) 123-45-67",
    "fax": "+7 (495) 765-43-21",
    "email": "ivanov@example.com",
    "additional_contact_info": "Дополнительная контактная информация"
  },
  "stay_permit": {
    "document_name": "Вид на жительство",
    "series": "5678",
    "number": "87654321",
    "start_date": "2020-01-01",
    "end_date": "2030-01-01"
  },
  "representative": {
    "full_name_or_entity": "ООО Представитель",
    "basis_document": "Доверенность",
    "start_of_authority": "***hidden***",
    "end_of_authority": "***hidden***"
  },
  "beneficial_owner": {
    "full_name": "Иванов Петр Иванович"
  },
  "beneficiary": {
    "full_name_or_entity": "ЗАО Бенефициар",
    "contract_number": "BNF-123456",
    "contract_date": "2023-03-01"
  },
  "pep": {
    "position": "Депутат",
    "employer": "Государственная Дума",
    "employer_address": "Москва, ул. Охотный Ряд, д. 1"
  },
  "pep_relative": {
    "relationship_degree": "Брат",
    "full_name": "Иванов Сергей Иванович",
    "position": "Министр"
  },
  "us_taxpayer_indicators": {
    "us_citizenship": false,
    "has_green_card": false,
    "birth_country_is_us": false,
    "physical_or_registered_or_mailing_address_in_us": false,
    "care_of_or_held_mail_address_in_us": false,
    "contact_phone_in_us": false,
    "long_term_payment_instructions_to_us_account": false,
    "power_of_attorney_to_person_with_us_address": false
  },
  "business_relationship": {
    "purpose_of_relationship": [
      "Инвестиции",
      "Торговля"
    ],
    "nature_of_relationship": "Партнёрство",
    "financial_business_activity_goals": "Расширение бизнеса",
    "financial_status": "Устойчивое",
    "business_reputation": "Отличная",
    "sources_of_funds": [
      "Инвестиции",
      "Доходы от бизнеса"
    ]
  },
  "user_consent_data": {
    "personal_data_processing_consent": true,
    "information_accuracy_confirmation": true,
    "fatca_consent": false
  },
  "tax_number": "14214",
  "tax_residence": {
    "is_kyrgyzstan_resident": true,
    "tax_residency_in_other_countries": [
      {
        "country": "Georgia",
        "tax_number": "919238174"
      }
    ]
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / user / list
<a id="3-epic-admin-user-list"></a>

- **Method:** GET
- **URL:** https://api.ackgt.ru/admin/user/list?page=1&per_page=10
- **Example file:** api_examples/021_list_get.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / user / get
<a id="3-epic-admin-user-get"></a>

- **Method:** GET
- **URL:** https://api.ackgt.ru/admin/user/get?id=2
- **Example file:** api_examples/022_get_get.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / user / ban
<a id="3-epic-admin-user-ban"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/admin/user/ban
- **Example file:** api_examples/023_ban_post.json

**Request Body:**
```json
{
  "id": 1,
  "reason": "test"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / user / unban
<a id="3-epic-admin-user-unban"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/admin/user/ban
- **Example file:** api_examples/024_unban_post.json

**Request Body:**
```json
{
  "id": 2
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / kyc / list
<a id="3-epic-admin-kyc-list"></a>

- **Method:** GET
- **URL:** https://api.ackgt.ru/admin/kyc/list?type=legal&page=1&per_page=10&statuses[0]=created
- **Example file:** api_examples/025_list_get.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / kyc / get
<a id="3-epic-admin-kyc-get"></a>

- **Method:** GET
- **URL:** https://api.ackgt.ru/admin/kyc/get?type=legal&id=2
- **Example file:** api_examples/026_get_get.json

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---

## 3_epic / admin / kyc / set_status
<a id="3-epic-admin-kyc-set-status"></a>

- **Method:** POST
- **URL:** https://api.ackgt.ru/admin/kyc/set_status
- **Example file:** api_examples/027_set_status_post.json

**Request Body:**
```json
{
  "id": 2,
  "type": "legal",
  "status": "approvedd"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "E_UNAUTHORIZED_ACCESS",
    "messages": [
      "Unauthorized access"
    ]
  }
}
```

---
