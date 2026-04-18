import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import { useAuth } from '../../auth/types'

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link
}

export function Navbar() {
  const { session, isReady, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div>
          <NavLink to="/" className={styles.brandLink}>
            <span className={styles.dot} aria-hidden="true" />
            <span>פסיכולוגי</span>
          </NavLink>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink to="/" className={navClassName} end>
            דף הבית
          </NavLink>

          {session?.role === 'client' ? (
            <>
              <NavLink to="/user/chat" className={navClassName}>
                צ'אט התאמה
              </NavLink>
              <NavLink to="/user/search" className={navClassName}>
                חיפוש פסיכולוגים
              </NavLink>
            </>
          ) : null}

          {session?.role === 'therapist' ? (
            <>
              <NavLink to="/therapist/dashboard" className={navClassName}>
                לוח בקרה
              </NavLink>
              <NavLink to="/therapist/register" className={navClassName}>
                פרופיל
              </NavLink>
            </>
          ) : null}

          {!session ? (
            <>
              <NavLink to="/user/chat" className={navClassName}>
                צ'אט התאמה
              </NavLink>
              <NavLink to="/user/search" className={navClassName}>
                חיפוש פסיכולוגים
              </NavLink>
              <NavLink to="/therapist/register" className={navClassName}>
                אזור מטפלים
              </NavLink>
              <NavLink to="/login" className={navClassName}>
                התחברות
              </NavLink>
            </>
          ) : null}

          {isReady && session ? (
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                logout()
                navigate('/', { replace: true })
              }}
            >
              התנתקות
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
