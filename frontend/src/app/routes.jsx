import PasswordReset from '../pages/PasswordResetPage';
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Login from "../pages/LoginPage";
import Signup from "../pages/SignupPage";
import Hub from "../pages/DashboardPage";
import Invitation from "../pages/InvitationPage";
import ProjectBoard from "../pages/BoardPage";
import { Protected } from "../context/AuthContext";

function ProjectRoute() {
  const { workspaceId, projectId } = useParams();
  return <ProjectBoard key={`${workspaceId}:${projectId}`} />;
}
export default function AppRoutes() {
  return (
    <Routes>
        <Route path="/forgot-password" element={<PasswordReset/>}/><Route path="/reset-password" element={<PasswordReset/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/invite/:token" element={<Invitation />} />
        <Route
          path="/workspace"
          element={
            <Protected>
              <Hub />
            </Protected>
          }
        />
        <Route
          path="/workspace/:workspaceId/project/:projectId"
          element={
            <Protected>
              <ProjectRoute />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
    </Routes>
  );
}
