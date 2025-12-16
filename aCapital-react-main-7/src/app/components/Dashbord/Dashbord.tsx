"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserBalances } from "@/app/hooks/use-user-balances";
import { CurrentUser, tariffTitles, TariffType } from "@/app/api/user/get-me";
import { user$ } from "@/app/services/user";
import { Loader } from "@/app/components/Loader";
import { openTopUpModal } from "@/app/services/topup_modal";
import BalansTop from "@/app/components/BalansTable/BalansTop";
import s from "./dashbord.module.scss";

const PREFERRED_CURRENCIES = ["KGS", "SOM", "SOMON"];

export default function Dashbord() {
  const { formattedBalances, loading, error } = useUserBalances();
  const [user, setUser] = useState<CurrentUser | null>(() => user$.getValue());
  const router = useRouter();

  useEffect(() => {
    const subscription = user$.subscribe(setUser);
    return () => subscription.unsubscribe();
  }, []);

  const primaryBalance = useMemo(() => {
    if (formattedBalances.length === 0) return null;
    const preferred = formattedBalances.find((balance) => PREFERRED_CURRENCIES.includes(balance.code));
    return preferred ?? formattedBalances[0];
  }, [formattedBalances]);

  const balanceDisplay = useMemo<ReactNode>(() => {
    if (loading) return <Loader size={18} />;
    if (error) return "Ошибка загрузки";
    if (!primaryBalance) return "—";
    return primaryBalance.display;
  }, [primaryBalance, loading, error]);

  const balanceTitle = useMemo(() => {
    if (formattedBalances.length > 0) {
      return formattedBalances.map((balance) => balance.display).join(", ");
    }
    return error || undefined;
  }, [formattedBalances, error]);

  const currentTariffTitle = useMemo(() => {
    const currentTariff = (user?.tariff_type as TariffType | undefined) ?? "default";
    return tariffTitles[currentTariff] ?? tariffTitles.default;
  }, [user?.tariff_type]);

  return (
    <>
      <div className={s.dashbord__top}>
        <div className={s.dashbord__white}>
          <div className={s.dashbord__white__info}>
            <p className={s.dashbord__white__text}>Мой баланс</p>
            <span className={s.dashbord__white__sum} title={balanceTitle}>
              {balanceDisplay}
          </span>
          <button type="button" className={s.dashbord__btn} onClick={() => openTopUpModal()}>
            + Пополнить баланс
          </button>
        </div>
        <div className={s.dashbord__white__image}>
          <Image aria-hidden src="/carts.png" alt="File icon" width={440} height={240} />
        </div>
      </div>
      <div className={s.dashbord__red}>
        <p className={s.dashbord__red__text}>Ваш текущий тариф</p>
        <span className={s.dashbord__red__title}>«{currentTariffTitle}»</span>
        <button
          type="button"
          className={s.dashbord__btn__white}
          onClick={() => router.push("/pages/prekyc")}
        >
          Пройти KYC
        </button>
      </div>
      </div>
      <div
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <BalansTop />
      </div>
    </>
  );
}
