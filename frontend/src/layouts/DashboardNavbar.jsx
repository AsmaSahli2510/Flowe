import NotificationBell from '../features/notifications/components/NotificationBell';
import { Bell, ChevronDown, Search, LogOut } from 'lucide-react';
import { api } from '../services/apiClient';
import { Flower } from '../features/dashboard/components/DashboardPrimitives';
import { initials } from '../features/dashboard/utils/dashboard';

export default function DashboardTopbar({user, isWorkspace, searchRef, search, setSearch, setNotificationsOpen, notifications, setMenuOpen, menuOpen, signout, notificationsOpen, setNotifications, setError, navigate, setView}) {
  return (
        <header className="fd-topbar">
          <div className="fd-top-context">
            {isWorkspace ? "WORKSPACE" : "MY FLOWE"} <Flower size={18} />
          </div>
          <label className="fd-search">
            <Search size={18} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
              placeholder="Search projects across your workspaces..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="fd-top-actions">
            <NotificationBell/>
            <button
              className="fd-top-profile"
              title="My profile"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="fd-avatar fd-avatar-pink">
                {initials(user.name)}
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
          {menuOpen && (
            <div className="fd-floating-menu fd-profile-menu">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
              <button onClick={signout}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </header>
  );
}
