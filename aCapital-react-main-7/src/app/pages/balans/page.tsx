import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import SideBar from "../../components/Sidebar/sideBar";
import BalansTable from "../../components/BalansTable/BalansTable";
import BalansTop from "../../components/BalansTable/BalansTop";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function Dashbord() {

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
              <h1 className={styles.page__title}>Баланс</h1> 
              <div className={styles.content}>
                  <BalansTop/>
                  <BalansTable/>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );

}