import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import SideBar from "../../components/Sidebar/sideBar";
import DocList from "../../components/DocList/DocList";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";


export default function DocKYC() {

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
              <h1 className={styles.page__title}>Документы</h1> 
              <div className={styles.content}>
                  <DocList/>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );

}
