import { ListChecks, Ellipsis, Plus, X } from 'lucide-react';

export default function CardChecklist({draft, setShowChecked, showChecked, readOnly, change, pct, newStep, setNewStep, addStep, toggleStep, editStep, setStepOptions, stepOptions, allowed, onConvertStep, onClose, setBusy, setError, deleteStep}) {
  return (
<section className="cd-section cd-checklist-section"><header><h3><ListChecks size={19}/>Checklist {draft.checklist.length?'':''}</h3><span className="cd-section-actions"><button onClick={()=>setShowChecked(v=>!v)}>{showChecked?'Hide checked items':'Show checked items'}</button><button disabled={readOnly||!draft.checklist.length} onClick={()=>{if(window.confirm('Delete this checklist?'))change('checklist',[])}}>Delete</button></span></header>
            {!!draft.checklist.length&&<><div className="cd-progress-info"><span>{pct}%</span><div className="cd-progress"><i style={{width:`${pct}%`}}/></div></div>
              {draft.checklist.filter(item=>showChecked||!item.done).map(item=><div className="cd-step-wrap" key={item.id}>
                <div className="cd-step">
                  <input aria-label={`Complete ${item.text}`} type="checkbox" disabled={readOnly} checked={!!item.done} onChange={e=>toggleStep(item.id,e.target.checked)}/>
                  <input aria-label={`Checklist item ${item.text}`} className={item.done?'done':''} value={item.text} disabled={readOnly} onChange={e=>editStep(item.id,e.target.value)}/>
                  <button title="Item dates and assignment" aria-label={`Options for ${item.text}`} onClick={()=>setStepOptions(v=>v===item.id?null:item.id)}><Ellipsis size={15}/></button>
                  <button title="Convert to card" aria-label={`Convert ${item.text} to card`} disabled={readOnly} onClick={async()=>{setBusy(true);try{await onConvertStep?.(draft,item);onClose()}catch(e){setError(e.message)}finally{setBusy(false)}}}><Plus size={14}/></button>
                  <button title="Remove checklist item" aria-label={`Remove ${item.text}`} disabled={readOnly} onClick={()=>deleteStep(item.id)}><X size={15}/></button>
                </div>
                {stepOptions===item.id&&<div className="cd-step-options"><label>Due date<input aria-label={`Due date for ${item.text}`} type="date" disabled={readOnly} value={item.due||''} onChange={e=>change('checklist',draft.checklist.map(x=>x.id===item.id?{...x,due:e.target.value}:x))}/></label><label>Assigned to<select aria-label={`Member for ${item.text}`} disabled={readOnly} value={item.assignee||''} onChange={e=>change('checklist',draft.checklist.map(x=>x.id===item.id?{...x,assignee:e.target.value}:x))}><option value="">Anyone</option>{allowed.map(m=><option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}</select></label></div>}
              </div>)}
            </>}
            <form className="cd-add-step" onSubmit={e=>{e.preventDefault();addStep()}}><input placeholder="Add an item" aria-label="New checklist item" value={newStep} maxLength={500} disabled={readOnly} onChange={e=>setNewStep(e.target.value)}/><button disabled={readOnly||!newStep.trim()} type="submit">Add an item</button></form>
          </section>
  );
}
