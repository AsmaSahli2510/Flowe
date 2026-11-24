import ReceivedInvitations from "../invitations/components/ReceivedInvitations";
import DashboardContent from "./components/DashboardContent";
import DashboardModal from "./components/DashboardModal";
import DashboardSidebar from "../../layouts/DashboardSidebar";
import DashboardTopbar from "../../layouts/DashboardNavbar";
import { totalCards, projectProgress, accent } from "./utils/dashboard";
import { Flower } from "./components/DashboardPrimitives";
import LiveGarden from "../chat/components/LiveGarden";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, House, CheckSquare2, MessageCircle, CalendarDays, Star, FolderKanban, Clock3, CheckCircle2, ListTodo } from "lucide-react";
import { api } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

import "./DashboardPanels.css";

export default function Hub() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [active, setActive] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsByWorkspace, setProjectsByWorkspace] = useState({});
  const [templates, setTemplates] = useState([]);
  const [members, setMembers] = useState([]);
  const [online, setOnline] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [view, setView] = useState("home");
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("flowe-sidebar-collapsed") === "true",
  );
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("flowe-dashboard-favorites") || "[]",
      );
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false),
    [invitations, setInvitations] = useState([]);

  const [showAllProjects, setShowAllProjects] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications,setNotifications] = useState([]);
  useEffect(()=>{
    let active=true;
    const refresh=()=>api('/notifications').then(d=>active&&setNotifications(d.notifications||[])).catch(()=>{});
    refresh();
    const event=()=>refresh();window.addEventListener('flowe-notification',event);
    return ()=>{active=false;window.removeEventListener('flowe-notification',event)};
  },[]);
  const [chatSignal, setChatSignal] = useState(0);
  const [newChatSignal, setNewChatSignal] = useState(0);
  const [featureNotice, setFeatureNotice] = useState("");
  const searchRef = useRef(null);
  const [loading, setLoading] = useState(true),
    [projectLoading, setProjectLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(""),
    [busy, setBusy] = useState(false);
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [template, setTemplate] = useState("study"),
    [columns, setColumns] = useState("Ideas, In progress, Done"),
    [inviteEmail, setInviteEmail] = useState(""),
    [inviteURL, setInviteURL] = useState("");
  const workspace = workspaces.find((w) => w._id === active);
  const owner = workspace?.owner === user.id;
  useEffect(()=>{if(new URLSearchParams(window.location.search).get('members')==='1')setModal('members')},[]);
  useEffect(() => {
    if (modal === "members" && owner)
      api(`/workspaces/${active}/invitations`)
        .then((d) => setInvitations(d.invitations))
        .catch((e) => setError(e.message));
  }, [modal, active, owner]);
  const isWorkspace = view === "workspace";
  const firstName = (user?.name || "there").split(" ")[0];
  const allProjects = useMemo(
    () =>
      workspaces.flatMap((w) =>
        (projectsByWorkspace[w._id] || []).map((p) => ({
          ...p,
          workspaceId: w._id,
          workspaceName: w.name,
        })),
      ),
    [workspaces, projectsByWorkspace],
  );
  const scopedProjects = isWorkspace
    ? projects.map((p) => ({
        ...p,
        workspaceId: active,
        workspaceName: workspace?.name,
      }))
    : allProjects;
  const visibleProjects = scopedProjects
    .filter((p) => !!p.archived === showArchived)
    .filter((p) =>
      [p.name, p.subtitle, p.workspaceName].some((value) =>
        (value || "").toLowerCase().includes(search.trim().toLowerCase()),
      ),
    );
  const allCards = allProjects.flatMap((p) => totalCards(p));
  const doneCards = allCards.filter((c) => c.completed).length;
  const workStats = [
    {
      label: "Total cards",
      number: allCards.length,
      icon: ListTodo,
      color: "lavender",
    },
    {
      label: "In progress",
      number: allCards.length - doneCards,
      icon: Clock3,
      color: "mint",
    },
    {
      label: "Completed",
      number: doneCards,
      icon: CheckCircle2,
      color: "butter",
    },
    {
      label: "Projects",
      number: allProjects.length,
      icon: FolderKanban,
      color: "pink",
    },
  ];
  const upcomingCards = useMemo(()=>{
    const today=new Date();today.setHours(0,0,0,0);
    const limit=new Date(today);limit.setDate(limit.getDate()+21);
    const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const start=key(today),end=key(limit);
    return allProjects.flatMap(project=>(project.lists||[]).filter(l=>!l.archived).flatMap(list=>(list.cards||[])
      .filter(c=>!c.archived&&!c.completed&&c.due&&c.due>=start&&c.due<=end)
      .map(card=>({...card,projectId:project._id,workspaceId:project.workspaceId,projectName:project.name})))).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,8);
  },[allProjects]);
  const recentUpdates = [...scopedProjects]
    .filter((p) => p.updatedAt || p.createdAt)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt),
    )
    .slice(0, 4);
  const favProjects = allProjects.filter((p) =>
    favorites.includes(`project:${p._id}`),
  );
  const favWorkspaces = workspaces.filter((w) =>
    favorites.includes(`workspace:${w._id}`),
  );
  const now = new Date();
  useEffect(() => {
    let live = true;
    Promise.all([api("/workspaces"), api("/templates")])
      .then(([w, t]) => {
        if (!live) return;
        setWorkspaces(w.workspaces);
        const preferred = sessionStorage.getItem("flowe-workspace");
        setActive(
          w.workspaces.find((x) => x._id === preferred)
            ? preferred
            : w.workspaces[0]?._id || "",
        );
        setTemplates(t.templates);
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!workspaces.length) {
      setProjectsByWorkspace({});
      return;
    }
    let live = true;
    Promise.all(
      workspaces.map(async (w) => {
        try {
          const response = await api(`/workspaces/${w._id}/projects`);
          return [w._id, response.projects || []];
        } catch {
          return [w._id, []];
        }
      }),
    ).then(
      (entries) => live && setProjectsByWorkspace(Object.fromEntries(entries)),
    );
    return () => {
      live = false;
    };
  }, [workspaces]);
  useEffect(() => {
    let live = true;
    setProjects([]);
    setMembers([]);
    setConversations([]);
    setOnline([]);
    if (!active) return;
    sessionStorage.setItem("flowe-workspace", active);
    setProjectLoading(true);
    setError("");
    Promise.all([
      api(`/workspaces/${active}/projects`),
      api(`/workspaces/${active}/members`),
    ])
      .then(([p, m]) => {
        if (!live) return;
        setProjects(p.projects || []);
        setMembers(m.members || []);
        setProjectsByWorkspace((previous) => ({
          ...previous,
          [active]: p.projects || [],
        }));
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setProjectLoading(false));
    return () => {
      live = false;
    };
  }, [active]);
  useEffect(()=>{
    if(!active)return;
    let alive=true;
    const refresh=()=>api(`/workspaces/${active}/members`).then(d=>alive&&setMembers(d.members||[])).catch(()=>{});
    window.addEventListener('flowe-members-changed',refresh);
    window.addEventListener('focus',refresh);
    return()=>{alive=false;window.removeEventListener('flowe-members-changed',refresh);window.removeEventListener('focus',refresh)};
  },[active]);
  useEffect(()=>{
    if(!active)return;
    let alive=true;
    const refresh=()=>api(`/workspaces/${active}/projects`).then(d=>{if(alive){setProjects(d.projects||[]);setProjectsByWorkspace(previous=>({...previous,[active]:d.projects||[]}))}}).catch(()=>{});
    window.addEventListener('flowe-projects-changed',refresh);
    window.addEventListener('focus',refresh);
    return()=>{alive=false;window.removeEventListener('flowe-projects-changed',refresh);window.removeEventListener('focus',refresh)};
  },[active]);
  useEffect(() => {
    localStorage.setItem("flowe-sidebar-collapsed", String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    localStorage.setItem(
      "flowe-dashboard-favorites",
      JSON.stringify(favorites),
    );
  }, [favorites]);
  useEffect(() => {
    const keydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotificationsOpen(false);
        setFeatureNotice("");
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  function open(kind) {
    setModal(kind);
    setName("");
    setDescription("");
    setInviteURL("");
    setInviteEmail("");
    setTemplate("study");
    setError("");
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (modal === "workspace") {
        const { workspace: w } = await api("/workspaces", {
          method: "POST",
          body: { name, description },
        });
        setWorkspaces((ws) => [...ws, w]);
        setActive(w._id);
        setView("workspace");
        setModal("");
        setNotice("Workspace created successfully.");
      }
      if (modal === "project") {
        const { project } = await api(`/workspaces/${active}/projects`, {
          method: "POST",
          body: {
            name,
            template,
            columns: columns
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        });
        navigate(`/workspace/${active}/project/${project._id}`);
      }
      if (modal === "invite") {
        const data = await api(`/workspaces/${active}/invitations`, {
          method: "POST",
          body: { email: inviteEmail },
        });
        setInviteURL(data.url);
        setNotice("Invitation created. Its email is queued for delivery.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signout() {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      setError(e.message);
    }
  }
  function selectWorkspace(id) {
    setActive(id);
    setView("workspace");
    setSearch("");
    setShowAllProjects(false);
    setFeatureNotice("");
  }
  function switchView(next) {
    setView(next);
    setSearch("");
    setFeatureNotice("");
  }
  function toggleFavorite(key) {
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  }
  async function refreshWorkspace() {
    if (!active) return;
    setProjectLoading(true);
    try {
      const d = await api(`/workspaces/${active}/projects`);
      setProjects(d.projects || []);
      setProjectsByWorkspace((prev) => ({
        ...prev,
        [active]: d.projects || [],
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setProjectLoading(false);
    }
  }
  function openFirstBoard() {
    const p = (isWorkspace ? projects : allProjects).find(p => !p.archived);
    if(p) openProject(p);
    else setFeatureNotice('Create a project to start planning together.');
  }
  function openChat(newConversation = false) {
    if (!active) {
      setFeatureNotice("Join or create a workspace to start chatting.");
      return;
    }
    if (newConversation) setNewChatSignal((x) => x + 1);
    else setChatSignal((x) => x + 1);
  }
  function openProject(p) {
    navigate(`/workspace/${p.workspaceId || active}/project/${p._id}`);
  }
  function projectCard(p, index) {
    const progress = projectProgress(p);
    const cards = totalCards(p);
    return (
      <article key={`${p.workspaceId}:${p._id}`} className="fd-project-card">
        <div className="fd-project-top">
          <button
            type="button"
            className={`fd-project-icon fd-${accent[index % 4]}`}
            onClick={() => openProject(p)}
            aria-label={`Open ${p.name}`}
          >
            <Flower size={31} />
          </button>
          <div className="fd-project-heading">
            <button className="fd-project-title" onClick={() => openProject(p)}>
              <h3>{p.name}</h3>
            </button>
            <small>
              {p.workspaceName || "Workspace"} ·{" "}
              {p.template === "study"
                ? "Study"
                : p.template === "scrum"
                  ? "Scrum"
                  : p.template === "custom"
                    ? "Custom"
                    : "Board"}
            </small>
          </div>
          <button
            className="fd-icon-button fd-fav-project"
            aria-label={
              favorites.includes(`project:${p._id}`)
                ? `Remove ${p.name} from favorites`
                : `Favorite ${p.name}`
            }
            title="Toggle favorite"
            onClick={() => toggleFavorite(`project:${p._id}`)}
          >
            <Star
              size={16}
              fill={favorites.includes(`project:${p._id}`) ? "#c8a5ef" : "none"}
            />
          </button>
        </div>
        <div className="fd-project-bottom">
          <div className="fd-project-meta">
            <span>
              {cards.length} {cards.length === 1 ? "card" : "cards"}
            </span>
            {progress === null ? (
              <span>No progress yet</span>
            ) : (
              <span>{progress}% completed</span>
            )}
          </div>
          <div className="fd-progress">
            <span
              style={{ width: `${progress || 0}%` }}
              className={`fd-bar-${accent[index % 4]}`}
            />
          </div>
          <div className="fd-project-footer">
            <span className="fd-soft-label">
              {p.lists?.length || 0} columns
            </span>
            <button onClick={() => openProject(p)}>
              Open board <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  const navItems = [
    { id: "home", label: "Home", Icon: House },
    { id: "work", label: "My Work", Icon: CheckSquare2 },
    { id: "messages", label: "Messages", Icon: MessageCircle },
    { id: "calendar", label: "Calendar", Icon: CalendarDays },
  ];
  const activeTitle = isWorkspace
    ? workspace?.name
    : view === "home"
      ? "My Flowe"
      : navItems.find((n) => n.id === view)?.label || "My Flowe";
  function previewFeature() {
    setFeatureNotice(
      "AI project generation is planned for Sprint 6. Your existing project templates are available now.",
    );
  }
  return (
    <main className={`fd-shell ${collapsed ? "fd-collapsed" : ""}`}>
      {active && (
        <LiveGarden
          key={active}
          currentUserId={user.id}
          workspaceId={active}
          onConversations={setConversations}
          onPresence={setOnline}
          openSignal={chatSignal}
          newConversationSignal={newChatSignal}
        />
      )}
      <DashboardSidebar {...{user, collapsed, setCollapsed, switchView, navItems, view, conversations, openChat, workspaces, isWorkspace, active, selectWorkspace, favorites, toggleFavorite, loading, open, favWorkspaces, favProjects, openProject, setFeatureNotice, setMenuOpen}} />
      <div className="fd-main">
        <DashboardTopbar {...{user, isWorkspace, searchRef, search, setSearch, setNotificationsOpen, notifications, setMenuOpen, menuOpen, signout, notificationsOpen, setNotifications, setError, navigate, setView}} />
        <div className="fd-invitations-shell"><ReceivedInvitations /></div>
        <DashboardContent {...{error, modal, notice, setNotice, featureNotice, setFeatureNotice, loading, workspaces, isWorkspace, workspace, members, owner, showAllProjects, setShowAllProjects, visibleProjects, projectCard, projectLoading, search, refreshWorkspace, recentUpdates, upcomingCards, openProject, openFirstBoard, setSearch, projects, online, openChat, conversations, view, now, firstName, previewFeature, switchView, workStats, setNotificationsOpen, activeTitle, allProjects, user, navigate, showArchived, setShowArchived, active, setActive, open}} />
      </div>
      <DashboardModal {...{modal, busy, setModal, workspace, error, members, owner, user, active, setMembers, setError, invitations, setInvitations, submit, inviteEmail, setInviteEmail, inviteURL, setNotice, name, setName, workspaces, setActive, description, setDescription, templates, template, setTemplate, columns, setColumns, open}} />
    </main>
  );
}
