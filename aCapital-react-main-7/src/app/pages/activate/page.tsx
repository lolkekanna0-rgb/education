import styles from "../../page.module.css";
import ActivateForm from "../../components/ActivateForm/ActivateForm";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function Activate() {

  return (
   <div className={styles.page}>
      <Header/>
      <main className={styles.main__red}>
          <div className={styles.container}>
              <ActivateForm/>
          </div>
      </main>
      <Footer/>
  </div>
  );

}
