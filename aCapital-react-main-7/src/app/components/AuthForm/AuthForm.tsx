"use client";

import { normalizePhone } from '@/app/utils/normalize-form';
import s from './authform.module.scss';
import { useEffect, useState } from "react";
import { authorizationApi } from '@/app/api/auth/authorization';
import { useRouter } from 'next/navigation'
import { parseError } from '@/app/utils/parse-error';
import { setAuthToken } from '@/app/services/authorization';
import Link from 'next/link';
import { formatTime } from '@/app/utils/format-time';
import { authorization2FaApi } from '@/app/api/auth/two-factor-login';
import { getMeApi } from '@/app/api/user/get-me';
import { user$ } from '@/app/services/user';
import { providerTextMap } from '@/app/utils/providers-map';

type TwoFactorState = {
  need: boolean;
  provider: string;
  code_id: string;
  availableProviders: string[];
};

const initialTwoFactorState: TwoFactorState = {
  need: false,
  provider: "",
  code_id: "",
  availableProviders: [],
};

export default function AuthForm() {

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState<TwoFactorState>(initialTwoFactorState);
  const [status, setStatus] = useState<string>("");

  const [values, setValues] = useState<string[]>(Array(6).fill("")); // массив для кода
  const [timeLeft, setTimeLeft] = useState<number>(59); // таймер в секундах
  const [expired, setExpired] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string>("");
  const [emailInfo, setEmailInfo] = useState<string>("");

  const router = useRouter()

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      setValues(Array(6).fill(""));
      return;
    }

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

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

  const initTwoFactorStep = (provider: string, codeId: string, available?: string[]) => {
    setTwoFactor({
      need: true,
      provider,
      code_id: codeId,
      availableProviders: available ?? [],
    });
    setValues(Array(6).fill(""));
    setTimeLeft(59);
    setExpired(false);
    setCodeError("");
  };

  const completeAuth = (token: string) => {
    setAuthToken(token)
    getMeApi().subscribe({
      next: (result) => {
        if (result.success) {
          user$.next(result.data.user)
          router.push("/pages/profile")
        }
      }
    })
  };

  const handleAuthResponse = (data: { token: string } | { code_id: string; provider: string; available_providers?: string[] }) => {
    if ('token' in data) {
      setTwoFactor(initialTwoFactorState)
      completeAuth(data.token)
      return
    }
    initTwoFactorStep(data.provider, data.code_id, data.available_providers)
  };

  const requestTwoFactorCode = (provider?: string) => {
    const phoneNumber = normalizePhone(phone)

    authorizationApi(phoneNumber, password, provider).subscribe({
      next: (result) => {
        if (result.success) {
          handleAuthResponse(result.data)
        }
      },
      error: (error: Error) => {
        setCodeError(parseError(error));
      },
    })
  };

  const handleResend = () => {
    requestTwoFactorCode(twoFactor.provider || undefined)
  };

  const handleProviderChange = (provider: string) => {
    if (provider === twoFactor.provider) return
    requestTwoFactorCode(provider)
  };

  const handleSendEmailCode = () => {
    if (twoFactor.availableProviders && !twoFactor.availableProviders.includes("email")) return;
    setEmailInfo("");
    requestTwoFactorCode("email");
    setEmailInfo("Код отправлен на e-mail, проверьте почту.");
  };

  const handleTwoFactor = (e: React.FormEvent) => {
    e.preventDefault()

    const enteredCode = values.join("");
    const phoneNumber = normalizePhone(phone)

    authorization2FaApi(phoneNumber, twoFactor.code_id, enteredCode).subscribe({
      next: (result) => {
        if (result.success) {
          completeAuth(result.data.token)
        }
      },
      error: (error: Error) => {
        setCodeError(parseError(error))
      }
    })

  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const phoneNumber = normalizePhone(phone)

    authorizationApi(phoneNumber, password).subscribe({
      next: (result) => {
        if (result.success) {
          setStatus("")
          handleAuthResponse(result.data)
        }
      },
      error: (error: Error) => {
        setStatus(parseError(error));
      },
    })
  };

  if (twoFactor.need) {

    const isComplete: boolean = values.join("").length === 6;
    const providerOptions = (twoFactor.availableProviders.length ? twoFactor.availableProviders : [twoFactor.provider]).filter(
      (providerName): providerName is string => Boolean(providerName),
    );

    return (<div className={s.activateForm__blocks}>
      <div className={s.activateForm__block}>
        <form onSubmit={handleTwoFactor} className={s.activateForm}>
          <span>Двухфакторная аутентификация</span>
          <p>
            Для входа {providerTextMap[twoFactor.provider] || ""}
          </p>
          {providerOptions.length > 1 && (
            <div className={s.activateForm__providers}>
              <p>Получить код через:</p>
              <div className={s.activateForm__providersList}>
                {providerOptions.map(providerName => (
                  <button
                    key={providerName}
                    type="button"
                    className={`${s.activateForm__providerBtn} ${providerName === twoFactor.provider ? s.activateForm__providerBtnActive : ""}`}
                    onClick={() => handleProviderChange(providerName)}
                    disabled={providerName === twoFactor.provider}
                  >
                    {providerTextMap[providerName] || providerName}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {codeError && <p>{codeError}</p>}
          {emailInfo && <p>{emailInfo}</p>}

          <button
            type="submit"
            className={`${s.activateForm__btn} ${!isComplete ? `${s.activateForm__btndis}` : ""}`}
            disabled={!isComplete}
          >
            Продолжить
          </button>

          {!expired ? (
            <p>Запросить повторный код можно через: {formatTime(timeLeft)}</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className={s.activateForm__resetcode}
            >
              Запросить код повторно
            </button>
          )}
          <button
            type="button"
            className={s.activateForm__resetcode}
            onClick={handleSendEmailCode}
            disabled={twoFactor.availableProviders && !twoFactor.availableProviders.includes("email")}
          >
            Получить код на email
          </button>
        </form>
      </div>
    </div>
    );
  }

  return (
    <div className={s.authForm__blocks}>
      <div className={s.authForm__block}>
        <form
          onSubmit={handleSubmit}
          className={s.authForm}
        >
          <span>Авторизация</span>
          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Логин</label>
            <input
              type="text"
              name="name"
              placeholder="Телефон "
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={s.authForm__input}
              required
            />
          </div>
          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Пароль </label>
            <input
              type={showPassword ? "text" : "password"}
              name="passowrd"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={s.authForm__input}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={s.activateForm__showbtn}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? (
                <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.19213 7.62678e-05C13.1574 0.0500067 16.4105 3.2146 18.0399 5.93747C18.0399 5.93747 17.4665 6.97902 16.9288 7.64576C16.6685 7.96831 16.3948 8.28254 16.1071 8.58645C15.902 8.80281 15.6901 9.01352 15.4704 9.21823C13.5065 11.049 10.6861 12.4148 7.70788 11.8845C4.39925 11.2953 1.70038 8.77884 0.078125 6.07228C0.078125 6.07228 0.654125 5.02973 1.19488 4.364C1.43713 4.06541 1.69138 3.77482 1.95763 3.49288C2.16163 3.27684 2.37313 3.06614 2.59175 2.86142C4.32687 1.23835 6.55325 -0.0112413 9.19213 7.62678e-05ZM9.17825 1.33155C6.9695 1.32423 5.13275 2.41904 3.67963 3.77814C3.482 3.96289 3.2915 4.15329 3.107 4.34835C2.86437 4.60533 2.63263 4.87062 2.41175 5.14258C2.19088 5.4142 1.96438 5.75705 1.78475 6.04832C3.215 8.18168 5.36187 10.1087 8.003 10.579C10.4641 11.0174 12.761 9.81307 14.384 8.30018C14.5824 8.11543 14.774 7.9247 14.9592 7.72931C15.2217 7.45203 15.4715 7.16543 15.7089 6.87084C15.9286 6.59822 16.1547 6.25469 16.334 5.9631C14.8497 3.75784 12.3103 1.37483 9.17825 1.33155Z" fill="#94A3B8" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.05911 3.33594C10.7185 3.33594 12.0659 4.53194 12.0659 6.00455C12.0659 7.4775 10.7185 8.67317 9.05911 8.67317C7.40011 8.67317 6.05273 7.4775 6.05273 6.00455C6.05273 4.53194 7.40011 3.33594 9.05911 3.33594ZM9.05911 4.67041C9.88898 4.67041 10.5625 5.26825 10.5625 6.00455C10.5625 6.74119 9.88898 7.33903 9.05911 7.33903C8.22961 7.33903 7.55611 6.74119 7.55611 6.00455C7.55611 5.26825 8.22961 4.67041 9.05911 4.67041Z" fill="#94A3B8" />
                </svg>
              ) : (
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2.12719 0L0.96582 1.00917L15.9106 14L17.072 12.9905L2.12719 0Z" fill="#94A3B8" />
                  <path d="M3.41945 3.1418L4.51257 4.09198C3.31595 4.97761 2.36308 6.08001 1.74733 7.04453L1.74545 7.04779C3.46032 9.54008 6.18131 11.8955 9.61554 11.5382C10.5425 11.4417 11.4073 11.1663 12.1974 10.7722L13.304 11.7338C11.7639 12.593 9.99842 13.0481 8.08555 12.8232C4.63632 12.4177 1.81595 9.95861 0.0380859 7.0706C0.872832 5.61063 2.0147 4.21389 3.41945 3.1418ZM5.90568 1.73365C6.87018 1.3601 7.9138 1.1404 9.0283 1.12476C9.09017 1.12443 9.82479 1.15475 10.1578 1.20234C10.3667 1.23233 10.5748 1.26981 10.7799 1.31642C14.0518 2.05733 16.4758 4.46162 17.9998 6.93859C17.3604 8.06087 16.523 9.1561 15.5244 10.0945L14.4643 9.17305C15.2019 8.48201 15.8169 7.71274 16.2905 6.96662C16.2905 6.96662 15.8143 6.30101 15.4531 5.88313C15.221 5.61454 14.9769 5.35377 14.7204 5.10245C14.5179 4.90427 13.7315 4.23116 13.5444 4.091C12.2889 3.15256 10.8148 2.41621 9.04667 2.4286C8.36192 2.43805 7.70343 2.5554 7.0783 2.75293L5.90568 1.73365Z" fill="#94A3B8" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.39519 5.72877L7.29481 6.51043C7.23594 6.66591 7.20369 6.83215 7.20369 7.00458C7.20369 7.87555 8.01706 8.58256 9.01906 8.58256C9.21743 8.58256 9.40868 8.55485 9.58755 8.50335L10.4872 9.28533C10.0529 9.4972 9.55193 9.61781 9.01906 9.61781C7.35969 9.61781 6.0127 8.44696 6.0127 7.00458C6.0127 6.54139 6.15182 6.10624 6.39519 5.72877ZM8.96356 4.39201C8.98193 4.39168 9.00068 4.39136 9.01906 4.39136C10.6784 4.39136 12.0254 5.56253 12.0254 7.00458C12.0254 7.02088 12.0254 7.03685 12.025 7.05282L8.96356 4.39201Z" fill="#94A3B8" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className={s.authForm__btn}
          >
            Войти
          </button>
          {status && <p className="text-white text-sm mt-2">{status}</p>}
          <Link className={s.forgetpassw__links} href="/pages/forget">Не помню свой пароль</Link>
        </form>
      </div>
      <p className={s.links__bottom}>
        Еще нет аккаунта? <Link href="/pages/reg">Зарегистрируйтесь</Link>
      </p>
    </div>
  );
}
