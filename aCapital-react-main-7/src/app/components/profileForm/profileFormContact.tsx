"use client";

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import PhoneInput from "react-phone-input-2";
import s from "./profileForm.module.scss";
import { user$ } from "@/app/services/user";
import { initiateEmailVerificationApi } from "@/app/api/user/initiate-email-verification";
import { parseError } from "@/app/utils/parse-error";

export default function ProfileFormContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"phone" | "activation" | "success">("phone");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [emailVerified, setEmailVerified] = useState<boolean>(Boolean(user$.getValue()?.email_is_verified));
  const [emailStatus, setEmailStatus] = useState<string>("");
  const [emailLoading, setEmailLoading] = useState<boolean>(false);

  // --- Активация ---
  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(59);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const subscription = user$.subscribe((user) => {
      if (user?.phone) setPhone(user.phone);
      if (user?.email) setEmail(user.email);
      if (user?.profile?.contact_info && typeof user.profile.contact_info === "string") {
        setCountry(user.profile.contact_info);
      }
      setEmailVerified(Boolean(user?.email_is_verified));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (emailVerified) {
      setEmailStatus("E-mail подтверждён.");
    }
  }, [emailVerified]);

  useEffect(() => {
    if (modalStep !== "activation") return;
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, modalStep]);

  const handlePhoneSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone || !password) {
      alert("Введите телефон и пароль");
      return;
    }
    setModalStep("activation");
    setValues(Array(6).fill(""));
    setIsComplete(false);
    setTimeLeft(59);
    setExpired(false);
    setTimeout(() => {
      const firstInput = document.getElementById("code-0") as HTMLInputElement | null;
      firstInput?.focus();
    }, 0);
  };

  const handleChange = (val: string, idx: number) => {
    if (/^[0-9]?$/.test(val)) {
      const newValues = [...values];
      newValues[idx] = val;
      setValues(newValues);
      setIsComplete(newValues.join("").length === 6);

      if (val && idx < 5) {
        const next = document.getElementById(`code-${idx + 1}`) as HTMLInputElement | null;
        next?.focus();
      }
    }
  };

  const handleActivationSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const enteredCode = values.join("");
    if (enteredCode === "123456") {
      setModalStep("success");
    } else {
      setError("Неверный код");
    }
  };

  const handleResend = () => {
    setValues(Array(6).fill(""));
    setTimeLeft(59);
    setExpired(false);
    setError("");
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSendVerification = () => {
    if (emailLoading) return;
    if (!email) {
      setEmailStatus("Сначала укажите адрес электронной почты в профиле.");
      return;
    }
    setEmailStatus("");
    setEmailLoading(true);
    initiateEmailVerificationApi().subscribe({
      next: (result) => {
        setEmailLoading(false);
        if (result.success) {
          setEmailStatus("Письмо с подтверждением отправлено на вашу почту.");
        } else {
          setEmailStatus("Не удалось отправить письмо. Попробуйте позже.");
        }
      },
      error: (err: Error) => {
        setEmailLoading(false);
        setEmailStatus(parseError(err));
      },
    });
  };

  return (
    <>
      <div className={s.authForm__blocks}>
        <div className={s.authForm__block}>
          <form className={s.authForm}>
            <span>Контакты</span>

            <div className={s.authForm__group}>
              <div className={s.authForm__group__row}>
                <div className={s.authForm__group__left}>
                  <label className={s.authForm__label}>Введите номер телефона</label>
                  <PhoneInput country="ru" value={phone} onChange={setPhone} inputClass={s.phoneInputs} />
                </div>

                <button
                  type="button"
                  onClick={() => { setIsOpen(true); setModalStep("phone"); }}
                  className={s.authForm__group__btn}
                >
                  Изменить
                </button>
              </div>
            </div>

            <div className={s.authForm__group}>
              <label className={s.authForm__label}>E-mail</label>
              <input
                type="text"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={s.authForm__input}
              />
              <div className={s.emailVerificationRow}>
                <span className={emailVerified ? s.emailVerified : s.emailNotVerified}>
                  {emailVerified ? "E-mail подтверждён" : "E-mail не подтверждён"}
                </span>
                {!emailVerified && (
                  <button
                    type="button"
                    className={s.profile__sm__btn}
                    onClick={handleSendVerification}
                    disabled={emailLoading}
                  >
                    {emailLoading ? "Отправляем..." : "Подтвердить e-mail"}
                  </button>
                )}
              </div>
              {emailStatus && <p className={s.emailStatus}>{emailStatus}</p>}
            </div>

            <div className={s.authForm__group}>
              <label className={s.authForm__label}>Страна</label>
              <input
                type="text"
                placeholder="Например: Россия"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={s.authForm__input}
              />
            </div>

            <button type="submit" className={s.profile__sm__btn}>
              Сохранить изменения
            </button>
          </form>
        </div>
      </div>

      {/* Модалка */}
      {isOpen && (
        <div className={s.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={s.activateForm__block} onClick={e => e.stopPropagation()}>
            <div className={s.modal}>
              {/* Смена телефона */}
              {modalStep === "phone" && (
                <form className={s.activateForm} onSubmit={handlePhoneSubmit}>
                  <span>Смена номера телефона</span>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Введите номер телефона</label>
                    <PhoneInput country="ru" value={phone} onChange={setPhone} inputClass={s.phoneInputs} />
                  </div>
                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Введите пароль</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={s.authForm__input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={s.activateForm__showbtn}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className={`${s.activateForm__btn} ${!phone || !password ? s.activateForm__btndis : s.activateForm__btnAct}`}
                    disabled={!phone || !password}
                  >
                    Продолжить
                  </button>
                </form>
              )}

              {/* Активация кода */}
              {modalStep === "activation" && (
                <form className={s.activateForm} onSubmit={handleActivationSubmit}>
                  <span>Введите код подтверждения</span>
                  <div className={s.activateForm__input_row}>
                    {values.map((v, i) => (
                      <input
                        key={i}
                        id={`code-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={v}
                        onChange={(e) => handleChange(e.target.value, i)}
                        className={s.activateForm__input}
                      />
                    ))}
                  </div>
                  {error && <p>{error}</p>}
                  <button
                    type="submit"
                    className={`${s.activateForm__btn} ${!isComplete ? s.activateForm__btndis : s.activateForm__btnAct}`}
                    disabled={!isComplete}
                  >
                    Подтвердить
                  </button>
                  {!expired ? (
                    <p>Код истечёт через {formatTime(timeLeft)}</p>
                  ) : (
                    <button type="button" onClick={handleResend} className={s.activateForm__resetcode}>
                      Запросить код повторно
                    </button>
                  )}
                </form>
              )}

              {modalStep === "success" && (
                <div className={s.activateForm__sucess}>
                  <Image aria-hidden src="/check.svg" alt="File icon" width={80} height={80} />
                  <span>Номер телефона подтвержден!</span>
                  <button className={s.activateForm__btn} onClick={() => setIsOpen(false)}>
                    Закрыть
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
