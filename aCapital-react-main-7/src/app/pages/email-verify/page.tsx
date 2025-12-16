"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { verifyEmailApi } from "@/app/api/user/verify-email";
import { parseError } from "@/app/utils/parse-error";
import { getMeApi } from "@/app/api/user/get-me";
import { user$ } from "@/app/services/user";

type Status = "pending" | "success" | "error";

function EmailVerifyContent() {
  const params = useSearchParams();
  const codeId = params.get("code_id");
  const code = params.get("code");
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("Подтверждаем адрес электронной почты...");

  useEffect(() => {
    if (!codeId || !code) {
      setStatus("error");
      setMessage("Некорректная ссылка подтверждения.");
      return;
    }

    const numericCode = Number(code);
    if (!Number.isFinite(numericCode)) {
      setStatus("error");
      setMessage("Некорректный код подтверждения.");
      return;
    }

    const subscription = verifyEmailApi(codeId, numericCode).subscribe({
      next: (result) => {
        if (result.success) {
          setStatus("success");
          setMessage("E-mail успешно подтверждён.");
          getMeApi().subscribe({
            next: (me) => {
              if (me.success && me.data?.user) {
                user$.next(me.data.user);
              }
            },
            error: () => {},
          });
        } else {
          setStatus("error");
          setMessage("Не удалось подтвердить адрес. Попробуйте позже.");
        }
      },
      error: (err: Error) => {
        setStatus("error");
        setMessage(parseError(err));
      },
    });

    return () => subscription.unsubscribe();
  }, [codeId, code]);

  const statusClass =
    status === "success" ? styles.successMessage : status === "error" ? styles.errorMessage : styles.infoMessage;

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main__centered}>
        <div className={styles.verifyCard}>
          <h1 className={styles.page__title}>Подтверждение e-mail</h1>
          <p className={statusClass}>{message}</p>
          {status === "success" && (
            <a className={styles.primaryLink} href="/pages/profile">
              Перейти в профиль
            </a>
          )}
          {status === "error" && (
            <div className={styles.verifyActions}>
              <a className={styles.primaryLink} href="/pages/profile">
                Вернуться в профиль
              </a>
              <a className={styles.secondaryLink} href="/auth">
                Войти
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function EmailVerifyPage() {
  return (
    <Suspense fallback={<div className={styles.main__centered}>Загрузка...</div>}>
      <EmailVerifyContent />
    </Suspense>
  );
}
