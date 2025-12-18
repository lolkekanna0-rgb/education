"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./sideBar.module.scss";
import { user$ } from "@/app/services/user";
import { authToken$ } from "@/app/services/authorization";
import { logoutApi } from "@/app/api/user/logout";
import { buildAccountMenuItems, type AccountMenuItem } from "./accountMenu";

const normalizePath = (value: string) => value.replace(/\/+$/, "");
const pathEquals = (href: string, pathname: string) => normalizePath(pathname) === normalizePath(href);
const pathNested = (href: string, pathname: string) => pathEquals(href, pathname) || pathname.startsWith(`${normalizePath(href)}/`);

export default function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [name, setName] = useState<string>("");
  const [menuItems, setMenuItems] = useState<AccountMenuItem[]>(() =>
    buildAccountMenuItems(user$.getValue()),
  );

  const router = useRouter()

  useEffect(() => {
    const sub = user$.subscribe((user) => {
      if (user?.profile) {
        const lastInitial = user.profile.last_name ? `${user.profile.last_name.charAt(0)}.` : "";
        setName(`${user.profile.first_name} ${lastInitial}`.trim());
      } else {
        setName("");
      }
      setMenuItems(buildAccountMenuItems(user));
    });
    return () => sub.unsubscribe();
  }, []);

  const handleLogout = () => {
    logoutApi().subscribe({
      next: (result) => {
        if (result.success) {
          user$.next(null)
          authToken$.next(null)
          router.push("/auth")
        }
      }
    })
  }

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      menuItems.forEach(({ label, children }) => {
        if (children?.some((child) => child.href && pathNested(child.href, pathname))) {
          next[label] = true;
        }
      });
      return next;
    });
  }, [pathname, menuItems]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.menus}>
        <div>
          
          <Link href="/pages/profile" className={`${styles.menuItem_profile} ${pathname.startsWith('/pages/profile') ? styles.active : ""}`}>
            <div className={styles.profile}>
              <div className={styles.avatar}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0.599609C15.1914 0.599609 19.4004 4.80853 19.4004 10C19.4004 15.1915 15.1914 19.4004 10 19.4004C4.80852 19.4004 0.599612 15.1915 0.599609 10C0.599609 4.80853 4.80852 0.599611 10 0.599609Z" stroke="#B6B7B7" strokeWidth="1.2" />
                  <path d="M10 4.92993C7.93 4.92993 6.25 6.60993 6.25 8.67989C6.25 10.7099 7.84 12.3599 9.95 12.4199C9.98 12.4199 10.02 12.4199 10.04 12.4199C10.06 12.4199 10.09 12.4199 10.11 12.4199C10.12 12.4199 10.13 12.4199 10.13 12.4199C12.15 12.3499 13.74 10.7099 13.75 8.67989C13.75 6.60993 12.07 4.92993 10 4.92993Z" fill="#B6B7B7" />
                  <path d="M16.7807 17.35C15.0007 18.99 12.6207 20 10.0007 20C7.38071 20 5.0007 18.99 3.2207 17.35C3.4607 16.44 4.1107 15.61 5.0607 14.97C7.79071 13.15 12.2307 13.15 14.9407 14.97C15.9007 15.61 16.5407 16.44 16.7807 17.35Z" fill="#B6B7B7" />
                </svg>
              </div>
              <div>
                <p className={styles.name}>{name}</p>
                <p className={styles.sub}>Профиль</p>
              </div>
            </div>
          </Link>
        </div>
        {menuItems.map(({ href, label, icon, children }) => {
          const isActive = href ? pathEquals(href, pathname) || pathname.startsWith(`${normalizePath(href)}/`) : false;
          const hasChildren = Boolean(children && children.length > 0);
          const isGroupOpen = hasChildren ? Boolean(openGroups[label]) : false;
          const isGroupActive = hasChildren
            ? children!.some((child) => pathNested(child.href!, pathname))
            : false;

          return (
            <div key={label}>
              {hasChildren ? (
                <div>
                  <button
                    className={`${styles.menuItem} ${isGroupActive ? styles.active : ""}`}
                    onClick={() => toggleGroup(label)}
                  >
                    {icon}
                    <span>{label}</span>
                    {label === "Обучение" && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="4" 
                        height="8" 
                        viewBox="0 0 4 8" 
                        fill="none"
                        className={`${styles.arrowIcon} ${isGroupOpen ? styles.arrowIconOpen : ""} ${isGroupActive ? styles.arrowIconActive : ""}`}
                      >
                        <path 
                          d="M0.186208 0.224482C0.0669428 0.366671 -3.25256e-07 0.559015 -3.16492e-07 0.759505C-3.07728e-07 0.959995 0.0669428 1.15234 0.186208 1.29453L2.45305 4.01897L0.186209 6.70547C0.066943 6.84766 -4.19627e-08 7.04001 -3.3199e-08 7.2405C-2.44353e-08 7.44099 0.0669431 7.63333 0.186209 7.77552C0.245738 7.84665 0.316561 7.90311 0.394593 7.94164C0.472626 7.98016 0.556323 8 0.640857 8C0.72539 8 0.809088 7.98016 0.88712 7.94164C0.965153 7.90311 1.03598 7.84665 1.0955 7.77552L3.81059 4.55779C3.8706 4.48724 3.91824 4.40331 3.95075 4.31083C3.98326 4.21835 4 4.11916 4 4.01897C4 3.91879 3.98326 3.8196 3.95075 3.72712C3.91824 3.63464 3.8706 3.5507 3.81059 3.48015L1.0955 0.224482C1.03598 0.153351 0.965152 0.0968937 0.88712 0.0583653C0.809087 0.0198373 0.72539 -3.17078e-08 0.640856 -2.80127e-08C0.556323 -2.43177e-08 0.472625 0.0198374 0.394593 0.0583653C0.31656 0.0968938 0.245737 0.153351 0.186208 0.224482Z" 
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                  {isGroupOpen && (
                    <div className={styles.submenu}>
                      {label === "Обучение" ? (
                        <Link
                          href="/pages/education/dashboard"
                          className={styles.achievementsButton}
                        >
                          <span>Мои достижения</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="4" 
                            height="8" 
                            viewBox="0 0 4 8" 
                            fill="none"
                            className={styles.achievementsArrow}
                          >
                            <path 
                              d="M0.186208 0.224482C0.0669428 0.366671 -3.25256e-07 0.559015 -3.16492e-07 0.759505C-3.07728e-07 0.959995 0.0669428 1.15234 0.186208 1.29453L2.45305 4.01897L0.186209 6.70547C0.066943 6.84766 -4.19627e-08 7.04001 -3.3199e-08 7.2405C-2.44353e-08 7.44099 0.0669431 7.63333 0.186209 7.77552C0.245738 7.84665 0.316561 7.90311 0.394593 7.94164C0.472626 7.98016 0.556323 8 0.640857 8C0.72539 8 0.809088 7.98016 0.88712 7.94164C0.965153 7.90311 1.03598 7.84665 1.0955 7.77552L3.81059 4.55779C3.8706 4.48724 3.91824 4.40331 3.95075 4.31083C3.98326 4.21835 4 4.11916 4 4.01897C4 3.91879 3.98326 3.8196 3.95075 3.72712C3.91824 3.63464 3.8706 3.5507 3.81059 3.48015L1.0955 0.224482C1.03598 0.153351 0.965152 0.0968937 0.88712 0.0583653C0.809087 0.0198373 0.72539 -3.17078e-08 0.640856 -2.80127e-08C0.556323 -2.43177e-08 0.472625 0.0198374 0.394593 0.0583653C0.31656 0.0968938 0.245737 0.153351 0.186208 0.224482Z" 
                              fill="currentColor"
                            />
                          </svg>
                        </Link>
                      ) : (
                        children!.map((child) => {
                          const childActive = pathEquals(child.href!, pathname);
                          return (
                            <Link
                              key={child.href}
                              href={child.href!}
                              className={`${styles.subItem} ${childActive ? styles.active : ""
                                }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={href!}
                  className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              )}
            </div>
          );
        })}

        <div>
          <a
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            href="#"
            className={`${styles.menuItem}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="24" viewBox="4 0 24 24" fill="#B6B7B7">
              <path fillRule="evenodd" stroke="#B6B7B7" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm5.03 4.72a.75.75 0 0 1 0 1.06l-1.72 1.72h10.94a.75.75 0 0 1 0 1.5H10.81l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            <span>Выйти</span>
          </a>
        </div>

      </nav>
    </aside>
  );
}
