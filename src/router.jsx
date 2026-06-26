import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Auth from './pages/Auth/Auth'
import Dashboard from './pages/Dashboard/Dashboard'
import Analytics from './pages/Analytics/Analytics'
import Income from './pages/Income/Income'
import Budget from './pages/Budget/Budget'
import Calendar from './pages/Calendar/Calendar'
import AddExpense from './pages/AddExpense/AddExpense'
import ExpenseList from './pages/ExpenseList/ExpenseList'
import AIAnalysis from './pages/AIAnalysis/AIAnalysis'
import Credits from './pages/Credits/Credits'
import NotFound from './pages/NotFound/NotFound'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Auth />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,         element: <Dashboard /> },
      { path: 'analytics',  element: <Analytics /> },
      { path: 'income',     element: <Income /> },
      { path: 'budget',     element: <Budget /> },
      { path: 'calendar',   element: <Calendar /> },
      { path: 'add',        element: <AddExpense /> },
      { path: 'expenses',    element: <ExpenseList /> },
      { path: 'ai-analysis', element: <AIAnalysis /> },
      { path: 'credits',     element: <Credits /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
