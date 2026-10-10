import { Outlet } from "react-router-dom";
import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { useFlowe } from "../context/FloweContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Welcome from "./Welcome";
import Stats from "./Stats";
import RightSidebar from "./RightSidebar";
import TaskModal from "./TaskModal";
export default function Layout() {
  const { toast } = useFlowe();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className={`app${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div className="workspace">
        <Header />
        <div className="content">
          <main>
            <Welcome />
            <Stats />
            <Outlet />
          </main>
          <RightSidebar />
        </div>
      </div>
      <TaskModal />
      {toast && (
        <div className="toast">
          <CheckCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
