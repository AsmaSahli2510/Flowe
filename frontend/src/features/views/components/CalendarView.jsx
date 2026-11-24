import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Plus, Settings2, X } from 'lucide-react';
import { advance, cardRange, dayKey, dateOffset, dateToday, shiftCardToDate, weekStart } from '../utils/viewData';
import { LabelPips, ViewEmpty } from './ViewParts';
import { listColor } from '../../board/constants/listColors';
import { cardsToIcs, saveFile } from '../utils/exportViews';

const DAY_NAMES=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export default function CalendarView({cards,lists,palette=[],readOnly,onOpen,onCardPatch,onCreateCard}){
  const [cursor,setCursor]=useState(()=>new Date());
  const [mode,setMode]=useState('Month');
  const [showWeekends,setShowWeekends]=useState(true);
  const [hideCompleted,setHideCompleted]=useState(false);
  const [showUnscheduled,setShowUnscheduled]=useState(true);
  const [options,setOptions]=useState(false);
  const [draft,setDraft]=useState(null);
  const [title,setTitle]=useState('');
  const [draftList,setDraftList]=useState('');
  const [dragOver,setDragOver]=useState('');
  const active=lists.filter(l=>!l.archived);
  const withDates=useMemo(()=>cards.filter(c=>cardRange(c)&&(!hideCompleted||!c.completed)),[cards,hideCompleted]);
  const unscheduled=cards.filter(c=>!cardRange(c)&&(!hideCompleted||!c.completed));
  const first=mode==='Week'?weekStart(cursor):new Date(cursor.getFullYear(),cursor.getMonth(),1);
  const gridStart=weekStart(first);
  const dayCount=mode==='Week'?7:42;
  const days=Array.from({length:dayCount},(_,i)=>advance(gridStart,i));
  const weeks=Array.from({length:dayCount/7},(_,i)=>days.slice(i*7,i*7+7));
  const navigate=n=>setCursor(d=>mode==='Week'?advance(d,n*7):new Date(d.getFullYear(),d.getMonth()+n,1));
  const putOnDay=(event,date)=>{
    event.preventDefault();setDragOver('');
    if(readOnly)return;
    const id=Number(event.dataTransfer.getData('application/x-flowe-card')||event.dataTransfer.getData('text/flowe-card'));
    const card=cards.find(c=>Number(c.id)===id);
    if(card)onCardPatch(card.id,shiftCardToDate(card,date));
  };
  const openDraft=date=>{if(readOnly)return;setDraft(dayKey(date));setTitle('');setDraftList(String(active[0]?.id||''))};
  const create=e=>{e.preventDefault();if(title.trim()&&draftList){onCreateCard(Number(draftList),title.trim(),draft);setTitle('');setDraft(null)}};
  return <div className="bv-calendar-view">
    <div className="bv-view-controls bv-calendar-controls">
      <div className="bv-inline"><CalendarDays size={17}/><strong className="bv-range-title">{cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button className="bv-control bv-icon-only" title="Previous period" onClick={()=>navigate(-1)}><ChevronLeft size={17}/></button><button className="bv-control" onClick={()=>setCursor(new Date())}>Today</button><button className="bv-control bv-icon-only" title="Next period" onClick={()=>navigate(1)}><ChevronRight size={17}/></button>
        <select className="bv-control" value={mode} onChange={e=>setMode(e.target.value)} aria-label="Calendar layout"><option>Month</option><option>Week</option></select>
      </div>
      <div className="bv-inline"><button type="button" className="bv-control" title="Download calendar events to import into your personal calendar" onClick={()=>saveFile(cardsToIcs(cards),'flowe-board-calendar.ics','text/calendar;charset=utf-8')}><Download size={14}/> Export .ics</button><button className={`bv-control ${showUnscheduled?'is-selected':''}`} onClick={()=>setShowUnscheduled(v=>!v)}>Unscheduled <span className="bv-bubble">{unscheduled.length}</span></button><div className="bv-relative"><button className="bv-control" onClick={()=>setOptions(v=>!v)} aria-expanded={options}><Settings2 size={15}/> Options <ChevronDown size={14}/></button>{options&&<div className="bv-dropdown bv-options-menu"><strong>Calendar options</strong><label><input type="checkbox" checked={showWeekends} onChange={e=>setShowWeekends(e.target.checked)}/> Show weekends</label><label><input type="checkbox" checked={hideCompleted} onChange={e=>setHideCompleted(e.target.checked)}/> Hide completed cards</label></div>}</div></div>
    </div>
    <div className="bv-calendar-layout">
      <div className="bv-cal-scroll"><div className="bv-calendar" style={{minWidth:showWeekends?850:690}}>
        <div className="bv-cal-weekdays" style={{gridTemplateColumns:`repeat(${showWeekends?7:5},minmax(0,1fr))`}}>{(showWeekends?DAY_NAMES:DAY_NAMES.slice(1,6)).map(name=><strong key={name}>{name}</strong>)}</div>
        {weeks.map((week,weekNumber)=>{
          const start=week[0], end=week[6];
          const segments=withDates.filter(c=>{const r=cardRange(c);return r&&r[0]<=end&&r[1]>=start}).map(c=>{const r=cardRange(c);return {card:c,start:Math.max(0,dateOffset(r[0],start)),end:Math.min(6,dateOffset(r[1],start))}}).sort((a,b)=>a.start-b.start||b.end-a.end);
          const occupied=[];
          const laid=segments.map(s=>{let lane=0;while(occupied[lane]!=null && occupied[lane]>=s.start)lane++;occupied[lane]=s.end;return {...s,lane}});
          const maxLane=Math.max(0,...laid.map(s=>s.lane+1));
          const minHeight=Math.max(mode==='Week'?330:110,45+maxLane*31+12);
          return <div key={dayKey(start)} className={`bv-cal-week ${mode==='Week'?'week-mode':''}`} style={{minHeight}}>
            {week.map((date,index)=>{const k=dayKey(date);if(!showWeekends&&(index===0||index===6))return null;return <div className={`bv-cal-day ${date.getMonth()!==cursor.getMonth()&&mode==='Month'?'is-other':''} ${k===dateToday()?'is-today':''} ${dragOver===k?'is-drop':''}`} key={k} style={{left:`${(showWeekends?index:index-1)*100/(showWeekends?7:5)}%`,width:`${100/(showWeekends?7:5)}%`}} onDragOver={e=>{e.preventDefault();setDragOver(k)}} onDragLeave={()=>setDragOver(v=>v===k?'':v)} onDrop={e=>putOnDay(e,date)}><div className="bv-cal-dayhead"><time dateTime={k}>{date.getDate()===1?date.toLocaleDateString(undefined,{month:'short',day:'numeric'}):date.getDate()}</time><button type="button" disabled={readOnly} aria-label={`Add card on ${k}`} title={`Add card on ${k}`} onClick={()=>openDraft(date)}><Plus size={14}/></button></div></div>})}
            {laid.filter(s=>showWeekends || (s.end>=1&&s.start<=5)).map(s=>{let display=s;if(!showWeekends)display={...s,start:Math.max(0,s.start-1),end:Math.min(4,s.end-1)};return <div className="bv-cal-event-slot" key={`${weekNumber}:${s.card.id}`} style={{left:`${display.start*100/(showWeekends?7:5)}%`,width:`${(display.end-display.start+1)*100/(showWeekends?7:5)}%`,top:35+s.lane*31}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();const box=e.currentTarget.closest('.bv-cal-week').getBoundingClientRect();const cols=showWeekends?7:5;const col=Math.max(0,Math.min(cols-1,Math.floor((e.clientX-box.left)/box.width*cols)));putOnDay(e,advance(start,showWeekends?col:col+1))}}><button className={`bv-cal-event ${s.card.completed?'is-done':''}`} style={{'--bv-label-color':palette.find(l=>l.name===s.card.labels?.[0])?.color||listColor(s.card.listColor)}} draggable={!readOnly} title={s.card.title} onClick={()=>onOpen(s.card)} onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-flowe-card',String(s.card.id))}}><LabelPips card={s.card} palette={palette}/>{s.card.completed&&<CheckCircle2 size={13}/>}<span>{s.card.title}</span></button></div>})}
          </div>
        })}
      </div></div>
      {showUnscheduled&&<aside className="bv-unscheduled"><div className="bv-side-head"><strong>Not scheduled</strong><span>{unscheduled.length}</span></div><p>Drag cards onto the calendar to give them a date.</p>{unscheduled.map(c=><button key={c.id} draggable={!readOnly} onDragStart={e=>e.dataTransfer.setData('application/x-flowe-card',String(c.id))} onClick={()=>onOpen(c)}><LabelPips card={c} palette={palette}/><span>{c.title}</span></button>)}{!unscheduled.length&&<ViewEmpty text="All cards are scheduled."/>}</aside>}
    </div>
    {draft&&<div className="bv-dialog-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDraft(null)}}><form className="bv-dialog" onSubmit={create} role="dialog" aria-modal="true" aria-label="Add calendar card"><div className="bv-dialog-title"><strong>Add a card · {draft}</strong><button type="button" aria-label="Close" onClick={()=>setDraft(null)}><X size={17}/></button></div><label>Card title<input autoFocus maxLength={240} placeholder="What needs to get done?" value={title} onChange={e=>setTitle(e.target.value)} required/></label><label>List<select value={draftList} onChange={e=>setDraftList(e.target.value)}>{active.map(l=><option value={l.id} key={l.id}>{l.title}</option>)}</select></label><div className="bv-dialog-actions"><button type="button" className="bv-control" onClick={()=>setDraft(null)}>Cancel</button><button type="submit" className="bv-primary" disabled={!title.trim()||!draftList}>Add card</button></div></form></div>}
  </div>;
}
