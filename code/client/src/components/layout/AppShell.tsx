import { type JSX } from 'react';
import {
  Activity,
  Bell,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  CloudUpload,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Pill,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { useAuth } from '../../hooks/useAuth';

const clinicianNavigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Patients', to: '/patients', icon: Users },
  { label: 'Profile', to: '/profile', icon: UserRound },
];

const patientNavigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My records', to: '/patient/records', icon: ClipboardList },
  { label: 'Reports', to: '/patient/reports', icon: FileText },
  { label: 'Medicines', to: '/patient/medications', icon: Pill },
  { label: 'Visits', to: '/patient/records', icon: CalendarDays },
  { label: 'AI Summary', to: '/patient/ai-summary', icon: BrainCircuit },
  { label: 'My Doctors', to: '/patient/doctors', icon: Stethoscope },
  { label: 'Upload', to: '/patient/reports/upload', icon: CloudUpload },
  { label: 'Privacy & Access', to: '/patient/privacy', icon: LockKeyhole },
  { label: 'Notifications', to: '/patient/notifications', icon: Bell },
  { label: 'Profile', to: '/patient/profile', icon: UserRound },
];

export function AppShell(): JSX.Element {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUiStore();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navigation = user?.role === 'patient' ? patientNavigation : clinicianNavigation;

  return (
    <div className={`app-shell ${user?.role === 'patient' ? 'patient-shell' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <Activity size={18} />
          </span>
          <span>{user?.role === 'patient' ? 'HealthRecord AI' : 'Careframe'}</span>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>Development workspace</p>
          <button
            className="logout-link"
            onClick={() => void logout().then(() => navigate('/login'))}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <button className="sidebar-backdrop" aria-label="Close navigation" onClick={closeSidebar} />
      )}
      <div className="shell-content">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Toggle navigation"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="topbar-context">
            {user?.role === 'patient' ? user.name : 'Clinical workspace'}
          </span>
          <div className="avatar">{user?.name.slice(0, 2).toUpperCase()}</div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
