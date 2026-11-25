import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/Layout/AppShell'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { QuotesPage } from './pages/QuotesPage'
import { QuoteBuilderPage } from './pages/QuoteBuilderPage'
import { ClientsPage } from './pages/ClientsPage'
import { JobsPage } from './pages/JobsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TeamPage } from './pages/TeamPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Route */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/quotes/new" element={<QuoteBuilderPage />} />
            <Route path="/quotes/:id" element={<QuoteBuilderPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<TeamPage />} />
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App