import MemberAvatar from '../../../components/ui/MemberAvatar';

import { Plus, Users, MessageCircle, FolderKanban, Folder, UserRoundPlus, Activity, MessageSquare } from "lucide-react";
import { Panel, EmptyNote } from "./DashboardPrimitives";
import { timeLabel, accent, initials } from "../utils/dashboard";



export default function WorkspaceOverview({workspace, members, owner, showAllProjects, setShowAllProjects, visibleProjects, projectCard, projectLoading, search, refreshWorkspace, recentUpdates, openProject, openFirstBoard, setSearch, projects, online, openChat, conversations, open}) {
  return (
<>
              <div className="fd-ws-heading">
                <div>
                  <div className="fd-breadcrumb">WORKSPACE / OVERVIEW</div>
                  <h1>{workspace?.name}</h1>
                  <p>
                    {workspace?.description ||
                      "Projects, people and collaboration in one place."}
                  </p>
                </div>
                <div className="fd-header-buttons">
                  <button
                    className="fd-btn-secondary"
                    onClick={() => open("members")}
                  >
                    <Users size={16} /> {members.length} members
                  </button>
                  {owner && (
                    <button
                      className="fd-btn-secondary"
                      onClick={() => open("invite")}
                    >
                      <UserRoundPlus size={16} /> Invite people
                    </button>
                  )}
                  <button
                    className="fd-btn-primary"
                    onClick={() => open("project")}
                  >
                    <Plus size={16} /> New project
                  </button>
                </div>
              </div>
              <div className="fd-dashboard-grid">
                <div className="fd-dashboard-main">
                  <Panel
                    title="Projects"
                    action={showAllProjects ? "Show less" : "View all"}
                    onAction={() => setShowAllProjects((v) => !v)}
                    className="fd-projects-panel"
                  >
                    <div id="fd-projects-section" className="fd-project-grid">
                      {(showAllProjects
                        ? visibleProjects
                        : visibleProjects.slice(0, 6)
                      ).map((p, i) => projectCard(p, i))}
                      {!projectLoading && !visibleProjects.length && (
                        <EmptyNote
                          icon={FolderKanban}
                          title="No projects yet"
                          description={
                            search
                              ? "Try another search."
                              : "Start with a Scrum, study or custom project."
                          }
                          action={!search ? "Create project" : undefined}
                          onAction={() => open("project")}
                        />
                      )}
                    </div>
                  </Panel>
                  <div className="fd-dual-panels">
                    <Panel
                      title="Recent activity"
                      action="Refresh"
                      onAction={refreshWorkspace}
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
                          title="No activity yet"
                          description="Project updates will appear here."
                        />
                      )}
                    </Panel>
                    <Panel
                      title="Team collaboration"
                      action="Open project"
                      onAction={openFirstBoard}
                    >
                      <EmptyNote
                        icon={MessageCircle}
                        title="Discuss your project"
                        description="Coordinate work in project chat and comments."
                        action="Go to a board"
                        onAction={openFirstBoard}
                      />
                    </Panel>
                  </div>
                  <Panel
                    title="Workspace projects"
                    action="Browse projects"
                    onAction={() => setSearch("")}
                    className="fd-resources-panel"
                  >
                    <div className="fd-quick-links">
                      <span>
                        <FolderKanban size={16} /> {projects.length} projects
                      </span>
                      <span>
                        <Users size={16} /> {members.length} members
                      </span>
                      <span>
                        <MessageCircle size={16} /> Workspace conversations
                      </span>
                    </div>
                  </Panel>
                </div>
                <div className="fd-dashboard-rail">
                  <Panel
                    title="Team members"
                    action="View all"
                    onAction={() => open("members")}
                  >
                    <div className="fd-rail-team">
                      <strong>
                        {online.length} online{" "}
                        <span>· {members.length} members</span>
                      </strong>
                      <div className="fd-avatars">
                        {members.slice(0,6).map(m=><button key={m.user._id} title={`${m.user.name} · ${m.role}`} onClick={()=>open('members')} className="fd-member-button"><MemberAvatar user={m.user} size={32} online={online.some(p=>p.id===m.user._id)}/></button>)}
                        {members.length > 6 && (
                          <button
                            className="fd-avatar fd-avatar-more"
                            onClick={() => open("members")}
                          >
                            +{members.length - 6}
                          </button>
                        )}
                      </div>
                    </div>
                  </Panel>
                  <Panel
                    title="Conversations"
                    action="Open chat"
                    onAction={() => openChat()}
                  >
                    <div className="fd-conversations-list">
                      {conversations.slice(0, 3).map((c) => (
                        <button
                          key={c._id}
                          onClick={() => openChat()}
                          className="fd-conversation-row"
                        >
                          <span className="fd-event-icon fd-lavender">
                            <MessageCircle size={17} />
                          </span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>
                              {c.participants?.length || 0} participants
                            </small>
                          </span>
                          {c.unread > 0 && <b>{c.unread}</b>}
                        </button>
                      ))}
                      {!conversations.length && (
                        <EmptyNote
                          icon={MessageSquare}
                          title="No conversations yet"
                          description="Start a direct message or a team chat."
                          action="New conversation"
                          onAction={() => openChat(true)}
                        />
                      )}
                    </div>
                  </Panel>
                  <Panel title="Workspace files">
                    <EmptyNote
                      icon={Folder}
                      title="Files live in tasks"
                      description="Open a project card to access attached files."
                    />
                  </Panel>
                </div>
              </div>
            </>
  );
}
