import { api } from "../../../services/apiClient";
import logo from "../../../assets/images/logoTransparent.png";

import { Plus, ArrowRight, X, Check, LayoutTemplate } from "lucide-react";

export default function DashboardModal({modal, busy, setModal, workspace, error, members, owner, user, active, setMembers, setError, invitations, setInvitations, submit, inviteEmail, setInviteEmail, inviteURL, setNotice, name, setName, workspaces, setActive, description, setDescription, templates, template, setTemplate, columns, setColumns, open}) {
  return (
<>
{modal && (
        <div
          className="fh-overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !busy && setModal("")
          }
        >
          <section
            className={`fh-modal ${modal === "project" ? "fh-modal-wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="fh-close"
              aria-label="Close"
              disabled={busy}
              onClick={() => setModal("")}
            >
              <X size={20} />
            </button>
            <span className="fh-modal-orb">
              <img src={logo} alt="" width="36" height="36" />
            </span>
            <span className="fh-label">
              {modal === "project"
                ? "A SEED OF POSSIBILITY"
                : modal === "workspace"
                  ? "YOUR NEXT CHAPTER"
                  : "GOOD THINGS GROW TOGETHER"}
            </span>
            <h2 id="modal-title">
              {modal === "workspace"
                ? "What’s your workspace called?"
                : modal === "project"
                  ? "Choose your starting point."
                  : modal === "members"
                    ? "The people in your garden."
                    : "Make room for your people."}
            </h2>
            <p>
              {modal === "workspace"
                ? "A home for your projects. Solo today, together whenever you like."
                : modal === "project"
                  ? "A little structure to get going. Make it yours as you grow."
                  : modal === "members"
                    ? workspace?.name
                    : "Invite someone by email. Only that person can accept the invitation."}
            </p>
            {error && (
              <p role="alert" className="flowe-error">
                {error}
              </p>
            )}
            {modal === "members" ? (
              <div className="fh-members">
                {members.map((m) => (
                  <div key={m.user._id}>
                    <span className="fh-avatar">
                      {m.user.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span>
                      <strong>{m.user.name}</strong>
                      <small>{m.user.email}</small>
                    </span>
                    {owner && m.user._id !== user.id ? (
                      <select
                        aria-label={"Role for " + m.user.name}
                        value={m.role}
                        onChange={async (e) => {
                          const role = e.target.value;
                          if (
                            role === "remove" &&
                            !window.confirm(
                              "Remove " + m.user.name + " from this workspace?",
                            )
                          )
                            return;
                          try {
                            await api(
                              `/workspaces/${active}/members/${m.user._id}`,
                              { method: "PATCH", body: { role } },
                            );
                            setMembers(
                              (await api(`/workspaces/${active}/members`))
                                .members,
                            );
                          } catch (e) {
                            setError(e.message);
                          }
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="reader">Reader</option>
                        <option value="remove">Remove member</option>
                      </select>
                    ) : (
                      <span className="fh-pill">{m.role}</span>
                    )}
                  </div>
                ))}
                {owner && invitations.length>0&&<div className="fh-invite-section-title">Workspace invitations <small>· pending, accepted and expired</small></div>}
                {owner &&
                  invitations.map((inv) => (
                    <div key={inv._id}>
                      <span>
                        {inv.email}
                        <small>{inv.acceptedAt ? `✓ Accepted ${new Date(inv.acceptedAt).toLocaleDateString()}` : new Date(inv.expiresAt)<=new Date() ? 'Expired' : `Pending · expires ${new Date(inv.expiresAt).toLocaleDateString()}`}</small>
                      </span>
                      {!inv.acceptedAt && new Date(inv.expiresAt)>new Date()&&<button type="button" onClick={async()=>{try{const d=await api(`/workspaces/${active}/invitations/${inv._id}/resend`,{method:'POST'});setNotice(`Invitation resent to ${inv.email}`);setInvitations(items=>items.map(x=>x._id===inv._id?{...x,expiresAt:d.expiresAt}:x))}catch(e){setError(e.message)}}}>Resend</button>}
                      {!inv.acceptedAt && new Date(inv.expiresAt)>new Date()&&<button
                        onClick={async () => {
                          try {
                            await api(
                              `/workspaces/${active}/invitations/${inv._id}`,
                              { method: "DELETE" },
                            );
                            setInvitations((a) =>
                              a.filter((x) => x._id !== inv._id),
                            );
                          } catch (e) {
                            setError(e.message);
                          }
                        }}
                      >
                        Revoke invitation
                      </button>}
                    </div>
                  ))}
                {owner && (
                  <button className="fh-primary" onClick={() => open("invite")}>
                    Invite someone <Plus size={16} />
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={submit} aria-busy={busy}>
                {modal === "invite" ? (
                  <>
                    <label htmlFor="invite-email">Email address</label>
                    <input
                      id="invite-email"
                      type="email"
                      autoFocus
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      placeholder="friend@example.com"
                    />
                    {inviteURL && (
                      <div className="fh-invite-result">
                        <strong>
                          Invitation ready{" "}
                          <img src={logo} alt="" width="16" height="16" />
                        </strong>
                        <p>The link expires in 7 days.</p>
                        <input
                          aria-label="Invitation link"
                          readOnly
                          value={inviteURL}
                        />
                        <button
                          type="button"
                          className="fh-pill"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(inviteURL);
                              setNotice("Invitation link copied.");
                            } catch {
                              setError(
                                "Copy the invitation link from the field above.",
                              );
                            }
                          }}
                        >
                          Copy invitation link
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label htmlFor="create-name">
                      {modal === "workspace" ? "Workspace" : "Project"} name
                    </label>
                    <input
                      id="create-name"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      required
                      placeholder={
                        modal === "workspace"
                          ? "e.g. Design collective"
                          : "e.g. Our next big idea"
                      }
                    />
                    {modal === "project" && workspaces.length > 1 && (
                      <>
                        <label htmlFor="destination-workspace">
                          Create in workspace
                        </label>
                        <select
                          id="destination-workspace"
                          value={active}
                          onChange={(e) => setActive(e.target.value)}
                        >
                          {workspaces.map((w) => (
                            <option value={w._id} key={w._id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    {modal === "workspace" ? (
                      <>
                        <label htmlFor="description">
                          A little context <small>(optional)</small>
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          maxLength={500}
                          placeholder="What will grow here?"
                        />
                      </>
                    ) : (
                      <>
                        <label>Start with a template</label>
                        <div className="fh-template-grid">
                          {[
                            ...templates,
                            {
                              id: "custom",
                              name: "Your own rhythm",
                              eyebrow: "MAKE IT YOURS",
                              description:
                                "Name your columns and create a flow that fits you.",
                              color: "#f5bcd2",
                              columns: [],
                            },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={`fh-template ${template === t.id ? "selected" : ""}`}
                              onClick={() => setTemplate(t.id)}
                              aria-pressed={template === t.id}
                            >
                              <span
                                className="fh-template-icon"
                                style={{ background: t.color }}
                              >
                                <LayoutTemplate size={21} />
                                {template === t.id && <Check size={14} />}
                              </span>
                              <small>{t.eyebrow}</small>
                              <strong>{t.name}</strong>
                              <p>{t.description}</p>
                              <span className="fh-column-preview">
                                {t.columns.slice(0, 5).map((c) => (
                                  <i key={c}>{c}</i>
                                ))}
                              </span>
                            </button>
                          ))}
                        </div>
                        {template === "custom" && (
                          <>
                            <label htmlFor="custom-columns">
                              Your columns{" "}
                              <small>(separated by commas, 1–12)</small>
                            </label>
                            <input
                              id="custom-columns"
                              value={columns}
                              onChange={(e) => setColumns(e.target.value)}
                              required
                              placeholder="Ideas, Doing, Done"
                            />
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                <div className="fh-modal-actions">
                  <button
                    type="button"
                    className="fh-pill"
                    disabled={busy}
                    onClick={() => setModal("")}
                  >
                    {inviteURL ? "Done" : "Cancel"}
                  </button>
                  {!inviteURL && (
                    <button
                      className="fh-primary"
                      type="submit"
                      disabled={busy}
                    >
                      {busy
                        ? "Growing…"
                        : modal === "workspace"
                          ? "Create workspace"
                          : modal === "project"
                            ? "Plant this project"
                            : "Send invitation"}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      )}
</>
  );
}
