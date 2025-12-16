"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Select, { SingleValue } from "react-select";
import PhoneInput from "react-phone-input-2";
import { submitIndividualBasicApi, SubmitIndividualBasicRequest } from "@/app/api/kyc/submit-individual-basic";
import { submitLegalPreKycApi, SubmitLegalPreKycRequest } from "@/app/api/kyc/submit-legal-prekyc";
import { uploadAttachmentApi } from "@/app/api/kyc/uploadAttachment";
import { parseError } from "@/app/utils/parse-error";
import { getPassportTemplate, passportCountryOptions, SelectOption } from "@/app/utils/passportTemplates";
import { type PassportRecognitionPayload } from "@/app/api/kyc/recognize-passport";
import s from "./prekycform.module.scss";
import UploadPhoto from "./UploadPhoto";
import PassportUploadTrigger from "../PassportUploadTrigger/PassportUploadTrigger";

export default function PrekycFrom() {
  const [checked, setChecked] = useState(false);
  const [notPhysicalChecked, setNotPhysicalChecked] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [legalSame, setLegalSame] = useState(false);

  const [isPhysical, setIsPhysical] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3>(1); // шаги: 1-код, 2-пароль, 3-успех

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [citizenship, setCitizenship] = useState<SelectOption | null>(null);
  const [country, setCountry] = useState<SelectOption | null>(null);
  const [registrationCountry, setRegistrationCountry] = useState<SelectOption | null>(null);
  const [passportFieldsVersion, setPassportFieldsVersion] = useState(0);
  const [physicalPayload, setPhysicalPayload] = useState<SubmitIndividualBasicRequest | null>(null);
  const [legalPayload, setLegalPayload] = useState<Partial<SubmitLegalPreKycRequest> | null>(null);
  const [legalPhone, setLegalPhone] = useState("");
  const [legalFax, setLegalFax] = useState("");
  const [stockTariffChecked, setStockTariffChecked] = useState(false);
  const [derivativesTariffChecked, setDerivativesTariffChecked] = useState(false);
  const [fxTariffChecked, setFxTariffChecked] = useState(false);
  const [stockTariffPlan, setStockTariffPlan] = useState("");
  const [derivativesTariffPlan, setDerivativesTariffPlan] = useState("");
  const [fxTariffPlan, setFxTariffPlan] = useState("");
  const [legalFiles, setLegalFiles] = useState<File[]>([]);
  const [legalPhotos, setLegalPhotos] = useState<File[]>([]);
  const [, setPassportPhoto] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const activePassportCountry = country?.value || citizenship?.value || "";
  const activePassportTemplate = useMemo(() => {
    return getPassportTemplate(activePassportCountry);
  }, [activePassportCountry]);
  const seriesField = activePassportTemplate.series;
  const numberField = activePassportTemplate.number;
  const divisionField = activePassportTemplate.divisionCode;
  const issueDateRequired = activePassportTemplate.issueDateRequired ?? true;
  const expiryDateRequired = activePassportTemplate.expiryDateRequired ?? false;
  const issuingAuthorityLabel = activePassportTemplate.issuingAuthorityLabel ?? "Кем выдан";
  const issuingAuthorityPlaceholder =
    activePassportTemplate.issuingAuthorityPlaceholder ?? "Введите наименование органа";

  useEffect(() => {
    setPassportFieldsVersion((prev) => prev + 1);
  }, [activePassportTemplate.code]);

  useEffect(() => {
    setFormError("");
  if (isPhysical) {
      setRegistrationCountry(null);
      setLegalPayload(null);
      setLegalPhone("");
      setLegalFax("");
      setLegalFiles([]);
      setLegalPhotos([]);
      setStockTariffChecked(false);
      setDerivativesTariffChecked(false);
      setFxTariffChecked(false);
      setStockTariffPlan("");
      setDerivativesTariffPlan("");
      setFxTariffPlan("");
    } else {
      setCitizenship(null);
      setCountry(null);
      setPhysicalPayload(null);
      setStockTariffChecked(false);
      setDerivativesTariffChecked(false);
      setFxTariffChecked(false);
      setStockTariffPlan("");
      setDerivativesTariffPlan("");
      setFxTariffPlan("");
    }
  }, [isPhysical]);

  useEffect(() => {
    setFormError("");
  }, [step]);

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
    setIfEmpty("document_issuing_authority", data.document_issuing_authority ?? undefined);

    if (data.citizenship) {
      const normalized = data.citizenship.toLowerCase();
      const option = passportCountryOptions.find(
        (opt) =>
          opt.value.toLowerCase() === normalized ||
          opt.label.toLowerCase() === normalized
      );
      if (option) setCitizenship(option);
    }
  };

  const handleLegalFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files);
    setLegalFiles((prev) => [...prev, ...next]);
  };

  const uploadLegalAttachments = (formId: number) => {
    const filesToSend = [...legalFiles, ...legalPhotos];
    if (!filesToSend.length) return Promise.resolve();
    return Promise.all(
      filesToSend.map((file) => {
        return new Promise<void>((resolve) => {
          uploadAttachmentApi(formId, "legal_pre", file).subscribe({
            next: () => resolve(),
            error: () => resolve(), // глотаем ошибки вложений, чтобы не блокировать отправку анкеты
          });
        });
      })
    ).then(() => {
      setLegalFiles([]);
      setLegalPhotos([]);
    });
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const handleStep1Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);

    if (isPhysical) {
      const firstName = formData.get("first_name")?.toString().trim();
      const lastName = formData.get("last_name")?.toString().trim();
      const patronymicValue = formData.get("patronymic")?.toString().trim();
      const passportSeries = formData.get("passport_series")?.toString().trim();
      const passportNumber = formData.get("passport_number")?.toString().trim();
      const divisionCode = formData.get("division_code")?.toString().trim();
      const issueDate = formData.get("issue_date")?.toString().trim();
      const expiryDate = formData.get("expiry_date")?.toString().trim();
      const documentAuthority = formData.get("document_issuing_authority")?.toString().trim();
      const template = activePassportTemplate;

      if (!firstName || !lastName || !documentAuthority || !citizenship) {
        setFormError("Пожалуйста, заполните обязательные поля.");
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

      if (template.divisionCode?.required && !divisionCode) {
        setFormError("Укажите код подразделения.");
        return;
      }

      if (issueDateRequired && !issueDate) {
        setFormError("Укажите дату выдачи документа.");
        return;
      }

      if (expiryDateRequired && !expiryDate) {
        setFormError("Укажите срок действия документа.");
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

      if (template.divisionCode?.pattern && divisionCode && !template.divisionCode.pattern.test(divisionCode)) {
        setFormError(template.divisionCode.hint || "Неверный формат кода подразделения.");
        return;
      }

      const payload: SubmitIndividualBasicRequest = {
        first_name: firstName,
        last_name: lastName,
        middle_name: checked ? null : patronymicValue || null,
        document_name: "Паспорт",
        document_series: passportSeries || "",
        document_number: passportNumber || "",
        document_division_code: divisionCode || null,
        document_issue_date: issueDate || "",
        document_expiry_date: expiryDate ? expiryDate : null,
        document_issuing_authority: documentAuthority,
        citizenship: [citizenship.value],
      };

      setPhysicalPayload(payload);
      setStep(2);
      return;
    }

    const representativeFirstName = formData.get("representative_first_name")?.toString().trim();
    const representativeLastName = formData.get("representative_last_name")?.toString().trim();
    const representativePatronymic = formData.get("representative_patronymic")?.toString().trim();
    const organizationNameRu = formData.get("organization_name_rus")?.toString().trim();
    const organizationShortRu = formData.get("organization_shortname_rus")?.toString().trim();
    const organizationNameForeign = formData.get("organization_name_foreign")?.toString().trim();
    const organizationShortForeign = formData.get("organization_shortname_foreign")?.toString().trim();
    const registrationAuthority = formData.get("registration_authority")?.toString().trim();
    const inn = formData.get("inn")?.toString().trim();
    const kpp = formData.get("kpp")?.toString().trim();
    const ogrn = formData.get("ogrn")?.toString().trim();
    const okpo = formData.get("okpo")?.toString().trim();
    const kio = formData.get("kio")?.toString().trim();
    const tin = formData.get("tin")?.toString().trim();

    if (!organizationNameRu) {
      setFormError("Укажите наименование организации.");
      return;
    }

    if (!registrationCountry) {
      setFormError("Выберите страну регистрации.");
      return;
    }

    const payload: Partial<SubmitLegalPreKycRequest> = {
      organization_name_rus: organizationNameRu,
      registration_country: registrationCountry.value,
      ...(representativeFirstName ? { representative_first_name: representativeFirstName } : {}),
      ...(representativeLastName ? { representative_last_name: representativeLastName } : {}),
      ...(!notPhysicalChecked && representativePatronymic
        ? { representative_patronymic: representativePatronymic }
        : {}),
      ...(organizationShortRu ? { organization_shortname_rus: organizationShortRu } : {}),
      ...(organizationNameForeign ? { organization_name_foreign: organizationNameForeign } : {}),
      ...(organizationShortForeign ? { organization_shortname_foreign: organizationShortForeign } : {}),
      ...(registrationAuthority ? { registration_authority: registrationAuthority } : {}),
      ...(inn ? { inn } : {}),
      ...(kpp ? { kpp } : {}),
      ...(ogrn ? { ogrn } : {}),
      ...(okpo ? { okpo } : {}),
      ...(kio ? { kio } : {}),
      ...(tin ? { tin } : {}),
    };

    setLegalPayload(payload);
    setStep(2);
  };

  const handleStep2Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);

    if (isPhysical) {
      if (!physicalPayload) {
        setFormError("Пожалуйста, завершите заполнение шага 1.");
        setStep(1);
        return;
      }

      if (stockTariffChecked && !stockTariffPlan.trim()) {
        setFormError("Укажите тарифный план для фондового рынка.");
        return;
      }
      if (derivativesTariffChecked && !derivativesTariffPlan.trim()) {
        setFormError("Укажите тарифный план для срочного рынка.");
        return;
      }
      if (fxTariffChecked && !fxTariffPlan.trim()) {
        setFormError("Укажите тарифный план для валютного рынка.");
        return;
      }

      const payload: SubmitIndividualBasicRequest = {
        ...physicalPayload,
        tariff_selection: {
          stock: {
            selected: stockTariffChecked,
            tariff_plan: stockTariffChecked ? stockTariffPlan.trim() || undefined : undefined,
          },
          derivatives: {
            selected: derivativesTariffChecked,
            tariff_plan: derivativesTariffChecked ? derivativesTariffPlan.trim() || undefined : undefined,
          },
          fx: {
            selected: fxTariffChecked,
            tariff_plan: fxTariffChecked ? fxTariffPlan.trim() || undefined : undefined,
          },
        },
      };

      setLoading(true);
      submitIndividualBasicApi(payload).subscribe({
        next: (result) => {
          setLoading(false);
          if (result.success) {
            setStep(3);
            setPhysicalPayload(null);
            setCitizenship(null);
            setCountry(null);
            setStockTariffChecked(false);
            setDerivativesTariffChecked(false);
            setFxTariffChecked(false);
            setStockTariffPlan("");
            setDerivativesTariffPlan("");
            setFxTariffPlan("");
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

    if (!legalPayload) {
      setFormError("Пожалуйста, завершите заполнение шага 1.");
      setStep(1);
      return;
    }

    if (!legalPayload.organization_name_rus || !legalPayload.registration_country) {
      setFormError("Пожалуйста, завершите заполнение шага 1.");
      setStep(1);
      return;
    }

    const legalAddress = formData.get("legal_address")?.toString().trim();
    if (!legalAddress) {
      setFormError("Укажите юридический адрес.");
      return;
    }

    const postalAddressRaw = formData.get("legal_postal_address")?.toString().trim();
    const activityAddress = formData.get("activity_address")?.toString().trim();
    const siteAddress = formData.get("site_address")?.toString().trim();
    const legalEmail = formData.get("legal_email")?.toString().trim();
    const phoneValue = legalPhone.trim();
    const faxValue = legalFax.trim();

    const nextPayload: SubmitLegalPreKycRequest = {
      ...legalPayload,
      organization_name_rus: legalPayload.organization_name_rus,
      registration_country: legalPayload.registration_country,
      legal_address: legalAddress,
    };

    nextPayload.legal_postal_address = legalSame ? legalAddress : postalAddressRaw || undefined;
    nextPayload.activity_address = activityAddress || undefined;
    nextPayload.site_address = siteAddress || undefined;
    nextPayload.legal_email = legalEmail || undefined;
    nextPayload.phone = phoneValue || undefined;
    nextPayload.fax = faxValue || undefined;

    setLegalPayload(nextPayload);
    setLoading(true);
    submitLegalPreKycApi(nextPayload).subscribe({
      next: (result) => {
        setLoading(false);
        if (result.success) {
          const formId = result.data?.form_id;
          if (formId) {
            uploadLegalAttachments(formId);
          }
          setLegalPayload(null);
          setStep(3);
          setLegalPhone("");
          setLegalFax("");
          setRegistrationCountry(null);
          setLegalSame(false);
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

  // === ЭКРАН 3 ===
  if (step === 3) {
    return (
      <div className={s.activateForm__blocks}>
        <div className={s.activateForm__finish}>
          <Image
            aria-hidden
            src="/check.svg"
            alt="File icon"
            width={140}
            height={100}
          />
          <span>Данные отправлены на проверку</span>
          <p>Отследить статус вы можете во вкладке «Документы»</p>
          <a href="/pages/doc" className={s.activateForm__finish__btn}>
            Отследить статус
          </a>
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
          </div>
          <form className={s.activateForm} onSubmit={handleStep2Submit}>
            {isPhysical && (
              <>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Адрес регистрации </label>
                  <input
                    type="text"
                    name="registration_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                    required
                  />

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
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Почтовый адрес  </label>
                  <input
                    type="text"
                    name="physical_postal_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                  />
                </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Налоговый номер  </label>
                <input
                  type="text"
                  name="tax_number"
                  placeholder="Не выбрано"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.tariffBlock}>
                <p className={s.authForm__label}>Выберите рынки и тарифные планы</p>
                <div className={s.tariffItem}>
                  <label className={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={stockTariffChecked}
                      onChange={() => setStockTariffChecked((prev) => !prev)}
                    />
                    <span className={s.checkmark}></span>
                    Фондовый рынок
                  </label>
                  <input
                    type="text"
                    placeholder="Тарифный план"
                    value={stockTariffPlan}
                    onChange={(event) => setStockTariffPlan(event.target.value)}
                    className={s.authForm__input}
                    disabled={!stockTariffChecked}
                  />
                </div>
                <div className={s.tariffItem}>
                  <label className={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={derivativesTariffChecked}
                      onChange={() => setDerivativesTariffChecked((prev) => !prev)}
                    />
                    <span className={s.checkmark}></span>
                    Срочный рынок
                  </label>
                  <input
                    type="text"
                    placeholder="Тарифный план"
                    value={derivativesTariffPlan}
                    onChange={(event) => setDerivativesTariffPlan(event.target.value)}
                    className={s.authForm__input}
                    disabled={!derivativesTariffChecked}
                  />
                </div>
                <div className={s.tariffItem}>
                  <label className={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={fxTariffChecked}
                      onChange={() => setFxTariffChecked((prev) => !prev)}
                    />
                    <span className={s.checkmark}></span>
                    Валютный рынок и рынок драгоценных металлов
                  </label>
                  <input
                    type="text"
                    placeholder="Тарифный план"
                    value={fxTariffPlan}
                    onChange={(event) => setFxTariffPlan(event.target.value)}
                    className={s.authForm__input}
                    disabled={!fxTariffChecked}
                  />
                </div>
              </div>
              </>
            )}
            {!isPhysical && (
              <>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Юридический адрес </label>
                  <input
                    type="text"
                    name="legal_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                    required
                  />
                </div>
                <div className={s.authForm__group__switch}>
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      checked={legalSame}
                      onChange={() => setLegalSame(!legalSame)}
                    />
                    <span className={s.slider}></span>
                  </label>
                  <p> Почтовый адрес совпадает с юридическим адресом</p>
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Почтовый адрес  </label>
                  <input
                    type="text"
                    name="legal_postal_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Телефон</label>
                  <PhoneInput
                    country={"ru"}
                    inputClass={s.phoneInputs}
                    value={legalPhone}
                    onChange={(value: string) => setLegalPhone(value)}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Факс</label>
                  <PhoneInput
                    country={"ru"}
                    inputClass={s.phoneInputs}
                    value={legalFax}
                    onChange={(value: string) => setLegalFax(value)}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>E-mail</label>
                  <input
                    type="text"
                    name="legal_email"
                    placeholder="Например: info@company.ru"
                    className={s.authForm__input}
                  />
                </div>
                <div className={s.authForm__group}>
                  <label className={s.authForm__label}>Адрес деятельности  </label>
                  <input
                    type="text"
                    name="activity_address"
                    placeholder="Не выбрано"
                    className={s.authForm__input}
                  />
                </div>
          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Адрес сайта</label>
            <input
              type="text"
              name="site_address"
              placeholder="Доменное имя"
              className={s.authForm__input}
            />
          </div>
          <div className={s.authForm__group}>
            <UploadPhoto
              label="Фото/сканы документов"
              multiple
              accept="image/png, image/jpeg, image/jpg"
              onFilesSelected={(files) => setLegalPhotos(files)}
            />
          </div>
          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Документы (PDF/DOCX и др.)</label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.gif,.tiff"
              onChange={(e) => handleLegalFiles(e.target.files)}
            />
            {legalFiles.length > 0 && (
              <p className={s.formHint}>Прикреплено файлов: {legalFiles.length}</p>
            )}
          </div>
              </>
            )}
            {formError && <p className={s.formError}>{formError}</p>}
            <div className={s.btnRow}>
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className={s.activateForm__btnPrev}
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={loading}
                className={s.activateForm__btnNext}
              >
                {loading ? "Отправка..." : "Отправить"}
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
          {isPhysical && (
            <PassportUploadTrigger
              onFilesSelected={handlePassportPhotoSelect}
              onUploadResult={handlePassportRecognition}
            />
          )}
        </div>
        <form ref={formRef} className={s.activateForm} onSubmit={handleStep1Submit}>
          <span>Личные данные</span>
          {isPhysical && (
            <>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Имя </label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="Ваше имя"
                  className={s.authForm__input}
                  defaultValue=""
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Фамилия </label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Ваша фамилия"
                  className={s.authForm__input}
                  defaultValue=""
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
                      defaultValue=""
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
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Дата рождения </label>
                <input
                  type="date"
                  name="years"
                  className={s.activateForm__input__date}
                />
              </div>
              <div className={s.mob__block__filter}>
                <label className={s.authForm__label}>Гражданство</label>
                <Select
                  name="citizenship"
                  placeholder="Не выбрано"
                  options={passportCountryOptions}
                  classNamePrefix="custom__select"
                  value={citizenship}
                  onChange={(option: SingleValue<SelectOption>) => setCitizenship(option ?? null)}
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
                <label className={s.authForm__label}>Страна</label>
                <Select
                  name="country"
                  placeholder="Не выбрано"
                  options={passportCountryOptions}
                  classNamePrefix="custom__select"
                  value={country}
                  onChange={(option: SingleValue<SelectOption>) => setCountry(option ?? null)}
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
              <input type="hidden" name="document_name" value="Паспорт" />

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
                    key={`issue-date-${passportFieldsVersion}`}
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
                    key={`expiry-date-${passportFieldsVersion}`}
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
                  name="document_issuing_authority"
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
              <div>
                <UploadPhoto />
              </div>
              <div className={s.authForm__group__info}>Паспорт должен быть без обложки, на нейтральном фоне. Весь разворот должен быть в кадре. Вся информация, включая номер паспорта и вашу фотографию, должна быть хорошо видна.</div>
            </>
          )}
          {!isPhysical && (
            <>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Имя представителя</label>
                <input
                  type="text"
                  name="representative_first_name"
                  placeholder="Ваше имя"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Фамилия представителя</label>
                <input
                  type="text"
                  name="representative_last_name"
                  placeholder="Ваша фамилия"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <div className={s.authForm__group__row}>
                  <div className={s.authForm__group__left}>
                    <label className={s.authForm__label}>Отчество представителя</label>
                    <input
                      type="text"
                      name="representative_patronymic"
                      placeholder="Ваше отчество"
                      className={s.authForm__input}
                    />
                  </div>
                  <div className={s.authForm__group__right}>
                    <label className={s.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={notPhysicalChecked}
                        onChange={() => setNotPhysicalChecked(!notPhysicalChecked)}
                      />
                      <span className={s.checkmark}></span>
                      Отчество отсутствует
                    </label>
                  </div>
                </div>
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Полное наименование организации (рус.)</label>
                <input
                  type="text"
                  name="organization_name_rus"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Сокращенное наименование (рус.)</label>
                <input
                  type="text"
                  name="organization_shortname_rus"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Полное наименование (иностр.)</label>
                <input
                  type="text"
                  name="organization_name_foreign"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>Сокращенное наименование (иностр.)</label>
                <input
                  type="text"
                  name="organization_shortname_foreign"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.mob__block__filter}>
                <label className={s.authForm__label}>Страна регистрации</label>
                <Select
                  name="registration_country"
                  placeholder="Не выбрано"
                  options={passportCountryOptions}
                  classNamePrefix="custom__select"
                  value={registrationCountry}
                  onChange={(option: SingleValue<SelectOption>) => setRegistrationCountry(option ?? null)}
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
                <label className={s.authForm__label}>Орган регистрации</label>
                <input
                  type="text"
                  name="registration_authority"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>ИНН</label>
                <input
                  type="text"
                  name="inn"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>КПП</label>
                <input
                  type="text"
                  name="kpp"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>ОГРН / регистрационный номер</label>
                <input
                  type="text"
                  name="ogrn"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>ОКПО</label>
                <input
                  type="text"
                  name="okpo"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>КИО</label>
                <input
                  type="text"
                  name="kio"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group}>
                <label className={s.authForm__label}>TIN</label>
                <input
                  type="text"
                  name="tin"
                  placeholder="Наименование"
                  className={s.authForm__input}
                />
              </div>
            </>
          )}
          {formError && step === 1 && <p className={s.formError}>{formError}</p>}
          <div className={s.btnRow}>
            <button type="button" onClick={prevStep} disabled className={s.activateForm__btnDisabled}>
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
