import styles from "../../page.module.css";
import Header from "../../components/Header/Header";
import ProfileFormData from "@/app/components/profileForm/profileFormData";
import ProfileFormContact from "@/app/components/profileForm/profileFormContact";
import ProfileBlockSafety from "@/app/components/profileForm/profileBlockSafety";
import PasswordAndActivation from "@/app/components/profileForm/profileBlockPass";
import SideBar from "../../components/Sidebar/sideBar";
import Footer from "../../components/Footer/Footer";
import { AuthGuard } from "@/app/guards/AuthGuard/AuthGuard";

export default function Profile() {

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
              <h1 className={styles.page__title}>Профиль</h1> 
              <div className={styles.content}>
                <ProfileFormData/>
                <ProfileFormContact/>
                <PasswordAndActivation/>
                <ProfileBlockSafety/>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );

}