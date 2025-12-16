"use client";

import { useEffect, useState } from "react";
import { firstValueFrom } from "rxjs";
import { http, httpWithAuth } from "@/app/api/http";
import s from "./adminSettings.module.scss";

type Contacts = {
  telegram: string;
  whatsapp: string;
};

const DEFAULT_CONTACTS: Contacts = {
  telegram: "https://t.me/asiacapit",
  whatsapp: "https://wa.me/+996222177711",
};

export default function AdminSettings() {
  const [form, setForm] = useState<Contacts>(DEFAULT_CONTACTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await firstValueFrom(http<{ success: boolean; data?: Contacts; error?: string }>("support-contacts"));
        if (res.success && res.data) {
          setForm({ ...DEFAULT_CONTACTS, ...res.data });
        } else {
          setError(res.error || "Не удалось загрузить настройки");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof Contacts, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await firstValueFrom(
        httpWithAuth<{ success: boolean; data?: Contacts; error?: string }>("support-contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      );
      if (res.success && res.data) {
        setForm(res.data);
        setMessage("Сохранено");
      } else {
        setError(res.error || "Не удалось сохранить");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div>
            <h2>Настройки</h2>
            <p className={s.hint}>Контакты из виджета поддержки (Telegram и WhatsApp).</p>
          </div>
          {loading && <span className={s.muted}>Загружаем...</span>}
        </div>

        <form className={s.form} onSubmit={handleSubmit}>
          <label className={s.field}>
            <span>Ссылка на Telegram</span>
            <input
              type="url"
              value={form.telegram}
              onChange={(e) => handleChange("telegram", e.target.value)}
              placeholder="https://t.me/username"
              required
            />
          </label>

          <label className={s.field}>
            <span>Ссылка на WhatsApp</span>
            <input
              type="url"
              value={form.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="https://wa.me/"
              required
            />
          </label>

          <div className={s.actions}>
            <button type="submit" className={s.primary} disabled={saving}>
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
            {message && <span className={s.success}>{message}</span>}
            {error && <span className={s.error}>{error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
