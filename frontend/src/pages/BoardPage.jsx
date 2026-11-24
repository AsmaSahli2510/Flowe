import LiveGarden from "../features/chat/components/LiveGarden";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Workspace from "../features/board/Workspace";
import { api } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/images/logoTransparent.png";
export default function ProjectBoard() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [chatSignal, setChatSignal] = useState(0);
  const [onlineMembers,setOnlineMembers] = useState([]);
  const [projects, setProjects] = useState(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Saved");
  const boardProps = useMemo(
    () =>
      projects?.map((p) => ({ ...p, visibility: p.visibility || "Workspace" })),
    [projects],
  );
  const revisions = useRef({});
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);
  const pending = useRef(0);
  useEffect(() => {
    let live = true;
    api(`/workspaces/${workspaceId}/projects`)
      .then((d) => {
        if (!live) return;
        if (!d.projects.some((p) => p._id === projectId))
          throw new Error("Project not found");
        revisions.current = Object.fromEntries(
          d.projects.map((p) => [p._id, p.revision]),
        );
        setProjects(d.projects);
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [workspaceId, projectId]);
  const persist = useCallback(
    (id, patch) => {
      if (!failed.current) setError("");
      pending.current++;
      setStatus("Saving…");
      const operation = queue.current.then(async () => {
        if (failed.current)
          throw Error("Reload the latest project before saving again");
        try {
          const { project } = await api(
            `/workspaces/${workspaceId}/projects/${id}`,
            {
              method: "PATCH",
              body: { ...patch, revision: revisions.current[id] },
            },
          );
          revisions.current[id] = project.revision;
          pending.current--;
          if (pending.current === 0) {
            setStatus("Saved");
            setProjects((ps) =>
              ps?.map((p) => (p._id === project._id ? project : p)),
            );
          }
          return project;
        } catch (e) {
          failed.current = !e.status || e.status === 409;
          setStatus("Not saved");
          pending.current = 0;
          throw e;
        }
      });
      queue.current = operation.catch(() => {});
      operation.catch((e) => setError(e.message));
      return operation;
    },
    [workspaceId],
  );
  useEffect(() => {
    function beforeUnload(e) {
      if (status !== "Saved") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [status]);
  async function leave(target) {
    await queue.current;
    if (!failed.current) navigate(target);
  }
  async function signout() {
    await queue.current;
    if (!failed.current) await logout();
  }
  if (error && !projects)
    return (
      <main className="flowe-loading">
        <h2>Your garden needs a moment.</h2>
        <p role="alert">{error}</p>
        <p>Recent changes may not have been saved.</p>
        <button onClick={() => window.location.reload()}>
          Reload latest version
        </button>
        <Link to="/workspace">My workspaces</Link>
      </main>
    );
  if (!projects)
    return (
      <main className="flowe-loading">
        <img src={logo} alt="" width="34" height="34" />
        Opening your project…
      </main>
    );
  return (
    <>
      <LiveGarden
        openSignal={chatSignal}
        currentUserId={user.id}
        onPresence={setOnlineMembers}
        workspaceId={workspaceId}
        projectId={projectId}
        onProject={(p) => {
          if (pending.current || p.revision <= revisions.current[p._id]) return;
          revisions.current[p._id] = p.revision;
          setProjects((ps) => ps?.map((x) => (x._id === p._id ? p : x)));
        }}
      />
      {error && (
        <div className="at-save-error" role="alert">
          {error}
          <button onClick={() => window.location.reload()}>
            Reload latest version
          </button>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      <Workspace
        key={workspaceId}
        initialBoards={boardProps}
        initialIndex={projects.findIndex((p) => p._id === projectId)}
        persist={persist}
        user={user}
        logout={signout}
        leave={leave}
        workspaceId={workspaceId}
        onlineMembers={onlineMembers}
        saveStatus={status}
        openMessages={()=>setChatSignal(value=>value+1)}
      />
    </>
  );
}
