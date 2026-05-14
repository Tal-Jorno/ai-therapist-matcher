import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <div className="stack">
      <Card title="404">
        <p>
          הדף לא נמצא. חזרה אל <Link to="/">דף הבית</Link>.
        </p>
      </Card>
    </div>
  )
}
