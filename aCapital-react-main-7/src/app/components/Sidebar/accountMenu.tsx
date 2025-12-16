import type { ReactNode } from "react";
import type { CurrentUser } from "@/app/api/user/get-me";

export type AccountMenuItem = {
  href?: string;
  label: string;
  icon?: ReactNode;
  children?: AccountMenuItem[];
};

const baseAccountMenuItems: AccountMenuItem[] = [
  {
    href: "/pages/dashbord",
    label: "Дашборд",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9.00939 0.240258C8.81995 0.238822 8.63568 0.30197 8.48693 0.419295L0.98856 6.251C0.814038 6.38639 0.700405 6.58553 0.672632 6.80466C0.64486 7.02378 0.705219 7.24497 0.840447 7.41962C0.907658 7.50684 0.991491 7.57989 1.0871 7.63452C1.18271 7.68915 1.28819 7.72429 1.39747 7.73791C1.50674 7.75154 1.61762 7.74336 1.72372 7.71387C1.82981 7.68439 1.92901 7.63416 2.01558 7.5661L2.37202 7.28941V16.9232C2.37118 17.1442 2.45816 17.3565 2.61382 17.5134C2.76949 17.6703 2.98109 17.7589 3.2021 17.7598H6.80562V15.9824C6.80562 15.0591 7.54895 14.3158 8.47228 14.3158H9.5286C10.4519 14.3158 11.1953 15.0591 11.1953 15.9824V17.7598H14.7988C15.0198 17.7589 15.2314 17.6703 15.3871 17.5134C15.5427 17.3565 15.6297 17.1442 15.6289 16.9232V7.2829L15.9918 7.5661C16.1663 7.70151 16.3873 7.76214 16.6064 7.73467C16.8256 7.70721 17.0248 7.59389 17.1604 7.41962C17.2957 7.24497 17.356 7.02378 17.3282 6.80466C17.3005 6.58553 17.1868 6.38639 17.0123 6.251L9.51395 0.419295C9.37003 0.30575 9.19269 0.242822 9.00939 0.240258Z"
          fill="#B6B7B7"
        />
      </svg>
    ),
  },
  {
    label: "Онбординг и KYC",
    icon: (
      <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M13.3571 7.33333V4.99998C13.3571 2.26667 10.9286 0 8.00002 0C5.07143 0 2.64286 2.26667 2.64286 5.00002V7.33337C1.42855 7.33337 0.5 8.20002 0.5 9.33337V16C0.5 17.1334 1.42855 18 2.64286 18H13.3571C14.5714 18 15.5 17.1334 15.5 16V9.33333C15.5 8.26667 14.5714 7.33333 13.3571 7.33333ZM8.35714 12.6V14.3334C8.35714 14.5333 8.21429 14.6667 8.00002 14.6667C7.78575 14.6667 7.6429 14.5333 7.6429 14.3334V12.6C7.21432 12.4667 6.92861 12.0666 6.92861 11.6667C6.92861 11.1334 7.42863 10.6667 8.00006 10.6667C8.57148 10.6667 9.0715 11.1333 9.0715 11.6667C9.07143 12.1333 8.78572 12.4667 8.35714 12.6ZM11.2143 7.33333H4.78571V4.99998C4.78571 3.33333 6.21429 2 7.99998 2C9.78568 2 11.2142 3.33333 11.2142 4.99998V7.33333H11.2143Z"
          fill="#B6B7B7"
        />
      </svg>
    ),
    children: [
      { href: "/pages/prekyc", label: "Pre-KYC" },
      { href: "/pages/kyc", label: "KYC" },
      { href: "/pages/doc", label: "Документы" },
    ],
  },
  {
    href: "/pages/balans",
    label: "Баланс",
    icon: (
      <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15.1579 12.5V13.3333C15.1579 14.25 14.4 15 13.4737 15H1.68421C0.749474 15 0 14.25 0 13.3333V1.66667C0 0.75 0.749474 0 1.68421 0H13.4737C14.4 0 15.1579 0.75 15.1579 1.66667V2.5H7.57895C6.64421 2.5 5.89474 3.25 5.89474 4.16667V10.8333C5.89474 11.75 6.64421 12.5 7.57895 12.5H15.1579ZM7.57895 10.8333H16V4.16667H7.57895V10.8333ZM10.9474 8.75C10.2484 8.75 9.68421 8.19167 9.68421 7.5C9.68421 6.80833 10.2484 6.25 10.9474 6.25C11.6463 6.25 12.2105 6.80833 12.2105 7.5C12.2105 8.19167 11.6463 8.75 10.9474 8.75Z"
          fill="#B6B7B7"
        />
      </svg>
    ),
  },
];

const adminMenuItem: AccountMenuItem = {
  label: "Админка",
  icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 0.75L1.5 3.75V8.25C1.5 12.2625 4.335 16.0575 9 17.25C13.665 16.0575 16.5 12.2625 16.5 8.25V3.75L9 0.75Z"
        stroke="#B6B7B7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 8.25L8.25 9.75L11.25 6.75"
        stroke="#B6B7B7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  children: [
    { href: "/pages/admin", label: "Клиенты" },
    { href: "/pages/admin/cards", label: "Заявки" },
    { href: "/pages/admin/prekyc", label: "Pre-KYC заявки" },
    { href: "/pages/admin/kyc", label: "KYC заявки" },
    { href: "/pages/admin/templates", label: "Шаблоны" },
    { href: "/pages/admin/settings", label: "Настройки" },
  ],
};

export const buildAccountMenuItems = (user: CurrentUser | null): AccountMenuItem[] => {
  const items = [...baseAccountMenuItems];
  if (user?.type === "admin") {
    items.push(adminMenuItem);
  }
  return items;
};
