import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/Layout/AppShell'
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
