import SharedCard from "./SharedCard";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../../../services/apiClient";
import "./LiveGarden.css";
export default function LiveGarden({
  workspaceId,
  projectId,
  currentUserId,
  onProject,
  onConversations,
  onPresence,
  openSignal,
  newConversationSignal,
}) {
  const [knock, setKnock] = useState(null);
  const sendAttempt = useRef(null),
    groupAttempt = useRef(null);
  const [shared, setShared] = useState(""),
    [projectOptions, setProjectOptions] = useState([]),
    [conversion, setConversion] = useState(null);
  useEffect(() => {
    if (workspaceId)
      api(`/workspaces/${workspaceId}/projects`)
        .then((d) => setProjectOptions(d.projects.filter((p) => !p.archived)))
        .catch(() => {});
  }, [workspaceId, openSignal]);
  const socket = useRef(),
    current = useRef(""),
    callback = useRef(onProject),
    summaryCallbacks = useRef({});
  callback.current = onProject;
  summaryCallbacks.current = { onConversations, onPresence };
  const [online, setOnline] = useState([]),
    [connected, setConnected] = useState(false),
    [open, setOpen] = useState(false),
    [conversations, setConversations] = useState([]),
    [members, setMembers] = useState([]),
    [selected, setSelected] = useState(""),
    [threadSearch,setThreadSearch]=useState(''),
    [messages, setMessages] = useState([]),
    [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [typing, setTyping] = useState(""),
    [creating, setCreating] = useState(false),
    [chosen, setChosen] = useState([]),
    [name, setName] = useState(""),
    [cursors, setCursors] = useState({}),
    [showCursors, setShowCursors] = useState(true);
  async function call(event, data = {}) {
    const result = await socket.current.timeout(8000).emitWithAck(event, data);
    if (!result.ok) throw Error(result.message);
    return result;
  }
  async function refresh() {
    try {
      const items = (await call("conversations")).conversations;
      setConversations(items);
      summaryCallbacks.current.onConversations?.(items);
    } catch (e) {
      setError(e.message);
    }
  }
  async function history(id) {
    try {
      const data = await call("history", { id });
      if (current.current !== id) return;
      setMessages(data.messages);
      await call("read", { id });
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (!workspaceId) return;
    let live = true;
    const s = io({ autoConnect: false, withCredentials: true });
    socket.current = s;
    s.on("connect", async () => {
      try {
        await call("join", { workspace: workspaceId, project: projectId });
        if (!live) return;
        setConnected(true);
        setError("");
        refresh();
        if (current.current) history(current.current);
        if (projectId)
          api(`/workspaces/${workspaceId}/projects`).then((d) => {
            const p = d.projects.find((p) => p._id === projectId);
            if (p) callback.current?.(p);
          });
      } catch (e) {
        setError(e.message);
      }
    });
    s.on("disconnect", () => {
      setConnected(false);
      setOnline([]);
      setCursors({});
    });
    s.on("accessRevoked", () => {
      setError("Your project access was removed.");
      setMessages([]);
      setConversations([]);
    });
    s.on("connect_error", () =>
      setError("Connection unavailable. Reconnecting…"),
    );
    s.on("cardHelp", setKnock);
    s.on("presence", (people) => {
      setOnline(people);
      summaryCallbacks.current.onPresence?.(people);
    });
    s.on('activityChanged', payload=>window.dispatchEvent(new CustomEvent('flowe-activity-changed',{detail:payload})));
    s.on('notification', payload=>window.dispatchEvent(new CustomEvent('flowe-notification',{detail:payload})));
    s.on("conversationChanged", refresh);
    s.on("workspaceMembersChanged",()=>window.dispatchEvent(new Event('flowe-members-changed')));
    s.on('workspaceProjectsChanged',()=>window.dispatchEvent(new Event('flowe-projects-changed')));
    s.on("projectChanged", (p) => callback.current?.(p));
    s.on("message", (m) => {
      refresh();
      if (current.current === m.conversation) {
        setMessages((ms) =>
          ms.some((x) => x._id === m._id) ? ms : [...ms, m],
        );
        if (document.visibilityState === "visible")
          call("read", { id: m.conversation }).catch(() => {});
      }
    });
    s.on("typing", (d) => {
      if (d.id === current.current) {
        setTyping(d.name + " is typing…");
        setTimeout(() => setTyping(""), 2500);
      }
    });
    s.on("cursor", (d) =>
      setCursors((c) => ({ ...c, [d.id]: { ...d, time: Date.now() } })),
    );
    s.on("cursorGone", (id) =>
      setCursors((c) => {
        const n = { ...c };
        delete n[id];
        return n;
      }),
    );
    s.connect();
    api(`/workspaces/${workspaceId}/members`)
      .then((d) => live && setMembers(d.members))
      .catch((e) => setError(e.message));
    const timer = setInterval(
      () =>
        setCursors((c) =>
          Object.fromEntries(
            Object.entries(c).filter(([, v]) => Date.now() - v.time < 5000),
          ),
        ),
      1000,
    );
    function visibility() {
      if (document.visibilityState === "visible" && current.current)
        history(current.current);
    }
    document.addEventListener("visibilitychange", visibility);
    return () => {
      live = false;
      s.disconnect();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [workspaceId, projectId]);
  useEffect(() => {
    if (!projectId) return;
    let last = 0;
    function move(e) {
      const board = document.querySelector(".fw-board-scroll");
      if (!board || !board.contains(e.target) || Date.now() - last < 100)
        return;
      last = Date.now();
      const box = board.getBoundingClientRect();
      const card = e.target.closest(".fw-task-card"),
        list = e.target.closest(".fw-list");
      const anchor = card || list || board;
      const r = anchor.getBoundingClientRect();
      socket.current?.emit("cursor", {
        x:
          anchor === board
            ? e.clientX - box.left + board.scrollLeft
            : (e.clientX - r.left) / r.width,
        y:
          anchor === board
            ? e.clientY - box.top + board.scrollTop
            : (e.clientY - r.top) / r.height,
        anchor: anchor.dataset.liveId || null,
      });
    }
    document.addEventListener("pointermove", move);
    return () => document.removeEventListener("pointermove", move);
  }, [projectId]);
  useEffect(() => {
    if (openSignal > 0) {
      setOpen(true);
      setCreating(false);
    }
  }, [openSignal]);
  useEffect(() => {
    if (newConversationSignal > 0) {
      setOpen(true);
      setCreating(true);
    }
  }, [newConversationSignal]);
  const [, renderTick] = useState(0);
  useEffect(() => {
    if (!projectId) return;
    const t = setInterval(() => renderTick((n) => n + 1), 120);
    return () => clearInterval(t);
  }, [projectId]);
  function cursorPosition(c) {
    const board = document.querySelector(".fw-board-scroll");
    if (!board) return null;
    let anchor = c.anchor
      ? [...board.querySelectorAll("[data-live-id]")].find(
          (el) => el.dataset.liveId === c.anchor,
        )
      : board;
    if (!anchor) return null;
    const r = anchor.getBoundingClientRect(),
      b = board.getBoundingClientRect();
    const x =
        anchor === board
          ? r.left + c.x - board.scrollLeft
          : r.left + c.x * r.width,
      y =
        anchor === board
          ? r.top + c.y - board.scrollTop
          : r.top + c.y * r.height;
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom
      ? { left: x, top: y }
      : null;
  }
  async function choose(id) {
    current.current = id;
    setSelected(id);
    setMessages([]);
    setTyping("");
    await history(id);
  }
  async function send(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setError("");
    try {
      if (!sendAttempt.current) sendAttempt.current = crypto.randomUUID();
      const card = shared ? JSON.parse(shared) : undefined;
      await call("send", {
        id: selected,
        text: draft,
        clientId: sendAttempt.current,
        card,
      });
      sendAttempt.current = null;
      setDraft("");
      setShared("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      {knock && (
        <div className="st-mini" role="status">
          <span>{knock.name} needs your help on a card.</span>
          <a
            href={`/workspace/${knock.workspace}/project/${knock.project}?card=${knock.card}`}
          >
            Open task ↗
          </a>
          <button
            aria-label="Dismiss help request"
            onClick={() => setKnock(null)}
          >
            ✕
          </button>
        </div>
      )}
      {conversion && (
        <div className="at-overlay" style={{ zIndex: 1600 }}>
          <section className="at-modal">
            <header>
              <h2>From conversation to action</h2>
              <button onClick={() => setConversion(null)}>✕</button>
            </header>
            <div className="at-body">
              <p className="at-hint">
                Review the text below. Only this text is shared with the
                project; the private conversation stays private.
              </p>
              <label>
                Card title
                <textarea
                  maxLength={240}
                  value={conversion.title}
                  onChange={(e) =>
                    setConversion({ ...conversion, title: e.target.value })
                  }
                />
              </label>
              <label>
                Project
                <select
                  value={conversion.project}
                  onChange={(e) =>
                    setConversion({
                      ...conversion,
                      project: e.target.value,
                      column:
                        projectOptions.find((p) => p._id === e.target.value)
                          ?.lists[0]?.id || "",
                    })
                  }
                >
                  {projectOptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Column
                <select
                  value={conversion.column}
                  onChange={(e) =>
                    setConversion({
                      ...conversion,
                      column: Number(e.target.value),
                    })
                  }
                >
                  {projectOptions
                    .find((p) => p._id === conversion.project)
                    ?.lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                </select>
              </label>
              <button
                onClick={async () => {
                  try {
                    await call("messageToCard", {
                      id: selected,
                      messageId: conversion.message._id,
                      project: conversion.project,
                      column: conversion.column,
                      title: conversion.title,
                    });
                    setConversion(null);
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Create linked card
              </button>
            </div>
          </section>
        </div>
      )}

      {projectId &&
        showCursors &&
        Object.values(cursors).map((c) => {
          const pos = cursorPosition(c);
          return (
            pos && (
              <div key={c.id} className="lg-cursor" style={pos}>
                ➤{" "}
                <span
                  style={{
                    background: ["#e6d1f3", "#f5cddd", "#c7ecd5", "#ffe9a8"][
                      [...c.userId].reduce((n, x) => n + x.charCodeAt(0), 0) % 4
                    ],
                  }}
                >
                  {c.name}
                </span>
              </div>
            )
          );
        })}
      {open && (
        <>
          <button
            className="lg-backdrop"
            aria-label="Close chat"
            onClick={() => {
              setOpen(false);
              current.current = "";
              setSelected("");
            }}
          />
          <aside className="lg-panel" aria-label="Team chat">
            <header>
              <div>
                <small>TEAM WORKSPACE</small>
                <h2>Chat</h2>
              </div>
              <button
                className="lg-close"
                aria-label="Close chat"
                onClick={() => {
                  setOpen(false);
                  current.current = "";
                  setSelected("");
                }}
              >
                ✕
              </button>
            </header>
            {error && (
              <p role="alert" className="lg-error">
                {error}
              </p>
            )}
            <div className="lg-layout">
              <nav>
                <button
                  className="lg-new"
                  onClick={() => setCreating((v) => !v)}
                >
                  <span>＋</span> New conversation
                </button>
                <div className="lg-thread-search"><input aria-label="Search conversations" value={threadSearch} placeholder="Search conversations…" onChange={e=>setThreadSearch(e.target.value)}/></div>
                {conversations.filter(c=>(c.name||'').toLowerCase().includes(threadSearch.toLowerCase())).map((c) => (
                  <button
                    key={c._id}
                    className={selected === c._id ? "active" : ""}
                    onClick={() => choose(c._id)}
                  >
                    <span className="lg-thread-avatar">
                      {c.name?.trim().slice(0, 1).toUpperCase() || "#"}
                    </span>
                    <span className="lg-thread-copy">
                      <b>{c.name}</b>
                      <small>
                        {c.participants.length === 2
                          ? "Direct message"
                          : `${c.participants.length} members`}
                      </small>
                    </span>
                    {c.unread > 0 && <em>{c.unread}</em>}
                  </button>
                ))}
              </nav>
              <section>
                {creating ? (
                  <form
                    className="lg-create"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const d = await call("createConversation", {
                          participants: chosen,
                          name,
                          clientId:
                            groupAttempt.current ||
                            (groupAttempt.current = crypto.randomUUID()),
                        });
                        setCreating(false);
                        groupAttempt.current = null;
                        setChosen([]);
                        setName("");
                        await refresh();
                        choose(d.conversation._id);
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    <h3>New conversation</h3>
                    <label>Conversation name</label>
                    <input
                      required
                      maxLength={80}
                      placeholder="e.g. Project team"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <label>Participants</label>
                    <div className="lg-members">
                      {members.map((m) => (
                        <label key={m.user._id}>
                          <input
                            type="checkbox"
                            checked={chosen.includes(m.user._id)}
                            onChange={(e) =>
                              setChosen((a) =>
                                e.target.checked
                                  ? [...a, m.user._id]
                                  : a.filter((x) => x !== m.user._id),
                              )
                            }
                          />
                          <span>{m.user.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="lg-create-actions">
                      <button type="button" onClick={() => setCreating(false)}>
                        Cancel
                      </button>
                      <button>Create conversation</button>
                    </div>
                  </form>
                ) : selected ? (
                  <>
                    <div className="lg-conversation-heading"><div className="lg-conversation-icon">✦</div><div><strong>{conversations.find(c=>c._id===selected)?.name||'Conversation'}</strong><small>{conversations.find(c=>c._id===selected)?.participants.length||0} participants · shared workspace</small></div></div>
                    <div className="lg-history">
                      {messages.length > 0 && (
                        <button
                          className="lg-older"
                          onClick={async () => {
                            try {
                              const d = await call("history", {
                                id: selected,
                                before: messages[0].createdAt,
                              });
                              setMessages((m) => [...d.messages, ...m]);
                            } catch (e) {
                              setError(e.message);
                            }
                          }}
                        >
                          Load earlier messages
                        </button>
                      )}
                      {messages.map((m) => (
                        <article key={m._id} className={m.sender===currentUserId?'lg-mine':''}>
                          <span className="lg-message-avatar" title={m.name}>{m.name?.slice(0, 2).toUpperCase()}</span>
                          <div>
                            <b>{m.name}</b>
                            <time>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                            <p>{m.text.split(/(@[\p{L}\p{N}_]+)/u).map((part,i)=>part.startsWith('@')?<mark className="lg-mention" key={i}>{part}</mark>:part)}</p>
                            {m.card && (
                              <SharedCard
                                reference={m.card}
                                workspaceId={workspaceId}
                                call={call}
                              />
                            )}
                            <button
                              className="lg-older"
                              onClick={() =>
                                setConversion({
                                  message: m,
                                  title: m.text.slice(0, 240),
                                  project: projectOptions[0]?._id || "",
                                  column: projectOptions[0]?.lists[0]?.id || "",
                                })
                              }
                            >
                              Turn into card
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    {typing && <small className="lg-typing">{typing}</small>}
                    <select
                      aria-label="Share a card"
                      style={{
                        margin: "0 18px",
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid #e5dfea",
                      }}
                      value={shared}
                      onChange={(e) => {
                        sendAttempt.current = null;
                        setShared(e.target.value);
                      }}
                    >
                      <option value="">Attach a project card (optional)</option>
                      {projectOptions.flatMap((p) =>
                        p.lists.flatMap((l) =>
                          l.cards
                            .filter((c) => !c.archived)
                            .map((c) => (
                              <option
                                key={p._id + ":" + c.id}
                                value={JSON.stringify({
                                  project: p._id,
                                  id: c.id,
                                })}
                              >
                                {p.name} · {c.title}
                              </option>
                            )),
                        ),
                      )}
                    </select>
                    {/@[\p{L}\p{N}_]*$/u.test(draft)&&<div className="lg-mention-picker">{members.filter(m=>m.user.name.replace(/\s+/g,'').toLowerCase().includes(draft.split('@').at(-1).toLowerCase())).slice(0,5).map(m=><button key={m.user._id} onClick={()=>setDraft(t=>t.replace(/@[\p{L}\p{N}_]*$/u,'@'+m.user.name.replace(/\s+/g,'')+' '))}>@{m.user.name.replace(/\s+/g,'')}</button>)}</div>}
                    <form className="lg-compose" onSubmit={send}>
                      <input
                        maxLength={4000}
                        aria-label="Message text"
                        value={draft}
                        placeholder="Write a message…"
                        onChange={(e) => {
                          sendAttempt.current = null;
                          setDraft(e.target.value);
                          socket.current?.emit("typing", { id: selected });
                        }}
                      />
                      <button
                        disabled={!draft.trim()}
                        aria-label="Send message"
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="lg-empty">
                    <span>✦</span>
                    <h3>No conversation selected</h3>
                    <p>Choose a conversation or start a new one.</p>
                  </div>
                )}
              </section>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
