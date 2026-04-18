import { Outlet } from 'react-router-dom'
import { Navbar } from '../navigation/Navbar'
import styles from './AppLayout.module.css'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export function AppLayout() {
  useDocumentTitle('פסיכולוגי')

  return (
    <div className={styles.shell}>
      <Navbar />

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.muted}>
            פסיכולוגי • גרסת דמו (Frontend)
          </span>
        </div>
      </footer>
    </div>
  )
}
