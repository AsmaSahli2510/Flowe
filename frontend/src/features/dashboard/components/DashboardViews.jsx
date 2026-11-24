
import { CheckSquare2, MessageCircle, CalendarDays, FolderKanban, MessageSquare } from "lucide-react";
import { Panel, EmptyNote } from "./DashboardPrimitives";
import { totalCards } from "../utils/dashboard";



export default function DashboardViews({activeTitle, view, allProjects, user, navigate, showArchived, setShowArchived, visibleProjects, projectCard, openChat, workspaces, active, setActive, conversations, openFirstBoard}) {
  return (
<>
              <div className="fd-subpage-head">
                <div className="fd-breadcrumb">
                  MY FLOWE / {activeTitle?.toUpperCase()}
                </div>
                <h1>{activeTitle}</h1>
                <p>
                  {view === "work"
                    ? "Projects and task boards across all your workspaces."
                    : view === "messages"
                      ? "Your conversations, organized by workspace."
                      : view === "calendar"
                        ? "Your personal calendar across workspaces."
                        : "Create and shape projects with Flowe."}
                </p>
              </div>
              {view === "work" ? (
                <>
                  <Panel title="My assigned cards">
                    <div className="fd-conversations-list">
                      {allProjects.flatMap((p) =>
                        totalCards(p)
                          .filter(
                            (c) =>
                              c.assignee === user.id &&
                              !c.archived &&
                              !p.archived,
                          )
                          .map((c) => (
                            <button
                              className="fd-conversation-row"
                              key={p._id + ":" + c.id}
                              onClick={() =>
                                navigate(
                                  `/workspace/${p.workspaceId}/project/${p._id}?card=${c.id}`,
                                )
                              }
                            >
                              <CheckSquare2 size={18} />
                              <span>
                                <strong>{c.title}</strong>
                                <small>
                                  {p.name} · {c.priority || "Medium"}
                                  {c.due ? " · " + c.due : ""}
                                </small>
                              </span>
                            </button>
                          )),
                      )}
                    </div>
                  </Panel>
                  <label className="at-check" style={{ margin: "16px 0" }}>
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                    />
                    Show archived projects
                  </label>
                  <Panel
                    title="All your projects"
                    action="New project"
                    onAction={() => open("project")}
                  >
                    <div className="fd-project-grid fd-project-grid-large">
                      {visibleProjects.map((p, i) => projectCard(p, i))}
                      {!visibleProjects.length && (
                        <EmptyNote
                          icon={FolderKanban}
                          title="No projects found"
                          description="Create your first project or search by name."
                          action="Create project"
                          onAction={() => open("project")}
                        />
                      )}
                    </div>
                  </Panel>
                </>
              ) : view === "messages" ? (
                <Panel
                  title="Conversations in your current workspace"
                  action="New conversation"
                  onAction={() => openChat(true)}
                >
                  <p className="fd-panel-subtitle">
                    Select a workspace to switch between your teams' private
                    chats.
                  </p>
                  <div className="fd-message-switch">
                    {workspaces.map((w) => (
                      <button
                        className={active === w._id ? "active" : ""}
                        onClick={() => setActive(w._id)}
                        key={w._id}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                  {conversations.length ? (
                    <div className="fd-conversations-list">
                      {conversations.map((c) => (
                        <button
                          className="fd-conversation-row"
                          key={c._id}
                          onClick={() => openChat()}
                        >
                          <MessageSquare size={18} />
                          <span>
                            <strong>{c.name}</strong>
                            <small>
                              {c.participants?.length || 0} participants
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyNote
                      icon={MessageCircle}
                      title="A conversation starts here"
                      description="Start chatting with the members of the selected workspace."
                      action="New conversation"
                      onAction={() => openChat(true)}
                    />
                  )}
                </Panel>
              ) : view === "calendar" ? (
                <Panel title="Task deadlines">
                  <div className="fd-conversations-list">
                    {allProjects
                      .flatMap((p) =>
                        totalCards(p)
                          .filter((c) => c.due && !c.archived && !p.archived)
                          .map((c) => ({ ...c, project: p })),
                      )
                      .sort((a, b) => a.due.localeCompare(b.due))
                      .map((c) => (
                        <button
                          key={c.project._id + ":" + c.id}
                          className="fd-conversation-row"
                          onClick={() =>
                            navigate(
                              `/workspace/${c.project.workspaceId}/project/${c.project._id}?card=${c.id}`,
                            )
                          }
                        >
                          <CalendarDays size={18} />
                          <span>
                            <strong>{c.title}</strong>
                            <small>
                              {c.due} · {c.project.name} ·{" "}
                              {c.completed
                                ? "Completed"
                                : c.due < new Date().toLocaleDateString("en-CA")
                                  ? "Overdue"
                                  : "Upcoming"}
                            </small>
                          </span>
                        </button>
                      ))}
                  </div>
                </Panel>
              ) : (
                <Panel title="Plan your next project">
                  <EmptyNote icon={FolderKanban} title="Your collaborative project space" description="Open a project to organize the board, calendar, tasks and conversation." action="Open a board" onAction={openFirstBoard}/>
                </Panel>
              )}
            </>
  );
}
