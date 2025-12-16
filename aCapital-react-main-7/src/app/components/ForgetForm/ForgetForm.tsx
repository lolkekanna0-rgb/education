"use client";

import s from './forgetForm.module.scss';
import PhoneInput from "react-phone-input-2";
import { useState } from "react";
import { initiatePasswordResetApi } from '@/app/api/auth/initiate-password-reset';
import { SetNewPasswordData, setNewPasswordData$ } from '@/app/api/auth/set-new-password';
import { useRouter } from 'next/navigation';
import { parseError } from '@/app/utils/parse-error';

export default function ForgetForm() {
  const [phone, setPhone] = useState(""); // добавляем управление состоянием поля
  const [error, setError] = useState("")

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      setError("Введите номер телефона!")
      return
    }

    const phoneNumber = `+${phone}`

    initiatePasswordResetApi(phoneNumber).subscribe({
      next: (result) => {
        if (result.success) {
          const data: SetNewPasswordData = {
            code_id: result.data.code_id,
            phone: phoneNumber
          }
          setNewPasswordData$.next(data)
          router.push("/pages/newpass")
        }
      },
      error: (error: Error) => {
        setError(parseError(error));
      },
    })
  }

  return (
    <div className={s.regForm__blocks}>
      <div className={s.regForm__block}>
        <form onSubmit={handleSubmit} className={s.regForm}>
          <span>Восстановление пароля</span>
          <p>
            Если вы забыли пароль, введите телефон, <br />
            который указывали при регистрации. На него будет отправлен код подтверждения.
          </p>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Введите номер телефона</label>
            <PhoneInput
              country="ru"
              value={phone}
              onChange={setPhone} // теперь поле управляемое
              inputClass={s.phoneInputs}
            />
          </div>

          <button type="submit" className={s.authForm__btn}>
            Отправить
          </button>
          {error && <p className="text-white text-sm mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
