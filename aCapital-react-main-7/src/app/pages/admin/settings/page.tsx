import styles from "../../../page.module.css";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import AdminSettings from "@/app/components/AdminSettings/AdminSettings";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function AdminSettingsPage() {
  return (
    <AuthGuard>
      <div className={styles.page}>
        <Header />
        <main className={styles.main__profile}>
          <div className={styles.containers}>
            <div className={styles.sidebar}>
              <SideBar />
            </div>
            <div className={styles.contents}>
              <div className={styles.pageHeaderRow}>
                <h1 className={styles.page__title}>Настройки</h1>
              </div>
              <div className={styles.content}>
                <AdminSettings />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
