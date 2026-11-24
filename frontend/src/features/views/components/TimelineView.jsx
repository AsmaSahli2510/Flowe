import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Rows3, X } from 'lucide-react';
import { advance, cardRange, dateOffset, dateToday, dayKey, memberLabel, shiftCardToDate, weekStart } from '../utils/viewData';
import { LabelPips, ViewEmpty } from './ViewParts';
import { listColor } from '../../board/constants/listColors';

const SCALES={Day:{days:7,width:88,step:7},Week:{days:14,width:62,step:14},Month:{days:35,width:43,step:28},Quarter:{days:98,width:29,step:84},Year:{days:365,width:20,step:182}};
export default function TimelineView({cards,lists,members=[],palette=[],readOnly,onOpen,onCardPatch,onCreateCard}){
  const [cursor,setCursor]=useState(()=>new Date());
  const [scale,setScale]=useState('Month');
  const [groupBy,setGroupBy]=useState('List');
  const [showUnscheduled,setShowUnscheduled]=useState(false);
  const [editing,setEditing]=useState(null);
  const [draftTitle,setDraftTitle]=useState('');
  const [draftList,setDraftList]=useState('');
  const [dragOver,setDragOver]=useState('');
  const [resizePreview,setResizePreview]=useState(null);
  const resizeRef=useRef(null);
  useEffect(()=>()=>resizeRef.current?.(),[]);
  const {days:span,width:cellWidth,step}=SCALES[scale];
  const start=weekStart(advance(cursor,scale==='Day'?-2:scale==='Week'?-4:scale==='Month'?-10:scale==='Quarter'?-20:-30));
  const dates=useMemo(()=>Array.from({length:span},(_,i)=>advance(start,i)),[span,dayKey(start)]);
  const activeLists=lists.filter(l=>!l.archived);
  const groups=groupBy==='List' ? activeLists.map(l=>({id:String(l.id),title:l.title,listId:l.id,cards:cards.filter(c=>c.listId===l.id)})) :
    [...new Set(cards.map(c=>String(c.assignee||'')))].map(id=>({id,title:memberLabel(members,id),listId:activeLists[0]?.id,cards:cards.filter(c=>String(c.assignee||'')===id)}));
  const navigate=n=>setCursor(d=>advance(d,n*step));
  const drop=(e,date)=>{e.preventDefault();setDragOver('');if(readOnly)return;const id=Number(e.dataTransfer.getData('application/x-flowe-card')||e.dataTransfer.getData('text/flowe-card'));const card=cards.find(c=>c.id===id);if(card)onCardPatch(id,shiftCardToDate(card,date));};
  const startResize=(e,card,edge)=>{
    if(readOnly)return;
    e.preventDefault();e.stopPropagation();
    const initial=e.clientX,range=cardRange(card);if(!range)return;
    const move=ev=>{const delta=Math.round((ev.clientX-initial)/cellWidth);setResizePreview({id:card.id,delta,edge})};
    const end=ev=>{
      const delta=Math.round((ev.clientX-initial)/cellWidth);
      const s=range[0],d=range[1];
      if(edge==='start'){
        const moved=advance(s,delta);
        if(moved<=d)onCardPatch(card.id,{start:dayKey(moved),due:dayKey(d)});
      }else{
        const moved=advance(d,delta);
        if(moved>=s)onCardPatch(card.id,{start:card.start||dayKey(s),due:dayKey(moved)});
      }
      setResizePreview(null);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);resizeRef.current=null;
    };
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);
    resizeRef.current=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end)};
  };
  const addToGroup=(group)=>{if(readOnly)return;setEditing(group);setDraftTitle('');setDraftList(String(group.listId||activeLists[0]?.id||''))};
  const saveNew=e=>{e.preventDefault();if(!draftTitle.trim()||!draftList)return;onCreateCard(Number(draftList),draftTitle.trim(),dayKey(cursor));setEditing(null)};
  return <div className="bv-timeline-view">
    <div className="bv-view-controls bv-timeline-toolbar"><div className="bv-inline"><CalendarDays size={17}/><input type="month" className="bv-control bv-timeline-month" aria-label="Choose timeline month" value={dayKey(cursor).slice(0,7)} onChange={e=>{if(e.target.value)setCursor(new Date(e.target.value+'-01T12:00:00'))}}/><strong className="bv-range-title">{start.toLocaleDateString(undefined,{month:'short',year:'numeric'})} – {advance(start,span-1).toLocaleDateString(undefined,{month:'short',year:'numeric'})}</strong><button className="bv-control bv-icon-only" title="Previous range" onClick={()=>navigate(-1)}><ChevronLeft size={17}/></button><button className="bv-control" onClick={()=>setCursor(new Date())}>Today</button><button className="bv-control bv-icon-only" title="Next range" onClick={()=>navigate(1)}><ChevronRight size={17}/></button></div><div className="bv-inline"><label className="bv-inline">Scale <select className="bv-control" aria-label="Timeline scale" value={scale} onChange={e=>setScale(e.target.value)}>{Object.keys(SCALES).map(s=><option key={s}>{s}</option>)}</select></label><label className="bv-inline"><Rows3 size={15}/> Group by <select className="bv-control" aria-label="Timeline group by" value={groupBy} onChange={e=>setGroupBy(e.target.value)}><option>List</option><option>Member</option></select></label><button className={`bv-control ${showUnscheduled?'is-selected':''}`} onClick={()=>setShowUnscheduled(v=>!v)}>Not scheduled</button></div></div>
    <div className="bv-timeline-scroller" aria-label="Timeline scrollable area"><div className="bv-timeline-grid" style={{'--bv-time-width':`${cellWidth}px`,'--bv-time-total':`${span*cellWidth}px`,minWidth:210+span*cellWidth}}>
      <div className="bv-timeline-scale"><div className="bv-timeline-sticky bv-timeline-label-header"><strong>{groupBy==='List'?'Gardens':'Members'}</strong><small>DRAG CARDS · RESIZE EDGES</small></div>{dates.map((d,i)=><div className={`bv-time-tick ${dayKey(d)===dateToday()?'is-today':''} ${d.getDay()===0||d.getDay()===6?'is-weekend':''}`} style={{width:cellWidth}} key={dayKey(d)}>{scale==='Year'?(i%14===0?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):''):scale==='Quarter'?(i%7===0?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):''): <><small>{d.toLocaleDateString(undefined,{weekday:'short'})}</small><strong>{d.getDate()}</strong></>}</div>)}</div>
      {groups.map(g=>{
        const scheduled=g.cards.filter(c=>cardRange(c));const unscheduled=g.cards.filter(c=>!cardRange(c));
        const intervals=scheduled.map(c=>{const range=cardRange(c);const a=dateOffset(range[0],start),b=dateOffset(range[1],start);return {card:c,a,b}}).filter(x=>x.b>=0&&x.a<span).sort((a,b)=>a.a-b.a||a.b-b.b);
        const lanes=[];const rows=intervals.map(x=>{let lane=0;while(lanes[lane]!=null&&lanes[lane]>=x.a)lane++;lanes[lane]=x.b;return {...x,lane}});
        const rowHeight=Math.max(73,16+Math.max(1,lanes.length)*38);
        return <div className="bv-timeline-group" key={g.id} style={{height:rowHeight}}><div className="bv-timeline-sticky bv-timeline-name" style={{'--bv-group-color':listColor(activeLists.find(l=>String(l.id)===String(g.listId))?.color)}}><strong title={g.title}>{g.title}</strong><span className="bv-timeline-count">{g.cards.length} cards</span><div><button disabled={readOnly} type="button" onClick={()=>addToGroup(g)} title={`Add card in ${g.title}`}><Plus size={15}/></button></div>{unscheduled.length>0&&<small onClick={()=>setShowUnscheduled(v=>!v)}>{unscheduled.length} not scheduled</small>}</div><div className="bv-timeline-day-cells">{dates.map(d=><div key={dayKey(d)} title={dayKey(d)} className={`bv-timeline-drop-cell ${dayKey(d)===dateToday()?'is-today':''} ${d.getDay()===0||d.getDay()===6?'is-weekend':''} ${dragOver===`${g.id}:${dayKey(d)}`?'is-drop':''}`} style={{width:cellWidth}} onDragOver={e=>{e.preventDefault();setDragOver(`${g.id}:${dayKey(d)}`)}} onDragLeave={()=>setDragOver('')} onDoubleClick={()=>{setCursor(d);addToGroup(g)}} onDrop={e=>drop(e,d)}/>)}</div>{rows.map(({card,a,b,lane})=>{
          let startIndex=Math.max(0,a),endIndex=Math.min(span-1,b);
          if(resizePreview?.id===card.id){if(resizePreview.edge==='start')startIndex=Math.max(0,Math.min(endIndex,a+resizePreview.delta));else endIndex=Math.min(span-1,Math.max(startIndex,b+resizePreview.delta));}
          return <div key={card.id} className={`bv-timeline-task ${card.completed?'is-done':''}`} title={`${card.title}\nDrag to move; pull edges to resize`} draggable={!readOnly} style={{left:210+startIndex*cellWidth+3,width:Math.max(27,(endIndex-startIndex+1)*cellWidth-6),top:12+lane*38,'--bv-label-color':palette.find(l=>l.name===card.labels?.[0])?.color||listColor(card.listColor)}}
            onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-flowe-card',String(card.id))}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();const rect=e.currentTarget.parentElement.getBoundingClientRect();const day=Math.max(0,Math.min(dates.length-1,Math.floor((e.clientX-rect.left-210)/cellWidth)));drop(e,dates[day])}} onClick={()=>onOpen(card)}>
            <span className="bv-time-resize" title="Change start" onPointerDown={e=>startResize(e,card,'start')}/><LabelPips card={card} palette={palette}/><span>{card.completed?'✓ ':''}{card.title}</span><span className="bv-time-resize" title="Change end" onPointerDown={e=>startResize(e,card,'end')}/>
          </div>
        })}{showUnscheduled&&unscheduled.length>0&&<div className="bv-timeline-unscheduled" style={{left:215,top:rowHeight-24}}>{unscheduled.slice(0,4).map(c=><button key={c.id} onClick={()=>onOpen(c)} draggable={!readOnly} onDragStart={e=>e.dataTransfer.setData('application/x-flowe-card',String(c.id))}>{c.title}</button>)}</div>}</div>
      })}
      {!groups.length&&<ViewEmpty text="No cards found. Create cards to see them on the timeline."/>}
    </div></div><p className="bv-hint">Drag a card to move its dates · Pull either edge to resize · Double-click a day to add a card · Scroll horizontally to explore your schedule.</p>
    {editing&&<div className="bv-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}><form className="bv-dialog" role="dialog" aria-modal="true" aria-label="Create timeline card" onSubmit={saveNew}><div className="bv-dialog-title"><strong>Add card · {editing.title}</strong><button type="button" onClick={()=>setEditing(null)} aria-label="Close"><X size={17}/></button></div><label>Title<input autoFocus value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} maxLength={240} required/></label><label>List<select value={draftList} onChange={e=>setDraftList(e.target.value)}>{activeLists.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label><div className="bv-dialog-actions"><button className="bv-control" type="button" onClick={()=>setEditing(null)}>Cancel</button><button className="bv-primary" type="submit">Create</button></div></form></div>}
  </div>;
}
