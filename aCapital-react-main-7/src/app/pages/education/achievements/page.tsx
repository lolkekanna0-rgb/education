"use client";

import { useState, useEffect } from "react";
import styles from "../../../page.module.css";
import educationStyles from "../education.module.scss";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";
import CertificateIcon from "../../../components/CertificateIcon/CertificateIcon";

interface CompletedCourse {
  id: string;
  title: string;
  completedDate: string;
}

export default function AchievementsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Временно статические данные, потом можно заменить на данные из API
  const completedCourses: CompletedCourse[] = [
    { id: "1", title: "Курс инвестора", completedDate: "21.04.2025" },
    { id: "2", title: "Основы криптовалют", completedDate: "21.04.2025" },
    { id: "3", title: "Основы капитала", completedDate: "21.04.2025" },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <AuthGuard>
      <div className={styles.page}>
        <Header />
        <main className={styles.main__profile}>
          <div className={styles.containers}>
            <div className={styles.sidebar}>
              <SideBar />
            </div>
            <div className={styles.contents}>
              <h1 className={styles.page__title}>Мои достижения</h1>
              <div className={styles.achievementsContainer}>
                <div className={styles.page_contents__5Jv7v}>
                  <h2 className={educationStyles.completedCoursesTitle}>
                    Пройденные курсы
                  </h2>
                  <div className={educationStyles.completedCoursesContainer}>
                    {completedCourses.map((course) => (
                      <div
                        key={course.id}
                        className={educationStyles.completedCourseCard}
                      >
                        <div className={educationStyles.completedCourseTopRow}>
                          <div
                            className={
                              educationStyles.completedCourseLeftContent
                            }
                          >
                            <div
                              className={educationStyles.completedCourseIcon}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="10" cy="10" r="10" fill="#22C55E" />
                                <path
                                  d="M6 10L9 13L14 7"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <span
                              className={educationStyles.completedCourseTitle}
                            >
                              {course.title}
                            </span>
                          </div>
                        </div>
                        <span className={educationStyles.completedCourseDate}>
                          {course.completedDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.page_contents__5Jv7v}>
                  <h2 className={educationStyles.completedCoursesTitle}>
                    Сертификаты
                  </h2>
                  <div className={educationStyles.certificatesContainer}>
                    <div className={educationStyles.certificateCard}>
                      <CertificateIcon />
                      <p className={educationStyles.certificateText}>
                        Сертификат "Курс Основы микрофинансов и аудита"
                      </p>
                    </div>
                    <div className={educationStyles.certificateCard}>
                      <CertificateIcon />
                      <p className={educationStyles.certificateText}>
                        Сертификат "Курс Основы микрофинансов и аудита"
                      </p>
                    </div>
                    <div className={educationStyles.certificateCard}>
                      <CertificateIcon />
                      <p className={educationStyles.certificateText}>
                        Сертификат "Курс Основы микрофинансов и аудита"
                      </p>
                    </div>
                    <div className={educationStyles.certificateCard}>
                      <CertificateIcon />
                      <p className={educationStyles.certificateText}>
                        Сертификат "Курс Основы микрофинансов и аудита"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
