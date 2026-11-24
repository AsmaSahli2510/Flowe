import MemberAvatar from '../../../components/ui/MemberAvatar';

import { Plus, MessageCircle, CalendarDays, Sparkles, FolderKanban, Bell, ChevronRight, UserRoundPlus, Activity, Layers3 } from "lucide-react";
import { Flower, Panel, EmptyNote } from "./DashboardPrimitives";
import { timeLabel, accent, initials } from "../utils/dashboard";



export default function HomeOverview({now, firstName, openFirstBoard, openChat, previewFeature, switchView, workStats, visibleProjects, projectCard, recentUpdates, upcomingCards=[], navigate, openProject, conversations, workspace, online, members, owner, setNotificationsOpen, open}) {
  return (
<>
              <div className="fd-dashboard-grid">
                <div className="fd-dashboard-main">
                  <section className="fd-welcome">
                    <div>
                      <h1>
                        Good{" "}
                        {now.getHours() < 12
                          ? "morning"
                          : now.getHours() < 18
                            ? "afternoon"
                            : "evening"}
                        , <em>{firstName}</em> 👋
                      </h1>
                      <p>Here’s what’s happening across your workspaces.</p>
                    </div>
                    <div className="fd-welcome-bloom">
                      <Flower size={112} />
                    </div>
                  </section>
                  <div className="fd-quick-actions">
                    <button
                      className="fd-quick-action fd-accent-lavender"
                      onClick={() => open("project")}
                    >
                      <span>
                        <Plus size={23} />
                      </span>
                      New project
                    </button>
                    <button className="fd-quick-action" onClick={openFirstBoard}>
                      <span className="fd-text-lavender">
                        <FolderKanban size={23} />
                      </span>
                      Open a Board
                    </button>
                    <button
                      className="fd-quick-action"
                      onClick={() => openChat(true)}
                    >
                      <span className="fd-text-green">
                        <MessageCircle size={23} />
                      </span>
                      New conversation
                    </button>
                    <button
                      className="fd-quick-action"
                      onClick={() => open("project")}
                    >
                      <span className="fd-text-yellow">
                        <Layers3 size={22} />
                      </span>
                      Use a template
                    </button>
                    <button
                      className="fd-quick-action"
                      onClick={previewFeature}
                    >
                      <span className="fd-text-lavender">
                        <Sparkles size={22} />
                      </span>
                      Create with AI
                    </button>
                  </div>
                  <Panel
                    title="My work"
                    action="View my work"
                    onAction={() => switchView("work")}
                    className="fd-metrics-panel"
                  >
                    <p className="fd-panel-subtitle">
                      Cards in your accessible workspaces
                    </p>
                    <div className="fd-metric-grid">
                      {workStats.map(({ label, number, icon: Icon, color }) => (
                        <div className={`fd-metric fd-${color}`} key={label}>
                          <span>
                            <Icon size={23} />
                          </span>
                          <div>
                            <strong>{number}</strong>
                            <small>{label}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel title="Upcoming deadlines" action="Open calendar" onAction={()=>switchView('calendar')}>
                    {upcomingCards.length ? <div className="fd-upcoming-list">{upcomingCards.map(c=><button key={`${c.projectId}:${c.id}`} onClick={()=>navigate(`/workspace/${c.workspaceId}/project/${c.projectId}?card=${c.id}`)}><span className="fd-upcoming-date"><CalendarDays size={16}/>{new Date(c.due+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><span><strong>{c.title}</strong><small>{c.projectName}</small></span><ChevronRight size={15}/></button>)}</div> : <p className="fd-upcoming-empty">No deadlines in the next 21 days. Add due dates to cards to see them here.</p>}
                  </Panel>
                  <Panel
                    title="Recent projects"
                    action="View all projects"
                    onAction={() => switchView("work")}
                  >
                    <div className="fd-project-grid">
                      {visibleProjects
                        .slice(0, 3)
                        .map((p, i) => projectCard(p, i))}
                      {!visibleProjects.length && (
                        <EmptyNote
                          icon={FolderKanban}
                          title="Your projects will appear here"
                          description="Create a project or explore another workspace."
                          action="Create project"
                          onAction={() => open("project")}
                        />
                      )}
                    </div>
                  </Panel>
                  <div className="fd-dual-panels">
                    <Panel
                      title="Recent activity"
                      action="See projects"
                      onAction={() => switchView("work")}
                    >
                      {recentUpdates.length ? (
                        <div className="fd-activity-list">
                          {recentUpdates.map((p, i) => (
                            <button
                              className="fd-activity-row"
                              onClick={() => openProject(p)}
                              key={p._id}
                            >
                              <span
                                className={`fd-event-icon fd-${accent[i % 4]}`}
                              >
                                <Activity size={16} />
                              </span>
                              <span>
                                <strong>{p.name}</strong>
                                <small>
                                  Project updated ·{" "}
                                  {timeLabel(p.updatedAt || p.createdAt)}
                                </small>
                              </span>
                              <span className="fd-event-tag">Project</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <EmptyNote
                          icon={Activity}
                          title="All caught up"
                          description="Project changes will appear here."
                        />
                      )}
                    </Panel>
                    <Panel
                      title="Recent conversations"
                      action="Open messages"
                      onAction={() => openChat()}
                    >
                      {conversations.length ? (
                        <div className="fd-conversations-list">
                          {conversations.slice(0, 3).map((c) => (
                            <button
                              key={c._id}
                              onClick={() => openChat()}
                              className="fd-conversation-row"
                            >
                              <span className="fd-event-icon fd-lavender">
                                <MessageCircle size={16} />
                              </span>
                              <span>
                                <strong>{c.name}</strong>
                                <small>
                                  {workspace?.name} ·{" "}
                                  {c.participants?.length || 0} participants
                                </small>
                              </span>
                              {c.unread > 0 && <b>{c.unread}</b>}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <EmptyNote
                          icon={MessageCircle}
                          title="Keep your team close"
                          description={`Conversations from ${workspace?.name || "your workspace"} will appear here.`}
                          action="Start chatting"
                          onAction={() => openChat(true)}
                        />
                      )}
                    </Panel>
                  </div>
                </div>
                <div className="fd-dashboard-rail">
                  <Panel
                    title="My Calendar"
                    action="View calendar"
                    onAction={() => switchView("calendar")}
                  >
                    <div className="fd-calendar-head">
                      <button
                        aria-label="Previous day"
                        onClick={() => switchView("calendar")}
                      >
                        <ChevronRight
                          style={{ transform: "rotate(180deg)" }}
                          size={17}
                        />
                      </button>
                      <strong>
                        {now.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                      <button
                        aria-label="Open calendar"
                        onClick={() => switchView("calendar")}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                    <EmptyNote
                      icon={CalendarDays}
                      title="Your schedule, in one place"
                      description="See project task deadlines in the Board Calendar view."
                    />
                  </Panel>
                  <Panel
                    title="Project coordination"
                    action="Open project"
                    onAction={openFirstBoard}
                  >
                    <div className="fd-meeting-hint">
                      <span className="fd-event-icon fd-lavender">
                        <MessageCircle size={19} />
                      </span>
                      <div>
                        <strong>Task discussions</strong>
                        <small>
                          Open a project board to review tasks and discuss progress.
                        </small>
                      </div>
                      <button onClick={openFirstBoard}>Open</button>
                    </div>
                  </Panel>
                  <Panel
                    title="Active members"
                    action="View team"
                    onAction={() => open("members")}
                  >
                    <div className="fd-rail-team">
                      <strong>
                        {workspace?.name || "Workspace"}{" "}
                        <span>
                          · {online.length} online / {members.length} members
                        </span>
                      </strong>
                      <div className="fd-avatars">
                        {members.slice(0, 6).map(m=><button key={m.user._id} title={m.user.name} onClick={()=>open('members')} className="fd-member-button"><MemberAvatar user={m.user} size={32} online={online.some(p=>p.id===m.user._id)}/></button>)}
                        {members.length > 6 && (
                          <button
                            className="fd-avatar fd-avatar-more"
                            onClick={() => open("members")}
                          >
                            +{members.length - 6}
                          </button>
                        )}
                      </div>
                      <small className="fd-scope-help">
                        Showing {workspace?.name || "current workspace"} only
                      </small>
                      {owner && (
                        <button
                          className="fd-invite-inline"
                          onClick={() => open("invite")}
                        >
                          <UserRoundPlus size={14} /> Invite people
                        </button>
                      )}
                    </div>
                  </Panel>
                  <Panel
                    title="Notifications"
                    action="View all"
                    onAction={() => setNotificationsOpen(true)}
                  >
                    <div className="fd-notification-placeholder">
                      <Bell size={19} />
                      <div>
                        <strong>No notifications to show</strong>
                        <small>
                          Mentions, assignments and invitations will appear when
                          available.
                        </small>
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>
            </>
  );
}
