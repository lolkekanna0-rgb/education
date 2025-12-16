"use client";

import { useEffect, useMemo, useState } from "react";
import { initiateTwoFactorDisableApi } from "@/app/api/user/initiate-two-factor-disable";
import s from "./profileForm.module.scss";
import { user$ } from "@/app/services/user";
import { CurrentUser } from "@/app/api/user/get-me";
import { parseError } from "@/app/utils/parse-error";
import { providerTextMap } from "@/app/utils/providers-map";
import { formatTime } from "@/app/utils/format-time";
import { twoFactorDisableApi } from "@/app/api/user/disable-two-factor";
import { setTwoFactorProviderApi } from "@/app/api/user/set-two-factor-provider";
import { initiateEmailVerificationApi } from "@/app/api/user/initiate-email-verification";

const pickDefaultProvider = (user: CurrentUser | null): string | null => {
    const available = user?.available_two_factor_providers ?? [];
    if (available.includes("email")) return "email";
    if (available.includes("sms")) return "sms";
    if (available.length > 0) return available[0];
    return null;
};


export default function ProfileBlockSafety() {

    const [error, setError] = useState("")
    const [enabled, setEnabled] = useState(false);
    const [provider, setProvider] = useState<string | null>(null);
    const [settedProvider, setSettedProvider] = useState<string | null>(null);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [emailConfirming, setEmailConfirming] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [codeId, setCodeId] = useState("");

    const [values, setValues] = useState<string[]>(Array(6).fill("")); // массив для кода
    const [timeLeft, setTimeLeft] = useState<number>(59); // таймер в секундах
    const [expired, setExpired] = useState<boolean>(false);
    const [codeError, setCodeError] = useState<string>("");

    useEffect(() => {
        if (timeLeft <= 0) {
            setExpired(true);
            setValues(Array(6).fill(""));
            return;
        }

        const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    useEffect(() => {
        const sub = user$.subscribe((user) => {
            const defaultProvider = pickDefaultProvider(user);
            if (user?.current_two_factor_provider) {
                setProvider(user.current_two_factor_provider);
                setSettedProvider(user.current_two_factor_provider);
                setEnabled(true);
            } else if (defaultProvider) {
                setProvider(defaultProvider);
            }
            if (user) {
                setUser(user);
            }
        });
        return () => sub.unsubscribe();
    }, []);

    const providers = useMemo(() => {
        const available = user?.available_two_factor_providers ?? [];
        return [
            { key: "sms", label: "SMS", isVerified: available.includes("sms") },
            { key: "email", label: "E-mail", isVerified: available.includes("email") },
            { key: "telegram", label: "Telegram", isVerified: available.includes("telegram") },
        ] as const;
    }, [user]);

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

    const handleResend = () => {
        initiateTwoFactorDisableApi().subscribe({
            next: (result) => {
                if (result.success) {
                    setCodeId(result.data.code_id)
                    setValues(Array(6).fill(""));
                    setTimeLeft(59);
                    setExpired(false);
                    setCodeError("");
                    setIsOpen(true);
                }
            },
            error: (error: Error) => {
                setIsOpen(false)
                setError(parseError(error))
            }
        })
    };

    const handleTwoFactorSwitch = (enabled: boolean) => {
        setError("")
        if (enabled) {
            if (!provider) {
                setProvider(pickDefaultProvider(user));
            }
            setEnabled(true)
        } else {
            if (settedProvider !== null) {
                initiateTwoFactorDisableApi().subscribe({
                    next: (result) => {
                        if (result.success) {
                            setCodeId(result.data.code_id)
                            setValues(Array(6).fill(""));
                            setTimeLeft(59);
                            setExpired(false);
                            setCodeError("");
                            setIsOpen(true)
                        }
                    },
                    error: (error: Error) => {
                        setError(parseError(error))
                    }
                })
            } else {
                setEnabled(false)
            }
        }
    }

    const handleSetTwoFactorProvider = () => {
        if (!provider) {
            setError("Провайдер не выбран!")
            return
        }
        setTwoFactorProviderApi(provider).subscribe({
            next: (result) => {
                if (result.success) {
                    setProvider(provider)
                    setSettedProvider(provider)
                    setEnabled(true)
                    setError("Провайдер успешно сохранен!")
                }
            },
            error: (error: Error) => {
                setError(parseError(error))
            }
        })
    }

    const handleEmailConfirm = () => {
        setEmailConfirming(true);
        setError("");
        initiateEmailVerificationApi().subscribe({
            next: (result) => {
                setEmailConfirming(false);
                if (result.success) {
                    setEmailSent(true);
                }
            },
            error: (error: Error) => {
                setEmailConfirming(false);
                setError(parseError(error));
            },
        });
    };

    const handleDisableTwoFactor = (e: React.FormEvent) => {
        e.preventDefault()
    
        const enteredCode = values.join("");

        twoFactorDisableApi(codeId, enteredCode).subscribe({
            next: (result) => {
                if (result.success) {
                    setIsOpen(false)
                    setCodeError("")
                    setError("")
                    setCodeId("")
                    setProvider(null)
                    setSettedProvider(null)
                    setEnabled(false)
                }
            },
            error: (error: Error) => {
                setCodeError(parseError(error))
            }
        })
    }

    if (!user) return ""

    const isComplete: boolean = values.join("").length === 6;

    return (
        <>
            <div className={s.authForm__blocks}>
                <div className={s.authForm__block}>
                    <form className={s.authForm}>
                        <span>Безопасность</span>
                        <div className={s.authForm__group__switch}>
                            <label className={s.switch}>
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={() => handleTwoFactorSwitch(!enabled)}
                                />
                                <span className={s.slider}></span>
                            </label>
                            <p> Включить двухфакторную идентификацию</p>
                        </div>
                        {enabled && (
                            <>
                                <div className={s.authForm__group__row}>
                                    {providers.map(({ key, label, isVerified }) => {
                                        const showConfirm = !isVerified;
                                        const isDisabled = !isVerified;
                                        const isActive = provider === key;

                                        return (
                                            <div key={key} className={s.authForm__providerItem}>
                                                <label className={s.radio__option}>
                                                    <input
                                                        type="radio"
                                                        name="pays"
                                                        value={key}
                                                        checked={isActive}
                                                        disabled={isDisabled}
                                                        onChange={() => setProvider(key)}
                                                    />
                                                    <div className={s.radio__label}>{label}</div>
                                                </label>
                                                {showConfirm && (
                                                    <button
                                                        type="button"
                                                        className={s.confirmBtn}
                                                        onClick={() => {
                                                            if (key === "email") {
                                                                handleEmailConfirm();
                                                            } else if (key === "telegram") {
                                                                // пока не реализовано
                                                            }
                                                        }}
                                                        disabled={(emailConfirming && key === "email") || key === "telegram"}
                                                    >
                                                        Подтвердить
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {error && <p className="text-white text-sm mt-2">{error}</p>}
                                {emailSent && <p className={s.infoText}>Письмо с подтверждением отправлено на e-mail.</p>}
                                <button
                                    type="button"
                                    className={s.profile__sm__btn}
                                    onClick={() => handleSetTwoFactorProvider()}
                                >
                                    Сохранить
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>

            {isOpen && (
                <div className={s.modalOverlay} onClick={() => { setIsOpen(false); setCodeId("") }}>
                    <div className={s.activateForm__block} onClick={(e) => e.stopPropagation()}>
                        <div className={s.modal}>
                            <div className={s.activateForm__blocks}>
                                <div className={s.activateForm__block}>
                                    <form onSubmit={handleDisableTwoFactor} className={s.activateForm}>
                                        <span>Отключение двухфакторной аутентификации</span>
                                        <p>
                                            Для отключения {settedProvider ? providerTextMap[settedProvider] : ""}
                                        </p>

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
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
