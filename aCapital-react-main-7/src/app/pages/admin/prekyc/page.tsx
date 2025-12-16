import styles from "../../../page.module.css";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";
import AdminKycList from "@/app/components/AdminKycList/AdminKycList";
import AdminNotificationsBell from "@/app/components/AdminNotifications/AdminNotificationsBell";

export default function AdminPreKycPage() {
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
                <h1 className={styles.page__title}>Pre-KYC заявки (админ)</h1>
                <AdminNotificationsBell />
              </div>
              <div className={styles.content}>
                <AdminKycList
                  type={["individual_basic", "individual", "legal_pre"]}
                  title="Заявки Pre-KYC"
                  hint="Анкеты, отправленные на предварительную проверку."
                  filterTypes={["individual_basic", "legal_pre"]}
                  fallbackTypes={["individual", "legal_pre"]}
                  formType="basic"
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
