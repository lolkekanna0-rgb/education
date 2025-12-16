"use client";

import s from "./regForm.module.scss";
import PhoneInput from "react-phone-input-2";
import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { RegistationData, registrationData$ } from "@/app/api/auth/registration";
import { useRouter } from "next/navigation";
import { parseError } from "@/app/utils/parse-error";
import { validatePassword } from "@/app/utils/validate-password";
import { getRegistrationCodeApi } from "@/app/api/auth/get-registration-code";
import Link from "next/link";

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
}

type Strength = "weak" | "strong";

export default function RegForm() {
  const [form, setForm] = useState<FormData>({ email: "", first_name: "", last_name: "" });
  const [checkedOffer, setCheckedOffer] = useState(false);
  const [checkedData, setCheckedData] = useState(false);
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string>("");

  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!checkedOffer) {
      setStatus("Вы не согласились с условиями оферты!")
      return
    }

    if (!checkedData) {
      setStatus("Вы не дали согласие на обработку персональных данных!")
      return
    }

    if (!validatePassword(password)) {
      setStatus(
        "Пароль должен быть минимум 8 символов, содержать заглавную букву, цифру, спецсимвол и только латиницу!"
      );
      return;
    }

    if (!phone) {
      setStatus("Введите номер телефона!");
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setStatus("Введите имя и фамилию!");
      return;
    }

    if (password !== confirm) {
      setStatus("Пароли не совпадают!")
      return
    }

    const phoneNumber = `+${phone}`

    getRegistrationCodeApi(form.email, phoneNumber).subscribe({
      next: (result) => {
        if (result.success) {
          const data: RegistationData = {
            email: form.email,
            phone: phoneNumber,
            password: password,
            code_id: result.data.code_id,
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
          };
          registrationData$.next(data)
          router.push("/pages/activate")
        }
      },
      error: (error: Error) => {
        setStatus(parseError(error));
      },
    })
  };

  // Простая эвристика силы пароля (можно усложнить)
  const getStrength = (pwd: string): Strength => {
    if (!pwd) return "weak";
    const lengthOk = pwd.length >= 10;        // >=10 считаем сильнее
    const hasLower = /[a-zа-яё]/.test(pwd);
    const hasUpper = /[A-ZА-ЯЁ]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-zА-Яа-яЁё0-9]/.test(pwd);

    const score = [lengthOk, hasLower, hasUpper, hasDigit, hasSpecial].reduce(
      (s, v) => s + (v ? 1 : 0),
      0
    );

    // score 4-5 -> strong, иначе weak
    return score >= 4 ? "strong" : "weak";
  };

  const strength = useMemo(() => getStrength(password), [password]);
  const passwordsMatch = password !== "" && password === confirm;

  // UI state message and color decision
  const statusText = useMemo(() => {
    if (!password && !confirm) return "";
    if (!passwordsMatch) return "Пароли не совпадают";
    return strength === "strong" ? "Пароли надёжные" : "Пароль слабый";
  }, [password, confirm, passwordsMatch, strength]);

  return (
    <div className={s.regForm__blocks}>
      <div className={s.regForm__block}>
        <form onSubmit={handleSubmit} className={s.regForm}>
          <span>Регистрация</span>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Введите номер телефона</label>
            <PhoneInput
              country={"ru"}
              value={phone}
              onChange={(value) => setPhone(value)}
              inputClass={s.phoneInputs}
            />
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Имя</label>
            <input
              type="text"
              name="first_name"
              placeholder="Например: Иван"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className={s.authForm__input}
              required
            />
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Фамилия</label>
            <input
              type="text"
              name="last_name"
              placeholder="Например: Иванов"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className={s.authForm__input}
              required
            />
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>E-mail</label>
            <input
              type="email"
              name="email"
              placeholder="Например: ivan@mail.ru"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={s.authForm__input}
              required
            />
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Придумайте пароль</label>
            <div className={s.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={s.authForm__input}
                aria-invalid={strength === "weak"}
                aria-describedby="pwd-status"
                required
              />
              <button
                type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={s.activateForm__showbtn}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
                {showPassword ? (
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.12719 0L0.96582 1.00917L15.9106 14L17.072 12.9905L2.12719 0Z" fill="#94A3B8" />
                    <path d="M3.41945 3.1418L4.51257 4.09198C3.31595 4.97761 2.36308 6.08001 1.74733 7.04453L1.74545 7.04779C3.46032 9.54008 6.18131 11.8955 9.61554 11.5382C10.5425 11.4417 11.4073 11.1663 12.1974 10.7722L13.304 11.7338C11.7639 12.593 9.99842 13.0481 8.08555 12.8232C4.63632 12.4177 1.81595 9.95861 0.0380859 7.0706C0.872832 5.61063 2.0147 4.21389 3.41945 3.1418ZM5.90568 1.73365C6.87018 1.3601 7.9138 1.1404 9.0283 1.12476C9.09017 1.12443 9.82479 1.15475 10.1578 1.20234C10.3667 1.23233 10.5748 1.26981 10.7799 1.31642C14.0518 2.05733 16.4758 4.46162 17.9998 6.93859C17.3604 8.06087 16.523 9.1561 15.5244 10.0945L14.4643 9.17305C15.2019 8.48201 15.8169 7.71274 16.2905 6.96662C16.2905 6.96662 15.8143 6.30101 15.4531 5.88313C15.221 5.61454 14.9769 5.35377 14.7204 5.10245C14.5179 4.90427 13.7315 4.23116 13.5444 4.091C12.2889 3.15256 10.8148 2.41621 9.04667 2.4286C8.36192 2.43805 7.70343 2.5554 7.0783 2.75293L5.90568 1.73365Z" fill="#94A3B8" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M6.39519 5.72877L7.29481 6.51043C7.23594 6.66591 7.20369 6.83215 7.20369 7.00458C7.20369 7.87555 8.01706 8.58256 9.01906 8.58256C9.21743 8.58256 9.40868 8.55485 9.58755 8.50335L10.4872 9.28533C10.0529 9.4972 9.55193 9.61781 9.01906 9.61781C7.35969 9.61781 6.0127 8.44696 6.0127 7.00458C6.0127 6.54139 6.15182 6.10624 6.39519 5.72877ZM8.96356 4.39201C8.98193 4.39168 9.00068 4.39136 9.01906 4.39136C10.6784 4.39136 12.0254 5.56253 12.0254 7.00458C12.0254 7.02088 12.0254 7.03685 12.025 7.05282L8.96356 4.39201Z" fill="#94A3B8" />
                  </svg>
                ) : (
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.05911 3.33594C10.7185 3.33594 12.0659 4.53194 12.0659 6.00455C12.0659 7.4775 10.7185 8.67317 9.05911 8.67317C7.40011 8.67317 6.05273 7.4775 6.05273 6.00455C6.05273 4.53194 7.40011 3.33594 9.05911 3.33594ZM9.05911 4.67041C9.88898 4.67041 10.5625 5.26825 10.5625 6.00455C10.5625 6.74119 9.88898 7.33903 9.05911 7.33903C8.22961 7.33903 7.55611 6.74119 7.55611 6.00455C7.55611 5.26825 8.22961 4.67041 9.05911 4.67041Z" fill="#94A3B8" />
                    <path d="M0.0383301 7.07034C1.81578 9.95847 4.63615 12.4176 8.08537 12.8231C12.7165 13.3652 16.3247 10.3508 17.9999 6.93833C16.3247 3.52613 12.7169 0.512038 8.08537 1.05389C4.63615 1.45942 1.81578 3.9178 0.0383301 7.07034ZM9.05911 3.33576C10.7185 3.33576 12.0659 4.53143 12.0659 6.00417C12.0659 7.47738 10.7185 8.67304 9.05911 8.67304C7.40011 8.67304 6.05273 7.47738 6.05273 6.00417C6.05273 4.53143 7.40011 3.33576 9.05911 3.33576Z" fill="#94A3B8" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Повторите пароль</label>
            <div className={s.inputWrapper}>
              <input
                type={showConfirm ? "text" : "password"}
                name="confirm"
                placeholder="Введите пароль"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={s.authForm__input}
                aria-invalid={!passwordsMatch || strength === "weak"}
                aria-describedby="pwd-status"
                required
              />
              <button
                type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className={s.activateForm__showbtn}
            >
                {showConfirm ? (
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.12719 0L0.96582 1.00917L15.9106 14L17.072 12.9905L2.12719 0Z" fill="#94A3B8" />
                    <path d="M3.41945 3.1418L4.51257 4.09198C3.31595 4.97761 2.36308 6.08001 1.74733 7.04453L1.74545 7.04779C3.46032 9.54008 6.18131 11.8955 9.61554 11.5382C10.5425 11.4417 11.4073 11.1663 12.1974 10.7722L13.304 11.7338C11.7639 12.593 9.99842 13.0481 8.08555 12.8232C4.63632 12.4177 1.81595 9.95861 0.0380859 7.0706C0.872832 5.61063 2.0147 4.21389 3.41945 3.1418ZM5.90568 1.73365C6.87018 1.3601 7.9138 1.1404 9.0283 1.12476C9.09017 1.12443 9.82479 1.15475 10.1578 1.20234C10.3667 1.23233 10.5748 1.26981 10.7799 1.31642C14.0518 2.05733 16.4758 4.46162 17.9998 6.93859C17.3604 8.06087 16.523 9.1561 15.5244 10.0945L14.4643 9.17305C15.2019 8.48201 15.8169 7.71274 16.2905 6.96662C16.2905 6.96662 15.8143 6.30101 15.4531 5.88313C15.221 5.61454 14.9769 5.35377 14.7204 5.10245C14.5179 4.90427 13.7315 4.23116 13.5444 4.091C12.2889 3.15256 10.8148 2.41621 9.04667 2.4286C8.36192 2.43805 7.70343 2.5554 7.0783 2.75293L5.90568 1.73365Z" fill="#94A3B8" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M6.39519 5.72877L7.29481 6.51043C7.23594 6.66591 7.20369 6.83215 7.20369 7.00458C7.20369 7.87555 8.01706 8.58256 9.01906 8.58256C9.21743 8.58256 9.40868 8.55485 9.58755 8.50335L10.4872 9.28533C10.0529 9.4972 9.55193 9.61781 9.01906 9.61781C7.35969 9.61781 6.0127 8.44696 6.0127 7.00458C6.0127 6.54139 6.15182 6.10624 6.39519 5.72877ZM8.96356 4.39201C8.98193 4.39168 9.00068 4.39136 9.01906 4.39136C10.6784 4.39136 12.0254 5.56253 12.0254 7.00458C12.0254 7.02088 12.0254 7.03685 12.025 7.05282L8.96356 4.39201Z" fill="#94A3B8" />
                  </svg>
                ) : (
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.05911 3.33594C10.7185 3.33594 12.0659 4.53194 12.0659 6.00455C12.0659 7.4775 10.7185 8.67317 9.05911 8.67317C7.40011 8.67317 6.05273 7.4775 6.05273 6.00455C6.05273 4.53194 7.40011 3.33594 9.05911 3.33594ZM9.05911 4.67041C9.88898 4.67041 10.5625 5.26825 10.5625 6.00455C10.5625 6.74119 9.88898 7.33903 9.05911 7.33903C8.22961 7.33903 7.55611 6.74119 7.55611 6.00455C7.55611 5.26825 8.22961 4.67041 9.05911 4.67041Z" fill="#94A3B8" />
                    <path d="M0.0383301 7.07034C1.81578 9.95847 4.63615 12.4176 8.08537 12.8231C12.7165 13.3652 16.3247 10.3508 17.9999 6.93833C16.3247 3.52613 12.7169 0.512038 8.08537 1.05389C4.63615 1.45942 1.81578 3.9178 0.0383301 7.07034ZM9.05911 3.33576C10.7185 3.33576 12.0659 4.53143 12.0659 6.00417C12.0659 7.47738 10.7185 8.67304 9.05911 8.67304C7.40011 8.67304 6.05273 7.47738 6.05273 6.00417C6.05273 4.53143 7.40011 3.33576 9.05911 3.33576Z" fill="#94A3B8" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div id="pwd-status" role="status" aria-live="polite" className={s.pwdStatus}>
            {statusText && (
              <div className={
                statusText === "Пароли надёжные"
                  ? s.statusSuccess
                  : s.statusError
              }>
                {statusText}
              </div>
            )}
          </div>

          <div className={s.authForm__group}>
            <label className={s.checkboxContainer}>
              <input
                type="checkbox"
                checked={checkedOffer}
                onChange={() => setCheckedOffer(!checkedOffer)}
                required
              />
              <span className={s.checkmark}></span>
              Я согласен с условиями{" "}
              <a href="https://asia-capital.kg/personal-data/" target="_blank" rel="noopener noreferrer">
                оферты
              </a>
            </label>
          </div>

          <div className={s.authForm__group}>
            <label className={s.checkboxContainer}>
              <input
                type="checkbox"
                checked={checkedData}
                onChange={() => setCheckedData(!checkedData)}
                required
              />
              <span className={s.checkmark}></span>
              Даю согласие на{" "}
              <a href="https://asia-capital.kg/personal-data/" target="_blank" rel="noopener noreferrer">
                обработку персональных данных
              </a>
            </label>
          </div>

          <button type="submit" className={s.authForm__btn}>
            Зарегистрироваться
          </button>

          {status && <p className="text-white text-sm mt-2">{status}</p>}
        </form>
      </div>

      <p className={s.links__bottom}>
        Уже есть аккаунт? <a href="/auth">Авторизуйтесь</a>
      </p>
    </div>
  );
}
