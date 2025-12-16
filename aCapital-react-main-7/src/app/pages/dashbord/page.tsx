import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import SideBar from "../../components/Sidebar/sideBar";
import Charts from "../../components/Charts/Сharts";
import Dashbords from "../../components/Dashbord/Dashbord";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";
import DashboardGreeting from "../../components/DashboardGreeting/DashboardGreeting";

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
              <DashboardGreeting className={styles.page__title} />
              <div className={styles.content}>
                  <Dashbords/>
                  <Charts/>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );

}
