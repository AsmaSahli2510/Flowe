import { useEffect, useState } from "react";
import { X, Check, Plus, Archive, Paperclip, MessageSquare, ArrowUpRight, SlidersHorizontal, CalendarDays, ShieldCheck, Copy, MapPin, Palette, WandSparkles, Tag, ArrowRight, Trash2 } from "lucide-react";
import { api } from "../../../../services/apiClient";
import "./CardEditor.css";
import { Modal } from "../../../../components/ui/Modal";
export { Modal } from "../../../../components/ui/Modal";
export default function CardEditor({
  card,
  project,
  workspaceId,
  members,
  user,
  onSave,
  onClose,
  readOnly,
  onDuplicate,
  onArchive,
  onConvertStep,
  cardButtons=[],
  onCardButton,
}) {
  const [draft, setDraft] = useState(() => ({
    ...card,
    checklist: card.checklist || [],
    labels: card.labels || [],
    dependencies: card.dependencies || [],
    fields: card.fields || {},
  }));
  const [tab, setTab] = useState("Details"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [step, setStep] = useState(""),
    [comment, setComment] = useState(""),
    [activity, setActivity] = useState({ comments: [], files: [] }),
    [editingComment,setEditingComment] = useState(''),
    [editText,setEditText] = useState('');
  const [helper, setHelper] = useState(""),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState("");
  const base = `/workspaces/${workspaceId}/projects/${project._id}/cards/${card.id}`;
  async function load() {
    try {
      const d = await api(base + "/activity");
      setActivity({
        comments: d.comments || [],
        files: d.files || [],
        help: d.help || [],
      });
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    const timer = setInterval(load, 6000);
    const refresh = e => {if(Number(e.detail?.card)===card.id)load()};
    window.addEventListener('flowe-activity-changed',refresh);
    return () => {clearInterval(timer);window.removeEventListener('flowe-activity-changed',refresh)};
  }, [base]);
  const change = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  async function save() {
    if (!draft.title.trim()) {
      setError("Give this card a title. Your changes are still here.");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...draft,
        checks: draft.checklist.length,
        done: draft.checklist.filter((x) => x.done).length,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const all = project.lists.flatMap((l) => l.cards),
    allowed = members.filter(
      (m) =>
        project.visibility !== "Private" ||
        project.members?.includes(m.user._id) ||
        m.user._id === project.createdBy ||
        m.role === "owner",
    );
  return (
    <Modal
      title={draft.title}
      kicker="FLOWE · CARD DETAILS"
      close={onClose}
      wide
    >
      <div className="at-card-hero" style={{background:draft.coverColor||'linear-gradient(120deg,#e8dafa,#f9e3ec)',backgroundImage:draft.coverImageId?`url(/api/workspaces/${workspaceId}/projects/${project._id}/files/${draft.coverImageId}?inline=1)`:undefined,backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="at-card-hero-actions"><button disabled={readOnly} onClick={()=>change('completed',!draft.completed)}><Check size={16}/>{draft.completed?'Completed':'Mark complete'}</button><button disabled={readOnly} onClick={()=>onDuplicate?.(draft)}><Copy size={16}/>Copy card</button><button disabled={readOnly} onClick={()=>onArchive?.(draft)}><Archive size={16}/>Archive</button></div>
      </div>
      <div className="at-quick-actions"><span>Quick add</span><button onClick={()=>setTab('Checklist')}><Check size={14}/>Checklist</button><button onClick={()=>setTab('Conversation')}><MessageSquare size={14}/>Comments & files</button>{cardButtons.map(r=><button key={r.id} disabled={readOnly} onClick={()=>{onCardButton?.(r,card.id);onClose()}}><WandSparkles size={14}/>{r.name}</button>)}</div>
      <div className="at-tabs">
        {["Details", "Checklist", "Conversation"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
            {t === "Checklist"
              ? " · " +
                draft.checklist.filter((x) => x.done).length +
                "/" +
                draft.checklist.length
              : ""}
          </button>
        ))}
      </div>
      {error && (
        <p className="at-error" role="alert">
          {error}
        </p>
      )}
      <div className="at-body">
        <fieldset disabled={readOnly || busy}>
          {tab === "Details" && (
            <>
              <label>
                Card title
                <input
                  maxLength={240}
                  value={draft.title}
                  onChange={(e) => change("title", e.target.value)}
                />
              </label>
              <label>
                Description
                <textarea
                  rows={4}
                  maxLength={5000}
                  placeholder="What does a good outcome look like?"
                  value={draft.detail || ""}
                  onChange={(e) => change("detail", e.target.value)}
                />
              </label>
              <div className="at-grid">
                <label>
                  Responsible
                  <select
                    value={draft.assignee || ""}
                    onChange={(e) => change("assignee", e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {allowed.map((m) => (
                      <option value={m.user._id} key={m.user._id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={draft.priority || "Medium"}
                    onChange={(e) => change("priority", e.target.value)}
                  >
                    {["Low", "Medium", "High"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Start date
                  <input type="date" value={draft.start||''} onChange={e=>change('start',e.target.value)}/>
                </label>
                <label>
                  Due date
                  <input
                    type="date"
                    value={draft.due || ""}
                    onChange={(e) => change("due", e.target.value)}
                  />
                </label>
                <label>
                  Labels · separated by commas
                  <input
                    value={draft.labels.join(", ")}
                    onChange={(e) =>
                      change(
                        "labels",
                        e.target.value.split(",").map((v) => v.trim()),
                      )
                    }
                  />
                </label>
              </div>
              <div className="at-palette-panel"><strong><Palette size={15}/> Card cover color</strong><div className="at-cover-choices">{['#d7bcec','#e7a0ba','#edbb72','#a9d8c5','#90c8e1','#f1c2aa','#e9e5dd'].map(color=><button type="button" title={`Use ${color} color`} className={draft.coverColor===color?'chosen':''} key={color} style={{background:color}} onClick={()=>change('coverColor',color)} aria-label={`Set cover color ${color}`}/>)}<button type="button" title="Remove cover color" onClick={()=>change('coverColor','')}><X size={14}/></button></div></div>
              <div className="at-location-grid"><label><MapPin size={14}/> Location name<input maxLength="160" placeholder="e.g. Campus building" value={draft.location||''} onChange={e=>change('location',e.target.value)}/></label><label>Latitude<input type="number" step="any" placeholder="36.8065" value={draft.latitude||''} onChange={e=>change('latitude',e.target.value)}/></label><label>Longitude<input type="number" step="any" placeholder="10.1815" value={draft.longitude||''} onChange={e=>change('longitude',e.target.value)}/></label></div>
              {!!project.labelPalette?.length&&<div className="at-label-options"><strong><Tag size={14}/> Labels</strong><div>{project.labelPalette.map(l=><button type="button" key={l.name} style={{background:l.color}} className={draft.labels.includes(l.name)?'active':''} onClick={()=>change('labels',draft.labels.includes(l.name)?draft.labels.filter(x=>x!==l.name):[...draft.labels,l.name])}>{draft.labels.includes(l.name)?'✓ ':''}{l.name}</button>)}</div></div>}
              <label>
                Move to
                <select
                  value={draft.listId}
                  onChange={(e) => change("listId", Number(e.target.value))}
                >
                  {project.lists.filter(l=>!l.archived).map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prerequisites
                <select
                  multiple
                  value={draft.dependencies.map(String)}
                  onChange={(e) =>
                    change(
                      "dependencies",
                      [...e.target.selectedOptions].map((o) => Number(o.value)),
                    )
                  }
                >
                  {all
                    .filter((c) => c.id !== card.id && !c.archived)
                    .map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.completed ? "✓ " : ""}
                        {c.title}
                      </option>
                    ))}
                </select>
                <small>
                  Ctrl / Cmd + click to select or clear prerequisites. Circular
                  dependencies are refused.
                </small>
              </label>
              {(project.customFields || [])
                .filter((f) => f.visible !== false)
                .map((f) => (
                  <label key={f.name}>
                    {f.name}
                    <input
                      type={f.type}
                      value={draft.fields[f.name] || ""}
                      onChange={(e) =>
                        change("fields", {
                          ...draft.fields,
                          [f.name]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              <label className="at-check">
                <input
                  type="checkbox"
                  checked={!!draft.completed}
                  onChange={(e) => change("completed", e.target.checked)}
                />
                Completed
              </label>
              {card.source && (
                <p className="at-hint">
                  Created from{" "}
                  {card.source==='inbox'?'your private Inbox': 'a conversation message'}
                  .
                </p>
              )}
            </>
          )}
          {tab === "Checklist" && (
            <>
              <div className="at-progress">
                <i
                  style={{
                    width:
                      (draft.checklist.length
                        ? (100 * draft.checklist.filter((x) => x.done).length) /
                          draft.checklist.length
                        : 0) + "%",
                  }}
                />
              </div>
              {draft.checklist.map((c) => (
                <div className="at-check-row" key={c.id}>
                  <input
                    aria-label={"Complete " + c.text}
                    type="checkbox"
                    checked={c.done}
                    onChange={(e) =>
                      change(
                        "checklist",
                        draft.checklist.map((x) =>
                          x.id === c.id ? { ...x, done: e.target.checked } : x,
                        ),
                      )
                    }
                  />
                  <div className="at-step-details"><span>{c.text}</span><div><label>Due<input type="date" aria-label={`Due date for ${c.text}`} value={c.due||''} onChange={e=>change('checklist',draft.checklist.map(x=>x.id===c.id?{...x,due:e.target.value}:x))}/></label><label>Assigned<select aria-label={`Member for ${c.text}`} value={c.assignee||''} onChange={e=>change('checklist',draft.checklist.map(x=>x.id===c.id?{...x,assignee:e.target.value}:x))}><option value="">Anyone</option>{allowed.map(m=><option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}</select></label></div></div>
                  {onConvertStep && <button type="button" title="Convert to card" aria-label={`Convert ${c.text} to card`} onClick={async()=>{setBusy(true);try{await onConvertStep(draft,c);onClose()}catch(e){setError(e.message)}finally{setBusy(false)}}}><ArrowRight size={14}/></button>}
                  <button
                    aria-label={"Remove " + c.text}
                    onClick={() =>
                      change(
                        "checklist",
                        draft.checklist.filter((x) => x.id !== c.id),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="at-inline">
                <input
                  placeholder="One small next step…"
                  maxLength={500}
                  value={step}
                  onChange={(e) => setStep(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (step.trim()) {
                      change("checklist", [
                        ...draft.checklist,
                        {
                          id: crypto.randomUUID(),
                          text: step.trim(),
                          done: false,
                        },
                      ]);
                      setStep("");
                    }
                  }}
                >
                  <Plus size={16} />
                  Add step
                </button>
              </div>
            </>
          )}
        </fieldset>
        {tab === "Conversation" && (
          <>
            <h3>
              <MessageSquare size={17} /> Keep the context here
            </h3>
            {activity.comments.map((c) => (
              <article className="at-comment" key={c._id}>
                <strong>{c.name}</strong>
                <time>{new Date(c.createdAt).toLocaleString()}</time>
                {editingComment===c._id?<><textarea aria-label="Edit your comment" value={editText} onChange={e=>setEditText(e.target.value)}/><div className="at-inline"><button disabled={!editText.trim()} onClick={async()=>{try{await api(base+'/comments/'+c._id,{method:'PATCH',body:{text:editText}});setEditingComment('');await load()}catch(e){setError(e.message)}}}>Save</button><button onClick={()=>setEditingComment('')}>Cancel</button></div></>:<p>{c.text}</p>}
                {c.author===user.id && editingComment!==c._id && <div className="at-comment-actions"><button onClick={()=>{setEditingComment(c._id);setEditText(c.text)}}>Edit</button><button onClick={async()=>{if(!window.confirm('Delete this comment?'))return;try{await api(base+'/comments/'+c._id,{method:'DELETE'});await load()}catch(e){setError(e.message)}}}>Delete</button></div>}
              </article>
            ))}
            {!activity.comments.length && (
              <p className="at-hint">
                A question, a decision, a useful detail. Start the conversation.
              </p>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api(base + "/comments", {
                    method: "POST",
                    body: { text: comment, clientId: crypto.randomUUID() },
                  });
                  setComment("");
                  await load();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="at-mention-tips"><span>Notify:</span>{['@board','@card',...allowed.map(m=>'@'+m.user.name.replace(/\s+/g,''))].slice(0,7).map(m=><button key={m} type="button" onClick={()=>setComment(x=>x+(x&& !x.endsWith(' ')?' ':'')+m+' ')}>{m}</button>)}</div>
              <textarea
                aria-label="Comment"
                placeholder="Add a comment… Use @ for mentions"
                maxLength={4000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button disabled={readOnly || busy || !comment.trim()}>
                Post comment
              </button>
            </form>
            <h3>
              <Paperclip size={17} /> Project files
            </h3>
            {activity.files.map((f) => (
              <div className="at-file-item" key={f._id}>
                {f.mime?.startsWith('image/')&&<img className="at-file-preview" src={`/api/workspaces/${workspaceId}/projects/${project._id}/files/${f._id}?inline=1`} alt={f.name}/>}
                <div className="at-file">
                  <a href={`/api/workspaces/${workspaceId}/projects/${project._id}/files/${f._id}${f.mime==='application/pdf'?'?inline=1':''}`} target={f.mime==='application/pdf'?'_blank':undefined} rel="noopener noreferrer" download={f.mime==='application/pdf'?undefined:true}><Paperclip size={16}/>{f.name}<ArrowUpRight size={15}/></a>
                  {f.mime?.startsWith('image/')&&<button disabled={readOnly} onClick={()=>change('coverImageId',f._id)}>Use as cover</button>}
                  <button disabled={readOnly||busy} aria-label={`Remove ${f.name}`} title="Remove attachment" onClick={async()=>{try{await api(base+'/files/'+f._id,{method:'DELETE'});if(draft.coverImageId===f._id)change('coverImageId','');await load()}catch(e){setError(e.message)}}}><Trash2 size={15}/></button>
                </div>
              </div>
            ))}
            <label>
              Attach a file · up to 3 MB
              <input
                disabled={readOnly || busy}
                type="file"
                onChange={async (e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  if (f.size > 3000000) {
                    setError("Choose a file smaller than 3 MB.");
                    return;
                  }
                  setBusy(true);
                  try {
                    const data = await new Promise((resolve, reject) => {
                      const r = new FileReader();
                      r.onload = () => resolve(r.result.split(",")[1]);
                      r.onerror = reject;
                      r.readAsDataURL(f);
                    });
                    await api(base + "/files", {
                      method: "POST",
                      body: { name: f.name, data },
                    });
                    await load();
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
          </>
        )}
      </div>
      <footer>
        <button
          disabled={readOnly}
          onClick={() => change("archived", !draft.archived)}
        >
          <Archive size={16} />
          {draft.archived ? "Restore card" : "Archive card"}
          {draft.archived && " · selected"}
        </button>
        <button
          className="at-primary"
          disabled={readOnly || busy}
          onClick={save}
        >
          <Check size={16} />
          {busy ? "Saving…" : "Save changes"}
        </button>
      </footer>
    </Modal>
  );
}
export function AtelierBar({
  project,
  members=[],
  filters,
  setFilters,
  onSettings,
  onCalendar,
  readOnly,
}) {
  return (
    <div className="at-bar">
      <span>
        <SlidersHorizontal size={15} /> Filters
      </span>
      <select
        aria-label="Priority filter"
        value={filters.priority}
        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
      >
        <option value="">All priorities</option>
        {["High", "Medium", "Low"].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <select
        aria-label="Assignment filter"
        value={filters.mine}
        onChange={(e) => setFilters({ ...filters, mine: e.target.value })}
      >
        <option value="">Everyone</option>
        <option value="me">Assigned to me</option>
        <option value="none">Unassigned</option>{members.map(m=><option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
      </select>
      <select
        aria-label="Deadline filter"
        value={filters.due}
        onChange={(e) => setFilters({ ...filters, due: e.target.value })}
      >
        <option value="">Any deadline</option>
        <option value="late">Overdue</option>
        <option value="today">Today</option>
        <option value="week">Next 7 days</option>
      </select>
      <input
        aria-label="Label filter"
        placeholder="Label…"
        value={filters.label}
        onChange={(e) => setFilters({ ...filters, label: e.target.value })}
      />
      <label className="at-check">
        <input
          type="checkbox"
          checked={filters.archived}
          onChange={(e) =>
            setFilters({ ...filters, archived: e.target.checked })
          }
        />
        Archived
      </label>
      <button
        onClick={() =>
          setFilters({
            priority: "",
            mine: "",
            due: "",
            label: "",
            archived: false,
          })
        }
      >
        Clear
      </button>
      <div className="at-bar-end">
        <button onClick={onCalendar}>
          <CalendarDays size={15} />
          Deadlines
        </button>
        <button onClick={onSettings}>
          <ShieldCheck size={15} />
          {readOnly ? "View access" : "Settings"}
        </button>
      </div>
    </div>
  );
}
export function matchesCard(card, f, userId) {
  const today = new Date().toLocaleDateString("en-CA"),
    week = new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-CA");
  return (
    !!card.archived === f.archived &&
    (!f.priority || (card.priority || "Medium") === f.priority) &&
    (!f.mine ||
      (f.mine === "me" ? card.assignee === userId : f.mine === "none" ? !card.assignee : card.assignee===f.mine)) &&
    (!f.label ||
      card.labels?.some((l) =>
        l.toLowerCase().includes(f.label.toLowerCase()),
      )) &&
    (!f.due ||
      (card.due &&
        !card.completed &&
        (f.due === "late"
          ? card.due < today
          : f.due === "today"
            ? card.due === today
            : card.due >= today && card.due <= week)))
  );
}
