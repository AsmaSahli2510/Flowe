import { Plus, House, MessageCircle, Leaf, Star, FolderKanban, Folder, Users, Settings2, PanelLeftClose, PanelLeftOpen, ChevronDown } from 'lucide-react';
import { Flower } from '../features/dashboard/components/DashboardPrimitives';
import { accent, initials } from '../features/dashboard/utils/dashboard';

export default function DashboardSidebar({user, collapsed, setCollapsed, switchView, navItems, view, conversations, openChat, workspaces, isWorkspace, active, selectWorkspace, favorites, toggleFavorite, loading, open, favWorkspaces, favProjects, openProject, setFeatureNotice, setMenuOpen}) {
  return (
      <aside className="fd-sidebar">
        <div className="fd-brand-row">
          <button
            className="fd-brand"
            onClick={() => switchView("home")}
            title="My Flowe Home"
          >
            <Flower size={35} />
            {!collapsed && (
              <span>
                flowe<span className="fd-brand-period">.</span>
              </span>
            )}
          </button>
          <button
            className="fd-collapse fd-icon-button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>
        <div className="fd-side-scroll">
          <p className="fd-side-heading">{collapsed ? "" : "MY FLOWE"}</p>
          <nav aria-label="My Flowe" className="fd-nav">
            {navItems.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                className={`fd-nav-item ${view === id ? "is-active" : ""}`}
                title={label}
                onClick={() => {
                  switchView(id);
                  if (id === "messages") openChat();
                }}
              >
                <Icon size={19} />
                {!collapsed && (
                  <>
                    <span>{label}</span>
                    {id === "messages" &&
                      conversations.reduce((n, c) => n + (c.unread || 0), 0) >
                        0 && (
                        <small className="fd-nav-badge">
                          {conversations.reduce(
                            (n, c) => n + (c.unread || 0),
                            0,
                          )}
                        </small>
                      )}
                  </>
                )}
              </button>
            ))}
          </nav>
          <div className="fd-sidebar-separator" />
          <div className="fd-side-section">
            <div className="fd-side-section-title">
              <span>{collapsed ? "" : "WORKSPACES"}</span>
              <button
                title="New workspace"
                aria-label="New workspace"
                onClick={() => open("workspace")}
              >
                <Plus size={17} />
              </button>
            </div>
            <div className="fd-workspace-list">
              {workspaces.map((w, i) => (
                <div className="fd-workspace-entry" key={w._id}>
                  <button
                    title={w.name}
                    className={`fd-workspace-item ${isWorkspace && active === w._id ? "is-selected" : ""}`}
                    onClick={() => selectWorkspace(w._id)}
                  >
                    <span className={`fd-ws-symbol fd-${accent[i % 4]}`}>
                      <Leaf size={16} />
                    </span>
                    {!collapsed && <span>{w.name}</span>}
                  </button>
                  {!collapsed && (
                    <button
                      className="fd-workspace-star"
                      title={
                        favorites.includes(`workspace:${w._id}`)
                          ? "Remove favorite"
                          : "Favorite workspace"
                      }
                      aria-label={`Favorite workspace ${w.name}`}
                      onClick={() => toggleFavorite(`workspace:${w._id}`)}
                    >
                      <Star
                        size={15}
                        fill={
                          favorites.includes(`workspace:${w._id}`)
                            ? "#caa9ec"
                            : "none"
                        }
                      />
                    </button>
                  )}
                </div>
              ))}
              {!workspaces.length && !loading && !collapsed && (
                <button
                  className="fd-add-workspace"
                  onClick={() => open("workspace")}
                >
                  <Plus size={15} /> Create a workspace
                </button>
              )}
            </div>
            {isWorkspace && !collapsed && (
              <div className="fd-workspace-subnav">
                <button
                  className="fd-active-link"
                  onClick={() => switchView("workspace")}
                >
                  <House size={14} /> Overview
                </button>
                <button
                  onClick={() =>
                    document
                      .getElementById("fd-projects-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <FolderKanban size={14} /> Projects
                </button>
                <button onClick={() => open("members")}>
                  <Users size={14} /> Members
                </button>
                <button onClick={() => openChat()}>
                  <MessageCircle size={14} /> Conversations
                </button>
              </div>
            )}
          </div>
          <div className="fd-sidebar-separator" />
          <div className="fd-side-section">
            <div className="fd-side-section-title">
              <span>{collapsed ? "" : "FAVORITES"}</span>
              <Star size={collapsed ? 18 : 15} />
            </div>
            <div className="fd-favorites">
              {favWorkspaces.map((w) => (
                <button
                  title={w.name}
                  key={w._id}
                  onClick={() => selectWorkspace(w._id)}
                >
                  <Leaf size={16} />
                  {!collapsed && <span>{w.name}</span>}
                </button>
              ))}
              {favProjects.map((p) => (
                <button
                  title={p.name}
                  key={p._id}
                  onClick={() => openProject(p)}
                >
                  <Folder size={16} />
                  {!collapsed && <span>{p.name}</span>}
                </button>
              ))}
              {!favWorkspaces.length && !favProjects.length && !collapsed && (
                <p>Star a project to see it here.</p>
              )}
            </div>
          </div>
        </div>
        <div className="fd-side-bottom">
          <button
            className="fd-nav-item"
            title="Workspace settings"
            onClick={() =>
              setFeatureNotice(
                "Workspace settings will appear here as more controls become available.",
              )
            }
          >
            <Settings2 size={18} />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            className="fd-profile-mini"
            title={user.name}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="fd-avatar fd-avatar-pink">
              {initials(user.name)}
            </span>
            {!collapsed && (
              <span className="fd-profile-name">
                <strong>{user.name}</strong>
                <small>Personal account</small>
              </span>
            )}
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
  );
}
