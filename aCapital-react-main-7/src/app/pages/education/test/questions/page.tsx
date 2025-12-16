"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../../page.module.css";
import educationStyles from "../../education.module.scss";
import Header from "../../../../components/Header/Header";
import SideBar from "../../../../components/Sidebar/sideBar";
import Footer from "../../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

type Question = {
  question: string;
  answers: string[];
};

const questions: Question[] = [
  {
    question: "Маржинальная торговля – это?",
    answers: [
      "Высокорискованный инструмент, так как позволяет совершать сделки на сумму, превышающую собственные средства, и потенциальные убытки могут быть больше, чем вложенные деньги.",
      "Торговля с использованием собственных средств инвестора.",
      "Торговля с использованием инвестиционных средств, полученных путем обмена ценных бумаг на облигации."
    ]
  },
  {
    question: "Что такое диверсификация портфеля?",
    answers: [
      "Инвестирование всех средств в один актив.",
      "Распределение инвестиций между различными активами для снижения рисков.",
      "Продажа всех активов одновременно."
    ]
  },
  {
    question: "Что означает термин 'ликвидность'?",
    answers: [
      "Способность актива быть быстро проданным по рыночной цене.",
      "Общая стоимость портфеля.",
      "Процентная ставка по кредиту."
    ]
  },
  {
    question: "Что такое дивиденды?",
    answers: [
      "Часть прибыли компании, выплачиваемая акционерам.",
      "Налог на доходы от инвестиций.",
      "Комиссия брокера за сделки."
    ]
  },
  {
    question: "Что означает 'бычий рынок'?",
    answers: [
      "Рынок с растущими ценами и оптимистичными настроениями.",
      "Рынок с падающими ценами.",
      "Рынок без изменений."
    ]
  },
  {
    question: "Что такое стоп-лосс?",
    answers: [
      "Приказ на автоматическую продажу актива при достижении определенной цены для ограничения убытков.",
      "Максимальная прибыль от сделки.",
      "Время закрытия торговой сессии."
    ]
  },
  {
    question: "Что означает 'медвежий рынок'?",
    answers: [
      "Рынок с падающими ценами и пессимистичными настроениями.",
      "Рынок с растущими ценами.",
      "Рынок без изменений."
    ]
  },
  {
    question: "Что такое индекс?",
    answers: [
      "Показатель, отражающий изменение стоимости группы активов.",
      "Отдельная акция компании.",
      "Валюта для торговли."
    ]
  },
  {
    question: "Что означает 'волатильность'?",
    answers: [
      "Степень изменчивости цены актива во времени.",
      "Общий объем торгов.",
      "Количество акций в портфеле."
    ]
  },
  {
    question: "Что такое 'акции роста'?",
    answers: [
      "Акции компаний, которые ожидают быстрого роста прибыли и стоимости.",
      "Акции с фиксированным дивидендом.",
      "Акции государственных компаний."
    ]
  }
];

export default function TestQuestions() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [mounted, setMounted] = useState(false);
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentQuestionData = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex] || null;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Завершение теста
        console.log("Тест завершен", selectedAnswers);
        // Переход на страницу результатов теста
        router.push("/pages/education/test/results");
      }
    }
  };

  const handleAnswerChange = (value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: value
    }));
  };

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
                <div className={educationStyles.testCard}>
                  <div className={educationStyles.progressContainer}>
                    <div className={educationStyles.progressBar}>
                      <span className={educationStyles.progressText}>{Math.round(progress)}%</span>
                      {mounted && (
                        <div 
                          className={educationStyles.progressFill} 
                          style={{ width: `${progress}%` }}
                        >
                          <div className={educationStyles.progressShine}></div>
                          <div className={educationStyles.progressShine}></div>
                          <div className={educationStyles.progressShine}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={educationStyles.questionContainer}>
                    <h2 className={educationStyles.questionTitle}>{currentQuestionData.question}</h2>
                    
                    <div className={educationStyles.answersContainer}>
                      {currentQuestionData.answers.map((answer, index) => (
                        <label 
                          key={index} 
                          className={educationStyles.answerOption}
                        >
                          <input
                            type="radio"
                            name={`answer-${currentQuestionIndex}`}
                            value={String(index)}
                            checked={selectedAnswer === String(index)}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className={educationStyles.radioInput}
                          />
                          <span className={educationStyles.answerText}>{answer}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={educationStyles.questionButtonsContainer}>
                    {currentQuestionIndex > 0 && (
                      <button 
                        className={educationStyles.previousQuestionButton} 
                        type="button"
                        onClick={handlePrevious}
                      >
                        Предыдущий вопрос
                      </button>
                    )}
                    {currentQuestionIndex === 0 && <div></div>}
                    <button 
                      className={`${educationStyles.nextQuestionButton} ${
                        currentQuestionIndex === totalQuestions - 1 && selectedAnswer !== null
                          ? educationStyles.nextQuestionButtonComplete
                          : selectedAnswer !== null
                          ? educationStyles.nextQuestionButtonActive
                          : ""
                      }`} 
                      type="button"
                      onClick={handleNext}
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? "Следующий вопрос" : "Завершить тест"}
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

