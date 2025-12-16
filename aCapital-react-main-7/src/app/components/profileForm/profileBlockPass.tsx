"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import s from "./profileForm.module.scss";
import { changePasswordApi } from "@/app/api/user/change-password";
import { parseError } from "@/app/utils/parse-error";

export default function PasswordAndActivation() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"password" | "success">("password");

  // --- Смена пароля ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState("");


  // --- Смена пароля ---
  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("Пароли не совпадают!");
      return;
    }
    
    changePasswordApi(currentPassword, newPassword).subscribe({
      next: (result) => {
        if (result.success) {
          setModalStep('success')
        }
      },
      error: (error: Error) => {
        setStatus(parseError(error))
      }
    })
  };

  return (
    <>
      {/* Кнопка для открытия модалки смены пароля */}
      <div className={s.authForm__blocks}>
        <div className={s.authForm__block}>
          <form className={s.authForm}>
            <span>Пароль</span>
            <button
              type="button"
              onClick={() => { setIsOpen(true); setModalStep("password"); }}
              className={s.profile__sm__btn}
            >
              Изменить пароль
            </button>
          </form>
        </div>
      </div>
      
      {isOpen && (
        <div className={s.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={s.activateForm__block} onClick={(e) => e.stopPropagation()}>
            <div className={s.modal}>
              {modalStep === "password" && (
                <form className={s.activateForm} onSubmit={handlePasswordSubmit}>
                  <span>Смена пароля</span>

                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Текущий пароль</label>
                    <input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Введите текущий пароль"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={s.authForm__input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className={s.activateForm__showbtn}
                    >
                      👁
                    </button>
                  </div>

                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Придумайте новый пароль</label>
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Введите новый пароль"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={s.authForm__input}
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className={s.activateForm__showbtn}>
                      👁
                    </button>
                  </div>

                  <div className={s.authForm__group}>
                    <label className={s.authForm__label}>Повторите пароль</label>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Повторите новый пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={s.authForm__input}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={s.activateForm__showbtn}>
                      👁
                    </button>
                  </div>

                  {status && <p>{status}</p>}

                  <button
                    type="submit"
                    className={`${s.activateForm__btn} ${!currentPassword || !newPassword || !confirmPassword ? s.activateForm__btndis : s.activateForm__btnAct
                      }`}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                  >
                    Продолжить
                  </button>

                </form>
              )}

              {modalStep === "success" && (
                <div className={s.activateForm__sucess}>
                  <Image aria-hidden src="/check.svg" alt="File icon" width={80} height={80} />
                  <span>Пароль успешно изменен!</span>
                  <a className={s.activateForm__btn} onClick={() => setIsOpen(false)}>
                    Закрыть
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
