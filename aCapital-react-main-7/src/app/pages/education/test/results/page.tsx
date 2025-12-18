"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../../page.module.css";
import educationStyles from "../../education.module.scss";
import Header from "../../../../components/Header/Header";
import SideBar from "../../../../components/Sidebar/sideBar";
import Footer from "../../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function TestResults() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBackToEducation = () => {
    router.push("/pages/education/dashboard");
  };

  // Здесь можно получить уровень обучения из API или состояния
  const learningLevel = "Начальный"; // Временно, потом из API

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
              <SideBar/>
            </div>
            <div className={styles.contents}>
              <h1 className={styles.page__title}>Тест на квалификацию</h1>
              <div className={styles.content}>
                <div className={educationStyles.resultCard}>
                  <div className={educationStyles.successIcon}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="80" height="80" rx="40" fill="#80C069"/>
                      <path d="M28 40L36 48L52 32" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className={educationStyles.resultTitle}>Тест сдан</h2>
                  <p className={educationStyles.resultLevel}>
                    Ваш уровень обучения '{learningLevel}'
                  </p>
                  <div className={educationStyles.resultDescriptionContainer}>
                    <p className={educationStyles.resultDescription}>
                      Теперь вам доступны материалы для данного уровня обучения.
                    </p>
                    <p className={educationStyles.resultDescription}>
                      Вы можете приступить к изучению в личном кабинете во вкладке "Обучение".
                    </p>
                  </div>
                  <button
                    className={educationStyles.backToEducationButton}
                    type="button"
                    onClick={handleBackToEducation}
                  >
                    Вернуться к обучению
                  </button>
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

