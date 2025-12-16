"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import PhoneInput from "react-phone-input-2";
import Image from "next/image";

import s from "./kycform.module.scss";
import { submitIndividualFullApi, SubmitIndividualFullRequest } from "@/app/api/kyc/submit-individual-full";
import { SubmitLegalRequest, submitLegalKycApi } from "@/app/api/kyc/submit-legal";
import { parseError } from "@/app/utils/parse-error";
import { uploadAttachmentApi } from "@/app/api/kyc/uploadAttachment";
import UploadPhoto from "../PrekycForm/UploadPhoto";
import { getPassportTemplate, passportCountryOptions, SelectOption } from "@/app/utils/passportTemplates";
import PassportUploadTrigger from "../PassportUploadTrigger/PassportUploadTrigger";
import { type PassportRecognitionPayload } from "@/app/api/kyc/recognize-passport";

const documentOptions = [
  { value: "passport", label: "Паспорт" },
];

const residenceDocumentOptions = [
  { value: "document", label: "Название документа предустановлено по умолчанию" }
]

const taxResidencyOptions = [
  { value: "РА", label: "Резидент РА" },
  { value: "АР", label: "Резидент АР" },
  { value: "РБ", label: "Резидент РБ" },
  { value: "РК", label: "Резидент РК" },
  { value: "КР", label: "Резидент КР" },
  { value: "РМ", label: "Резидент РМ" },
  { value: "РФ", label: "Резидент РФ" },
  { value: "РТ", label: "Резидент РТ" },
  { value: "РУз", label: "Резидент РУз" }
];

