"use client";

import styles from "../../../page.module.css";
import Header from "../../../components/Header/Header";
import SideBar from "../../../components/Sidebar/sideBar";
import Footer from "../../../components/Footer/Footer";
import AdminCardRequests from "../../../components/AdminCardRequests/AdminCardRequests";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";
import AdminNotificationsBell from "@/app/components/AdminNotifications/AdminNotificationsBell";

export default function AdminCardRequestsPage() {
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
                <h1 className={styles.page__title}>Заявки</h1>
                <AdminNotificationsBell />
              </div>
              <div className={styles.content}>
                <AdminCardRequests />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
