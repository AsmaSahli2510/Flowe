import {
  Home,
  ListTodo,
  PanelsTopLeft,
  CalendarDays,
  Users,
  MessageCircle,
  Files,
  ChartNoAxesColumn,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import Avatar from "./Avatar";
import logo from "../images/logo.png";
const nav = [
  ["Home", Home],
  ["My Tasks", ListTodo],
  ["Projects", PanelsTopLeft],
  ["Calendar", CalendarDays],
  ["Team", Users],
  ["Messages", MessageCircle],
  ["Files", Files],
  ["Analytics", ChartNoAxesColumn],
];
export default function Sidebar({ collapsed, onToggle }) {
  const { page, setPage, setTab, setModal, setWorkspace } = useFlowe();
  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="brand">
        <button
          className="brand-logo"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Flowe home"}
          onClick={collapsed ? onToggle : undefined}
        >
          <img src={logo} alt="Flowe logo" />
        </button>
        <span className="brand-name">flowe</span>
        <span className="brand-arc" />
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav>
        {nav.map(([n, I]) => (
          <button
            className={page === n ? "active" : ""}
            key={n}
            title={collapsed ? n : undefined}
            onClick={() => {
              setPage(n);
              setTab(n === "Calendar" ? "Calendar" : "Board");
            }}
          >
            <I size={17} />
            <span>{n}</span>
            {n === "Messages" && <i>3</i>}
          </button>
        ))}
      </nav>
      <div className="favorites">
        <small>Favorites</small>
        {["Website Redesign", "Mobile App", "Marketing", "Personal"].map(
          (n, i) => (
            <button
              key={n}
              onClick={() => {
                setWorkspace(n);
                setPage("Projects");
              }}
            >
              <span
                style={{
                  background: ["#ffc3dc", "#ffe494", "#d7c4fa", "#bef4d9"][i],
                }}
              />
              {n}
            </button>
          ),
        )}
        <button
          className="add-workspace"
          onClick={() => {
            setModal({
              workspace: true,
              title: "",
            });
          }}
        >
          <Plus size={17} />
          Add workspace
        </button>
      </div>
      <div className="profile" aria-label="Signed in as Asma, Product Designer">
        <span className="profile-avatar">
          <Avatar />
          <i />
        </span>
        <div className="profile-details">
          <span className="signed-in">Signed in as</span>
          <b>Asma</b>
          <small>Product Designer</small>
        </div>
        <button
          aria-label="Settings"
          onClick={() =>
            setModal({
              settings: true,
            })
          }
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}
