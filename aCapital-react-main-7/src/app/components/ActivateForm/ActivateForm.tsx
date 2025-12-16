"use client";

import { useState, useEffect } from "react";
import type React from "react";
import type { ChangeEvent } from "react";
import s from "./activateform.module.scss";
import { RegistationData, registrationApi, registrationData$ } from "@/app/api/auth/registration";
import { useRouter } from "next/navigation";
import { parseError } from "@/app/utils/parse-error";
import { getRegistrationCodeApi } from "@/app/api/auth/get-registration-code";
import { formatPhone } from "@/app/utils/format-phone";
import { formatTime } from "@/app/utils/format-time";
import { setAuthToken } from "@/app/services/authorization";
import { user$ } from "@/app/services/user";
import { getMeApi } from "@/app/api/user/get-me";


export default function ActivateForm() {
  const [values, setValues] = useState<string[]>(Array(6).fill("")); // массив для кода
  const [timeLeft, setTimeLeft] = useState<number>(59); // таймер в секундах
  const [expired, setExpired] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const sub = registrationData$.subscribe((data) => {
      if (data) {
        setEmail(data.email)
        setPhone(formatPhone(data.phone))
      } else {
        router.replace("/pages/reg")
      }
    });
    return () => sub.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      setValues(Array(6).fill(""));
      return;
    }

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const enteredCode = values.join("");
    const data = registrationData$.value;
    if (!data) {
      router.push("/pages/reg")
      return
    }

    registrationApi({
      email: data.email,
      phone: data.phone,
      password: data.password,
      code_id: data.code_id,
      code: enteredCode,
      first_name: data.first_name,
      last_name: data.last_name,
    }).subscribe({
      next: (result) => {
        if (result.success) {
          setError("");
          registrationData$.next(null);
          const token = result.data?.token;
          if (token) {
            setAuthToken(token);
            getMeApi().subscribe({
              next: (me) => {
                if (me.success && me.data?.user) {
                  user$.next(me.data.user);
                }
                router.replace("/pages/dashbord");
              },
              error: () => {
                router.replace("/pages/dashbord");
              },
            });
          } else {
            router.replace("/pages/dashbord");
          }
        }
      },
      error: (error: Error) => {
        const message = parseError(error);
        setError(message && message !== "Unknown error" ? message : "Неверный код. Попробуйте снова.");
      },
    });
  };

  const handleChange = (val: string, idx: number) => {
    if (/^[0-9]?$/.test(val)) {
      const newValues = [...values];
      newValues[idx] = val;
      setValues(newValues);

      // автофокус на следующее поле
      if (val && idx < 5) {
        const next = document.getElementById(
          `code-${idx + 1}`
        ) as HTMLInputElement | null;
        next?.focus();
      }
    }
  };

  const isComplete: boolean = values.join("").length === 6;

  const handleResend = () => {

    const data = registrationData$.value
    if (!data) {
      router.push("/pages/reg")
      return
    }

    getRegistrationCodeApi(data.email, data.phone).subscribe({
      next: (result) => {
        if (result.success) {
          const newData: RegistationData = {
            email: data.email,
            phone: data.phone,
            password: data.password,
            code_id: result.data.code_id,
            first_name: data.first_name,
            last_name: data.last_name,
          };
          registrationData$.next(newData)
          setValues(Array(6).fill(""));
          setTimeLeft(59);
          setExpired(false);
          setError("");
        }
      }
    })
  };

  return (
    <div>
      <div className={s.activateForm__block}>
        <form onSubmit={handleSubmit} className={s.activateForm}>
          <span>Активация аккаунта</span>
          <p>
            Для активации аккаунта введите код, который мы <br /> направили вам на
            e-mail {email}
          </p>

          <div className={s.activateForm__input_row}>
            {values.map((v, i) => {
              const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
                handleChange(event.target.value, i);
              };

              return (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={v}
                  onChange={handleInputChange}
                  className={s.activateForm__input}
                />
              );
            })}
          </div>

          {error && <p className={s.activateForm__error}>{error}</p>}

          <button
            type="submit"
            className={`${s.activateForm__btn} ${!isComplete ? s.activateForm__btndis : ""}`}
            disabled={!isComplete}
          >
            Продолжить
          </button>
          {!expired ? (
            <p>
              Код истечёт через {formatTime(timeLeft)}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className={s.activateForm__resetcode}
            >
              Запросить код повторно
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
