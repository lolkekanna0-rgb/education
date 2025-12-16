"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../../page.module.css";
import educationStyles from "../../education.module.scss";
import Header from "../../../../components/Header/Header";
import SideBar from "../../../../components/Sidebar/sideBar";
import Footer from "../../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function TestQuestions() {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentQuestion] = useState(1);
  const totalQuestions = 10;
  const progress = (currentQuestion / totalQuestions) * 100;

  const question = "Маржинальная торговля – это?";
  const answers = [
    "Высокорискованный инструмент, так как позволяет совершать сделки на сумму, превышающую собственные средства, и потенциальные убытки могут быть больше, чем вложенные деньги.",
    "Торговля с использованием собственных средств инвестора.",
    "Торговля с использованием инвестиционных средств, полученных путем обмена ценных бумаг на облигации."
  ];

  const handleNext = () => {
    // Здесь будет логика перехода к следующему вопросу
    console.log("Следующий вопрос");
  };

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
                <div className={educationStyles.testCard}>
                  <div className={educationStyles.progressContainer}>
                    <div className={educationStyles.progressBar}>
                      <span className={educationStyles.progressText}>{Math.round(progress)}%</span>
                      <div 
                        className={educationStyles.progressFill} 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className={educationStyles.questionContainer}>
                    <h2 className={educationStyles.questionTitle}>{question}</h2>
                    
                    <div className={educationStyles.answersContainer}>
                      {answers.map((answer, index) => (
                        <label 
                          key={index} 
                          className={educationStyles.answerOption}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={String(index)}
                            checked={selectedAnswer === String(index)}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            className={educationStyles.radioInput}
                          />
                          <span className={educationStyles.answerText}>{answer}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={educationStyles.questionButtonsContainer}>
                    <button 
                      className={educationStyles.nextQuestionButton} 
                      type="button"
                      onClick={handleNext}
                      disabled={selectedAnswer === null}
                    >
                      Следующий вопрос
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

