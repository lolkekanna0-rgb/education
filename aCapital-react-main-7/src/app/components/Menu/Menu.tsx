"use client";

import s from "./menu.module.scss";

export type MenuLink = {
  label: string;
  href: string;
  children?: MenuLink[];
};

export const menuItems: MenuLink[] = [
  { label: "Услуги брокера", href: "https://asia-capital.kg/brocker-services/" },
  { label: "Персональный трейдинг", href: "https://asia-capital.kg/trading/" },
  { label: "Торговые сигналы", href: "https://asia-capital.kg/signal/" },
  { label: "Инвестиционные услуги", href: "https://asia-capital.kg/investment/" },
  { label: "Комплаенс", href: "https://asia-capital.kg/compliance/" },
  { label: "Устойчивое развитие", href: "https://asia-capital.kg/sustainability/" },
  {
    label: "О нас",
    href: "https://asia-capital.kg/about/",
    children: [
      { label: "Документы", href: "https://asia-capital.kg/docs/" },
      { label: "Контакты", href: "https://asia-capital.kg/contacts/" },
      { label: "Финансовая отчётность", href: "https://asia-capital.kg/reports/" },
      { label: "Персональные данные", href: "https://asia-capital.kg/personal-data/" },
      { label: "Информационная политика", href: "https://asia-capital.kg/information-policy/" },
      { label: "Органы управления", href: "https://asia-capital.kg/management/" },
      { label: "Управление рисками", href: "https://asia-capital.kg/risk-management/" },
    ],
  },
];

export default function Menu() {
  return (
    <nav className={s.menu} aria-label="Основное меню">
      <ul className={s.menu__list}>
        {menuItems.map(item => (
          <li key={item.label} className={`${s.menu__item} ${item.children ? s.menu__itemDropdown : ""}`}>
            <a href={item.href} className={s.menu__link} target="_blank" rel="noopener noreferrer">
              {item.label}
            </a>
            {item.children && (
              <ul className={s.menu__dropdown}>
                {item.children.map(child => (
                  <li key={child.label} className={s.menu__dropdownItem}>
                    <a href={child.href} target="_blank" rel="noopener noreferrer">
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
