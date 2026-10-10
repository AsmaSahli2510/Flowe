import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { initial } from "../data/demoData";
export const pagePaths = {
  Home: "/",
  "My Tasks": "/my-tasks",
  Projects: "/projects",
  Calendar: "/calendar",
  Team: "/team",
  Messages: "/messages",
  Files: "/files",
  Analytics: "/analytics",
};
const FloweContext = createContext(null);
export function FloweProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const page =
    Object.keys(pagePaths).find(
      (name) => pagePaths[name] === location.pathname,
    ) || "Home";
  const setPage = (name) => {
    navigate(pagePaths[name] || "/");
    setTab(name === "Calendar" ? "Calendar" : "Board");
  };
  const [tasks, setTasks] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("flowe-tasks")) || initial;
      } catch {
        return initial;
      }
    }),
    [tab, setTab] = useState(page === "Calendar" ? "Calendar" : "Board"),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(null),
    [filter, setFilter] = useState(false),
    [high, setHigh] = useState(false),
    [notice, setNotice] = useState(false),
    [month, setMonth] = useState(9),
    [selected, setSelected] = useState(10),
    [workspace, setWorkspace] = useState("Website Redesign"),
    [toast, setToast] = useState("");
  useEffect(
    () => localStorage.setItem("flowe-tasks", JSON.stringify(tasks)),
    [tasks],
  );
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2800);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const visible = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) &&
      (!high || t.priority === "High"),
  );
  const done = tasks.filter((t) => t.status === 3).length;
  function move(id, status) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
  }
  function create(status = 0) {
    setModal({
      id: Date.now(),
      title: "",
      tag: "Design",
      priority: "Medium",
      status,
      day: 14,
      person: 0,
      description: "",
      comments: 0,
      isNew: true,
    });
  }
  useEffect(() => {
    setTab(page === "Calendar" ? "Calendar" : "Board");
  }, [page]);
  return (
    <FloweContext.Provider
      value={{
        tasks,
        setTasks,
        page,
        setPage,
        tab,
        setTab,
        query,
        setQuery,
        modal,
        setModal,
        filter,
        setFilter,
        high,
        setHigh,
        notice,
        setNotice,
        month,
        setMonth,
        selected,
        setSelected,
        workspace,
        setWorkspace,
        toast,
        setToast,
        visible,
        done,
        move,
        create,
      }}
    >
      {children}
    </FloweContext.Provider>
  );
}
export function useFlowe() {
  const value = useContext(FloweContext);
  if (!value) throw new Error("useFlowe must be inside FloweProvider");
  return value;
}
