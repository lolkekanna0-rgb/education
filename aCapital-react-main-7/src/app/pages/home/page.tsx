import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function Auth() {

  return (
    <AuthGuard>
        <div className={styles.page}>
            <Header/>
            <main className={styles.main__red}>
                <div className={styles.container}>
                    <h2>
                      Домашняя страница (Пользователь авторизован)
                    </h2>
                </div>
            </main>
            <Footer/>
        </div>
    </AuthGuard>
  );

}