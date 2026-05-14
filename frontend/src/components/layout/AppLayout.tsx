import { Outlet } from 'react-router-dom'
import { Navbar } from '../navigation/Navbar'
import styles from './AppLayout.module.css'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { BRAND_NAME_HE } from '../../constants/brand'

export function AppLayout() {
  useDocumentTitle(BRAND_NAME_HE)

  return (
    <div className={styles.shell}>
      <Navbar />

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.muted}>
            {BRAND_NAME_HE} • גרסת דמו (Frontend)
          </span>
        </div>
      </footer>
    </div>
  )
}
