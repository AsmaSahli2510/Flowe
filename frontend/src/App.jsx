import { Routes, Route, Navigate } from "react-router-dom";
import { FloweProvider } from "./context/FloweContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MyTasks from "./pages/MyTasks";
import Projects from "./pages/Projects";
import Calendar from "./pages/Calendar";
import Team from "./pages/Team";
import Messages from "./pages/Messages";
import Files from "./pages/Files";
import Analytics from "./pages/Analytics";
export default function App() {
  return (
    <FloweProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="projects" element={<Projects />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="team" element={<Team />} />
          <Route path="messages" element={<Messages />} />
          <Route path="files" element={<Files />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FloweProvider>
  );
}
