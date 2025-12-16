import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import ClientsTable from "../../components/ClientsTable/ClientsTable";
import SideBar from "../../components/Sidebar/sideBar";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function Clients() {

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
              <h1 className={styles.page__title}>Клиенты</h1> 
              <div className={styles.content}>
                  <ClientsTable/>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );

}