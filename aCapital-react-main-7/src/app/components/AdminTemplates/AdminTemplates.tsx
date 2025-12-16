"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./adminTemplates.module.scss";
import { adminTemplateListApi } from "@/app/api/admin/templates/list";
import { adminTemplateUploadApi } from "@/app/api/admin/templates/upload";
import { adminTemplateDeleteApi } from "@/app/api/admin/templates/delete";
import { adminTemplateUpdateApi } from "@/app/api/admin/templates/update";
import { API_URL } from "@/app/api/http";
import { authToken$ } from "@/app/services/authorization";
import { parseError } from "@/app/utils/parse-error";

type TemplateItem = {
  id: number;
  name: string;
  type: "prekyc" | "kyc";
  updated_at?: string;
  isSaving?: boolean;
  downloadUrl: string;
};

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const uploadType: "prekyc" | "kyc" = "prekyc";

  useEffect(() => {
    const sub = adminTemplateListApi().subscribe({
      next: (result) => {
        if (result.success && result.data?.items) {
          setTemplates(
            result.data.items.map((item) => ({
              id: item.id,
              name: item.name,
              type: item.type,
              updated_at: item.updated_at,
              downloadUrl: `/admin/templates/${item.id}/download`,
            })),
          );
        }
      },
      error: (err: Error) => setError(parseError(err)),
    });
    return () => sub.unsubscribe();
  }, []);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    setFileName(file.name);
    setError("");
    adminTemplateUploadApi(file, uploadType, file.name).subscribe({
      next: (result) => {
        if (result.success) {
          // reload list
          adminTemplateListApi().subscribe({
            next: (list) => {
              if (list.success && list.data?.items) {
                setTemplates(
                  list.data.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    updated_at: item.updated_at,
                    downloadUrl: `/admin/templates/${item.id}/download`,
                  })),
                );
              }
            },
          });
        }
      },
      error: (err: Error) => setError(parseError(err)),
    });
  };

  const handleUpdateType = (id: number, newType: "prekyc" | "kyc") => {
    const current = templates.find((tpl) => tpl.id === id);
    if (current?.type === newType) return;
    setError("");
    setTemplates((prev) => prev.map((tpl) => (tpl.id === id ? { ...tpl, type: newType, isSaving: true } : tpl)));
    adminTemplateUpdateApi(id, { type: newType }).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          setTemplates((prev) =>
            prev.map((tpl) => (tpl.id === id ? { ...tpl, ...result.data, isSaving: false } : tpl)),
          );
        } else {
          setTemplates((prev) => prev.map((tpl) => (tpl.id === id ? { ...tpl, isSaving: false } : tpl)));
          setError(result.message || "Не удалось обновить шаблон");
        }
      },
      error: (err: Error) => {
        setTemplates((prev) => prev.map((tpl) => (tpl.id === id ? { ...tpl, isSaving: false } : tpl)));
        setError(parseError(err));
      },
    });
  };

  const handleDelete = (id: number) => {
    setError("");
    adminTemplateDeleteApi(id).subscribe({
      next: (result) => {
        if (result.success) {
          setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
        }
      },
      error: (err: Error) => setError(parseError(err)),
    });
  };

  const handleOpen = async (tpl: TemplateItem) => {
    setError("");
    const token = authToken$.getValue();
    try {
      const res = await fetch(`${API_URL}/admin/templates/${tpl.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = tpl.name;
      anchor.style.display = "none";
      
      // Проверяем, что document.body существует
      if (!document.body) {
        URL.revokeObjectURL(url);
        throw new Error("Document body not available");
      }
      
      document.body.appendChild(anchor);
      
      // Используем requestAnimationFrame для гарантии, что элемент добавлен
      requestAnimationFrame(() => {
        anchor.click();
        
        // Удаляем элемент асинхронно после клика
        setTimeout(() => {
          try {
            // Проверяем, что элемент все еще существует и находится в DOM
            if (anchor && anchor.parentNode && anchor.parentNode === document.body) {
              document.body.removeChild(anchor);
            } else if (anchor && anchor.parentNode) {
              anchor.remove();
            }
          } catch (error) {
            // Игнорируем ошибки при удалении элемента
            console.warn("Failed to remove download anchor:", error);
          } finally {
            URL.revokeObjectURL(url);
          }
        }, 200);
      });
    } catch (err) {
      setError(parseError(err as Error));
    }
  };

  const infoText = useMemo(() => {
    if (!fileName) return "";
    return `Файл выбран: ${fileName}`;
  }, [fileName]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2>Шаблоны документов</h2>
          <p>Загрузите новый шаблон или выберите существующий для просмотра.</p>
        </div>
        <label className={styles.uploadBtn}>
          Загрузить шаблон
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} />
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {infoText && <div className={styles.info}>{infoText}</div>}

      <div className={styles.grid}>
        {templates.map((tpl) => (
          <div key={tpl.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.dot} />
            <p className={styles.title}>{tpl.name}</p>
          </div>
          <p className={styles.meta}>Тип: {tpl.type === "prekyc" ? "Pre-KYC" : "KYC"}</p>
          <p className={styles.meta}>Обновлен: {tpl.updated_at || "—"}</p>
          <div className={styles.typeButtons}>
            <button
              type="button"
              className={`${styles.typeButton} ${tpl.type === "kyc" ? styles.typeButtonActive : ""}`}
              onClick={() => handleUpdateType(tpl.id, "kyc")}
              disabled={tpl.isSaving}
            >
              KYC
            </button>
            <button
              type="button"
              className={`${styles.typeButton} ${tpl.type === "prekyc" ? styles.typeButtonActive : ""}`}
              onClick={() => handleUpdateType(tpl.id, "prekyc")}
              disabled={tpl.isSaving}
            >
              Pre-KYC
            </button>
          </div>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={() => handleOpen(tpl)} disabled={!tpl.downloadUrl}>
              Открыть
            </button>
            <button className={styles.secondary} onClick={() => handleDelete(tpl.id)}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
