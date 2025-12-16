"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import Menu, { menuItems as publicMenuItems, type MenuLink } from "@/app/components/Menu/Menu";
import s from "./header.module.scss";
import { user$ } from "@/app/services/user";
import { authToken$ } from "@/app/services/authorization";
import { logoutApi } from "@/app/api/user/logout";
import type { CurrentUser } from "@/app/api/user/get-me";
import { buildAccountMenuItems, type AccountMenuItem } from "@/app/components/Sidebar/accountMenu";

const normalizePath = (value: string) => value.replace(/\/+$/, "");
const pathEquals = (href: string, pathname: string) => normalizePath(pathname) === normalizePath(href);
const pathNested = (href: string, pathname: string) => pathEquals(href, pathname) || pathname.startsWith(`${normalizePath(href)}/`);

const getProfileDisplayName = (user: CurrentUser | null) => {
  if (!user?.profile) return "";
  const { first_name, last_name } = user.profile;
  const initial = last_name ? `${last_name.charAt(0)}.` : "";
  return `${first_name} ${initial}`.trim();
};

const hasActiveDescendant = (pathname: string, item: AccountMenuItem) =>
  item.children?.some(child => child.href && pathNested(child.href, pathname)) ?? false;

export default function Header() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => user$.getValue());
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();

  const profileName = useMemo(() => getProfileDisplayName(currentUser), [currentUser]);
  const accountMenuItems = useMemo(
    () => buildAccountMenuItems(currentUser),
    [currentUser],
  );
  const hasAccountAccess = Boolean(currentUser);

  useEffect(() => {
    const subscription = user$.subscribe(setCurrentUser);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMobileOpenGroups((prev) => {
      const next: Record<string, boolean> = {};
      accountMenuItems.forEach((item) => {
        if (item.children && item.children.length > 0) {
          next[item.label] = prev[item.label] ?? hasActiveDescendant(pathname, item);
        }
      });
      return next;
    });
  }, [pathname, accountMenuItems]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const toggleMobileGroup = (label: string) => {
    setMobileOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logoutApi().subscribe({
      next: (result) => {
        if (result.success) {
          user$.next(null);
          authToken$.next(null);
          closeMobileMenu();
          router.push("/auth");
        }
      },
      error: () => {
        closeMobileMenu();
      },
    });
  };

  const handleOverlayClick = () => closeMobileMenu();
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

  const renderGeneralMenu = (items: MenuLink[]) => (
    <ul className={s.mobileMenuList}>
      {items.map(item => (
        <li key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={s.mobileMenuLink}
            onClick={closeMobileMenu}
          >
            <span>{item.label}</span>
          </a>
          {item.children && (
            <ul className={s.mobileMenuSubList}>
              {item.children.map(child => (
                <li key={child.label}>
                  <a
                    href={child.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.mobileMenuSubLink}
                    onClick={closeMobileMenu}
                  >
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  const renderAccountMenu = (items: AccountMenuItem[]) => (
    <ul className={s.mobileMenuList}>
      {items.map(item => {
        const isActive = item.href ? pathEquals(item.href, pathname) : hasActiveDescendant(pathname, item);
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isGroupOpen = hasChildren ? mobileOpenGroups[item.label] ?? isActive : false;
        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className={`${s.mobileMenuLink} ${isActive ? s.mobileMenuLinkActive : ""}`}
                onClick={closeMobileMenu}
              >
                {item.icon && <span className={s.mobileMenuIcon}>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ) : (
              <div className={s.mobileMenuGroup}>
                <button
                  type="button"
                  className={s.mobileMenuGroupLabel}
                  onClick={() => toggleMobileGroup(item.label)}
                  aria-expanded={isGroupOpen}
                >
                  {item.icon && <span className={s.mobileMenuIcon}>{item.icon}</span>}
                  <span>{item.label}</span>
                  <span aria-hidden className={s.mobileMenuGroupCaret}>{isGroupOpen ? "−" : "+"}</span>
                </button>
                {item.children && isGroupOpen && (
                  <ul className={s.mobileMenuSubList}>
                    {item.children.map(child => {
                      const childActive = child.href ? pathEquals(child.href, pathname) : false;
                      return (
                        <li key={child.label}>
                          <Link
                            href={child.href!}
                            className={`${s.mobileMenuSubLink} ${childActive ? s.mobileMenuSubLinkActive : ""}`}
                            onClick={closeMobileMenu}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <header className={s.header}>
        <div className={s.header__container}>
          <div className={s.container}>
            <div className={s.top__header}>
              <a href="https://asia-capital.kg/" target="_blank" rel="noopener noreferrer">
                <Image aria-hidden priority src="/logo.png" alt="Asia Capital" width={140} height={100} />
              </a>
              <div className={s.header__wp}>
                <span className={s.header__wpicon}>
                  <Image aria-hidden src="/wp.svg" alt="" width={16} height={16} />
                </span>
                <a href="https://wa.me/+996222177711" target="_blank" rel="noopener noreferrer">
                  Чат в WhatsApp
                </a>
              </div>
              <div className={s.header__phone}>
                <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="black"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.08685 5.90223C5.55085 6.86865 6.18337 7.77441 6.98443 8.57546C7.78548 9.37651 8.69124 10.009 9.65765 10.473C9.74078 10.5129 9.78234 10.5329 9.83494 10.5482C10.0218 10.6027 10.2513 10.5636 10.4096 10.4502C10.4542 10.4183 10.4923 10.3802 10.5685 10.304C10.8016 10.071 10.9181 9.95443 11.0353 9.87824C11.4772 9.59091 12.0469 9.59091 12.4889 9.87824C12.606 9.95443 12.7226 10.071 12.9556 10.304L13.0856 10.4339C13.4398 10.7882 13.617 10.9654 13.7132 11.1556C13.9046 11.534 13.9046 11.9809 13.7132 12.3592C13.617 12.5495 13.4398 12.7266 13.0856 13.0809L12.9805 13.186C12.6274 13.5391 12.4508 13.7156 12.2108 13.8505C11.9445 14.0001 11.5308 14.1077 11.2253 14.1068C10.95 14.1059 10.7619 14.0525 10.3856 13.9457C8.36333 13.3718 6.45509 12.2888 4.86311 10.6968C3.27112 9.10479 2.18814 7.19655 1.61416 5.17429C1.50735 4.79799 1.45395 4.60984 1.45313 4.33455C1.45222 4.02906 1.5598 3.6154 1.70941 3.34907C1.84424 3.10904 2.02078 2.9325 2.37386 2.57942L2.47895 2.47433C2.83325 2.12004 3.0104 1.94289 3.20065 1.84666C3.57903 1.65528 4.02587 1.65528 4.40424 1.84666C4.5945 1.94289 4.77164 2.12004 5.12594 2.47433L5.25585 2.60424C5.48892 2.83732 5.60546 2.95385 5.68165 3.07104C5.96898 3.51296 5.96898 4.08268 5.68165 4.52461C5.60546 4.6418 5.48892 4.75833 5.25585 4.9914C5.17964 5.06761 5.14154 5.10571 5.10965 5.15026C4.9963 5.30854 4.95717 5.53805 5.01165 5.72495C5.02698 5.77754 5.04694 5.81911 5.08685 5.90223Z"
                  />
                </svg>
                <a href="tel:+996222177711">+996 222 177 711</a>
              </div>
              <div className={s.header__socials}>
                <a href="https://t.me/asiacapit" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <Image aria-hidden src="/tg.svg" alt="" width={16} height={16} unoptimized />
                </a>
                <a href="https://vk.com/asiacapital" target="_blank" rel="noopener noreferrer" aria-label="VK">
                  <Image aria-hidden src="/vk.svg" alt="" width={16} height={16} unoptimized />
                </a>
                <a href="https://www.instagram.com/asiacapitalru/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Image aria-hidden src="/inst.svg" alt="" width={16} height={16} unoptimized />
                </a>
              </div>
              <div className={s.header__leng}>
                <a href="#">
                  <Image aria-hidden src="/gb.svg" alt="" width={27} height={20} unoptimized />
                </a>
                <a href="#">
                  <Image aria-hidden src="/rus.svg" alt="" width={27} height={20} unoptimized />
                </a>
                <a href="#">
                  <Image aria-hidden src="/kit.svg" alt="" width={27} height={20} unoptimized />
                </a>
              </div>
              <div className={s.header__login}>
                <Link className={s.header__login__dec} href={hasAccountAccess ? "/pages/profile" : "/auth"}>
                  Личный кабинет
                </Link>
                <Link
                  className={s.header__login__mob}
                  href={hasAccountAccess ? "/pages/profile" : "/auth"}
                  aria-label="Личный кабинет"
                >
                  <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.99997 13.49C6.8299 13.49 4.01077 15.0206 2.21597 17.396C1.82968 17.9072 1.63653 18.1628 1.64285 18.5083C1.64773 18.7752 1.81533 19.1119 2.02534 19.2767C2.29716 19.49 2.67384 19.49 3.4272 19.49H16.5727C17.3261 19.49 17.7028 19.49 17.9746 19.2767C18.1846 19.1119 18.3522 18.7752 18.3571 18.5083C18.3634 18.1628 18.1703 17.9072 17.784 17.396C15.9892 15.0206 13.17 13.49 9.99997 13.49Z" fill="white" />
                    <path d="M9.99997 10.49C12.4853 10.49 14.5 8.47527 14.5 5.98999C14.5 3.50471 12.4853 1.48999 9.99997 1.48999C7.51469 1.48999 5.49997 3.50471 5.49997 5.98999C5.49997 8.47527 7.51469 10.49 9.99997 10.49Z" fill="white" />
                    <path d="M9.99997 13.49C6.8299 13.49 4.01077 15.0206 2.21597 17.396C1.82968 17.9072 1.63653 18.1628 1.64285 18.5083C1.64773 18.7752 1.81533 19.1119 2.02534 19.2767C2.29716 19.49 2.67384 19.49 3.4272 19.49H16.5727C17.3261 19.49 17.7028 19.49 17.9746 19.2767C18.1846 19.1119 18.3522 18.7752 18.3571 18.5083C18.3634 18.1628 18.1703 17.9072 17.784 17.396C15.9892 15.0206 13.17 13.49 9.99997 13.49Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.99997 10.49C12.4853 10.49 14.5 8.47527 14.5 5.98999C14.5 3.50471 12.4853 1.48999 9.99997 1.48999C7.51469 1.48999 5.49997 3.50471 5.49997 5.98999C5.49997 8.47527 7.51469 10.49 9.99997 10.49Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className={s.menu__line}>
            <div className={s.container}>
              <div className={s.menu__container}>
                <button
                  className={s.menu__burger}
                  type="button"
                  aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
                  aria-expanded={isMobileMenuOpen}
                  onClick={toggleMobileMenu}
                >
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7.48999H19M1 1.48999H19M1 13.49H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <Menu />
                <a
                  className={s.header__popup}
                  href="https://asia-capital.kg/about/#elementor-action%3Aaction%3Dpopup%3Aopen%26settings%3DeyJpZCI6IjYyOSIsInRvZ2dsZSI6ZmFsc2V9"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Оставить заявку
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className={s.mobileMenuOverlay} onClick={handleOverlayClick}>
          <div className={s.mobileMenuPanel} onClick={stopPropagation}>
            <div className={s.mobileMenuHeader}>
              <span className={s.mobileMenuTitle}>Меню</span>
              <button
                type="button"
                className={s.mobileMenuClose}
                aria-label="Закрыть меню"
                onClick={closeMobileMenu}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                    stroke="#1F2937"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {hasAccountAccess && (
              <Link
                href="/pages/profile"
                className={s.mobileMenuProfile}
                onClick={closeMobileMenu}
              >
                <div className={s.mobileMenuAvatar}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0.599609C15.1914 0.599609 19.4004 4.80853 19.4004 10C19.4004 15.1915 15.1914 19.4004 10 19.4004C4.80852 19.4004 0.599612 15.1915 0.599609 10C0.599609 4.80853 4.80852 0.599611 10 0.599609Z" stroke="#B6B7B7" strokeWidth="1.2" />
                    <path d="M10 4.92993C7.93 4.92993 6.25 6.60993 6.25 8.67989C6.25 10.7099 7.84 12.3599 9.95 12.4199C9.98 12.4199 10.02 12.4199 10.04 12.4199C10.06 12.4199 10.09 12.4199 10.11 12.4199C10.12 12.4199 10.13 12.4199 10.13 12.4199C12.15 12.3499 13.74 10.7099 13.75 8.67989C13.75 6.60993 12.07 4.92993 10 4.92993Z" fill="#B6B7B7" />
                    <path d="M16.7807 17.35C15.0007 18.99 12.6207 20 10.0007 20C7.38071 20 5.0007 18.99 3.2207 17.35C3.4607 16.44 4.1107 15.61 5.0607 14.97C7.79071 13.15 12.2307 13.15 14.9407 14.97C15.9007 15.61 16.5407 16.44 16.7807 17.35Z" fill="#B6B7B7" />
                  </svg>
                </div>
                <div>
                  <p className={s.mobileMenuProfileName}>{profileName || "Профиль"}</p>
                  <p className={s.mobileMenuProfileMeta}>Перейти в профиль</p>
                </div>
              </Link>
            )}
            {hasAccountAccess && (
              <div className={s.mobileMenuSection}>
                <p className={s.mobileMenuSectionTitle}>Личный кабинет</p>
                {renderAccountMenu(accountMenuItems)}
                <button type="button" className={s.mobileMenuLogout} onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            )}
            <div className={`${s.mobileMenuSection} ${s.mobileMenuSiteSection}`}>
              <p className={s.mobileMenuSectionTitle}>Сайт Asia Capital</p>
              {renderGeneralMenu(publicMenuItems)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
