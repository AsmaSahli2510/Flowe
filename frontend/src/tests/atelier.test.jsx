
import { beforeEach, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardEditor from "../features/board/components/cards/CardEditor";
import { api } from "../services/apiClient";
vi.mock("../services/apiClient", () => ({ api: vi.fn() }));
const user = { id: "owner", name: "Nour" },
  members = [
    { user: { _id: "owner", name: "Nour" }, role: "owner" },
    { user: { _id: "member", name: "Asma" }, role: "member" },
  ];
const card = {
  id: 10,
  title: "Review the launch",
  listId: 1,
  detail: "Keep the context",
  checklist: [],
};
const project = {
  _id: "project",
  createdBy: "owner",
  name: "Creative garden",
  visibility: "Workspace",
  lists: [{ id: 1, title: "To do", cards: [card] }],
};
beforeEach(() => {
  vi.clearAllMocks();
  api.mockResolvedValue({ comments: [], files: [], help: [] });
});
test("card editor retains draft on failed save and retries with checklist and assignee", async () => {
  const u = userEvent.setup(),
    save = vi
      .fn()
      .mockRejectedValueOnce(Error("Project changed elsewhere"))
      .mockResolvedValueOnce(),
    close = vi.fn();
  render(
    <CardEditor
      card={card}
      project={project}
      workspaceId="w"
      members={members}
      user={user}
      onSave={save}
      onClose={close}
    />,
  );
  await u.selectOptions(screen.getByLabelText("Responsible"), "member");
  await u.click(screen.getByRole("button", { name: /Checklist/ }));
  await u.type(
    screen.getByPlaceholderText("One small next step…"),
    "Check contrast",
  );
  await u.click(screen.getByRole("button", { name: "Add step" }));
  await u.click(screen.getByLabelText("Complete Check contrast"));
  await u.click(screen.getByRole("button", { name: "Save changes" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Project changed elsewhere",
  );
  expect(close).not.toHaveBeenCalled();
  await u.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(save.mock.calls[1][0]).toMatchObject({
    assignee: "member",
    done: 1,
    checks: 1,
    detail: "Keep the context",
  });
});
test("reader can consult card content but cannot save or post", async () => {
  const u = userEvent.setup();
  render(
    <CardEditor
      readOnly
      card={card}
      project={project}
      workspaceId="w"
      members={members}
      user={user}
      onSave={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Save changes" }).matches(":disabled")).toBe(true);
  expect(screen.getByLabelText("Card title").matches(":disabled")).toBe(true);
  await u.click(screen.getByRole("button", { name: "Conversation" }));
  expect(screen.getByRole("button", { name: "Post comment" }).matches(":disabled")).toBe(true);
});
