"use client";

import { useMemo, useState } from "react";
import UploadPhoto from "../PrekycForm/UploadPhoto";
import styles from "./passportUploadTrigger.module.scss";
import { recognizePassportApi, type PassportRecognitionPayload } from "@/app/api/kyc/recognize-passport";
import { parseError } from "@/app/utils/parse-error";

type PassportUploadTriggerProps = {
  onFilesSelected?: (files: File[]) => void;
  onUploadResult?: (data: PassportRecognitionPayload) => void;
  onUploadError?: (message: string) => void;
  title?: string;
  description?: string;
};

const TriggerIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M4 9C4 7.11438 4 6.17157 4.58579 5.58579C5.17157 5 6.11438 5 8 5H9.34315C9.85884 5 10.293 4.66421 10.4472 4.17071L10.5528 3.82929C10.707 3.33579 11.1412 3 11.6569 3H12.3431C12.8588 3 13.293 3.33579 13.4472 3.82929L13.5528 4.17071C13.707 4.66421 14.1412 5 14.6569 5H16C17.8856 5 18.8284 5 19.4142 5.58579C20 6.17157 20 7.11438 20 9V15C20 16.8856 20 17.8284 19.4142 18.4142C18.8284 19 17.8856 19 16 19H8C6.11438 19 5.17157 19 4.58579 18.4142C4 17.8284 4 16.8856 4 15V9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M16.5 9H16.51"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function PassportUploadTrigger({
  onFilesSelected,
  onUploadResult,
  onUploadError,
  title = "Загрузите фото паспорта",
  description = "Фото понадобится для автоматического заполнения полей.",
}: PassportUploadTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const modalTitleId = useMemo(() => `passport-upload-title-${Math.random().toString(36).slice(2, 8)}`, []);

  const handleFilesSelected = (files: File[]) => {
    setHasSelection(Boolean(files.length));
    onFilesSelected?.(files);
    const [file] = files;
    if (!file) return;

    setUploadError("");
    setUploading(true);
    recognizePassportApi(file).subscribe({
      next: (result) => {
        setUploading(false);
        if (result.success && result.data) {
          onUploadResult?.(result.data);
        } else {
          const message = result.error || "Не удалось распознать паспорт.";
          setUploadError(message);
          onUploadError?.(message);
        }
      },
      error: (error: Error) => {
        const message = parseError(error);
        setUploadError(message);
        setUploading(false);
        onUploadError?.(message);
      },
    });
  };

  return (
    <div className={styles.triggerWrapper} data-has-selection={hasSelection}>
      <button
        type="button"
        className={styles.triggerButton}
        aria-label="Загрузить фото паспорта"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <TriggerIcon />
      </button>

      {isOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          onClick={() => setIsOpen(false)}
        >
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p id={modalTitleId} className={styles.modalTitle}>{title}</p>
                <p className={styles.modalSubtitle}>{description}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Закрыть окно загрузки"
                onClick={() => setIsOpen(false)}
              >
                &#10005;
              </button>
            </div>
            <UploadPhoto
              label="Фото паспорта"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onFilesSelected={handleFilesSelected}
            />
            {isUploading && <p className={styles.statusText}>Отправляем и распознаём...</p>}
            {uploadError && <p className={styles.errorText}>{uploadError}</p>}
            <p className={styles.hint}>JPG, PNG или WEBP, до 20 МБ. Можно перетащить в область.</p>
          </div>
        </div>
      )}
    </div>
  );
}
