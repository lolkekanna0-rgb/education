"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import educationStyles from "../education.module.scss";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function EducationVideo() {
  const router = useRouter();
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleBack = () => {
    router.push("/pages/education/dashboard");
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <AuthGuard>
      <div className={educationStyles.page}>
        <Header />
        <main className={educationStyles.main__profile}>
          <div className={educationStyles.containers}>
            <div className={educationStyles.sidebar}>
              <SideBar />
            </div>
            <div className={educationStyles.contents}>
              <h1 className={educationStyles.page__title}>Обучение</h1>
              <div className={educationStyles.videoPageContainer}>
                <div className={educationStyles.videoPageHeader}>
                  <button
                    className={educationStyles.backButton}
                    type="button"
                    onClick={handleBack}
                  >
                    Назад
                  </button>
                  <h1 className={educationStyles.videoPageTitle}>
                    Основы инвестирования: видео-урок
                  </h1>
                </div>
                <div className={educationStyles.videoPageContent}>
                  <div className={educationStyles.videoPlayerContainer}>
                    <div className={educationStyles.videoPlayer}>
                      {videoError ? (
                        <div className={educationStyles.videoError}>
                          <p>
                            Видео временно недоступно. Пожалуйста, попробуйте
                            позже.
                          </p>
                        </div>
                      ) : (
                        <video
                          ref={videoRef}
                          src="/video-example.mp4"
                          controls
                          className={educationStyles.videoPlayerVideo}
                          onError={handleVideoError}
                          playsInline
                          preload="metadata"
                        >
                          Ваш браузер не поддерживает воспроизведение видео.
                        </video>
                      )}
                    </div>
                  </div>
                  <div className={educationStyles.videoDescriptionContainer}>
                    <h2 className={educationStyles.videoDescriptionTitle}>
                      Описание
                    </h2>
                    <div className={educationStyles.videoDescriptionText}>
                      <p>
                        Инвестирование — это вложение денег в активы с целью
                        получить доход. Активами называют всё, чем можно
                        распоряжаться и что приносит выгоду: недвижимость,
                        бизнес, драгоценные металлы, валюту, деньги на депозитах
                        или на обезличенных металлических счетах.
                      </p>
                      <p>
                        В этой статье мы расскажем об инвестировании в более
                        узком смысле — о вложениях в биржевые инструменты:
                        акции, облигации и другие. Интерес к инвестированию на
                        бирже растёт: за второй квартал 2025 года число
                        инвесторов на Мосбирже увеличилось на 15% в сравнении со
                        вторым кварталом 2024-го.
                      </p>
                      <p>
                        Суть инвестирования сводится к тому, что актив покупают
                        дешевле, а продают дороже. Например, инвестор может
                        вложить деньги в акции компании — и продать их, когда
                        они подорожают.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  className={educationStyles.backButtonMobile}
                  type="button"
                  onClick={handleBack}
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
