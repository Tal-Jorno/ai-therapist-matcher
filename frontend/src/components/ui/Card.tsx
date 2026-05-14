import type { ReactNode } from 'react'
import styles from './Card.module.css'

export function Card(props: { title?: string; children: ReactNode }) {
  return (
    <section className={styles.card}>
      {props.title ? <h2 className={styles.title}>{props.title}</h2> : null}
      <div className={styles.body}>{props.children}</div>
    </section>
  )
}
