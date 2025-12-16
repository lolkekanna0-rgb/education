"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import s from "./documentsList.module.scss";
import { listDocumentsApi, DocumentItemDto } from "@/app/api/documents/list";
import { initiateDocumentSignApi } from "@/app/api/documents/initiate-sign";
import { signDocumentApi } from "@/app/api/documents/sign";
import { Loader } from "@/app/components/Loader";
import { parseError } from "@/app/utils/parse-error";
import { authToken$ } from "@/app/services/authorization";
import { API_URL } from "@/app/api/http";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeStyle: "short",
});

type DownloadState = {
  id: string | null;
  error: string;
};

type SignState = {
  open: boolean;
  document: DocumentItemDto | null;
  queue: DocumentItemDto[];
  code: string[];
  codeId: string;
  error: string;
  loading: boolean;
  timeLeft: number;
  expired: boolean;
};

const formatSeconds = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const DocumentsList = () => {
  const [documents, setDocuments] = useState<DocumentItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadState, setDownloadState] = useState<DownloadState>({ id: null, error: "" });
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [signState, setSignState] = useState<SignState>({
    open: false,
    document: null,
    queue: [],
    code: Array(6).fill(""),
    codeId: "",
    error: "",
    loading: false,
    timeLeft: 60,
    expired: false,
  });
  const signCodeInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const focusSignInput = (index: number) => {
    const el = signCodeInputsRef.current[index];
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  useEffect(() => {
    if (!signState.open) return;
    if (signState.timeLeft <= 0) {
      setSignState(prev => ({ ...prev, expired: true }));
      return;
    }
    const timer = setTimeout(() => {
      setSignState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [signState.open, signState.timeLeft]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const subscription = listDocumentsApi().subscribe({
      next: (result) => {
          setLoading(false);
          if (result.success) {
            setDocuments(result.data?.documents ?? []);
            setDownloadState({ id: null, error: "" });
          } else {
            setError("Не удалось получить список документов.");
          }
      },
      error: (err: Error) => {
        setLoading(false);
        setError(parseError(err));
      },
    });

    return () => subscription.unsubscribe();
  }, [refreshCounter]);

  const handleDownload = async (doc: DocumentItemDto) => {
    const token = authToken$.getValue();
    if (!token) {
      setDownloadState({ id: null, error: "Сессия истекла. Авторизуйтесь снова." });
      return;
    }

    try {
      setDownloadState({ id: doc.id, error: "" });
      const response = await fetch(`${API_URL}/user/documents/${doc.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement("a");
      link.href = url;
      link.download = doc.name || `document-${doc.id}.docx`;
      link.style.display = "none";
      
      // Проверяем, что document.body существует
      if (!globalThis.document.body) {
        URL.revokeObjectURL(url);
        throw new Error("Document body not available");
      }
      
      globalThis.document.body.appendChild(link);
      
      // Используем requestAnimationFrame для гарантии, что элемент добавлен
      requestAnimationFrame(() => {
        link.click();
        
        // Удаляем элемент асинхронно после клика
        setTimeout(() => {
          try {
            // Проверяем, что элемент все еще существует и находится в DOM
            if (link && link.parentNode && link.parentNode === globalThis.document.body) {
              globalThis.document.body.removeChild(link);
            } else if (link && link.parentNode) {
              link.remove();
            }
          } catch (error) {
            // Игнорируем ошибки при удалении элемента
            console.warn("Failed to remove download link:", error);
          } finally {
            URL.revokeObjectURL(url);
          }
        }, 200);
      });
      setDownloadState({ id: null, error: "" });
    } catch (error) {
      const message = error instanceof Error ? parseError(error) : "Не удалось скачать документ.";
      setDownloadState({ id: null, error: message });
    }
  };

  const startSigning = (doc: DocumentItemDto, queue: DocumentItemDto[]) => {
    setSignState({
      open: true,
      document: doc,
      queue,
      code: Array(6).fill(""),
      codeId: "",
      error: "",
      loading: true,
      timeLeft: 60,
      expired: false,
    });
    initiateDocumentSignApi(doc.id).subscribe({
      next: (result) => {
        if (result.success) {
          setSignState(prev => ({
            ...prev,
            loading: false,
            codeId: result.data.code_id,
            timeLeft: 60,
            expired: false,
          }));
        } else {
          setSignState(prev => ({ ...prev, loading: false, error: "Не удалось отправить код." }));
        }
      },
      error: (err: Error) => {
        setSignState(prev => ({ ...prev, loading: false, error: parseError(err) }));
      },
    });
  };

  const openSignModal = (doc: DocumentItemDto) => startSigning(doc, []);

  const openSignAll = (pending: DocumentItemDto[]) => {
    if (pending.length === 0) return;
    const [first, ...rest] = pending;
    startSigning(first, rest);
  };

  const closeSignModal = () => {
    setSignState({
      open: false,
      document: null,
      queue: [],
      code: Array(6).fill(""),
      codeId: "",
      error: "",
      loading: false,
      timeLeft: 60,
      expired: false,
    });
  };

  const handleSignCodeChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, "");
    setSignState(prev => {
      const nextCode = [...prev.code];
      let cursor = index;

      if (digits.length === 0) {
        nextCode[cursor] = "";
        return { ...prev, code: nextCode, error: "" };
      }

      for (const digit of digits) {
        if (cursor >= nextCode.length) break;
        nextCode[cursor] = digit;
        cursor += 1;
      }

      // перейти на следующую ячейку после обновления стейта
      const nextIndex = cursor < nextCode.length ? cursor : nextCode.length - 1;
      setTimeout(() => {
        if (digits.length && nextIndex < nextCode.length) {
          focusSignInput(nextIndex);
        }
      }, 0);

      return { ...prev, code: nextCode, error: "" };
    });
  };

  const handleSignCodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && signState.code[index] === "") {
      const prevIndex = Math.max(0, index - 1);
      focusSignInput(prevIndex);
    }
  };

  const handleSignCodePaste = (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text");
    handleSignCodeChange(text, index);
  };

  const handleResendCode = () => {
    if (!signState.document) return;
    setSignState(prev => ({ ...prev, loading: true, error: "", timeLeft: 60, expired: false }));
    initiateDocumentSignApi(signState.document.id).subscribe({
      next: (result) => {
        if (result.success) {
          setSignState(prev => ({
            ...prev,
            loading: false,
            codeId: result.data.code_id,
            code: Array(6).fill(""),
          }));
        } else {
          setSignState(prev => ({ ...prev, loading: false, error: "Не удалось отправить код." }));
        }
      },
      error: (err: Error) => {
        setSignState(prev => ({ ...prev, loading: false, error: parseError(err) }));
      },
    });
  };

  const handleSignSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!signState.document) return;
    const code = signState.code.join("");
    if (code.length !== 6) {
      setSignState(prev => ({ ...prev, error: "Введите 6-значный код." }));
      return;
    }
    setSignState(prev => ({ ...prev, loading: true, error: "" }));
    signDocumentApi(signState.document!.id, signState.codeId, code).subscribe({
      next: (result) => {
        setSignState(prev => ({ ...prev, loading: false }));
        if (result.success) {
          if (signState.queue.length > 0) {
            // переход к следующему документу из очереди
            const [nextDoc, ...rest] = signState.queue;
            setRefreshCounter(prev => prev + 1);
            startSigning(nextDoc, rest);
          } else {
            closeSignModal();
            setRefreshCounter(prev => prev + 1);
          }
        } else {
          setSignState(prev => ({ ...prev, error: "Не удалось подтвердить код." }));
        }
      },
      error: (err: Error) => {
        setSignState(prev => ({ ...prev, loading: false, error: parseError(err) }));
      },
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={s.loaderRow}>
          <Loader size={20} />
        </div>
      );
    }

    if (error) {
      return <p className={s.error}>{error}</p>;
    }

    if (documents.length === 0) {
      return <p className={s.empty}>Документы ещё не сформированы.</p>;
    }

    const pending = documents.filter((doc) => !doc.signed_at);
    const signed = documents.filter((doc) => !!doc.signed_at);

    const renderBlock = (items: DocumentItemDto[], title: string) => (
      <div className={s.block}>
        <div className={s.blockHeader}>
          <h3>{title}</h3>
        </div>
        {items.length === 0 ? (
          <p className={s.empty}>Нет документов в этом разделе.</p>
        ) : (
          <div className={s.list}>
            {items.map((doc) => {
              const createdAt = doc.created_at ? dateFormatter.format(new Date(doc.created_at)) : "—";
              const isDownloading = downloadState.id === doc.id;
              const isSigned = Boolean(doc.signed_at);
              return (
                <div key={doc.id} className={s.item}>
              <div className={s.icon}>
                <Image aria-hidden src="/pdf.png" alt="Документ" width={48} height={48} />
              </div>
              <div className={s.info}>
                <p className={s.name}>{doc.name}</p>
                <p className={s.date}>От {createdAt}</p>
                {isSigned ? <span className={s.statusSigned}>Подписан</span> : <span className={s.statusPending}>Не подписан</span>}
              </div>
              <button
                type="button"
                className={s.downloadBtn}
                onClick={() => handleDownload(doc)}
                disabled={isDownloading}
              >
                {isDownloading ? "Загрузка…" : "Скачать"}
              </button>
              {!isSigned && (
                <button type="button" className={s.signBtn} onClick={() => openSignModal(doc)}>
                  Подписать
                </button>
              )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    );

    return (
      <>
        {renderBlock(pending, "Требуют подписи")}
        {renderBlock(signed, "Подписанные документы")}
      </>
    );
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2 className={s.title}>Документы</h2>
        <div className={s.headerActions}>
          <button type="button" className={s.refreshBtn} onClick={() => setRefreshCounter((prev) => prev + 1)} disabled={loading}>
            Обновить
          </button>
          <button
            type="button"
            className={s.signAllBtn}
            onClick={() => openSignAll(documents.filter((d) => !d.signed_at))}
            disabled={loading || documents.filter((d) => !d.signed_at).length === 0}
          >
            Подписать все
          </button>
        </div>
      </div>
      {renderContent()}
      {downloadState.error && <p className={s.error}>{downloadState.error}</p>}
      {signState.open && (
        <div className={s.modalOverlay} onClick={closeSignModal} role="presentation">
          <div className={s.modal} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={s.activateFormClose} onClick={closeSignModal} aria-label="Закрыть">
              ×
            </button>
            <form className={s.activateForm} onSubmit={handleSignSubmit}>
              <span>Подтверждение подписи</span>
              <p>
                Мы отправили код. Введите его, чтобы подписать документ.
              </p>
              <div className={s.activateForm__input_row}>
                {signState.code.map((value, index) => (
                  <input
                    key={index}
                    id={`sign-code-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleSignCodeChange(e.target.value, index)}
                    onKeyDown={(e) => handleSignCodeKeyDown(e, index)}
                    onPaste={(e) => handleSignCodePaste(e, index)}
                    ref={(el) => {
                      signCodeInputsRef.current[index] = el;
                    }}
                    className={s.activateForm__input}
                    disabled={signState.loading}
                  />
                ))}
              </div>
              {signState.error && <p className={s.error}>{signState.error}</p>}
              <div className={s.modalActions}>
                {!signState.expired ? (
                  <p className={s.modalTimer}>Код истечёт через {formatSeconds(signState.timeLeft)}</p>
                ) : (
                  <button type="button" className={s.refreshBtn} onClick={handleResendCode} disabled={signState.loading}>
                    Запросить код повторно
                  </button>
                )}
                <button type="submit" className={s.downloadBtn} disabled={signState.loading}>
                  {signState.loading ? "Подтверждаем…" : "Подписать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
