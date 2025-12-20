"use client";

import { useRouter } from "next/navigation";
import educationStyles from "./education.module.scss";
import Header from "../../components/Header/Header";
import SideBar from "../../components/Sidebar/sideBar";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function Education() {
  const router = useRouter();

  const handleTestClick = () => {
    router.push("/pages/education/test");
  };

  return (
    <AuthGuard>
      <div className={educationStyles.page}>
        <Header />
        <main className={educationStyles.main__profile}>
          <div className={educationStyles.containers}>
            <div className={educationStyles.sidebar}>
              <SideBar/>
            </div>
            <div className={educationStyles.contents}>
              <h1 className={educationStyles.page__title}>Обучение</h1> 
              <div className={educationStyles.content}>
                <div className={educationStyles.educationCard}>
                  <h2 className={educationStyles.title}>Уровень обучения не определен</h2>
                  <div className={educationStyles.descriptionContainer}>
                    <p className={educationStyles.description}>
                      Чтобы приступить к обучению и получить доступ к материалам курсов, необходимо пройти тест квалификации.
                    </p>
                    <p className={educationStyles.description}>
                      После прохождения теста будет определен ваш текущий уровень обучения и станут доступны соответствующие <br/> 
                      мате&shy;риалы.
                    </p>
                  </div>
                  <button 
                    className={educationStyles.testButton} 
                    type="button"
                    onClick={handleTestClick}
                  >
                    Пройти тест
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

