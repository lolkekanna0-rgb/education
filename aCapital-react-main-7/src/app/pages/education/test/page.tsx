"use client";

import { useRouter } from "next/navigation";
import educationStyles from "../education.module.scss";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function EducationTest() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/pages/education");
  };

  const handleStartTest = () => {
    router.push("/pages/education/test/questions");
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
              <h1 className={educationStyles.page__title}>
                Тест на квалификацию
              </h1>
              <div className={educationStyles.content}>
                <div className={educationStyles.educationCard}>
                  <h2 className={educationStyles.title}>
                    Ваш текущий уровень обучения не определен
                  </h2>
                  <div className={educationStyles.descriptionContainer}>
                    <p className={educationStyles.description}>
                      Чтобы приступить к прохождению теста, нажмите кнопку
                      "Начать тест".
                    </p>
                    <p className={educationStyles.description}>
                      Данный тест предназначен для определения вашего уровня
                      обучения в системе.
                    </p>
                    <p className={educationStyles.description}>
                      Тест состоит из 10 вопросов.
                    </p>
                    <p className={educationStyles.description}>
                      В каждом вопросе необходимо выбрать один вариант ответа.
                    </p>
                    <p className={educationStyles.description}>
                      Вы не ограничены по времени.
                    </p>
                  </div>
                  <div className={educationStyles.buttonsContainer}>
                    <button
                      className={educationStyles.backButton}
                      type="button"
                      onClick={handleBack}
                    >
                      Назад
                    </button>
                    <button
                      className={educationStyles.startTestButton}
                      type="button"
                      onClick={handleStartTest}
                    >
                      Начать тест
                    </button>
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
