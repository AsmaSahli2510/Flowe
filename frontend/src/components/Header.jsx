import { Plus, Search, Bell } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import Avatar from "./Avatar";
export default function Header() {
  const { query, setQuery, setModal, notice, setNotice, create } = useFlowe();
  return (
    <header className="topbar">
      <div className="search">
        <Search size={17} />
        <input
          aria-label="Search tasks"
          placeholder="Search tasks, projects, or people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="top-actions">
        <button
          className="mobile-account"
          aria-label="Signed in as Asma — account settings"
          onClick={() =>
            setModal({
              settings: true,
            })
          }
        >
          <span className="profile-avatar">
            <Avatar />
            <i />
          </span>
          <span>
            <small>Signed in as</small>
            <b>Asma</b>
          </span>
        </button>
        <button className="create" onClick={() => create()}>
          <Plus size={16} /> Create
        </button>
        <div className="notification-wrap">
          <button
            className="notification"
            aria-label="Notifications"
            onClick={() => setNotice(!notice)}
          >
            <Bell size={19} />
            <i />
          </button>
          {notice && (
            <div className="notification-panel">
              <b>You're all caught up</b>
              <p>Sarra moved UI kit to Review.</p>
              <p>Team sync · Today at 14:00</p>
            </div>
          )}
        </div>
        <div className="avatar-stack">
          {[0, 1, 2].map((p) => (
            <Avatar key={p} person={p} />
          ))}
          <span>+2</span>
        </div>
      </div>
    </header>
  );
}
