"use client";

import Form from "@/app/components/CallForm/CallForm";
import s from "./footer.module.scss";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className={s.footer}>
        <div className={s.container}>
            <div className={s.footer__container}>
                <div className={s.footer__col}>
                    <div className={s.footer__phones}>
                        <a className={s.footer__phone} href="tel:+996222177711">+996 222 177 711</a>
                    </div>
                    <nav className={s.footer__menu}>
                        <a href="https://asia-capital.kg/contacts/" target="_blank" rel="noopener noreferrer">Контакты</a>
                        <a href="https://asia-capital.kg/docs/" target="_blank" rel="noopener noreferrer">Документы</a>
                        <a href="https://asia-capital.kg/about/" target="_blank" rel="noopener noreferrer">О нас</a>
                    </nav>
                    <div className={s.footer__socials}>
                        <a href="https://t.me/asiacapit" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                            <Image
                                aria-hidden
                                src="/f-tg.svg"
                                alt="File icon"
                                width={16}
                                height={16}
                                unoptimized
                            />
                        </a>
                        <a href="https://vk.com/asiacapital" target="_blank" rel="noopener noreferrer" aria-label="VK">
                            <Image
                                aria-hidden
                                src="/f-vk.svg"
                                alt="File icon"
                                width={16}
                                height={16}
                                unoptimized
                            />
                        </a>
                        <a href="https://www.instagram.com/asiacapitalru/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <Image
                                aria-hidden
                                src="/f-inst.svg"
                                alt="File icon"
                                width={16}
                                height={16}
                                unoptimized
                            />
                        </a>
                    </div>
                </div>
                <div className={s.footer__col}>
                    <nav className={s.footer__menu}>
                        <a href="https://asia-capital.kg/personal-broker/" target="_blank" rel="noopener noreferrer">Персональный брокер</a>
                        <a href="https://asia-capital.kg/brocker-services/" target="_blank" rel="noopener noreferrer">Услуги брокера</a>
                        <a href="https://asia-capital.kg/signal/" target="_blank" rel="noopener noreferrer">Торговые сигналы</a>
                        <a href="https://asia-capital.kg/investment/" target="_blank" rel="noopener noreferrer">Инвестиционные услуги</a>
                        <a
                          href="https://asia-capital.kg/%D1%86%D0%B8%D1%84%D1%80%D0%BE%D0%B2%D1%8B%D0%B5-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D1%8B%D0%B5-%D0%B0%D0%BA%D1%82%D0%B8%D0%B2%D1%8B/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Цифровые финансовые активы
                        </a>
                    </nav>
                </div>
                <div className={s.footer__col}>
                    <nav className={s.footer__menu}>
                        <a href="https://asia-capital.kg/structure/" target="_blank" rel="noopener noreferrer">Структура управления</a>
                        <a
                          href="https://asia-capital.kg/wp-content/uploads/2025/08/%D0%90%D0%BD%D1%82%D0%B8%D0%BA%D0%BE%D1%80%D1%80%D1%83%D0%BF%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D0%B0%D1%8F_%D0%BF%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0_22_08_2025.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Антикоррупционная политика
                        </a>
                        <a href="https://asia-capital.kg/sustainability/" target="_blank" rel="noopener noreferrer">Устойчивое развитие</a>
                        <a
                          href="https://asia-capital.kg/wp-content/uploads/2025/08/D0A3D181D182D0B0D0B22BD09ED090D09E2BD090D09A2B2025-compressed.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Устав
                        </a>
                        <a href="https://asia-capital.kg/development/" target="_blank" rel="noopener noreferrer">Обучение и развитие</a>
                        <a href="https://asia-capital.kg/news/" target="_blank" rel="noopener noreferrer">Новости</a>
                    </nav>
                </div>
                <div className={s.footer__col}>
                    <span>Валюты</span>
                    <nav className={s.footer__menu}>
                        <a href="https://asia-capital.kg/convertacia/" target="_blank" rel="noopener noreferrer">Конвертация валют</a>
                        <a href="https://asia-capital.kg/currency/" target="_blank" rel="noopener noreferrer">Курсы</a>
                        <a href="https://asia-capital.kg/utrennii-obzor/" target="_blank" rel="noopener noreferrer">Утренний обзор</a>
                    </nav>
                </div>
                <div className={s.footer__col}>
                    <Form/>
                </div>
            </div>
        </div>  
    </footer>
  );
}
