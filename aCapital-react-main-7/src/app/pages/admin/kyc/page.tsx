import styles from "../../../page.module.css";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";
import AdminKycList from "@/app/components/AdminKycList/AdminKycList";
import AdminNotificationsBell from "@/app/components/AdminNotifications/AdminNotificationsBell";

export default function AdminKycPage() {
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
                <h1 className={styles.page__title}>KYC заявки (админ)</h1>
                <AdminNotificationsBell />
              </div>
              <div className={styles.content}>
                <AdminKycList
                  type={["individual_full", "individual", "legal"]}
                  title="Заявки KYC"
                  hint="Основные анкеты клиентов, требующие проверки."
                  filterTypes={["individual_full", "legal"]}
                  fallbackTypes={["individual", "legal"]}
                  formType="full"
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