export default function KycForm() {
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [enabledStep1, setEnabledStep1] = useState(true);
  const [enabledStep2, setEnabledStep2] = useState(true);
  const [enabledStep3, setEnabledStep3] = useState(true);
  const [enabledStep4, setEnabledStep4] = useState(true);
  const [enabledStep5, setEnabledStep5] = useState(true);
  const [checkedOffer, setCheckedOffer] = useState(false);
  const [checkedData, setCheckedData] = useState(false);
  const [checkedFet, setCheckedFet] = useState(false);
  const [enabledGr, setEnabledGr] = useState(false);
  const [selected, setSelected] = useState({
    relation: "",
    character: "",
    goal: "",
    finance: "",
    reputation: "",
    istochnik: "",
    relationLegal: "",
    characterLegal: "",
    liquidation: "",
    bankruptcyProcess: "",
    bankruptcyDone: "",
    undoFacts: "",
    agentRating: ""
  });
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // шаги: 1-код, 2-пароль, 3-успех
  const selectedDocument = documentOptions[0];
  const selectedResidenceDocument = residenceDocumentOptions[0];

  const [taxResidency, selectTaxResidency] = useState<{ value: string, label: string } | null>(taxResidencyOptions[4]);
  const [legalTaxResidency, selectLegalTaxResidency] = useState<{ value: string, label: string } | null>(taxResidencyOptions[4])

  const [physicalSame, setPhysicalSame] = useState(false);

  const [noLicense, setNoLicense] = useState(false)

  const handleChange = (group: string, value: string) => {
    setSelected((prev) => ({ ...prev, [group]: value }));
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  const [isPhysical, setIsPhysical] = useState(true);

  const [isByProxy, setIsByProxy] = useState(true);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState(true);
  const [beneficialOwner, setBeneficialOwner] = useState(true);

  const [legalPhone, setLegalPhone] = useState("");
  const [physicalPhone, setPhysicalPhone] = useState("");
  const [legalFax, setLegalFax] = useState("");
  const [physicalFax, setPhysicalFax] = useState("");
  const [physicalFiles, setPhysicalFiles] = useState<File[]>([]);
  const [legalFiles, setLegalFiles] = useState<File[]>([]);
  const [, setPassportPhoto] = useState<File | null>(null);
  const [passportCountry, setPassportCountry] = useState<SelectOption | null>(
    passportCountryOptions.find((item) => item.value === "Kyrgyzstan") ?? null
  );
  const formRef = useRef<HTMLFormElement | null>(null);
  const [passportFieldsVersion, setPassportFieldsVersion] = useState(0);

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [individualDraft, setIndividualDraft] = useState<Partial<SubmitIndividualFullRequest>>({});
  const [legalDraft, setLegalDraft] = useState<Partial<SubmitLegalRequest>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);

  const formatPhone = (value: string) => {
    if (!value) return "";
    return value.startsWith("+") ? value : `+${value}`;
  };

  const normalizeUrl = (value: string) => {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  };

  const [terror, setTerror] = useState(false);
  const [bank, setBank] = useState(false);
  const [emit, setEmit] = useState(false);
  const [usRes, setUsRes] = useState(false);
  const [usAddr, setUsAddr] = useState(false);
  const [usBen, setUsBen] = useState(false);
  const [usPhone, setUsPhone] = useState(false);
  const [usAuth, setUsAuth] = useState(false);
  const [usPay, setUsPay] = useState(false);
  const appendFiles =
    (setter: React.Dispatch<React.SetStateAction<File[]>>) =>
    (fileList: FileList | null) => {
      if (!fileList) return;
      const incoming = Array.from(fileList);
      if (!incoming.length) return;
      setter((prev) => [...prev, ...incoming]);
    };

  const formatFileSize = (size: number) => {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${size} Б`;
  };

  const renderFileList = (files: File[]) =>
    files.length > 0 && (
      <ul className={s.attachList}>
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className={s.attachItem}>
            <span className={s.attachName}>{file.name}</span>
            <span className={s.attachSize}>{formatFileSize(file.size)}</span>
          </li>
        ))}
      </ul>
    );

  const handlePassportPhotoSelect = (files: File[]) => {
    setPassportPhoto(files[0] ?? null);
  };

  const handlePassportRecognition = (data: PassportRecognitionPayload) => {
    if (!isPhysical || !formRef.current) return;

    const setIfEmpty = (name: string, value?: string | null) => {
      if (!value) return;
      const control = formRef.current?.elements.namedItem(name) as HTMLInputElement | null;
      if (control && !control.value) {
        control.value = value;
      }
    };

    setIfEmpty("first_name", data.first_name);
    setIfEmpty("last_name", data.last_name);
    setIfEmpty("patronymic", data.middle_name ?? undefined);
    setIfEmpty("passport_series", data.document_series ?? undefined);
    setIfEmpty("passport_number", data.document_number ?? undefined);
    setIfEmpty("division_code", data.division_code ?? undefined);
    setIfEmpty("issue_date", data.document_issue_date ?? undefined);
    setIfEmpty("expiry_date", data.document_expiry_date ?? undefined);
    setIfEmpty("issued_by", data.document_issuing_authority ?? undefined);

    if (data.citizenship) {
      const normalized = data.citizenship.toLowerCase();
      const option = passportCountryOptions.find(
        (opt) =>
          opt.value.toLowerCase() === normalized ||
          opt.label.toLowerCase() === normalized
      );
      if (option) setPassportCountry(option);
    }
  };

  const passportUploadTrigger = isPhysical ? (
    <PassportUploadTrigger
      onFilesSelected={handlePassportPhotoSelect}
      onUploadResult={handlePassportRecognition}
    />
  ) : null;

  const activePassportCountry = passportCountry?.value || (enabled ? "" : "Kyrgyzstan");
  const activePassportTemplate = useMemo(() => getPassportTemplate(activePassportCountry), [activePassportCountry]);
  const seriesField = activePassportTemplate.series;
  const numberField = activePassportTemplate.number;
  const divisionField = activePassportTemplate.divisionCode;
  const issueDateRequired = activePassportTemplate.issueDateRequired ?? true;
  const expiryDateRequired = activePassportTemplate.expiryDateRequired ?? false;
  const issuingAuthorityLabel = activePassportTemplate.issuingAuthorityLabel ?? "Кем выдан";
  const issuingAuthorityPlaceholder =
    activePassportTemplate.issuingAuthorityPlaceholder ?? "Как в паспорте";

  useEffect(() => {
    setFormError("");
  }, [step, isPhysical]);

  useEffect(() => {
    setPassportFieldsVersion((prev) => prev + 1);
  }, [activePassportTemplate.code]);

  useEffect(() => {
    if (!isPhysical) return;
    if (enabled) {
      setPassportCountry((prev) => (prev?.value === "Kyrgyzstan" ? null : prev));
    } else {
      const defaultCountry = passportCountryOptions.find((item) => item.value === "Kyrgyzstan") ?? null;
      setPassportCountry((prev) => prev ?? defaultCountry);
    }
  }, [enabled, isPhysical]);

  useEffect(() => {
    setPhysicalFiles([]);
    setLegalFiles([]);
  }, [isPhysical]);

  const uploadAttachments = (formId: number, formType: "individual" | "legal", files: File[]) => {
    if (!files.length) return Promise.resolve();
    setAttachmentsUploading(true);
    return Promise.all(
      files.map(
        (file) =>
          new Promise<void>((resolve) => {
            uploadAttachmentApi(formId, formType, file).subscribe({
              next: () => resolve(),
              error: () => resolve(),
            });
          })
      )
    ).finally(() => setAttachmentsUploading(false));
  };

  if (submitted) {
    return (
      <div className={s.activateForm__blocks}>
        <div className={s.activateForm__finish}>
          <Image
            aria-hidden
            src="/check.svg"
            alt="success icon"
            width={140}
            height={100}
          />
          <span>Данные отправлены на проверку</span>
          <p>Отследить статус вы можете во вкладке «Документы»</p>
        </div>
      </div>
    );
  }

  const handleStep1Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);

    if (isPhysical) {
      const firstName = formData.get("first_name")?.toString().trim() || "";
      const lastName = formData.get("last_name")?.toString().trim() || "";
      const passportSeries = formData.get("passport_series")?.toString().trim() || "";
      const passportNumber = formData.get("passport_number")?.toString().trim() || "";
      const divisionCode = formData.get("division_code")?.toString().trim() || "";
      const issueDate = formData.get("issue_date")?.toString().trim() || "";
      const middleNameRaw = formData.get("patronymic")?.toString().trim() || "";
      const expiryDate = formData.get("expiry_date")?.toString().trim() || "";
      const issueAuthority = formData.get("issued_by")?.toString().trim() || "";
      const template = activePassportTemplate;

      if (!firstName || !lastName || !issueAuthority || !passportCountry) {
        setFormError("Заполните паспортные данные и ФИО.");
        return;
      }

      if (template.series?.required && !passportSeries) {
        setFormError("Укажите серию документа.");
        return;
      }

      if (template.number.required && !passportNumber) {
        setFormError("Укажите номер документа.");
        return;
      }

      if (divisionField?.required && !divisionCode) {
        setFormError("Укажите код подразделения.");
        return;
      }

      if (issueDateRequired && !issueDate) {
        setFormError("Укажите дату выдачи.");
        return;
      }

      if (expiryDateRequired && !expiryDate) {
        setFormError("Укажите срок действия.");
        return;
      }

      if (template.series?.pattern && passportSeries && !template.series.pattern.test(passportSeries)) {
        setFormError(template.series.hint || "Неверный формат серии документа.");
        return;
      }

      if (template.number.pattern && passportNumber && !template.number.pattern.test(passportNumber)) {
        setFormError(template.number.hint || "Неверный формат номера документа.");
        return;
      }

      if (divisionField?.pattern && divisionCode && !divisionField.pattern.test(divisionCode)) {
        setFormError(divisionField.hint || "Неверный формат кода подразделения.");
        return;
      }

      setIndividualDraft((prev) => ({
        ...prev,
        first_name: firstName,
        last_name: lastName,
        middle_name: checked ? null : middleNameRaw || null,
        document_name: selectedDocument?.label ?? "Паспорт",
        document_series: passportSeries,
        document_number: passportNumber,
        document_division_code: divisionCode || null,
        document_issue_date: issueDate,
        document_expiry_date: expiryDate ? expiryDate : null,
        document_issuing_authority: issueAuthority,
        citizenship: [passportCountry.value],
      }));

      setStep(2);
      return;
    }

    const fullNameRu = formData.get("company_name_rus")?.toString().trim() || "";
    if (!fullNameRu) {
      setFormError("Укажите полное наименование организации.");
      return;
    }

    const generalInfo = {
      client_code:
        legalDraft.general_information?.client_code ||
        formData.get("company_shortname_rus")?.toString().trim() ||
        fullNameRu,
      full_name_ru: fullNameRu,
      short_name_ru: formData.get("company_shortname_rus")?.toString().trim() || "",
      full_name_foreign: formData.get("company_name_foreign")?.toString().trim() || "",
      short_name_foreign: formData.get("company_shortname_foreign")?.toString().trim() || "",
      legal_form: formData.get("legal_form")?.toString().trim() || "",
    };

    setLegalDraft((prev) => ({
      ...prev,
      general_information: generalInfo,
      registration_and_tax_info: {
        ...(prev.registration_and_tax_info ?? {}),
        country_of_registration: prev.registration_and_tax_info?.country_of_registration ?? "",
        okpo: formData.get("okpo")?.toString().trim() || "",
      },
    }));

    setStep(2);
  };

  const handleStep2Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);

    if (isPhysical) {
      const registrationAddress = formData.get("physical_address")?.toString().trim() || "";
      if (!registrationAddress) {
        setFormError("Укажите адрес регистрации.");
        return;
      }

      const postalRaw = formData.get("physical_postal_address")?.toString().trim() || "";
      const postalAddress = physicalSame ? registrationAddress : postalRaw;
      const email = formData.get("contact_email")?.toString().trim() || "";
      const additionalContact = formData.get("contact_additional")?.toString().trim() || "";
      const inn = formData.get("physical_inn")?.toString().trim() || "";

      const additionalParts = [
        additionalContact,
        registrationAddress ? `Адрес регистрации: ${registrationAddress}` : "",
        postalAddress ? `Почтовый адрес: ${postalAddress}` : "",
      ].filter(Boolean);
      const additionalInfo = additionalParts.join(" | ");

      const isKyrgyzResident = taxResidency?.value
        ? taxResidency.value === "КР"
        : !enabled;

      setIndividualDraft((prev) => ({
        ...prev,
        contact_info: {
          phone_number: formatPhone(physicalPhone),
          fax: formatPhone(physicalFax),
          email,
          additional_contact_info: additionalInfo,
        },
        tax_number: inn,
        tax_residence: {
          is_kyrgyzstan_resident: isKyrgyzResident,
          tax_residency_in_other_countries:
            isKyrgyzResident || !taxResidency
              ? []
              : [
                  {
                    country: taxResidency.label,
                    tax_number: "",
                  },
                ],
        },
      }));

      setStep(3);
      return;
    }

    const legalAddress = formData.get("egrul")?.toString().trim() || "";
    if (!legalAddress) {
      setFormError("Укажите юридический адрес.");
      return;
    }

    const postalRaw = formData.get("fact_postal_address")?.toString().trim() || "";
    const postalAddress = postalRaw || legalAddress;
    const activityAddress = formData.get("main_activity_place")?.toString().trim() || "";
    const siteAddressRaw = formData.get("legal_site")?.toString().trim() || "";
    const siteAddress = normalizeUrl(siteAddressRaw);
    const email = formData.get("legal_email")?.toString().trim() || "";
    const inn = formData.get("legal_inn")?.toString().trim() || "";
    const kpp = formData.get("legal_kpp")?.toString().trim() || "";
    const kio = formData.get("legal_kio")?.toString().trim() || "";
    const tin = formData.get("legal_tin")?.toString().trim() || "";
    const ogrn = formData.get("legal_ogrn")?.toString().trim() || "";
    const registrationAuthority = formData.get("registration_authority")?.toString().trim() || "";
    const registrationDate = formData.get("legal_registration_date")?.toString().trim() || "";

    setLegalDraft((prev) => ({
      ...prev,
      addresses: {
        legal_address: legalAddress,
        postal_address: postalAddress || undefined,
        activity_location: activityAddress || undefined,
      },
      contacts: {
        phone: formatPhone(legalPhone),
        fax: formatPhone(legalFax),
        email,
        website: siteAddress || undefined,
      },
      registration_and_tax_info: {
        ...(prev.registration_and_tax_info ?? {}),
        country_of_registration: prev.registration_and_tax_info?.country_of_registration || legalTaxResidency?.label || "",
        issuing_authority: registrationAuthority,
        registration_date: registrationDate || undefined,
        inn_or_kpp: [inn, kpp].filter(Boolean).join(" / "),
        ogrn: ogrn || undefined,
        okpo: formData.get("okpo")?.toString().trim() || "",
        kio: kio || undefined,
        tin: tin || undefined,
      },
    }));

    setStep(3);
  };

  const handleStep3Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setStep(4);
  };

  const handleFinalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const personalDataConsent = isPhysical ? checkedData : true;
    const infoAccuracyConsent = isPhysical ? checkedOffer : true;

    if (isPhysical) {
      if (!checkedOffer || !checkedData) {
        setFormError("Подтвердите согласия.");
        return;
      }

      const goalOther = formData.get("goal_other")?.toString().trim() || "";
      const fundsOther = formData.get("funds_other")?.toString().trim() || "";
      if (
        !individualDraft.first_name ||
        !individualDraft.last_name ||
        !individualDraft.document_series ||
        !individualDraft.document_number ||
        !individualDraft.document_issue_date
      ) {
        setFormError("Заполните данные на предыдущих шагах.");
        setStep(1);
        return;
      }

      const businessRelationship =
        selected.goal ||
        selected.character ||
        selected.finance ||
        selected.reputation ||
        selected.istochnik
          ? {
              purpose_of_relationship:
                selected.goal === "other" && goalOther
                  ? [goalOther]
                  : selected.goal
                  ? [selected.goal]
                  : undefined,
              nature_of_relationship: selected.character || undefined,
              financial_business_activity_goals:
                selected.goal === "other"
                  ? goalOther || "Другое"
                  : selected.goal || undefined,
              financial_status: selected.finance || undefined,
              business_reputation: selected.reputation || undefined,
              sources_of_funds: selected.istochnik
                ? selected.istochnik === "Иное, укажу текстом"
                  ? [fundsOther || "Другое"]
                  : [selected.istochnik]
                : undefined,
            }
          : undefined;

      const payload: SubmitIndividualFullRequest = {
        first_name: individualDraft.first_name || "",
        last_name: individualDraft.last_name || "",
        middle_name: typeof individualDraft.middle_name === "undefined" ? null : individualDraft.middle_name,
        document_name: individualDraft.document_name || (selectedDocument?.label ?? "Паспорт"),
        document_series: individualDraft.document_series || "",
        document_number: individualDraft.document_number || "",
        document_division_code:
          typeof individualDraft.document_division_code === "undefined"
            ? null
            : individualDraft.document_division_code,
        document_issue_date: individualDraft.document_issue_date || "",
        document_expiry_date: typeof individualDraft.document_expiry_date === "undefined" ? null : individualDraft.document_expiry_date,
        document_issuing_authority: individualDraft.document_issuing_authority || "",
        citizenship: individualDraft.citizenship && individualDraft.citizenship.length > 0 ? individualDraft.citizenship : ["Кыргызстан"],
        contact_info: {
          phone_number: individualDraft.contact_info?.phone_number || formatPhone(physicalPhone),
          fax: individualDraft.contact_info?.fax || formatPhone(physicalFax),
          email: individualDraft.contact_info?.email || "",
          additional_contact_info: individualDraft.contact_info?.additional_contact_info || "",
        },
        stay_permit: null,
        representative: null,
        beneficial_owner: null,
        beneficiary: null,
        pep: null,
        pep_relative: null,
        us_taxpayer_indicators: {
          us_citizenship: enabledGr,
          has_green_card: false,
          birth_country_is_us: false,
          physical_or_registered_or_mailing_address_in_us: false,
          care_of_or_held_mail_address_in_us: false,
          contact_phone_in_us: false,
          long_term_payment_instructions_to_us_account: false,
          power_of_attorney_to_person_with_us_address: false,
        },
        business_relationship: businessRelationship,
        user_consent_data: {
          personal_data_processing_consent: personalDataConsent,
          information_accuracy_confirmation: infoAccuracyConsent,
          fatca_consent: checkedFet,
        },
        tax_number: individualDraft.tax_number || "",
        tax_residence: {
          is_kyrgyzstan_resident:
            typeof individualDraft.tax_residence?.is_kyrgyzstan_resident === "boolean"
              ? individualDraft.tax_residence.is_kyrgyzstan_resident
              : !enabled,
          tax_residency_in_other_countries: individualDraft.tax_residence?.tax_residency_in_other_countries ?? [],
        },
      };

      setLoading(true);
      submitIndividualFullApi(payload).subscribe({
        next: (result) => {
      setLoading(false);
      if (result.success) {
          const formId = result.data?.form_id;
          if (formId) {
            uploadAttachments(formId, "individual", physicalFiles);
          }
          setSubmitted(true);
          setPhysicalFiles([]);
      } else {
        setFormError("Не удалось отправить данные. Попробуйте позже.");
      }
        },
        error: (error: Error) => {
          setLoading(false);
          setFormError(parseError(error));
        },
      });

      return;
    }

    const generalInformation = {
      ...legalDraft.general_information,
      client_code:
        legalDraft.general_information?.client_code ||
        legalDraft.general_information?.short_name_ru ||
        legalDraft.general_information?.full_name_ru ||
        "N/A",
    };
    if (!generalInformation?.full_name_ru) {
      setFormError("Заполните данные организации.");
      setStep(1);
      return;
    }

    if (!legalDraft.addresses?.legal_address) {
      setFormError("Укажите юридический адрес.");
      setStep(2);
      return;
    }

    const investSource = formData.get("invest_source")?.toString().trim() || "";
    const relationshipPurposeMap: Record<string, "BROKER_SERVICE" | "DEPOSITORY_SERVICE" | undefined> = {
      brok: "BROKER_SERVICE",
      dep: "DEPOSITORY_SERVICE",
    };
    const relationshipTypeMap: Record<string, "SHORT_TERM" | "LONG_TERM" | "ONE_TIME_OPERATIONS" | undefined> = {
      Краткосрочные: "SHORT_TERM",
      Долгосрочные: "LONG_TERM",
      Разовые: "ONE_TIME_OPERATIONS",
    };
    const reputationMap: Record<string, "POSITIVE" | "NEGATIVE" | undefined> = {
      Положительная: "POSITIVE",
      Отрицательная: "NEGATIVE",
    };

    const relationshipPurpose = relationshipPurposeMap[selected.relationLegal];
    const relationshipType = relationshipTypeMap[selected.characterLegal];
    const businessReputationValue = reputationMap[selected.reputation];
    const financialConditionValue = selected.finance || "";

    if (!relationshipPurpose || !relationshipType) {
      setFormError("Выберите цель и характер отношений.");
      return;
    }

    if (!businessReputationValue || !financialConditionValue) {
      setFormError("Укажите деловую репутацию и финансовое положение.");
      return;
    }

    const licenseActivityType = noLicense
      ? "Лицензии отсутствуют"
      : formData.get("license_activity_type")?.toString().trim() || "";
    const licenseDetailsRaw = formData.get("licenses_req")?.toString().trim() || "";
    const licenseDetails = noLicense ? "Лицензии отсутствуют" : licenseDetailsRaw;
    if (!licenseActivityType || !licenseDetails) {
      setFormError("Заполните сведения о лицензиях.");
      return;
    }

    const managementStructureInfoRaw = formData.get("management_structure_info")?.toString().trim() || "";
    const managementStructureInfo = managementStructureInfoRaw || "Не указано";
    const assetsInfo = formData.get("assets_founders_trustees_info")?.toString().trim() || "";

    const bankDetails = formData.get("bank_details")?.toString().trim() || "";
    if (!bankDetails) {
      setFormError("Заполните банковские реквизиты.");
      return;
    }

    const registrationInfo = {
      ...legalDraft.registration_and_tax_info,
      registration_date:
        legalDraft.registration_and_tax_info?.registration_date ||
        formData.get("legal_registration_date")?.toString().trim() ||
        "",
      issuing_authority:
        legalDraft.registration_and_tax_info?.issuing_authority ||
        formData.get("registration_authority")?.toString().trim() ||
        "",
      inn_or_kpp: legalDraft.registration_and_tax_info?.inn_or_kpp || "",
      ogrn: legalDraft.registration_and_tax_info?.ogrn || "",
    };

    if (!registrationInfo.inn_or_kpp || !registrationInfo.ogrn || !registrationInfo.registration_date || !registrationInfo.issuing_authority) {
      setFormError("Заполните ИНН/КПП, ОГРН, дату и орган регистрации на предыдущих шагах.");
      return;
    }

    const legalBusinessRelationship =
      selected.relationLegal || selected.characterLegal || selected.finance || selected.reputation
        ? {
            relationship_purpose: relationshipPurpose,
            relationship_type: relationshipType,
            source_of_funds: investSource || selected.finance || "",
            business_reputation: businessReputationValue,
            financial_condition: financialConditionValue,
          }
        : undefined;

    const agencyRatings =
      selected.agentRating === "Присвоен"
        ? formData.get("agent_rating_value")?.toString().trim() || "Уровень рейтинга не указан"
        : "Отсутствует";

    const payload: SubmitLegalRequest = {
      general_information: generalInformation,
      registration_and_tax_info: registrationInfo,
      addresses: legalDraft.addresses,
      contacts: legalDraft.contacts,
      license_data: {
        license_activity_type: licenseActivityType,
        license_details: noLicense ? "Лицензии отсутствуют" : licenseDetails,
      },
      structure_and_assets: {
        management_structure_info: managementStructureInfo,
        assets_founders_trustees_info: assetsInfo || undefined,
      },
      bank_info: {
        bank_details: bankDetails,
        has_accounts_in_terror_sponsor_banks: terror,
        has_relations_with_non_managed_banks: bank,
        is_info_disclosure_issuer: emit,
      },
      fatca: {
        is_us_tax_resident: usRes,
        has_us_registration_or_postal_address: usAddr,
        has_us_taxpayer_beneficiaries_or_controllers: usBen,
        has_us_phone_number: usPhone,
        has_us_address_power_of_attorney: usAuth,
        has_us_long_term_payment_instructions: usPay,
      },
      business_relationships: legalBusinessRelationship,
      legal_status: {
        liquidation_in_process: selected.liquidation === "В процессе",
        bankruptcy_in_process: selected.bankruptcyProcess === "Ведется",
        has_court_bankruptcy_decisions: selected.bankruptcyDone === "Имеются",
        has_default_facts: selected.undoFacts === "Имеются",
        agency_ratings: agencyRatings,
      },
      consents: {
        personal_data_processing_consent: personalDataConsent,
        information_veracity_confirmation: infoAccuracyConsent,
        fatca_consent: checkedFet,
      },
    };

    setLoading(true);
    submitLegalKycApi(payload).subscribe({
      next: (result) => {
        setLoading(false);
        if (result.success) {
          const formId = result.data?.form_id;
          if (formId) {
            uploadAttachments(formId, "legal", legalFiles);
          }
          setLegalFiles([]);
          setSubmitted(true);
        } else {
          setFormError("Не удалось отправить данные. Попробуйте позже.");
        }
      },
      error: (error: Error) => {
        setLoading(false);
        setFormError(parseError(error));
      },
    });
  };

  // === ЭКРАН 4 ===
  if (step === 4) {
    return (
      <div className={s.activateForm__blocks}>
        <div className={s.activateForm__block}>
          <div className={s.activateForm__steps}>
            <div className={s.activateForm__step}><span className={s.step__num}>1</span> Шаг 1</div>
            <div className={s.activateForm__step}><span className={s.step__num}>2</span> Шаг 2</div>
            <div className={s.activateForm__step}><span className={s.step__num}>3</span> Шаг 3</div>
            <div className={`${s.activateForm__step} ${s.activateForm__stepActive}`}>
              <span className={s.step__num}>4</span> Шаг 4
            </div>
          </div>

          <form
            className={s.activateForm}
            onSubmit={handleFinalSubmit}
          >
            {isPhysical && (
              <>
                <span>Цели, финансы, согласия</span>
                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Цель установления отношений</h3>
                  <div className={s.authForm__group__radio}>
                    <label className={s.radio__option}>
                      <input
                        type="radio"
                        name="relation"
                        value="brok"
                        checked={selected.relation === "brok"}
                        onChange={() => handleChange("relation", "brok")}
                      />
                      <div className={s.radio__label}>Брокерское</div>
                    </label>
                  </div>
                  <div className={s.authForm__group__radio}>
                    <label className={s.radio__option}>
                      <input
                        type="radio"
                        name="relation"
                        value="dep"
                        checked={selected.relation === "dep"}
                        onChange={() => handleChange("relation", "dep")}
                      />
                      <div className={s.radio__label}>Депозитарное обслуживание</div>
                    </label>
                  </div>
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Характер отношений</h3>
                  {["Краткосрочные", "Долгосрочные", "Разовые"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="character"
                          value={item}
                          checked={selected.character === item}
                          onChange={() => handleChange("character", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Цели</h3>
                  <div className={s.authForm__group__radio}>
                    <label className={s.radio__option}>
                      <input
                        type="radio"
                        name="goal"
                        value="finance"
                        checked={selected.goal === "finance"}
                        onChange={() => handleChange("goal", "finance")}
                      />
                      <div className={s.radio__label}>Финансирование хоз. деятельности</div>
                    </label>
                  </div>
                  <div className={s.authForm__group__radio}>
                    <label className={s.radio__option}>
                      <input
                        type="radio"
                        name="goal"
                        value="other"
                        checked={selected.goal === "other"}
                        onChange={() => handleChange("goal", "other")}
                      />
                      <div className={s.radio__label}>Другое, укажу текстом</div>
                    </label>
                  </div>
                  {selected.goal === "other" && (
                    <input name="goal_other" type="text" placeholder="Введите текст..." className={s.authForm__input} />
                  )}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Финансовое положение</h3>
                  {["Устойчивое", "Неустойчивое"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="finance"
                          value={item}
                          checked={selected.finance === item}
                          onChange={() => handleChange("finance", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Деловая репутация</h3>
                  {["Положительная", "Отрицательная"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="reputation"
                          value={item}
                          checked={selected.reputation === item}
                          onChange={() => handleChange("reputation", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>


                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Источники средств</h3>

                  {[
                    "Зарплата",
                    "Предпринимательская деятельность",
                    "Операции с ценными бумагами",
                    "Заем/кредит",
                    "Иное, укажу текстом",
                  ].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="istochnik"
                          value={item}
                          checked={selected.istochnik === item}
                          onChange={() => handleChange("istochnik", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>

                      {/* если выбран вариант "Иное" — показать поле ввода */}
                      {selected.istochnik === "Иное, укажу текстом" && item === "Иное, укажу текстом" && (
                        <input
                          type="text"
                          name="funds_other"
                          placeholder="Введите текст..."
                          className={s.authForm__input}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <h3 className={s.authForm__group__titles}>Налогоплательщик США</h3>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={enabledGr}
                      onChange={() => setEnabledGr(!enabledGr)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p>Гражданство США</p>
                </div>
                {enabledGr && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Green Card</label>
                      <input type="text" className={s.authForm__input} />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Страна рождения</label>
                      <input type="text" className={s.authForm__input} />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Адрес в США</label>
                      <input type="text" className={s.authForm__input} />
                    </div>
                  </>
                )}

                <div className={s.authForm__group}>
                  <label className={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={checkedData}
                      onChange={() => setCheckedData(!checkedData)}
                    />
                    <span className={`${s.checkmark} ${s.oneline}`}></span>
                    Согласен на обработку персональных данных
                  </label>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={checkedOffer}
                      onChange={() => setCheckedOffer(!checkedOffer)}
                    />
                    <span className={`${s.checkmark} ${s.oneline}`}></span>
                    Подтверждаю достоверность сведений
                  </label>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={checkedFet}
                      onChange={() => setCheckedFet(!checkedFet)}
                    />
                    <span className={`${s.checkmark} ${s.oneline}`}></span>
                    Согласен на раскрытие FATCA
                  </label>
                </div>

                <div className={s.authForm__group}>
                  <UploadPhoto
                    label="Файлы (фото и документы)"
                    multiple
                    accept="image/*,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onFilesSelected={(files) =>
                      setPhysicalFiles((prev) => [...prev, ...files])
                    }
                  />
                  {renderFileList(physicalFiles)}
                </div>
              </>
            )}

            {!isPhysical && (
              <>
                <span>Банковские реквизиты</span>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Банковские реквизиты*</label>
                  <input
                    type="text"
                    name="bank_details"
                    className={s.authForm__input}
                    placeholder="Банк, счет, БИК"
                  />
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={terror}
                      onChange={() => setTerror(!terror)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Имеются счета в банках, указанных в перечне государств (территорий), определенных как государства, имеющие статус спонсоров терроризма</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={bank}
                      onChange={() => setBank(!bank)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Имеются отношения с банками, не имеющими на территории государств, где они зарегистрированы постоянно действующего органа управления</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={emit}
                      onChange={() => setEmit(!emit)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Организация является эмитентом, обязанным раскрывать информацию в соответствии с действующим законодательством</p>
                </div>


                <span>Сведения о принадлежности к налогоплательщикам США</span>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={usRes}
                      onChange={() => setUsRes(!usRes)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Страной налогового резидентства юридического лица является США</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={usAddr}
                      onChange={() => setUsAddr(!usAddr)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Адресом регистрации или почтовым адресом юридического лица является США</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={usBen}
                      onChange={() => setUsBen(!usBen)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>В состав бенефициарных владельцев или контролирующих лиц юридического лица входят физические или юридические лица, являющиеся налогоплательщиками США</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={usPhone}
                      onChange={() => setUsPhone(!usPhone)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Действующий номер контактного телефона на территории США</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={usAuth}
                      onChange={() => setUsAuth(!usAuth)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Организацией выдана доверенность или организацией предоставлены полномочия на подписание документов от имени организации физическому лицу, имеющему адрес в США</p>
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={usPay}
                      onChange={() => setUsPay(!usPay)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p className={s.left_text}>Долгосрочные платежные инструкции по перечислению денежных средств на счет в США</p>
                </div>

                <span>Цель установления деловых отношений (сведения о планируемых операциях)</span>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Цель установления отношений*</h3>
                  <div className={s.authForm__group__radio}>
                    <label className={s.radio__option}>
                      <input
                        type="radio"
                        name="relationLegal"
                        value="brok"
                        checked={selected.relationLegal === "brok"}
                        onChange={() => handleChange("relationLegal", "brok")}
                      />
                      <div className={s.radio__label}>Брокерское</div>
                    </label>
                  </div>
                  <div className={s.authForm__group__radio}>
                    <label className={s.radio__option}>
                      <input
                        type="radio"
                        name="relationLegal"
                        value="dep"
                        checked={selected.relationLegal === "dep"}
                        onChange={() => handleChange("relationLegal", "dep")}
                      />
                      <div className={s.radio__label}>Депозитарное обслуживание</div>
                    </label>
                  </div>
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Характер отношений*</h3>
                  {["Краткосрочные", "Долгосрочные", "Разовые"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="characterLegal"
                          value={item}
                          checked={selected.characterLegal === item}
                          onChange={() => handleChange("characterLegal", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Деловая репутация*</h3>
                  {["Положительная", "Отрицательная"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="reputationLegal"
                          value={item}
                          checked={selected.reputation === item}
                          onChange={() => handleChange("reputation", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Происхождение средств для инвестирования*</label>
                  <input
                    type="text"
                    name="invest_source"
                    className={s.authForm__input}
                  />
                </div>

                <span>Сведения о финансовом положении юридического лица предоставляется в отношении Клиента</span>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Финансовое положение*</h3>
                  {["Устойчивое", "Неустойчивое"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="financeLegal"
                          value={item}
                          checked={selected.finance === item}
                          onChange={() => handleChange("finance", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Процедура ликвидации в отношении юридического лица*</h3>
                  {["Проводится", "Не проводится"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="liquidation"
                          value={item}
                          checked={selected.liquidation === item}
                          onChange={() => handleChange("liquidation", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Производство по делу о банкротстве в отношении юридического лица*</h3>
                  {["Ведется", "Не ведется"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="bankruptcyProcess"
                          value={item}
                          checked={selected.bankruptcyProcess === item}
                          onChange={() => handleChange("bankruptcyProcess", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Вступившие в силу решения суда в отношении юридического лица о признании его банкротом*</h3>
                  {["Имеются", "Не имеются"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="bankruptcyDone"
                          value={item}
                          checked={selected.bankruptcyDone === item}
                          onChange={() => handleChange("bankruptcyDone", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Факты неисполнения юридическим лицом денежных обязательств по причине отсутствия денежных средств на банковских счетах по делу о банкротстве в отношении юридического лица*</h3>
                  {["Имеются", "Не имеются"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="undoFacts"
                          value={item}
                          checked={selected.undoFacts === item}
                          onChange={() => handleChange("undoFacts", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className={s.authForm__group__list}>
                  <h3 className={s.authForm__group__titles}>Рейтинг международных/национальных рейтинговых агентств</h3>
                  {["Присвоен", "Не присвоен"].map((item) => (
                    <div key={item} className={s.authForm__group__radio}>
                      <label className={s.radio__option}>
                        <input
                          type="radio"
                          name="agentRating"
                          value={item}
                          checked={selected.agentRating === item}
                          onChange={() => handleChange("agentRating", item)}
                        />
                        <div className={s.radio__label}>{item}</div>
                      </label>
                    </div>
                  ))}
                </div>

                {selected.agentRating === 'Присвоен' && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Укажите уровень и наименование рейтингового агентства</label>
                      <input
                        type="text"
                        name="agent_rating_value"
                        className={s.authForm__input}
                      />
                    </div>
                  </>
                )}
              </>
            )}


            {formError && <p className={s.formError}>{formError}</p>}
            <div className={s.btnRow}>
              <button type="button" onClick={prevStep} className={s.activateForm__btnPrev} disabled={loading}>
                Назад
              </button>
              <button type="submit" className={s.activateForm__btnNext} disabled={loading}>
                {loading ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // === ЭКРАН 3 ===
  if (step === 3) {
    return (
      <div className={s.activateForm__blocks}>
        <div className={s.activateForm__block}>
          <div className={s.activateForm__steps}>
            <div className={s.activateForm__step}>
              <span className={s.step__num}>1</span> Шаг 1
            </div>
            <div className={s.activateForm__step}>
              <span className={s.step__num}>2</span> Шаг 2
            </div>
            <div className={`${s.activateForm__step} ${s.activateForm__stepActive}`}>
              <span className={s.step__num}>3</span> Шаг 3
            </div>
            <div className={s.activateForm__step}>
              <span className={s.step__num}>4</span> Шаг 4
            </div>
          </div>
          <form
            className={s.activateForm}
            onSubmit={handleStep3Submit}
          >
            {isPhysical && (
              <>
                <span>Представители, выгодоприобретатели и статусы</span>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={enabledStep1}
                      onChange={() => setEnabledStep1(!enabledStep1)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Не являюсь гражданином КР</p>
                </div>

                {enabledStep1 && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>ФИО, Наименование </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>

                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Документ-основание </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>

                    <div className={s.authForm__group__rows}>
                      <div className={s.authForm__group}>
                        <label className={s.authForm__label}>Дата начала полномочий* </label>
                        <input
                          type="date"
                          name="plonom"
                          className={s.activateForm__input__date}
                        />
                      </div>
                      <div className={s.authForm__group}>
                        <label className={s.authForm__label}>Дата окончания полномочий* </label>
                        <input
                          type="date"
                          name="plonom2"
                          className={s.activateForm__input__date}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={enabledStep2}
                      onChange={() => setEnabledStep2(!enabledStep2)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Бенефициарный владелец</p>
                </div>
                {enabledStep2 && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>ФИО </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                  </>
                )}

                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={enabledStep3}
                      onChange={() => setEnabledStep3(!enabledStep3)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Выгодоприобретатель</p>
                </div>
                {enabledStep3 && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>ФИО/Наименование </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group__rows}>
                      <div className={s.authForm__group}>
                        <label className={s.authForm__label}>Номер договора* </label>
                        <input
                          type="text"
                          name="numplonom"
                          className={s.authForm__input}
                        />
                      </div>
                      <div className={s.authForm__group}>
                        <label className={s.authForm__label}>Дата договора* </label>
                        <input
                          type="date"
                          name="dogovor"
                          className={s.activateForm__input__date}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={enabledStep4}
                      onChange={() => setEnabledStep4(!enabledStep4)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Публичное должностное лицо</p>
                </div>
                {enabledStep4 && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Должность </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Работодатель </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Адрес работодателя </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                  </>
                )}
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={enabledStep5}
                      onChange={() => setEnabledStep5(!enabledStep5)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Супруг(а)/родственник PEP</p>
                </div>
                {enabledStep5 && (
                  <>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Степень родства </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>ФИО </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Должность </label>
                      <input
                        type="text"
                        name="phone"
                        className={s.authForm__input}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {!isPhysical && (
              <>
                <span>Сведения о видах осуществляемой деятельности</span>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Вид осуществляемой деятельности, подлежащей лицензированию за пределами КР</label>
                  <input
                    type="text"
                    name="license_activity_type"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <div className={s.authForm__group__row}>
                    <div className={s.authForm__group__left}>
                      <label className={s.authForm__label}>Реквизиты лицензий анкетируемого лица</label>
                      <input
                        type="text"
                        name="licenses_req"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group__right}>
                      <label className={s.checkboxContainer}>
                        <input
                          type="checkbox"
                          checked={noLicense}
                          onChange={() => setNoLicense(!noLicense)}
                        />
                        <span className={s.checkmark}></span>
                        Лицензии отсутствуют
                      </label>
                    </div>
                  </div>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Сведения о структуре и персональном составе органов управления юридического лица, иностранной структуры без образования юридического лица</label>
                  <textarea
                    name="management_structure_info"
                    className={s.authForm__textarea}
                  />
                  <label className={s.authForm__prompt}>Не указываются сведения о персональном составе акционеров (участников), владеющих менее чем 5% акций (долей) юридического лица</label>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Состав имущества, находящегося в управлении (собственности), ФИО (при наличии), наименование и адрес места жительства (нахождения) учредителей, доверительного собственника (управляющего), протектора</label>
                  <textarea
                    name="assets_founders_trustees_info"
                    className={s.authForm__textarea}
                  />
                  <label className={s.authForm__prompt}>Информация предоставляется в отношении трастов и иных иностранных структур без образования юридического лица с аналогичной структурой или функцией</label>
                </div>
              </>
            )}

            {!isPhysical && (
              <>
                <div className={s.authForm__group}>
                  <UploadPhoto
                    label="Файлы (фото и документы)"
                    multiple
                    accept="image/*,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onFilesSelected={(files) =>
                      setLegalFiles((prev) => [...prev, ...files])
                    }
                  />
                  {renderFileList(legalFiles)}
                </div>
              </>
            )}

            {formError && <p className={s.formError}>{formError}</p>}
            <div className={s.btnRow}>
              <button type="button" onClick={prevStep} className={s.activateForm__btnPrev} disabled={loading}>
                Назад
              </button>
              <button type="submit" className={s.activateForm__btnNext} disabled={loading}>
                {loading ? "Сохранение..." : "Далее"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // === ЭКРАН 2 ===
  if (step === 2) {
    return (
      <div className={s.activateForm__blocks}>
        <div className={s.activateForm__block}>
          <div className={s.activateForm__steps}>
            <div className={s.activateForm__step}>
              <span className={s.step__num}>1</span> Шаг 1
            </div>
            <div className={`${s.activateForm__step} ${s.activateForm__stepActive}`}>
              <span className={s.step__num}>2</span> Шаг 2
            </div>
            <div className={s.activateForm__step}>
              <span className={s.step__num}>3</span> Шаг 3
            </div>
            <div className={s.activateForm__step}>
              <span className={s.step__num}>4</span> Шаг 4
            </div>
          </div>

          <form
            className={s.activateForm}
            onSubmit={handleStep2Submit}
          >
            {isPhysical && (
              <>
                <span>Адреса, контакты и налоговый статус</span>
                <div className={s.mob__block__filter}>
                  <label className={s.authForm__label}>Статус налогового резидентства*</label>
                  <Select
                    name="tax"
                    placeholder="Не выбрано"
                    options={taxResidencyOptions}
                    value={taxResidency}
                    onChange={option => selectTaxResidency(option)}
                    classNamePrefix="custom__select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        border: "1.5px solid var(--border-light-gray)",
                        borderRadius: "6px",
                        height: "52px",
                        padding: "0 6px",
                        boxShadow: "none",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                        color: state.isFocused ? "var(--text-light-gray)" : "#808080",
                        "&:hover": {
                          borderColor: "#bfd9ff",
                        },
                        minHeight: "52px"
                      }),
                      placeholder: (base) => ({
                        ...base,
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "var(--text-light-gray)",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "6px",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#2684ff" : state.isFocused ? "#deebff" : "#fff",
                        color: state.isSelected ? "#fff" : "#000",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                        cursor: "pointer",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: 4,
                      }),
                      indicatorSeparator: () => ({ display: "none" }),
                    }}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Адрес регистрации</label>
                  <input
                    type="text"
                    name="physical_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                    required
                  />
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={physicalSame}
                      onChange={() => setPhysicalSame(!physicalSame)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Почтовый адрес совпадает с адресом регистрации</p>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Почтовый адрес  </label>
                  <input
                    type="text"
                    name="physical_postal_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                  />
                </div>

                <div className={s.authForm__group__rows}>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Телефон* </label>
                    <PhoneInput
                      country={"ru"}
                      value={physicalPhone}
                      onChange={(value) => setPhysicalPhone(value)}
                      inputClass={s.phoneInputs}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>E-mail </label>
                    <input
                      type="text"
                      name="contact_email"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Факс </label>
                    <PhoneInput
                      country={"ru"}
                      value={physicalFax}
                      onChange={(value) => setPhysicalFax(value)}
                      inputClass={s.phoneInputs}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label_oneline}>Иные контактые данные </label>
                    <input
                      type="text"
                      name="contact_additional"
                      className={s.authForm__input}
                    />
                  </div>
                </div>
                <div className={s.mob__block__filter}>
                  <label className={s.authForm__label}>Статус налогового резидентства*</label>
                  <Select
                    name="tax"
                    placeholder="Не выбрано"
                    options={taxResidencyOptions}
                    value={taxResidency}
                    onChange={option => selectTaxResidency(option)}
                    classNamePrefix="custom__select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        border: "1.5px solid var(--border-light-gray)",
                        borderRadius: "6px",
                        height: "52px",
                        padding: "0 6px",
                        boxShadow: "none",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                        color: state.isFocused ? "var(--text-light-gray)" : "#808080",
                        "&:hover": {
                          borderColor: "#bfd9ff",
                        },
                        minHeight: "52px"
                      }),
                      placeholder: (base) => ({
                        ...base,
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "var(--text-light-gray)",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "6px",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#2684ff" : state.isFocused ? "#deebff" : "#fff",
                        color: state.isSelected ? "#fff" : "#000",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                        cursor: "pointer",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: 4,
                      }),
                      indicatorSeparator: () => ({ display: "none" }),
                    }}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>ИНН {taxResidency?.value}</label>
                  <input
                    type="text"
                    name="physical_inn"
                    placeholder="ИНН"
                    className={s.authForm__input}
                  />
                </div>
              </>
            )}

            {!isPhysical && (
              <>
                <span>Страна регистрации</span>
                <div className={s.mob__block__filter}>
                  <label className={s.authForm__label}>Статус налогового резидентства*</label>
                  <Select
                    name="tax"
                    placeholder="Не выбрано"
                    options={taxResidencyOptions}
                    value={legalTaxResidency}
                    onChange={option => selectLegalTaxResidency(option)}
                    classNamePrefix="custom__select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        border: "1.5px solid var(--border-light-gray)",
                        borderRadius: "6px",
                        height: "52px",
                        padding: "0 6px",
                        boxShadow: "none",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                        color: state.isFocused ? "var(--text-light-gray)" : "#808080",
                        "&:hover": {
                          borderColor: "#bfd9ff",
                        },
                        minHeight: "52px"
                      }),
                      placeholder: (base) => ({
                        ...base,
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "var(--text-light-gray)",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "6px",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#2684ff" : state.isFocused ? "#deebff" : "#fff",
                        color: state.isSelected ? "#fff" : "#000",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "150%",
                        cursor: "pointer",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: 4,
                      }),
                      indicatorSeparator: () => ({ display: "none" }),
                    }}
                  />
                </div>
                <div className={s.authForm__group__rows}>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>ИНН </label>
                    <input
                      type="text"
                      name="legal_inn"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>КПП </label>
                    <input
                      type="text"
                      name="legal_kpp"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>КИО </label>
                    <input
                      type="text"
                      name="legal_kio"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label_oneline}>TIN </label>
                    <input
                      type="text"
                      name="legal_tin"
                      className={s.authForm__input}
                    />
                  </div>
                </div>
                <span>Данные о государственной регистрации</span>
                <div className={s.authForm__group__rows}>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label_oneline}>ОГРН / Регистрационный номер </label>
                    <input
                      type="text"
                      name="legal_ogrn"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label_oneline}>Дата регистрации</label>
                    <input
                      type="date"
                      name="legal_registration_date"
                      className={s.activateForm__input__date}
                    />
                  </div>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>Наименование органа, осуществившего регистрацию </label>
                  <input
                    type="text"
                    name="registration_authority"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>ОКПО (при наличии) </label>
                  <input
                    type="text"
                    name="okpo"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>БИК </label>
                  <input
                    type="text"
                    name="bik"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>Адрес юридического лица (согласно ЕГРЮЛ)</label>
                  <input
                    type="text"
                    name="egrul"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>Фактический (почтовый) адрес</label>
                  <input
                    type="text"
                    name="fact_postal_address"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>Место ведения основной деятельности</label>
                  <input
                    type="text"
                    name="main_activity_place"
                    className={s.authForm__input}
                  />
                </div>

                <div className={s.authForm__group__rows}>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Телефон* </label>
                    <PhoneInput
                      country={"ru"}
                      value={legalPhone}
                      onChange={(value) => setLegalPhone(value)}
                      inputClass={s.phoneInputs}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Факс </label>
                    <PhoneInput
                      country={"ru"}
                      value={legalFax}
                      onChange={(value) => setLegalFax(value)}
                      inputClass={s.phoneInputs}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>E-mail </label>
                    <input
                      type="text"
                      name="legal_email"
                      placeholder="info@company.ru"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label_oneline}>Сайт</label>
                    <input
                      type="text"
                      name="legal_site"
                      placeholder="Доменное имя"
                      className={s.authForm__input}
                    />
                  </div>
                </div>
              </>
            )}

            <div className={s.btnRow}>
              <button type="button" onClick={prevStep} className={s.activateForm__btnPrev}>
                Назад
              </button>
              <button type="submit" className={s.activateForm__btnNext}>
                Далее
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // === ЭКРАН 1 ===
  return (
    <div className={s.activateForm__blocks}>
      <div className={s.activateForm__block}>
        <div className={s.activateForm__steps}>
          <div className={`${s.activateForm__step} ${s.activateForm__stepActive}`}>
            <span className={s.step__num}>1</span> Шаг 1
          </div>
          <div className={s.activateForm__step}>
            <span className={s.step__num}>2</span> Шаг 2
          </div>
          <div className={s.activateForm__step}>
            <span className={s.step__num}>3</span> Шаг 3
          </div>
          <div className={s.activateForm__step}>
            <span className={s.step__num}>4</span> Шаг 4
          </div>
        </div>

        <div className={s.entityRow}>
          <div className={s.entityControl}>
            <div
              className={`${s.entityButton} ${isPhysical ? s.active : ""}`}
              onClick={() => setIsPhysical(true)}
            >
              <span>Физическое лицо</span>
            </div>

            <div
              className={`${s.entityButton} ${!isPhysical ? s.active : ""}`}
              onClick={() => setIsPhysical(false)}
            >
            <span>Юридическое лицо</span>
          </div>
        </div>
        {passportUploadTrigger}
      </div>

      <form
        className={s.activateForm}
        onSubmit={handleStep1Submit}
        ref={formRef}
      >
          {isPhysical && (
            <>
              <span>Личные данные</span>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Имя </label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="Ваше имя"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Фамилия </label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Ваша фамилия"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <div className={s.authForm__group__row}>
                  <div className={s.authForm__group__left}>
                    <label className={s.authForm__label}>Отчество</label>
                    <input
                      type="text"
                      name="patronymic"
                      placeholder="Ваше отчество"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group__right}>
                    <label className={s.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setChecked(!checked)}
                      />
                      <span className={s.checkmark}></span>
                      Отчество отсутствует
                    </label>
                  </div>
                </div>
              </div>
              <div className={s.mob__block__filter}>
                <label className={s.authForm__label}>Выберите тип документа</label>
                <Select
                  name="document"
                  placeholder="Не выбрано"
                  value={selectedDocument}
                  options={documentOptions}
                  classNamePrefix="custom__select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: "1.5px solid var(--border-light-gray)",
                      borderRadius: "6px",
                      height: "52px",
                      padding: "0 6px",
                      boxShadow: "none",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                      color: state.isFocused ? "var(--text-light-gray)" : "#808080",
                      "&:hover": {
                        borderColor: "#bfd9ff",
                      },
                      minHeight: "52px"
                    }),
                    placeholder: (base) => ({
                      ...base,
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "var(--text-light-gray)",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "6px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#2684ff" : state.isFocused ? "#deebff" : "#fff",
                      color: state.isSelected ? "#fff" : "#000",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                      cursor: "pointer",
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      padding: 4,
                    }),
                    indicatorSeparator: () => ({ display: "none" }),
                  }}
                />
              </div>
              <div className={s.mob__block__filter}>
                <label className={s.authForm__label}>Гражданство / страна паспорта</label>
                <Select
                  name="passport_country"
                  placeholder="Не выбрано"
                  value={passportCountry}
                  options={passportCountryOptions}
                  onChange={(option) => {
                    const nextOption = (option as SelectOption | null) ?? null;
                    setPassportCountry(nextOption);
                    if (nextOption) {
                      const isKyrgyzstan = nextOption.value.toLowerCase() === "kyrgyzstan";
                      setEnabled((prev) => (prev === !isKyrgyzstan ? prev : !isKyrgyzstan));
                    }
                  }}
                  classNamePrefix="custom__select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: "1.5px solid var(--border-light-gray)",
                      borderRadius: "6px",
                      height: "52px",
                      padding: "0 6px",
                      boxShadow: "none",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                      color: state.isFocused ? "var(--text-light-gray)" : "#808080",
                      "&:hover": {
                        borderColor: "#bfd9ff",
                      },
                      minHeight: "52px"
                    }),
                    placeholder: (base) => ({
                      ...base,
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "var(--text-light-gray)",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "6px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#2684ff" : state.isFocused ? "#deebff" : "#fff",
                      color: state.isSelected ? "#fff" : "#000",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                      cursor: "pointer",
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      padding: 4,
                    }),
                    indicatorSeparator: () => ({ display: "none" }),
                  }}
                />
              </div>

              <div className={s.passportHeader}>
                <span>Паспорт</span>
                <span className={s.passportBadge}>{activePassportTemplate.name}</span>
              </div>
              <div className={s.authForm__group__rows}>
                {seriesField && (
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>
                      {seriesField.label}
                      {seriesField.required ? "*" : ""}
                    </label>
                    <input
                      key={`series-${passportFieldsVersion}`}
                      type="text"
                      name="passport_series"
                      placeholder={seriesField.placeholder}
                      className={s.authForm__input}
                      maxLength={seriesField.maxLength}
                      pattern={seriesField.pattern?.source}
                      inputMode={seriesField.inputMode}
                      required={seriesField.required}
                    />
                    {seriesField.hint && <p className={s.formHint}>{seriesField.hint}</p>}
                  </div>
                )}
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>
                    {numberField.label}
                    {numberField.required ? "*" : ""}
                  </label>
                  <input
                    key={`number-${passportFieldsVersion}`}
                    type="text"
                    name="passport_number"
                    placeholder={numberField.placeholder}
                    className={s.authForm__input}
                    maxLength={numberField.maxLength}
                    pattern={numberField.pattern?.source}
                    inputMode={numberField.inputMode}
                    required={numberField.required}
                  />
                  {numberField.hint && <p className={s.formHint}>{numberField.hint}</p>}
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>
                    {issueDateRequired ? "Дата выдачи*" : "Дата выдачи"}
                  </label>
                  <input
                    key={`issue-${passportFieldsVersion}`}
                    type="date"
                    name="issue_date"
                    className={s.activateForm__input__date}
                    required={issueDateRequired}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>
                    {expiryDateRequired ? "Срок действия*" : "Срок действия, если есть"}
                  </label>
                  <input
                    key={`expiry-${passportFieldsVersion}`}
                    type="date"
                    name="expiry_date"
                    className={s.activateForm__input__date}
                    required={expiryDateRequired}
                  />
                </div>
                {divisionField && (
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>
                      {divisionField.label}
                      {divisionField.required ? "*" : ""}
                    </label>
                    <input
                      key={`division-${passportFieldsVersion}`}
                      type="text"
                      name="division_code"
                      placeholder={divisionField.placeholder}
                      className={s.authForm__input}
                      maxLength={divisionField.maxLength}
                      pattern={divisionField.pattern?.source}
                      inputMode={divisionField.inputMode}
                      required={divisionField.required}
                    />
                    {divisionField.hint && <p className={s.formHint}>{divisionField.hint}</p>}
                  </div>
                )}
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>
                  {issuingAuthorityLabel}
                  *
                </label>
                <input
                  type="text"
                  name="issued_by"
                  placeholder={issuingAuthorityPlaceholder}
                  className={s.authForm__input}
                  required
                />
              </div>
              {activePassportTemplate.hints?.length ? (
                <div className={s.passportHints}>
                  {activePassportTemplate.hints.map((hint) => (
                    <p key={hint} className={s.formHint}>
                      {hint}
                    </p>
                  ))}
                </div>
              ) : null}

            <div className={s.authForm__group}>
              <UploadPhoto
                label="Файлы (фото и документы)"
                multiple
                accept="image/*,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onFilesSelected={(files) =>
                  setPhysicalFiles((prev) => [...prev, ...files])
                }
              />
              {renderFileList(physicalFiles)}
            </div>

              <div className={s.authForm__group__switch}>
                <label className={s.switch}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => setEnabled(!enabled)}
                  />
                  <span className={s.slider}></span>
                </label>
                <p> Не являюсь гражданином КР</p>
              </div>
              {enabled && (
                <>
                  <div className={s.mob__block__filter}>
                    <label className={s.authForm__label}>Документ о праве пребывания</label>
                    <Select
                      name="re"
                      placeholder="Не выбрано"
                      value={selectedResidenceDocument}
                      options={residenceDocumentOptions}
                      classNamePrefix="custom__select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          border: "1.5px solid var(--border-light-gray)",
                          borderRadius: "6px",
                          height: "52px",
                          padding: "0 6px",
                          boxShadow: "none",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                          color: state.isFocused ? "var(--text-light-gray)" : "#808080",
                          "&:hover": {
                            borderColor: "#bfd9ff",
                          },
                          minHeight: "52px"
                        }),
                        placeholder: (base) => ({
                          ...base,
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: "var(--text-light-gray)",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: "6px",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? "#2684ff" : state.isFocused ? "#deebff" : "#fff",
                          color: state.isSelected ? "#fff" : "#000",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                          cursor: "pointer",
                        }),
                        dropdownIndicator: (base) => ({
                          ...base,
                          padding: 4,
                        }),
                        indicatorSeparator: () => ({ display: "none" }),
                      }}
                    />
                  </div>
                  <div className={s.authForm__group__rows}>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Серия* </label>
                      <input
                        type="text"
                        name="residence_series"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Номер* </label>
                      <input
                        type="text"
                        name="residence_number"
                        className={s.authForm__input}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Дата начала срока* </label>
                      <input
                        type="date"
                        name="residence_start"
                        className={s.activateForm__input__date}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Дата окончания срока </label>
                      <input
                        type="date"
                        name="residence_end"
                        className={s.activateForm__input__date}
                      />
                    </div>

                  </div>
                </>
              )}
            </>
          )}

          {!isPhysical && (
            <>
              <span>Данные о компании</span>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Полное наименование (на русском языке)</label>
                <input
                  type="text"
                  name="company_name_rus"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Сокращенное наименование (на русском языке)</label>
                <input
                  type="text"
                  name="company_shortname_rus"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Полное наименование (на иностранном языке)</label>
                <input
                  type="text"
                  name="company_name_foreign"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Сокращенное наименование (на иностранном языке)</label>
                <input
                  type="text"
                  name="company_shortname_foreign"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Организационно-правовая форма</label>
                <input
                  type="text"
                  name="legal_form"
                  className={s.authForm__input}
                />
              </div>
              <span>Представитель, действующий от имени юридического лица без доверенности</span>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>ФИО (наименование) представителя*</label>
                <input
                  type="text"
                  name="representative_name"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Должность представителя*</label>
                <input
                  type="text"
                  name="representative_position"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Документ-основание*</label>
                <input
                  type="text"
                  name="document_basis"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group__rows}>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Начало полномочий*</label>
                  <input
                    type="date"
                    name="authority_start"
                    className={s.activateForm__input__date}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label_oneline}>Окончание полномочий*</label>
                  <input
                    type="date"
                    name="authority_end"
                    className={s.activateForm__input__date}
                  />
                </div>
              </div>
              <span>Представитель по доверенности</span>
              <div className={s.authForm__group__switch}>
                <label className={s.switch}>
                  <input
                    type="checkbox"
                    checked={isByProxy}
                    onChange={() => setIsByProxy(!isByProxy)}
                  />
                  <span className={s.slider}></span>
                </label>
                <p>Есть</p>
              </div>

              {isByProxy && (
                <>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>ФИО (наименование) представителя*</label>
                    <input
                      type="text"
                      name="proxy_name"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Документ-основание*</label>
                    <input
                      type="text"
                      name="proxy_document"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group__rows}>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label}>Начало полномочий*</label>
                      <input
                        type="date"
                        name="proxy_start"
                        className={s.activateForm__input__date}
                      />
                    </div>
                    <div className={s.authForm__group}>
                      <label className={s.authForm__label_oneline}>Окончание полномочий*</label>
                      <input
                        type="date"
                        name="proxy_end"
                        className={s.activateForm__input__date}
                      />
                    </div>
                  </div>
                </>
              )}

              <span>Сведения о выгодоприобретателе</span>
              <div className={s.authForm__group__switch}>
                <label className={s.switch}>
                  <input
                    type="checkbox"
                    checked={beneficiaryInfo}
                    onChange={() => setBeneficiaryInfo(!beneficiaryInfo)}
                  />
                  <span className={s.slider}></span>
                </label>
                <p>Есть</p>
              </div>

              {beneficiaryInfo && (
                <>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>ФИО (наименование) выгодоприобретателя*</label>
                    <input
                      type="text"
                      name="beneficial_name"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Номер и дата договора, заключенного между клиентом и выгодоприобретателем</label>
                    <input
                      type="text"
                      name="beneficial_order_info"
                      className={s.authForm__input}
                    />
                  </div>
                </>
              )}

              <span>Сведения о бенефициарном владельце</span>
              <div className={s.authForm__group__switch}>
                <label className={s.switch}>
                  <input
                    type="checkbox"
                    checked={beneficialOwner}
                    onChange={() => setBeneficialOwner(!beneficialOwner)}
                  />
                  <span className={s.slider}></span>
                </label>
                <p>Есть</p>
              </div>

              {beneficialOwner && (
                <>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>ФИО (наименование) бенефициарного владельца*</label>
                    <input
                      type="text"
                      name="beneficial_owner_name"
                      className={s.authForm__input}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {formError && <p className={s.formError}>{formError}</p>}
          <div className={s.btnRow}>
            <button type="button" disabled className={s.activateForm__btnDisabled}>
              Назад
            </button>
            <button type="submit" className={s.activateForm__btnNext}>
              Далее
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
