import styles from "../page.module.css";
import AuthForm from "../components/AuthForm/AuthForm";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

export default function AuthPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main__red}>
        <div className={styles.container}>
          <AuthForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
