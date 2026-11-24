
import { test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/LoginPage";
import Signup from "../pages/SignupPage";
import Hub from "../features/dashboard/Dashboard";
import Invitation from "../pages/InvitationPage";

import { api } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
vi.mock("../services/apiClient", () => ({
  api: vi.fn(),
  afterLogin: () =>
    sessionStorage.getItem("flowe-invite")
      ? "/invite/" + sessionStorage.getItem("flowe-invite")
      : "/workspace",
}));
vi.mock("../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuth: vi.fn() };
});
const user = { id: "owner", name: "Nour Studio", email: "nour@example.com" };
const workspace = {
  _id: "ws1",
  name: "Design collective",
  owner: "owner",
  members: [],
  description: "A home for ideas",
};
const templates = [
  {
    id: "study",
    name: "Study garden",
    eyebrow: "LEARN",
    description: "Learn steadily.",
    color: "#dcccf7",
    columns: ["Resources", "To learn", "Practising", "Mastered"],
  },
  {
    id: "scrum",
    name: "Scrum workflow",
    eyebrow: "DELIVER",
    description: "Your next sprint.",
    color: "#beedd0",
    columns: ["Backlog", "Doing", "Done"],
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({
    user,
    setUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(),
    loading: false,
  });
});
function router(component, path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={component} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/workspace" element={<div>Workspace destination</div>} />
        <Route path="/invite/:token" element={<Invitation />} />
        <Route
          path="/workspace/:wid/project/:pid"
          element={<div>Project destination</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}
function hubMock(projects = []) {
  api.mockImplementation(async (path, options) => {
    if (path === "/workspaces" && !options) return { workspaces: [workspace] };
    if (path === "/templates") return { templates };
    if (path.endsWith("/projects") && !options) return { projects };
    if (path.endsWith("/members"))
      return { members: [{ user: { _id: "owner", ...user }, role: "owner" }] };
    return {};
  });
}
test("login sends real credentials and remember option then navigates", async () => {
  api.mockResolvedValue({ user });
  router(<Login />);
  const u = userEvent.setup();
  await u.type(screen.getByLabelText("Email address"), "nour@example.com");
  await u.type(
    screen.getByLabelText("Password", { exact: true }),
    "password123",
  );
  await u.click(screen.getByRole("button", { name: /Enter your workspace/ }));
  await screen.findByText("Workspace destination");
  expect(api).toHaveBeenCalledWith("/auth/login", {
    method: "POST",
    body: { email: user.email, password: "password123", remember: true },
  });
});
test("login displays API failure instead of creating demo session", async () => {
  api.mockRejectedValue(new Error("Email or password incorrect"));
  router(<Login />);
  const u = userEvent.setup();
  await u.type(screen.getByLabelText("Email address"), "nour@example.com");
  await u.type(
    screen.getByLabelText("Password", { exact: true }),
    "wrongpassword",
  );
  await u.click(screen.getByRole("button", { name: /Enter your workspace/ }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Email or password incorrect",
  );
  expect(sessionStorage.getItem("flowe-session")).toBeNull();
});
test("signup creates account and offers both social providers", async () => {
  api.mockResolvedValue({ user });
  router(<Signup />);
  const u = userEvent.setup();
  expect(screen.getByRole("button", { name: "Google" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Outlook" })).toBeTruthy();
  await u.type(screen.getByLabelText("Full name"), user.name);
  await u.type(screen.getByLabelText("Email address"), user.email);
  await u.type(
    screen.getByLabelText("Password", { exact: true }),
    "password123",
  );
  await u.click(screen.getByRole("button", { name: /Create your account/ }));
  await screen.findByText("Workspace destination");
  expect(api).toHaveBeenCalledWith("/auth/signup", {
    method: "POST",
    body: { name: user.name, email: user.email, password: "password123" },
  });
});
test("workspace creation requires no invitations and appears in sidebar", async () => {
  api.mockImplementation(async (path, options) => {
    if (path === "/workspaces" && !options) return { workspaces: [] };
    if (path === "/templates") return { templates };
    if (path === "/workspaces" && options) return { workspace };
    if (path.endsWith("/projects")) return { projects: [] };
    if (path.endsWith("/members")) return { members: [] };
  });
  router(<Hub />);
  const u = userEvent.setup();
  await u.click(
    await screen.findByRole("button", { name: /Plant my first workspace/ }),
  );
  await u.type(screen.getByLabelText("Workspace name"), "Design collective");
  await u.click(screen.getByRole("button", { name: /Create workspace/ }));
  await screen.findByRole("heading", { name: "Design collective" });
  expect(api).toHaveBeenCalledWith("/workspaces", {
    method: "POST",
    body: { name: "Design collective", description: "" },
  });
});
test("custom project sends chosen column names and opens persisted project", async () => {
  hubMock();
  const initial = api.getMockImplementation();
  api.mockImplementation((path, options) =>
    options && path.endsWith("/projects")
      ? Promise.resolve({ project: { _id: "project1" } })
      : initial(path, options),
  );
  router(<Hub />);
  const u = userEvent.setup();
  await u.click(await screen.findByRole("button", { name: "New project" }));
  await u.type(screen.getByLabelText("Project name"), "Brand refresh");
  await u.click(screen.getByRole("button", { name: /Your own rhythm/ }));
  const columns = screen.getByLabelText(/Your columns/);
  await u.clear(columns);
  await u.type(columns, "Discover, Design, Launch");
  await u.click(screen.getByRole("button", { name: /Plant this project/ }));
  await screen.findByText("Project destination");
  expect(api).toHaveBeenCalledWith("/workspaces/ws1/projects", {
    method: "POST",
    body: {
      name: "Brand refresh",
      template: "custom",
      columns: ["Discover", "Design", "Launch"],
    },
  });
});
test("owner can create email invitation and receive its copyable link", async () => {
  hubMock();
  const initial = api.getMockImplementation();
  api.mockImplementation((path, options) =>
    path.endsWith("/invitations")
      ? Promise.resolve({ url: "http://localhost:5173/invite/token" })
      : initial(path, options),
  );
  router(<Hub />);
  const u = userEvent.setup();
  await u.click(await screen.findByRole("button", { name: "Invite people" }));
  await u.type(screen.getByLabelText("Email address"), "friend@example.com");
  await u.click(screen.getByRole("button", { name: /Send invitation/ }));
  await screen.findByText("Invitation ready");
  expect(screen.getByLabelText("Invitation link").value).toBe(
    "http://localhost:5173/invite/token",
  );
  expect(api).toHaveBeenCalledWith("/workspaces/ws1/invitations", {
    method: "POST",
    body: { email: "friend@example.com" },
  });
});
test("member sees projects without owner invitation controls", async () => {
  useAuth.mockReturnValue({ user: { ...user, id: "member" }, logout: vi.fn() });
  hubMock([{ _id: "p1", name: "Team sprint", template: "scrum", lists: [] }]);
  router(<Hub />);
  await screen.findByRole("heading", { name: "Team sprint" });
  expect(screen.queryByRole("button", { name: "Invite people" })).toBeNull();
});
test("invitation survives authentication and rejects wrong-account API error visibly", async () => {
  api.mockImplementation(async (path) => {
    if (path.endsWith("/accept"))
      throw new Error(
        "Sign in with the email address that received the invitation",
      );
    return { workspaceName: "Design collective" };
  });
  router(<Invitation />, "/invite/valid-token");
  await screen.findByRole("heading", { name: /You’re invited/ });
  expect(sessionStorage.getItem("flowe-invite")).toBe("valid-token");
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: /Join workspace/ }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Sign in with the email",
  );
});

test("existing Bloom board saves edited card details through the project API", async () => {
  const { default: ProjectBoard } = await import("../pages/BoardPage");
  const project = {
    _id: "p1",
    name: "Study garden",
    subtitle: "Study",
    revision: 0,
    lists: [
      {
        id: 1,
        title: "Resources",
        color: "lav",
        cards: [
          {
            id: 10,
            title: "Outline the next chapter",
            detail: "Original context",
            checks: 0,
            done: 0,
          },
        ],
      },
    ],
  };
  api.mockImplementation(async (path, options) =>
    options
      ? { project: { ...project, revision: 1 } }
      : { projects: [project] },
  );
  render(
    <MemoryRouter initialEntries={["/workspace/ws1/project/p1"]}>
      <Routes>
        <Route
          path="/workspace/:workspaceId/project/:projectId"
          element={<ProjectBoard />}
        />
      </Routes>
    </MemoryRouter>,
  );
  const u = userEvent.setup();
  await u.click(
    await screen.findByText("Outline the next chapter", { exact: true }),
  );
  const description = screen.getByLabelText("Description");
  await u.clear(description);
  await u.type(description, "Shared project context");
  await u.click(
    screen.getByRole("button", { name: "Save changes", exact: true }),
  );
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/workspaces/ws1/projects/p1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({
          revision: 0,
          lists: expect.arrayContaining([
            expect.objectContaining({
              cards: expect.arrayContaining([
                expect.objectContaining({ detail: "Shared project context" }),
              ]),
            }),
          ]),
        }),
      }),
    ),
  );
});
