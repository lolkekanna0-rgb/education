"use client";

import { user$ } from "@/app/services/user";
import s from "./profileForm.module.scss";
import { useEffect, useState } from "react";
import { CurrentUser } from "@/app/api/user/get-me";
import GuardLoader from "../Loader/Loader";
import { updateProfileApi } from "@/app/api/profile/update-profile";
import { parseError } from "@/app/utils/parse-error";

export default function ProfileFormData() {
  const [status, setStatus] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [birthDate, setBirthDate] = useState<string>("");

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [patronymic, setPatronymic] = useState<string | null>("")
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const sub = user$.subscribe((user) => {
      if (user?.profile) {
        setFirstName(user.profile.first_name)
        setLastName(user.profile.last_name)
        setPatronymic(user.profile.patronymic)
        if (user.profile.patronymic === null) {
          setChecked(true)
        }
      }
      if (user) {
        setUser(user)
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const handleBirthDateChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    let formatted = "";
    if (day) formatted = day;
    if (month) formatted = `${day}.${month}`;
    if (year) formatted = `${day}.${month}.${year}`;

    setBirthDate(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfileApi({
      first_name: firstName,
      last_name: lastName,
      patronymic: patronymic,
      timezone: "Asia/Tbilisi",
      contact_info: "pass"
    }).subscribe({
      next: (result) => {
        if (result.success) {
          user$.next(result.data.user)
          setStatus("Личные данные успешно сохранены!")
        }
      },
      error: (error: Error) => {
        setStatus(parseError(error))
      }
    })
  };

  if (!user) return (<GuardLoader></GuardLoader>)

  return (
    <div className={s.authForm__blocks}>
      <div className={s.authForm__block}>
        <form onSubmit={handleSubmit} className={s.authForm}>
          <span>Личные данные</span>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Имя</label>
            <input
              type="text"
              name="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={s.authForm__input}
            />
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Фамилия</label>
            <input
              type="text"
              name="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={s.authForm__input}
            />
          </div>

          <div className={s.authForm__group}>
            <div className={s.authForm__group__row}>
              <div className={s.authForm__group__left}>
                <label className={s.authForm__label}>Отчество</label>
                <input
                  type="text"
                  name="patronymic"
                  value={patronymic || ""}
                  onChange={(e) => setPatronymic(e.target.value)}
                  disabled={checked}
                  className={s.authForm__input}
                />
              </div>
              <div className={s.authForm__group__right}>
                <label className={s.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {setChecked(!checked); setPatronymic(checked ? null : "")}}
                  />
                  <span className={s.checkmark}></span>
                  Отчество отсутствует
                </label>
              </div>
            </div>
          </div>

          <div className={s.authForm__group}>
            <label className={s.authForm__label}>Дата рождения</label>
            <input
              type="text"
              placeholder="ДД.ММ.ГГГГ"
              value={birthDate}
              onChange={event => handleBirthDateChange(event.target.value)}
              inputMode="numeric"
              maxLength={10}
              className={s.authForm__input}
            />
          </div>

          <button type="submit" className={s.profile__sm__btn}>
            Сохранить изменения
          </button>

          {status && <p className="text-white text-sm mt-2">{status}</p>}
        </form>
      </div>
    </div>
  );
}
