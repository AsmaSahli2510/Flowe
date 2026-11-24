import MemberAvatar from '../../../../components/ui/MemberAvatar';
import CardAttachments from "./CardAttachments";
import CardChecklist from "./CardChecklist";
import CardActivityPanel from "./CardActivityPanel";
import { COVER_PALETTE, initials, formatDate } from "../../utils/cardFormatting";
import { useEffect, useRef, useState } from 'react';
import { AlignLeft, Archive, Check, ChevronDown, Clock3, Copy, Ellipsis, Image, ListChecks, MapPin, MessageSquare, Paperclip, Plus, Settings2, Tag, UserPlus, WandSparkles, X, Zap } from 'lucide-react';
import {api} from '../../../../services/apiClient';
import './CardDetailsModal.css';
export default function CardDetails({card,project,workspaceId,members,user,onSave,onClose,readOnly,onDuplicate,onArchive,onConvertStep,cardButtons=[],onCardButton,onCreateLabel,onOpenAutomation}){
  const [draft,setDraft]=useState(()=>({...card,labels:(card.labels||[]).filter(Boolean),checklist:card.checklist||[],dependencies:card.dependencies||[],fields:card.fields||{}}));
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [panel,setPanel]=useState('');
  const [showActivity,setShowActivity]=useState(true);
  const [showChecked,setShowChecked]=useState(true);
  const [descriptionEditing,setDescriptionEditing]=useState(!card.detail);
  const [newStep,setNewStep]=useState('');
  const [stepOptions,setStepOptions]=useState(null);
  const [newLabel,setNewLabel]=useState('');
  const [newLabelColor,setNewLabelColor]=useState(COVER_PALETTE[0]);
  const [comment,setComment]=useState('');
  const [activity,setActivity]=useState({comments:[],files:[],events:[]});
  const [editingComment,setEditingComment]=useState('');
  const [reactionPicker,setReactionPicker]=useState(null);
  const [editText,setEditText]=useState('');
  const fileInput=useRef(null);
  const commentBox=useRef(null);
  const descriptionBox=useRef(null);
  const base=`/workspaces/${workspaceId}/projects/${project._id}/cards/${card.id}`;
  const all=project.lists.flatMap(l=>l.cards);
  const allowed=members.filter(m=>project.visibility!=='Private'||project.members?.includes(m.user._id)||m.user._id===project.createdBy||m.role==='owner');
  const checks=draft.checklist.filter(x=>x.done).length;
  const pct=draft.checklist.length?Math.round(100*checks/draft.checklist.length):0;
  const assigned=allowed.find(m=>m.user._id===draft.assignee)?.user;
  const currentList=project.lists.find(l=>l.id===draft.listId);
  const [saveHint,setSaveHint]=useState('');
  const change=(key,value)=>{setDraft(d=>({...d,[key]:value}));setSaveHint('Unsaved changes')};
  async function load(){
    try {const data=await api(base+'/activity');setActivity({comments:data.comments||[],files:data.files||[],events:data.events||[]})}
    catch(e){setError(e.message)}
  }
  useEffect(()=>{
    let alive=true;
    const update=async()=>{try{const data=await api(base+'/activity');if(alive)setActivity({comments:data.comments||[],files:data.files||[],events:data.events||[]})}catch(e){if(alive)setError(e.message)}};
    update();const interval=setInterval(update,6000);
    const refresh=e=>{if(Number(e.detail?.card)===card.id)update()};
    window.addEventListener('flowe-activity-changed',refresh);
    return ()=>{alive=false;clearInterval(interval);window.removeEventListener('flowe-activity-changed',refresh)};
  },[base,card.id]);
  useEffect(()=>{const key=e=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[onClose]);
  async function save(){
    if(!draft.title.trim()){setError('A card needs a title. Your changes were kept.');return}
    setBusy(true);setError('');
    try{await onSave({...draft,checks:draft.checklist.length,done:checks});setSaveHint('');onClose()}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }
  const toggleLabel=name=>change('labels',draft.labels.includes(name)?draft.labels.filter(x=>x!==name):[...draft.labels,name]);
  const addStep=()=>{if(!newStep.trim())return;change('checklist',[...draft.checklist,{id:crypto.randomUUID(),text:newStep.trim(),done:false}]);setNewStep('')};
  const toggleStep=(id,done)=>change('checklist',draft.checklist.map(x=>x.id===id?{...x,done}:x));
  const editStep=(id,text)=>change('checklist',draft.checklist.map(x=>x.id===id?{...x,text}:x));
  const deleteStep=id=>change('checklist',draft.checklist.filter(x=>x.id!==id));
  const coverUrl=id=>`/api/workspaces/${workspaceId}/projects/${project._id}/files/${id}?inline=1`;
  async function uploadFile(file){
    if(!file)return;if(file.size>3000000){setError('Attachments must be smaller than 3 MB.');return}
    setBusy(true);setError('');
    try{
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});
      await api(base+'/files',{method:'POST',body:{name:file.name,data}});await load();window.dispatchEvent(new CustomEvent('flowe-activity-changed',{detail:{card:card.id}}));
    }catch(e){setError(e.message)}finally{setBusy(false);if(fileInput.current)fileInput.current.value=''}
  }
  async function deleteFile(file){
    if(!window.confirm(`Remove attachment "${file.name}"?`))return;
    try{await api(base+'/files/'+file._id,{method:'DELETE'});if(draft.coverImageId===file._id)change('coverImageId','');await load();window.dispatchEvent(new CustomEvent('flowe-activity-changed',{detail:{card:card.id}}))}
    catch(e){setError(e.message)}
  }
  async function postComment(e){
    e.preventDefault();if(!comment.trim()||readOnly)return;setBusy(true);setError('');
    try{await api(base+'/comments',{method:'POST',body:{text:comment.trim(),clientId:crypto.randomUUID()}});setComment('');await load();window.dispatchEvent(new CustomEvent('flowe-activity-changed',{detail:{card:card.id}}))}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }
  async function reactToComment(id,emoji){
    try{await api(base+'/comments/'+id+'/react',{method:'POST',body:{emoji}});setReactionPicker(null);await load();window.dispatchEvent(new CustomEvent('flowe-activity-changed',{detail:{card:card.id}}))}
    catch(e){setError(e.message)}
  }
  async function changeComment(id,action){
    try{if(action==='delete'){if(!window.confirm('Delete this comment?'))return;await api(base+'/comments/'+id,{method:'DELETE'})}
      else await api(base+'/comments/'+id,{method:'PATCH',body:{text:editText}});
      setEditingComment('');await load();window.dispatchEvent(new CustomEvent('flowe-activity-changed',{detail:{card:card.id}}))}
    catch(e){setError(e.message)}
  }
  const choosePanel=key=>setPanel(p=>p===key?'':key);
  const entries=[...activity.comments.map(value=>({type:'comment',value})),...activity.files.map(value=>({type:'file',value})),...activity.events.map(value=>({type:'event',value}))].sort((a,b)=>new Date(b.value.createdAt)-new Date(a.value.createdAt));
  const uploadButton=<button type="button" disabled={readOnly} onClick={()=>fileInput.current?.click()}><Paperclip size={16}/>Attachment</button>;
  return <div className="cd-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section role="dialog" aria-modal="true" aria-label={`Card details: ${draft.title}`} className={`cd-modal ${showActivity?'':'cd-slim'}`}>
      <div className={`cd-top ${draft.coverImageId||draft.coverColor?'has-cover':''}`} style={draft.coverImageId?{backgroundImage:`url(${coverUrl(draft.coverImageId)})`}:draft.coverColor?{background:draft.coverColor}:{}}>
        <div className="cd-top-actions">
          <select aria-label="Move to list" title="Move card to another list" disabled={readOnly} value={draft.listId} onChange={e=>change('listId',Number(e.target.value))}>
            {project.lists.filter(l=>!l.archived).map(l=><option value={l.id} key={l.id}>{l.title}</option>)}
          </select>
          <span className="cd-top-end">
            <button title="Change cover" aria-label="Change cover" onClick={()=>choosePanel('Cover')}><Image size={17}/></button>
            <button title="Card actions" aria-label="Card actions" onClick={()=>choosePanel('Actions')}><Ellipsis size={19}/></button>
            <button title="Close card details" aria-label="Close card details" onClick={onClose}><X size={20}/></button>
          </span>
        </div>
      </div>
      <div className="cd-main">
        <div className="cd-left">
          <div className="cd-title-row">
            <button aria-label={draft.completed?'Mark incomplete':'Mark complete'} title={draft.completed?'Mark incomplete':'Mark complete'} disabled={readOnly} className={`cd-complete ${draft.completed?'active':''}`} onClick={()=>change('completed',!draft.completed)}>{draft.completed?<Check size={18}/>:null}</button>
            <input aria-label="Card title" maxLength={240} disabled={readOnly} value={draft.title} onChange={e=>change('title',e.target.value)} className={`cd-title-input ${draft.completed?'completed':''}`}/>
          </div>
          <div className="cd-quick">
            <button onClick={()=>choosePanel('Add')}><Plus size={16}/>Add</button>
            <button onClick={()=>choosePanel('Labels')}><Tag size={16}/>Labels</button>
            <button onClick={()=>choosePanel('Dates')}><Clock3 size={16}/>Dates</button>
            <button onClick={()=>{choosePanel('Checklist');setTimeout(()=>document.querySelector('.cd-add-step input')?.focus(),0)}}><ListChecks size={16}/>Checklist</button>
            <button onClick={()=>choosePanel('Members')}><UserPlus size={16}/>Members</button>
            {uploadButton}
            <button onClick={()=>choosePanel('Location')}><MapPin size={16}/>Location</button>
          </div>
          {!!panel&&<div className="cd-action-panel">
            <header><strong>{panel}</strong><button aria-label="Close action panel" onClick={()=>setPanel('')}><X size={16}/></button></header>
            {panel==='Power-ups'&&<><p className="cd-small-note">Flowe extensions available for this card</p><div className="cd-action-grid"><button onClick={()=>choosePanel('Advanced')}><Settings2 size={15}/>Custom fields</button><button onClick={()=>choosePanel('Location')}><MapPin size={15}/>Location</button><button onClick={()=>choosePanel('Cover')}><Image size={15}/>Cover</button><button onClick={()=>choosePanel('Labels')}><Tag size={15}/>Labels</button></div></>}
            {panel==='Add'&&<div className="cd-action-grid">{['Labels','Dates','Checklist','Members','Cover','Location','Advanced'].map(x=><button onClick={()=>choosePanel(x)} key={x}><Plus size={14}/>{x}</button>)}{uploadButton}</div>}
            {panel==='Labels'&&<><div className="cd-label-options">{(project.labelPalette||[]).map(l=><button disabled={readOnly} type="button" className={draft.labels.includes(l.name)?'active':''} key={l.name} onClick={()=>toggleLabel(l.name)} style={{'--chip':l.color}}>{l.name}{draft.labels.includes(l.name)&&<Check size={15}/>}</button>)}</div>
              <div className="cd-new-label"><input placeholder="New label name" disabled={readOnly} value={newLabel} onChange={e=>setNewLabel(e.target.value)}/><input aria-label="New label color" type="color" value={newLabelColor} onChange={e=>setNewLabelColor(e.target.value)}/><button disabled={readOnly||!newLabel.trim()} onClick={()=>{const name=newLabel.trim();if(!draft.labels.includes(name))change('labels',[...draft.labels,name]);onCreateLabel?.(name,newLabelColor);setNewLabel('')}}>Create</button></div>
            </>}
            {panel==='Dates'&&<div className="cd-action-grid"><label>Start date<input disabled={readOnly} aria-label="Start date" type="date" value={draft.start||''} onChange={e=>change('start',e.target.value)}/></label><label>Due date<input disabled={readOnly} aria-label="Due date" type="date" value={draft.due||''} onChange={e=>change('due',e.target.value)}/></label><button disabled={readOnly} onClick={()=>{change('start','');change('due','')}}>Clear dates</button></div>}
            {panel==='Members'&&<div className="cd-member-choices">{allowed.map(m=><button disabled={readOnly} onClick={()=>change('assignee',draft.assignee===m.user._id?'':m.user._id)} key={m.user._id}><MemberAvatar user={m.user} size={28} showStatus={false}/>{m.user.name}{draft.assignee===m.user._id&&<Check size={17}/>}</button>)}</div>}
            {panel==='Cover'&&<><p className="cd-small-note">Choose a cover color, or use an attached image as cover.</p><div className="cd-color-swatches">{COVER_PALETTE.map(c=><button disabled={readOnly} key={c} title={`Choose ${c}`} style={{background:c}} onClick={()=>{change('coverColor',c);change('coverImageId','')}}/>)}<button disabled={readOnly} title="Remove cover" onClick={()=>{change('coverColor','');change('coverImageId','')}}><X size={16}/></button></div>{activity.files.filter(f=>f.mime?.startsWith('image/')).map(f=><button className="cd-cover-file" key={f._id} onClick={()=>{change('coverImageId',f._id);change('coverColor','')}}><Image size={15}/>{f.name}</button>)}</>}
            {panel==='Location'&&<div className="cd-action-grid"><label>Place<input disabled={readOnly} maxLength={160} value={draft.location||''} onChange={e=>change('location',e.target.value)} placeholder="Where is this?"/></label><label>Latitude<input disabled={readOnly} type="number" step="any" value={draft.latitude||''} onChange={e=>change('latitude',e.target.value)}/></label><label>Longitude<input disabled={readOnly} type="number" step="any" value={draft.longitude||''} onChange={e=>change('longitude',e.target.value)}/></label></div>}
            {panel==='Checklist'&&<p className="cd-small-note">Use the checklist section below to add or complete items.</p>}
            {panel==='Actions'&&<div className="cd-action-grid"><button disabled={readOnly} onClick={()=>onDuplicate?.(draft)}><Copy size={15}/>Copy card</button><button disabled={readOnly} onClick={()=>onArchive?.(draft)}><Archive size={15}/>Archive card</button><button disabled={readOnly} onClick={()=>change('completed',!draft.completed)}><Check size={15}/>{draft.completed?'Mark incomplete':'Mark complete'}</button><button onClick={()=>choosePanel('Advanced')}><Settings2 size={15}/>More settings</button></div>}
            {panel==='Advanced'&&<div className="cd-action-grid">
              <label>Responsible<select aria-label="Responsible" disabled={readOnly} value={draft.assignee||''} onChange={e=>change('assignee',e.target.value)}><option value="">Unassigned</option>{allowed.map(m=><option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}</select></label>
              <label>Priority<select disabled={readOnly} value={draft.priority||'Medium'} onChange={e=>change('priority',e.target.value)}>{['Low','Medium','High'].map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Prerequisites<select aria-label="Prerequisites" disabled={readOnly} multiple value={draft.dependencies.map(String)} onChange={e=>change('dependencies',[...e.target.selectedOptions].map(o=>Number(o.value)))}>{all.filter(c=>c.id!==card.id&&!c.archived).map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label>
              {(project.customFields||[]).filter(f=>f.visible!==false).map(f=><label key={f.name}>{f.name}<input type={f.type} value={draft.fields[f.name]||''} disabled={readOnly} onChange={e=>change('fields',{...draft.fields,[f.name]:e.target.value})}/></label>)}
            </div>}
          </div>}
          {(assigned||draft.labels.length||draft.due||draft.start)&&<div className="cd-fields">
            {assigned&&<div><small>Members</small><MemberAvatar user={assigned} size={28} showStatus={false}/><button aria-label="Add members" disabled={readOnly} onClick={()=>choosePanel('Members')}><Plus size={17}/></button></div>}
            {!!draft.labels.length&&<div><small>Labels</small><span className="cd-label-row">{draft.labels.map((name,i)=><button key={name+i} style={{background:(project.labelPalette||[]).find(l=>l.name===name)?.color||'#c3a7eb'}} onClick={()=>choosePanel('Labels')}>{name}</button>)}<button aria-label="Add labels" onClick={()=>choosePanel('Labels')}><Plus size={16}/></button></span></div>}
            {(draft.due||draft.start)&&<div><small>Dates</small><button className={`cd-date-chip ${draft.completed?'is-done':''}`} onClick={()=>choosePanel('Dates')}><Clock3 size={15}/>{draft.start&&`${formatDate(draft.start)} – `}{draft.due?formatDate(draft.due):'Start only'}{draft.completed&&<strong>Complete</strong>}<ChevronDown size={14}/></button></div>}
          </div>}
          <section className="cd-section"><header><h3><AlignLeft size={19}/>Description</h3><button onClick={()=>{setDescriptionEditing(v=>!v);setTimeout(()=>descriptionBox.current?.focus(),0)}}>{descriptionEditing?'Done':'Edit'}</button></header>
            {descriptionEditing||!draft.detail?<textarea aria-label="Description" ref={descriptionBox} disabled={readOnly} maxLength={5000} value={draft.detail||''} onChange={e=>change('detail',e.target.value)} placeholder="Add a more detailed description..." rows={3}/>:<p className="cd-description" onClick={()=>!readOnly&&setDescriptionEditing(true)}>{draft.detail}</p>}
          </section>
          {activity.files.length>0&&<CardAttachments {...{activity, fileInput, readOnly, coverUrl, deleteFile, change}} />}
          <CardChecklist {...{draft, setShowChecked, showChecked, readOnly, change, pct, newStep, setNewStep, addStep, toggleStep, editStep, setStepOptions, stepOptions, allowed, onConvertStep, onClose, setBusy, setError, deleteStep}} />
          {(draft.location)&&<div className="cd-location"><MapPin size={16}/>{draft.location}<button onClick={()=>choosePanel('Location')}>Edit</button></div>}
        </div>
        {showActivity&&<CardActivityPanel {...{setShowActivity, postComment, commentBox, comment, readOnly, setComment, busy, allowed, entries, editingComment, editText, setEditText, changeComment, reactionPicker, setReactionPicker, setEditingComment, reactToComment, user, coverUrl}} />}
      </div>
      {error&&<div className="cd-error" role="alert">{error}</div>}
      <footer className="cd-footer"><div className="cd-footer-left">
        <button onClick={()=>choosePanel('Power-ups')}><WandSparkles size={16}/>Power-ups</button>
        <button onClick={()=>cardButtons.length?choosePanel('Automation'):onOpenAutomation?.()}><Zap size={16}/>Automations</button>
        <button className={showActivity?'selected':''} onClick={()=>setShowActivity(v=>!v)}><MessageSquare size={16}/>Comments</button>
      </div>
        {panel==='Automation'&&!!cardButtons.length&&<div className="cd-automation-pills">{cardButtons.map(r=><button key={r.id} disabled={readOnly} onClick={()=>{onCardButton?.(r,card.id);onClose()}}><WandSparkles size={14}/>{r.name}</button>)}</div>}
        <div className="cd-footer-right">{saveHint&&<small>{saveHint}</small>}<button className="cd-save" disabled={readOnly||busy} onClick={save}><Check size={16}/>{busy?'Saving…':'Save changes'}</button></div>
      </footer>
      <input ref={fileInput} type="file" className="cd-hidden-input" aria-label="Upload attachment" disabled={readOnly||busy} onChange={e=>uploadFile(e.target.files?.[0])}/>
    </section>
  </div>
}
