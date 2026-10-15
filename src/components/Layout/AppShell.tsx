import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Toaster } from '../Toast/Toaster'

export function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}