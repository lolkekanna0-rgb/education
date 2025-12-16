"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/api/http";
import styles from "./supportWidget.module.scss";

type SupportContacts = {
  telegram: string;
  whatsapp: string;
};

const DEFAULT_CONTACTS: SupportContacts = {
  telegram: "https://t.me/asiacapit",
  whatsapp: "https://wa.me/+996222177711",
};

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M21.5 3.5L2.5 11.5L8.5 13.5M21.5 3.5L19.5 20.5L8.5 13.5M21.5 3.5L8.5 13.5M8.5 13.5V19.5L12.3 15.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M4 20L5.2 16.3C3.9 14.8 3 12.85 3 10.75C3 6.5 6.58 3 11 3C15.42 3 19 6.5 19 10.75C19 15 15.42 18.5 11 18.5C10 18.5 9.05 18.3 8.17 17.94L4 20Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.75 8.25C9.85 8.25 9.96 8.25 10.07 8.26C10.21 8.28 10.32 8.42 10.35 8.56C10.44 9 10.65 9.9 10.65 9.9C10.69 10.05 10.64 10.22 10.53 10.32L9.98 10.82C10.41 11.78 11.18 12.6 12.21 13.2L12.67 12.67C12.77 12.56 12.93 12.51 13.08 12.55L14.85 13.05C15.01 13.1 15.12 13.25 15.14 13.41C15.18 13.69 15.21 14.06 15.21 14.5C15.21 14.72 15.03 14.9 14.81 14.9H14.72C13.07 14.78 10.91 13.65 9.5 12.22C8.08 10.78 7.25 9 7.1 7.26C7.08 7.03 7.26 6.83 7.49 6.82C7.83 6.8 8.18 6.78 8.53 6.78C8.8 6.78 9 7 9.05 7.27L9.46 8.98C9.5 9.15 9.63 9.27 9.8 9.28L9.75 8.25Z"
      fill="currentColor"
    />
  </svg>
);

const QuestionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M12 17H12.01M9.09 8.99997C9.32551 8.33114 9.78974 7.76885 10.4 7.40931C11.0103 7.04977 11.7279 6.91478 12.4267 7.02637C13.1255 7.13796 13.7608 7.48911 14.2146 8.01628C14.6685 8.54345 14.9105 9.21147 14.9 9.89997C14.9 12 12.4 12.5 12.4 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<SupportContacts>(DEFAULT_CONTACTS);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_URL}/support-contacts`, { cache: "no-store" });
        const json = (await res.json()) as { success: boolean; data?: SupportContacts };
        if (json.success && json.data) {
          setContacts({ ...DEFAULT_CONTACTS, ...json.data });
        } else {
          setContacts(DEFAULT_CONTACTS);
        }
      } catch {
        setContacts(DEFAULT_CONTACTS);
      }
    };

    fetchContacts().catch(() => setContacts(DEFAULT_CONTACTS));
  }, []);

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.fab}
        aria-label="Открыть поддержку"
        onClick={() => setIsOpen(true)}
      >
        <QuestionIcon />
      </button>
    );
  }

  return (
    <div className={styles.widget} aria-label="Поддержка">
      <div className={styles.header}>
        <span className={styles.title}>Мы на связи</span>
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть поддержку"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>
      </div>
      <div className={styles.links}>
        <a
          className={styles.link}
          href={contacts.telegram}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.icon}><TelegramIcon /></span>
          <span>Telegram</span>
        </a>
        <a
          className={styles.link}
          href={contacts.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.icon}><WhatsAppIcon /></span>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
