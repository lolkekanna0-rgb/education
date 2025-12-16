import styles from "../../page.module.css";
import FormPass from "../../components/NewPass/NewPass";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function NewPass() {

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main__red}>
                <div className={styles.container}>
                    <FormPass />
                </div>
            </main>
            <Footer />
        </div>
    );

}
