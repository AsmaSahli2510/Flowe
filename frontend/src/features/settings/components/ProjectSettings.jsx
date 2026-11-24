import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
export default function ProjectSettings({
  project,
  members,
  user,
  onSave,
  close,
}) {
  const [draft, setDraft] = useState({
    name: project.name,
    subtitle: project.subtitle,
    visibility: project.visibility || "Workspace",
    members: project.members || [],
    customFields: project.customFields || [],
    archived: !!project.archived,
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [name, setName] = useState(""),
    [type, setType] = useState("number");
  const owner =
    project.createdBy === user.id ||
    members.some((m) => m.user._id === user.id && m.role === "owner");
  return (
    <Modal title="Room to grow" kicker="PROJECT SETTINGS" close={close}>
      <div className="at-body">
        {error && (
          <p role="alert" className="at-error">
            {error}
          </p>
        )}
        <fieldset disabled={!owner || busy}>
          <label>
            Project name
            <input
              value={draft.name}
              maxLength={80}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={draft.subtitle}
              maxLength={200}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            />
          </label>
          <label>
            Who can see this garden?
            <select
              value={draft.visibility}
              onChange={(e) =>
                setDraft({ ...draft, visibility: e.target.value })
              }
            >
              <option>Workspace</option>
              <option>Private</option>
            </select>
          </label>
          {draft.visibility === "Private" &&
            members
              .filter(
                (m) => m.user._id !== project.createdBy && m.role !== "owner",
              )
              .map((m) => (
                <label className="at-check" key={m.user._id}>
                  <input
                    type="checkbox"
                    checked={draft.members.includes(m.user._id)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        members: e.target.checked
                          ? [...draft.members, m.user._id]
                          : draft.members.filter((id) => id !== m.user._id),
                      })
                    }
                  />
                  {m.user.name}
                </label>
              ))}
          <p className="at-hint">
            The project creator and workspace owner retain access. Readers can
            view but cannot change the board.
          </p>
          <h3>Fields for your workflow</h3>
          {draft.customFields.map((f, i) => (
            <div className="at-row" key={f.name}>
              <span>
                {f.name} <small>{f.type}</small>
              </span>
              <label className="at-check">
                <input
                  type="checkbox"
                  checked={f.visible !== false}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      customFields: draft.customFields.map((x, j) =>
                        j === i ? { ...x, visible: e.target.checked } : x,
                      ),
                    })
                  }
                />
                Visible
              </label>
              <button
                onClick={() =>
                  setDraft({
                    ...draft,
                    customFields: draft.customFields.filter((_, j) => i !== j),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <div className="at-inline">
            <input
              placeholder="e.g. Effort points"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="number">Number</option>
              <option value="text">Text</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={() => {
                if (
                  name.trim() &&
                  !draft.customFields.some((f) => f.name === name.trim())
                ) {
                  setDraft({
                    ...draft,
                    customFields: [
                      ...draft.customFields,
                      { name: name.trim(), type, visible: true },
                    ],
                  });
                  setName("");
                }
              }}
            >
              Add
            </button>
          </div>
          <h3>Project lifecycle</h3>
          <label className="at-check">
            <input
              type="checkbox"
              checked={draft.archived}
              onChange={(e) =>
                setDraft({ ...draft, archived: e.target.checked })
              }
            />
            Archive this project
          </label>
          <p className="at-hint">
            Archived projects keep their cards, files and conversations.
            Restore them from the project list.
          </p>
        </fieldset>
      </div>
      <footer>
        <button onClick={close}>Close</button>
        <button
          className="at-primary"
          disabled={!owner || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(draft);
              close();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </footer>
    </Modal>
  );
}
