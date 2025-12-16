import styles from "../../page.module.css";
import ForgetForm from "../../components/ForgetForm/ForgetForm";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function Forget() {

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main__red}>
                <div className={styles.container}>
                    <ForgetForm />
                </div>
            </main>
            <Footer />
        </div>
    );

}