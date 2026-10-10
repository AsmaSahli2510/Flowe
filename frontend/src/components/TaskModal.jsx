import { Check, X } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import { columns, people, initial } from "../data/demoData";
import Avatar from "./Avatar";
export default function TaskModal() {
  const {
    setTasks,
    setPage,
    modal,
    setModal,
    workspace,
    setWorkspace,
    setToast,
  } = useFlowe();
  return modal ? (
    <div className="modal-backdrop" onClick={() => setModal(null)}>
      <section className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="close"
          onClick={() => setModal(null)}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        {modal.settings ? (
          <>
            <h2>Your account</h2>
            <div className="account-summary">
              <Avatar />
              <div>
                <b>Asma</b>
                <p>Product Designer</p>
              </div>
              <span>Demo account</span>
            </div>
            <p>
              Flowe is a static React demo. Your task changes are saved in this
              browser.
            </p>
            <button
              onClick={() => {
                setTasks(initial);
                setModal(null);
                setToast("Demo tasks restored");
              }}
            >
              Restore demo tasks
            </button>
          </>
        ) : modal.workspace ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setWorkspace(modal.title);
              setPage("Projects");
              setModal(null);
            }}
          >
            <h2>Create workspace</h2>
            <label>
              Workspace name
              <input
                required
                value={modal.title}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    title: e.target.value,
                  })
                }
              />
            </label>
            <button className="create">Create workspace</button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const { isNew, ...task } = modal;
              setTasks((ts) =>
                isNew
                  ? [...ts, task]
                  : ts.map((t) => (t.id === task.id ? task : t)),
              );
              setModal(null);
              setToast("Task saved");
            }}
          >
            <span className="eyebrow">{workspace}</span>
            <h2>{modal.isNew ? "Create a task" : "Task details"}</h2>
            <label>
              Task name
              <input
                autoFocus
                required
                value={modal.title}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    title: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Description
              <textarea
                value={modal.description}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    description: e.target.value,
                  })
                }
              />
            </label>
            <div className="form-grid">
              <label>
                Status
                <select
                  value={modal.status}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      status: +e.target.value,
                    })
                  }
                >
                  {columns.map((c, i) => (
                    <option value={i} key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={modal.priority}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      priority: e.target.value,
                    })
                  }
                >
                  {["Low", "Medium", "High"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Assignee
                <select
                  value={modal.person}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      person: +e.target.value,
                    })
                  }
                >
                  {people.map((p, i) => (
                    <option key={p} value={i}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due date (October)
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={modal.day}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      day: +e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              {!modal.isNew && (
                <button
                  type="button"
                  className="delete"
                  onClick={() => {
                    setTasks((ts) => ts.filter((t) => t.id !== modal.id));
                    setModal(null);
                  }}
                >
                  Delete task
                </button>
              )}
              <button className="create" type="submit">
                Save task <Check size={16} />
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  ) : null;
}
