"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css";
import educationStyles from "../education.module.scss";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";
import Image from "next/image";

export default function EducationDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRetakeTest = () => {
    router.push("/pages/education/test");
  };

  // Здесь можно получить данные из API
  const learningLevel = "Начальный"; // Временно, потом из API
  const learningProgress = 63; // Временно, потом из API

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
              <h1 className={styles.page__title}>Обучение</h1>
              <div className={educationStyles.dashboardContainer}>
                <div className={educationStyles.dashboardCardsContainer}>
                  <div className={educationStyles.levelCard}>
                    <h2 className={educationStyles.levelCardTitle}>
                      Начальный уровень
                    </h2>
                    <div
                      className={educationStyles.levelCardDescriptionsContainer}
                    >
                      <p className={educationStyles.levelCardDescription}>
                        Ваш текущий уровень обучения.
                      </p>
                      <p className={educationStyles.levelCardDescription}>
                        Чтобы его изменить, пересдайте еще раз тест на
                        квалификацию.
                      </p>
                    </div>
                    <Image
                      src={"/Vector.png"}
                      width={1000}
                      height={1000}
                      alt="education"
                      className={educationStyles.levelCardImg}
                    />
                  </div>
                  <div className={educationStyles.progressCard}>
                    <h2 className={educationStyles.progressCardTitle}>
                      Прогресс обучения
                    </h2>
                    <div className={educationStyles.progressBarContainer}>
                      <div className={educationStyles.progressBarWrapper}>
                        <div
                          className={educationStyles.progressBarFill}
                          style={{ width: `${learningProgress}%` }}
                        ></div>
                        <span className={educationStyles.progressBarText}>
                          {learningProgress}%
                        </span>
                      </div>
                    </div>
                    <Image
                      src={"/фонстрелка.png"}
                      width={1000}
                      height={1000}
                      alt="education"
                      className={educationStyles.progressBarImg}
                    />
                  </div>
                  <div className={educationStyles.testCard}>
                    <h2 className={educationStyles.testCardTitle}>
                      Тест на квалификацию
                    </h2>
                    <Image
                      src={"/certificate.png"}
                      width={1000}
                      height={1000}
                      alt="education"
                      className={educationStyles.testCardImg}
                    />
                    <button
                      className={educationStyles.retakeTestButton}
                      type="button"
                      onClick={handleRetakeTest}
                    >
                      Пересдать тест
                    </button>
                  </div>
                </div>
                <div className={educationStyles.BlockWithTests}>
                  <span className={educationStyles.BlockWithText}>Тесты</span>
                  <div className={educationStyles.testsRectanglesContainer}>
                    <div className={educationStyles.testItem}>
                      <div className={educationStyles.testRectangle}>
                        <Image
                          src={"/content.png"}
                          width={250}
                          height={144}
                          alt="test content"
                          className={educationStyles.testRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.testItemText}>
                        Тест инвестора
                      </span>
                    </div>
                    <div className={educationStyles.testItem}>
                      <div className={educationStyles.testRectangle}>
                        <Image
                          src={"/content.png"}
                          width={250}
                          height={144}
                          alt="test content"
                          className={educationStyles.testRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.testItemText}>
                        Тест "Акции и облигации"
                      </span>
                    </div>
                    <div className={educationStyles.testItem}>
                      <div className={educationStyles.testRectangle}>
                        <Image
                          src={"/content.png"}
                          width={250}
                          height={144}
                          alt="test content"
                          className={educationStyles.testRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.testItemText}>
                        Тест "Договоры РЕПО"
                      </span>
                    </div>
                    <div className={educationStyles.testItem}>
                      <div className={educationStyles.testRectangle}>
                        <Image
                          src={"/content.png"}
                          width={250}
                          height={144}
                          alt="test content"
                          className={educationStyles.testRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.testItemText}>
                        Тест "Акции и облигации"
                      </span>
                    </div>
                    <div className={educationStyles.testItem}>
                      <div className={educationStyles.testRectangle}>
                        <Image
                          src={"/content.png"}
                          width={250}
                          height={144}
                          alt="test content"
                          className={educationStyles.testRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.testItemText}>
                        Тест инвестора
                      </span>
                    </div>
                  </div>
                  <div className={educationStyles.arrowContainer}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      className={educationStyles.arrowIcon}
                    >
                      <rect
                        x="40"
                        y="40"
                        width="40"
                        height="40"
                        rx="10"
                        transform="rotate(180 40 40)"
                        fill="white"
                      />
                      <path
                        d="M12 19C11.4477 19 11 19.4477 11 20C11 20.5523 11.4477 21 12 21L12 20L12 19ZM28.7071 20.7071C29.0976 20.3166 29.0976 19.6834 28.7071 19.2929L22.3431 12.9289C21.9526 12.5384 21.3195 12.5384 20.9289 12.9289C20.5384 13.3195 20.5384 13.9526 20.9289 14.3431L26.5858 20L20.9289 25.6569C20.5384 26.0474 20.5384 26.6805 20.9289 27.0711C21.3195 27.4616 21.9526 27.4616 22.3431 27.0711L28.7071 20.7071ZM12 20L12 21L28 21L28 20L28 19L12 19L12 20Z"
                        fill="#292929"
                      />
                    </svg>
                  </div>
                </div>
                <div className={educationStyles.BlockWithTestVideo}>
                  <span className={educationStyles.BlockWithText}>
                    Видео-материалы для обучения
                  </span>
                  <div className={educationStyles.testsRectanglesContainer}>
                    <div className={educationStyles.testVideoItem}>
                      <div
                        className={
                          educationStyles.testVideoRectangleImgContainer
                        }
                      >
                        <Image
                          src={"/education-example-1.png"}
                          width={500}
                          height={500}
                          alt="education video"
                          className={educationStyles.testVideoRectangleImg}
                        />
                        <div className={educationStyles.testVideoItemTime}>
                          12 мин.
                        </div>
                      </div>
                      <span className={educationStyles.testVideoItemText}>
                        Основы инвестирования: видео-урок
                      </span>
                    </div>
                    <div className={educationStyles.testVideoItem}>
                      <div
                        className={
                          educationStyles.testVideoRectangleImgContainer
                        }
                      >
                        <Image
                          src={"/education-example-2.png"}
                          width={500}
                          height={500}
                          alt="education video"
                          className={educationStyles.testVideoRectangleImg}
                        />
                        <div className={educationStyles.testVideoItemTime}>
                          23 мин.
                        </div>
                      </div>
                      <span className={educationStyles.testVideoItemText}>
                        Криптокошелек и финансовые риски
                      </span>
                    </div>
                  </div>
                </div>
                <div className={educationStyles.BlockWithPdfMaterials}>
                  <span className={educationStyles.BlockWithText}>
                    PDF-материалы для обучения
                  </span>
                  <div className={educationStyles.testsRectanglesContainer}>
                    <div className={educationStyles.pdfItem}>
                      <div className={educationStyles.pdfRectangleImgContainer}>
                        <Image
                          src={"/pdf-education.png"}
                          width={500}
                          height={500}
                          alt="education pdf"
                          className={educationStyles.pdfRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.pdfItemText}>
                        Руководство по инвестированию
                      </span>
                    </div>
                    <div className={educationStyles.pdfItem}>
                      <div className={educationStyles.pdfRectangleImgContainer}>
                        <Image
                          src={"/pdf-education.png"}
                          width={500}
                          height={500}
                          alt="education pdf"
                          className={educationStyles.pdfRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.pdfItemText}>
                        Основы финансового планирования
                      </span>
                    </div>
                    <div className={educationStyles.pdfItem}>
                      <div className={educationStyles.pdfRectangleImgContainer}>
                        <Image
                          src={"/pdf-education.png"}
                          width={500}
                          height={500}
                          alt="education pdf"
                          className={educationStyles.pdfRectangleImg}
                        />
                      </div>
                      <span className={educationStyles.pdfItemText}>
                        Анализ рынка ценных бумаг
                      </span>
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
