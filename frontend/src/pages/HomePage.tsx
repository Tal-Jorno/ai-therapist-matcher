import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'
import { BRAND_NAME_HE } from '../constants/brand'

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroBg} aria-hidden="true">
          <span className={styles.orb1} />
          <span className={styles.orb2} />
          <span className={styles.orb3} />
          <span className={styles.gridGlow} />
        </div>

        <div className={`${styles.heroInner} fadeIn`}>
          <div className={styles.heroContent}>
            <div className={styles.kicker}>
              <span className={styles.kickerDot} aria-hidden="true" />
              פרטיות מובטחת
            </div>

            <h1 id="home-title" className={styles.title}>
              {BRAND_NAME_HE}
            </h1>

            <p className={styles.subtitle}>AI עדין שמוביל להתאמה נכונה — בשיחה קצרה, בלי עומס.</p>

            <div className={styles.actions}>
              <Link to="/user/chat" className={`${styles.button} ${styles.primary}`}>
                מצא פסיכולוג עם AI
                <span className={styles.arrow} aria-hidden="true">
                  ←
                </span>
              </Link>
              <Link to="/user/search" className={`${styles.button} ${styles.secondary}`}>
                חיפוש פסיכולוגים
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.visualStage}>
              <div className={styles.stageGlow} />
              <div className={styles.neuralGlass}>
                <div className={styles.neuralTop}>
                  <span className={styles.pulseDot} />
                  התאמה חכמה
                </div>

                <div className={styles.neuralCanvas}>
                  {/* abstract “matching network” */}
                  <span className={`${styles.node} ${styles.n1}`} />
                  <span className={`${styles.node} ${styles.n2}`} />
                  <span className={`${styles.node} ${styles.n3}`} />
                  <span className={`${styles.node} ${styles.n4}`} />
                  <span className={`${styles.node} ${styles.n5}`} />
                  <span className={`${styles.node} ${styles.n6}`} />

                  {/* ambient trust bubbles */}
                  <span className={`${styles.bubble} ${styles.b1}`}>המקום הבטוח שלך</span>
                  <span className={`${styles.bubble} ${styles.b2}`}>דיוק רגשי</span>
                  <span className={`${styles.bubble} ${styles.b3}`}>התאמה מדויקת</span>
                  <span className={`${styles.bubble} ${styles.b4}`}>פרטיות מובטחת</span>
                  <span className={`${styles.bubble} ${styles.b5}`}>AI מותאם אישית</span>
                  <span className={`${styles.bubble} ${styles.b6}`}>שיחה נעימה</span>
                  <span className={`${styles.bubble} ${styles.b7}`}>התאמה חכמה</span>
                  <span className={`${styles.bubble} ${styles.b8}`}>מגוון פסיכולוגים מקצועיים</span>
                </div>

                <div className={styles.neuralBottom}>
                  <span className={styles.signalPill}>שיחה</span>
                  <span className={styles.signalPill}>פילוח</span>
                  <span className={styles.signalPill}>התאמה</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
