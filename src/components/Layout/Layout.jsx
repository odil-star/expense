import { useState } from 'react'
import { Outlet } from 'react-router'
import SvgSprite from '../SvgSprite/SvgSprite'
import Sidebar from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import './Layout.css'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar  = () => { setSidebarOpen(true);  document.body.style.overflow = 'hidden' }
  const closeSidebar = () => { setSidebarOpen(false); document.body.style.overflow = '' }
  const toggleSidebar = () => sidebarOpen ? closeSidebar() : openSidebar()

  return (
    <div className="dashboard-body">
      <SvgSprite />
      {sidebarOpen && (
        <div
          className="sidebar-overlay active"
          onClick={closeSidebar}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="content">
        <Topbar onBurgerClick={toggleSidebar} burgerOpen={sidebarOpen} />
        <Outlet />
      </div>
    </div>
  )
}
