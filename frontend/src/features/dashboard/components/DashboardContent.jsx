import WorkspaceOverview from "./WorkspaceOverview";
import HomeOverview from "./HomeOverview";
import DashboardViews from "./DashboardViews";

import { ArrowRight, X, Check, Sparkles } from "lucide-react";
import { Flower } from "./DashboardPrimitives";




export default function DashboardContent({error, modal, notice, setNotice, featureNotice, setFeatureNotice, loading, workspaces, isWorkspace, workspace, members, owner, showAllProjects, setShowAllProjects, visibleProjects, projectCard, projectLoading, search, refreshWorkspace, recentUpdates, upcomingCards, openProject, openFirstBoard, setSearch, projects, online, openChat, conversations, view, now, firstName, previewFeature, switchView, workStats, setNotificationsOpen, activeTitle, allProjects, user, navigate, showArchived, setShowArchived, active, setActive, open}) {
  return (
        <div className="fd-content">
          {error && !modal && (
            <p className="flowe-error" role="alert">
              {error}{" "}
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </p>
          )}
          {notice && (
            <p className="fh-notice" role="status">
              <Check size={15} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={14} />
              </button>
            </p>
          )}
          {featureNotice && (
            <div className="fd-feature-info">
              <Sparkles size={17} />
              <span>{featureNotice}</span>
              <button
                aria-label="Close notice"
                onClick={() => setFeatureNotice("")}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="fd-page-loading">
              <Flower size={38} /> Opening your space…
            </div>
          ) : !workspaces.length ? (
            <div className="fd-first-empty">
              <Flower size={64} />
              <h2>Your first chapter starts here.</h2>
              <p>Create a workspace to start collaborating with your team.</p>
              <button
                className="fd-btn-primary"
                onClick={() => open("workspace")}
              >
                Plant my first workspace <ArrowRight size={17} />
              </button>
            </div>
          ) : isWorkspace ? (
            <WorkspaceOverview {...{workspace, members, owner, showAllProjects, setShowAllProjects, visibleProjects, projectCard, projectLoading, search, refreshWorkspace, recentUpdates, upcomingCards, openProject, openFirstBoard, setSearch, projects, online, openChat, conversations, open}} />
          ) : view === "home" ? (
            <HomeOverview {...{now, firstName, openFirstBoard, openChat, previewFeature, switchView, workStats, visibleProjects, projectCard, recentUpdates, upcomingCards, navigate, openProject, conversations, workspace, online, members, owner, setNotificationsOpen, open}} />
          ) : (
            <DashboardViews {...{activeTitle, view, allProjects, user, navigate, showArchived, setShowArchived, visibleProjects, projectCard, openChat, workspaces, active, setActive, conversations, openFirstBoard}} />
          )}
        </div>
  );
}
