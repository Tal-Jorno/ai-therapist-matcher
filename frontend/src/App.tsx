import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UserChatPage } from './pages/user/UserChatPage'
import { UserSearchPage } from './pages/user/UserSearchPage'
import { TherapistRegisterPage } from './pages/therapist/TherapistRegisterPage'
import { TherapistDashboardPage } from './pages/therapist/TherapistDashboardPage'
import { PaymentPage } from './pages/PaymentPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RequireRole } from './auth/types'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route path="user">
          <Route index element={<Navigate to="chat" replace />} />
          <Route
            path="chat"
            element={
              <RequireRole role="client">
                <UserChatPage />
              </RequireRole>
            }
          />
          <Route
            path="search"
            element={
              <RequireRole role="client">
                <UserSearchPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="therapist">
          <Route index element={<Navigate to="register" replace />} />
          <Route path="register" element={<TherapistRegisterPage />} />
          <Route
            path="dashboard"
            element={
              <RequireRole role="therapist">
                <TherapistDashboardPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="payment" element={<PaymentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
