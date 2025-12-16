"use client";

import s from './callform.module.scss';

import { useState, FormEvent, ChangeEvent } from "react";

interface FormData {
  name: string;
  phone: string;
}

export default function CallForm() {
  const [form, setForm] = useState<FormData>({ name: "", phone: "" });
  const [status, setStatus] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("Отправка...");

    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("✅ Заявка отправлена!");
        setForm({ name: "", phone: "" });
      } else {
        setStatus("❌ Ошибка отправки");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Ошибка сети");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={s.callForm}
    >
      <input
        type="text"
        name="name"
        placeholder="Имя"
        value={form.name}
        onChange={handleChange}
        className={s.callForm__input}
        required
      />
      <input
        type="tel"
        name="phone"
        placeholder="Телефон"
        value={form.phone}
        onChange={handleChange}
        className={s.callForm__input}
        required
      />
      <button
        type="submit"
        className={s.callForm__btn}
      >
        ЗАКАЗАТЬ ЗВОНОК
      </button>
      {status && <p className="text-white text-sm mt-2">{status}</p>}
    </form>
  );
}
