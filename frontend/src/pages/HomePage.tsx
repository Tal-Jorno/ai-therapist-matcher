import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <div className="stack">
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 id="home-title" className={styles.title}>
          פסיכולוגי
        </h1>
        <p className={styles.subtitle}>התאמה חכמה לפסיכולוגים בעזרת AI</p>

        <div className={styles.actions}>
          <Link to="/user/chat" className={`${styles.button} ${styles.primary}`}>
            מצא פסיכולוג עם AI
          </Link>
          <Link
            to="/user/search"
            className={`${styles.button} ${styles.secondary}`}
          >
            חיפוש פסיכולוגים
          </Link>
        </div>
      </section>

      <div className={`grid ${styles.features}`} aria-label="Quick links">
        <Card title="התאמה באמצעות שיחה">
          <p className={styles.featureText}>
            ספרו לנו מה אתם מחפשים — והמערכת תציע התאמות על סמך הצרכים שלכם.
          </p>
          <p className={styles.featureText}>
            <Link to="/user/chat">מעבר לצ'אט התאמה</Link>
          </p>
        </Card>

        <Card title="חיפוש פסיכולוגים">
          <p className={styles.featureText}>
            חיפוש לפי פרמטרים והתמחויות (בקרוב יתווספו מסננים ותוצאות).
          </p>
          <p className={styles.featureText}>
            <Link to="/user/search">מעבר לחיפוש</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
