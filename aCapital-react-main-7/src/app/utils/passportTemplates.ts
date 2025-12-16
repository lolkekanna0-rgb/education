export type SelectOption = {
  value: string;
  label: string;
};

export type PassportFieldConfig = {
  label: string;
  placeholder: string;
  required: boolean;
  pattern?: RegExp;
  maxLength?: number;
  inputMode?: "text" | "numeric";
  hint?: string;
};

export type PassportTemplate = {
  code: string;
  name: string;
  series?: PassportFieldConfig;
  number: PassportFieldConfig;
  divisionCode?: PassportFieldConfig;
  issueDateRequired?: boolean;
  expiryDateRequired?: boolean;
  issuingAuthorityLabel?: string;
  issuingAuthorityPlaceholder?: string;
  hints?: string[];
};

const normalizeTemplateKey = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const passportCountryOptions: SelectOption[] = [
  { value: "Armenia", label: "Армения" },
  { value: "Azerbaijan", label: "Азербайджан" },
  { value: "Belarus", label: "Беларусь" },
  { value: "Kazakhstan", label: "Казахстан" },
  { value: "Kyrgyzstan", label: "Кыргызстан" },
  { value: "Moldova", label: "Молдова" },
  { value: "Russia", label: "Россия" },
  { value: "Tajikistan", label: "Таджикистан" },
  { value: "Uzbekistan", label: "Узбекистан" },
];

export const passportTemplates: Record<string, PassportTemplate> = {
  default: {
    code: "default",
    name: "Стандартный паспорт",
    series: {
      label: "Серия",
      placeholder: "0000",
      required: true,
      pattern: /^\d{2,4}$/,
      maxLength: 4,
      inputMode: "numeric",
    },
    number: {
      label: "Номер",
      placeholder: "000000",
      required: true,
      pattern: /^\d{6,10}$/,
      maxLength: 10,
      inputMode: "numeric",
    },
    issueDateRequired: true,
    expiryDateRequired: false,
    issuingAuthorityLabel: "Кем выдан",
    issuingAuthorityPlaceholder: "Введите наименование органа",
  },
  russia: {
    code: "russia",
    name: "Россия",
    series: {
      label: "Серия",
      placeholder: "0000",
      required: true,
      pattern: /^\d{4}$/,
      maxLength: 4,
      inputMode: "numeric",
      hint: "4 цифры без пробелов",
    },
    number: {
      label: "Номер",
      placeholder: "000000",
      required: true,
      pattern: /^\d{6}$/,
      maxLength: 6,
      inputMode: "numeric",
      hint: "6 цифр без пробелов",
    },
    divisionCode: {
      label: "Код подразделения",
      placeholder: "000-000",
      required: true,
      pattern: /^\d{3}-?\d{3}$/,
      maxLength: 7,
      inputMode: "numeric",
      hint: "Формат 000-000",
    },
    issueDateRequired: true,
    expiryDateRequired: false,
    issuingAuthorityLabel: "Кем выдан",
    issuingAuthorityPlaceholder: "Например: ОВД 770-001",
    hints: ["Для РФ серия и номер вводятся раздельно", "Укажите код подразделения из паспорта"],
  },
  kazakhstan: {
    code: "kazakhstan",
    name: "Казахстан",
    number: {
      label: "Номер",
      placeholder: "123456789",
      required: true,
      pattern: /^\d{9}$/,
      maxLength: 9,
      inputMode: "numeric",
      hint: "9 цифр без пробелов",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "МВД РК",
    hints: ["Серия не требуется, только номер удостоверения"],
  },
  kyrgyzstan: {
    code: "kyrgyzstan",
    name: "Кыргызстан",
    number: {
      label: "Номер",
      placeholder: "ID1234567",
      required: true,
      pattern: /^[A-Za-zА-Яа-я0-9]{8,9}$/,
      maxLength: 9,
      inputMode: "text",
      hint: "Буквы и цифры без пробелов",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "Например: ГРС КР",
    hints: ["Укажите номер ID-карты без пробелов"],
  },
  belarus: {
    code: "belarus",
    name: "Беларусь",
    series: {
      label: "Серия",
      placeholder: "AB",
      required: true,
      pattern: /^[A-Za-zА-Яа-я]{2}$/,
      maxLength: 2,
      inputMode: "text",
      hint: "2 буквы",
    },
    number: {
      label: "Номер",
      placeholder: "1234567",
      required: true,
      pattern: /^\d{7}$/,
      maxLength: 7,
      inputMode: "numeric",
      hint: "7 цифр",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Кем выдан",
    issuingAuthorityPlaceholder: "Например: МВД РБ",
  },
  armenia: {
    code: "armenia",
    name: "Армения",
    number: {
      label: "Номер",
      placeholder: "AB1234567",
      required: true,
      pattern: /^[A-Za-z]{2}\d{7}$/,
      maxLength: 9,
      inputMode: "text",
      hint: "2 буквы и 7 цифр",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "Например: Полиция РА",
    hints: ["Номер вводится без пробелов"],
  },
  azerbaijan: {
    code: "azerbaijan",
    name: "Азербайджан",
    number: {
      label: "Номер",
      placeholder: "AZ1234567",
      required: true,
      pattern: /^[A-Za-z]{2}\d{7}$/,
      maxLength: 9,
      inputMode: "text",
      hint: "2 буквы и 7 цифр",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "Например: МВД Азербайджана",
  },
  moldova: {
    code: "moldova",
    name: "Молдова",
    number: {
      label: "Номер",
      placeholder: "A1234567",
      required: true,
      pattern: /^[A-Za-z]\d{7}$/,
      maxLength: 8,
      inputMode: "text",
      hint: "1 буква и 7 цифр",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "Например: АГИС",
  },
  tajikistan: {
    code: "tajikistan",
    name: "Таджикистан",
    number: {
      label: "Номер",
      placeholder: "AC1234567",
      required: true,
      pattern: /^[A-Za-z]{2}\d{7}$/,
      maxLength: 9,
      inputMode: "text",
      hint: "2 буквы и 7 цифр",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "Например: МВД РТ",
  },
  uzbekistan: {
    code: "uzbekistan",
    name: "Узбекистан",
    number: {
      label: "Номер",
      placeholder: "AA1234567",
      required: true,
      pattern: /^[A-Za-z]{2}\d{7}$/,
      maxLength: 9,
      inputMode: "text",
      hint: "2 буквы и 7 цифр",
    },
    issueDateRequired: true,
    expiryDateRequired: true,
    issuingAuthorityLabel: "Орган выдачи",
    issuingAuthorityPlaceholder: "Например: МВД Узбекистана",
  },
};

export const getPassportTemplate = (country?: string | null) => {
  const normalized = normalizeTemplateKey(country);
  return passportTemplates[normalized] ?? passportTemplates.default;
};
