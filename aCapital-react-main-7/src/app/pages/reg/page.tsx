import styles from "../../page.module.css";
import RegForm from "../../components/RegForm/RegForm";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function Reg() {

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main__red}>
                <div className={styles.container}>
                    <RegForm />
                </div>
            </main>
            <Footer />
        </div>
    );

}
