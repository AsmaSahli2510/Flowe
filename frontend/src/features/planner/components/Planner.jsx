import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Ellipsis, EyeOff, Grip, Plus, Settings2, X } from 'lucide-react';
import { listColor } from '../../board/constants/listColors';
import { advance, cardsForDay, dayKey, dueHour, isComplete, monthGrid, PLANNER_MODES, plannerCards, rangeDays, sameDay, schedulePatch, startOfMonth, stepCursor, timeForDay, unscheduledCards } from '../utils/plannerData';
import './Planner.css';

const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const formatRange = (cursor,mode,customDays,agendaDays) => {
  const end=rangeDays(mode,cursor,customDays,agendaDays);
  if(mode==='Month')return cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  if(mode==='Day')return cursor.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  const first=end[0], last=end.at(-1);
  return `${first.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${last.toLocaleDateString(undefined,{month:first.getMonth()===last.getMonth()?undefined:'short',day:'numeric',year:first.getFullYear()===last.getFullYear()?undefined:'numeric'})}`;
};

export default function Planner({lists, palette=[], mode='Agenda', onModeChange, readOnly=false, onCardPatch, onCreateCard, onOpenCard}) {
  const [cursor,setCursor] = useState(()=>new Date());
  const [menu,setMenu] = useState('');
  const [pickerMonth,setPickerMonth] = useState(()=>new Date());
  const [customDays,setCustomDays] = useState(5);
  const [agendaDays,setAgendaDays] = useState(14);
  const [showWeekends,setShowWeekends] = useState(true);
  const [hideCompleted,setHideCompleted] = useState(false);
  const [showUnscheduled,setShowUnscheduled] = useState(false);
  const [draft,setDraft] = useState(null);
  const [draftTitle,setDraftTitle] = useState('');
  const [draftList,setDraftList] = useState('');
  const [hoverDay,setHoverDay] = useState('');
  const [activeDrag,setActiveDrag] = useState(null);
  const [fitToScreen,setFitToScreen] = useState(false);
  const menuRef=useRef(null);
  const cards=useMemo(()=>plannerCards(lists),[lists]);
  const visibleCards=useMemo(()=>cards.filter(c=>!hideCompleted||!isComplete(c)),[cards,hideCompleted]);
  const unscheduled=useMemo(()=>unscheduledCards(visibleCards),[visibleCards]);
  const activeLists=lists.filter(l=>!l.archived);
  const days=useMemo(()=>rangeDays(mode,cursor,customDays,agendaDays),[mode,cursor,customDays,agendaDays]);
  const renderedDays=showWeekends?days:days.filter(d=>d.getDay()!==0&&d.getDay()!==6);
  const dayCards=date=>cardsForDay(visibleCards,date);
  const openMenu=name=>setMenu(current=>current===name?'':name);
  const toToday=()=>{setCursor(new Date());setPickerMonth(new Date());setMenu('')};
  const chooseDate=date=>{setCursor(new Date(date.getFullYear(),date.getMonth(),date.getDate()));setMenu('')};
  const openCreate=(date=new Date(),hour=null,card=null)=>{
    if(readOnly)return;
    setDraft({date:dayKey(date),hour,card});setDraftTitle('');setDraftList(String(card?.listId??activeLists[0]?.id??''));setMenu('');
  };
  const create=e=>{
    e.preventDefault();
    if(!draft||readOnly)return;
    const date=new Date(`${draft.date}T12:00:00`);
    if(draft.card){onCardPatch?.(draft.card.id,schedulePatch(draft.card,date,draft.hour));setDraft(null);return;}
    if(!draftTitle.trim()||!draftList)return;
    onCreateCard?.(Number(draftList),draftTitle.trim(),draft.hour===null?draft.date:timeForDay(date,draft.hour));
    setDraft(null);setDraftTitle('');
  };
  const startDrag=(e,card)=>{
    if(readOnly){e.preventDefault();return;}
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('application/x-flowe-card',String(card.id));
    e.dataTransfer.setData('text/plain',String(card.id));
    setActiveDrag(card.id);
  };
  const dropOn=(event,date,hour=null)=>{
    event.preventDefault();
    setHoverDay('');setActiveDrag(null);
    if(readOnly)return;
    const raw=event.dataTransfer.getData('application/x-flowe-card')||event.dataTransfer.getData('text/flowe-card')||event.dataTransfer.getData('text/plain');
    const card=cards.find(c=>String(c.id)===raw);
    if(card)onCardPatch?.(card.id,schedulePatch(card,date,hour));
  };
  useEffect(()=>{
    const handle=e=>{
      if(readOnly)return;
      const {cardId,date,hour}=e.detail||{};
      const card=cards.find(item=>String(item.id)===String(cardId));
      if(!card || !/^\d{4}-\d{2}-\d{2}$/.test(date||''))return;
      const target=new Date(`${date}T12:00:00`);
      if(!Number.isNaN(target.getTime()))onCardPatch?.(card.id,schedulePatch(card,target,hour==null?null:Number(hour)));
    };
    window.addEventListener('flowe-planner-drop',handle);
    return()=>window.removeEventListener('flowe-planner-drop',handle);
  },[cards,onCardPatch,readOnly]);
  useEffect(()=>{
    if(!menu)return;
    const close=e=>{if(!menuRef.current?.contains(e.target))setMenu('')};
    const esc=e=>{if(e.key==='Escape')setMenu('')};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',esc);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',esc)};
  },[menu]);
  const pickCard=card=>onOpenCard?.(card);
  const cardColor=card=>palette.find(item=>item.name===card.labels?.[0])?.color||listColor(card.listColor);
  const eventPill=(card,key)=> <button type="button" draggable={!readOnly} key={`${key}:${card.id}`} className={`fgp-event ${isComplete(card)?'is-complete':''}`} style={{'--fgp-accent':cardColor(card)}} onClick={event=>{event.stopPropagation();pickCard(card)}} onDragStart={e=>startDrag(e,card)} onDragEnd={()=>setActiveDrag(null)} title={card.title}><span className="fgp-event-mark"/>{isComplete(card)&&<Check size={12}/>}<span>{card.title}</span></button>;
  const dragProps=(date,hour=null)=>({
    'data-fgp-drop-date':dayKey(date),
    ...(hour===null?{}:{'data-fgp-drop-hour':String(hour)}),
    onDragOver:e=>{if(readOnly)return;e.preventDefault();e.dataTransfer.dropEffect='move';setHoverDay(`${dayKey(date)}:${hour??'all'}`)},
    onDragLeave:e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoverDay('')},
    onDrop:e=>dropOn(e,date,hour),
  });
  const isDrop=(date,hour=null)=>hoverDay===`${dayKey(date)}:${hour??'all'}`;
  const selection=mode==='Agenda'?rangeDays('Agenda',cursor,customDays,agendaDays):renderedDays;
  const datePickerDays=monthGrid(pickerMonth);

  return <div className={`fgp-planner ${fitToScreen?'fgp-fit':''}`}>
    <div className="fgp-toolbar" ref={menuRef}>
      <div className="fgp-left-tools">
        <div className="fgp-anchor">
          <button type="button" className={`fgp-tool fgp-date-button ${menu==='date'?'selected':''}`} onClick={()=>{setPickerMonth(startOfMonth(cursor));openMenu('date')}} aria-expanded={menu==='date'}><CalendarDays size={15}/><span className="fgp-date-text">{formatRange(cursor,mode,customDays,agendaDays)}</span><ChevronDown size={13}/></button>
          {menu==='date'&&<div className="fgp-popover fgp-date-popover" role="dialog" aria-label="Select date">
            <div className="fgp-menu-heading">Select date <button type="button" onClick={()=>setMenu('')} aria-label="Close date picker"><X size={14}/></button></div>
            <div className="fgp-picker-month"><button type="button" onClick={()=>setPickerMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} aria-label="Previous month"><ChevronLeft size={16}/></button><strong>{pickerMonth.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>setPickerMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} aria-label="Next month"><ChevronRight size={16}/></button></div>
            <div className="fgp-picker-grid">{WEEKDAYS.map(x=><span key={x}>{x.slice(0,2)}</span>)}{datePickerDays.map(d=><button type="button" key={dayKey(d)} className={`${d.getMonth()!==pickerMonth.getMonth()?'other':''} ${sameDay(d,cursor)?'chosen':''} ${sameDay(d,new Date())?'today':''}`} onClick={()=>chooseDate(d)}>{d.getDate()}</button>)}</div>
          </div>}
        </div>
        <button type="button" className="fgp-tool fgp-icon" aria-label="Previous period" onClick={()=>setCursor(d=>stepCursor(d,mode,-1,customDays,agendaDays))}><ChevronLeft size={16}/></button>
        <button type="button" className="fgp-tool fgp-today" onClick={toToday}>Today</button>
        <button type="button" className="fgp-tool fgp-icon" aria-label="Next period" onClick={()=>setCursor(d=>stepCursor(d,mode,1,customDays,agendaDays))}><ChevronRight size={16}/></button>
      </div>
      <div className="fgp-right-tools">
        <div className="fgp-anchor">
          <button type="button" className="fgp-tool fgp-view-control" onClick={()=>openMenu('view')} aria-expanded={menu==='view'} title="Change Planner view"><span>{mode}</span><ChevronDown size={14}/></button>
          {menu==='view'&&<div className="fgp-popover fgp-view-popover" role="menu"><div className="fgp-menu-heading">Change view</div><button type="button" onClick={()=>{setFitToScreen(v=>!v);setMenu('')}}><Grip size={15}/> Fit to screen {fitToScreen&&<Check size={14}/>}</button>{PLANNER_MODES.map(name=><button type="button" role="menuitem" className={mode===name?'active':''} key={name} onClick={()=>{onModeChange(name);setMenu('')}}><CalendarDays size={15}/>{name} {mode===name&&<Check size={14}/>}</button>)}{mode==='Custom'&&<label className="fgp-custom-days">Days shown <select value={customDays} onChange={e=>setCustomDays(Number(e.target.value))}>{[3,5,7,10,14].map(n=><option key={n} value={n}>{n} days</option>)}</select></label>}</div>}
        </div>
        <div className="fgp-anchor">
          <button type="button" className="fgp-tool fgp-icon" aria-label="Planner options" aria-expanded={menu==='options'} onClick={()=>openMenu('options')}><Ellipsis size={18}/></button>
          {menu==='options'&&<div className="fgp-popover fgp-options" role="menu"><div className="fgp-menu-heading">Planner options</div><label><input type="checkbox" checked={showWeekends} onChange={e=>setShowWeekends(e.target.checked)}/> Show weekends</label><label><input type="checkbox" checked={hideCompleted} onChange={e=>setHideCompleted(e.target.checked)}/> Hide completed cards</label><label><input type="checkbox" checked={showUnscheduled} onChange={e=>setShowUnscheduled(e.target.checked)}/> Show unscheduled cards</label>{mode==='Agenda'&&<label>Agenda length <select value={agendaDays} onChange={e=>setAgendaDays(Number(e.target.value))}><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select></label>}<button type="button" onClick={toToday}><Clock3 size={14}/> Jump to today</button></div>}
        </div>
        <button type="button" className="fgp-tool fgp-add" onClick={()=>openCreate(cursor)} disabled={readOnly} title="Schedule a card"><Plus size={15}/><span>Add</span></button>
      </div>
    </div>
    {mode==='Agenda'&&<div className="fgp-content fgp-agenda">
      {selection.filter(d=>showWeekends||(d.getDay()!==0&&d.getDay()!==6)).map(d=>{const dayEvents=dayCards(d);return <section key={dayKey(d)} className={`fgp-agenda-day ${sameDay(d,new Date())?'today':''} ${isDrop(d)?'drop-target':''}`} {...dragProps(d)}><div className="fgp-agenda-heading"><span className="fgp-agenda-date"><small>{sameDay(d,new Date())?'TODAY':d.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase()}</small><strong>{d.getDate()}</strong></span><span className="fgp-agenda-items">{dayEvents.length?`${dayEvents.length} scheduled`:'Nothing planned yet'}</span><button type="button" aria-label={`Add card on ${dayKey(d)}`} title="Add card" disabled={readOnly} onClick={()=>openCreate(d)}><Plus size={15}/></button></div>{dayEvents.length>0&&<div className="fgp-agenda-cards">{dayEvents.map(c=>eventPill(c,dayKey(d)))}</div>}</section>})}
    </div>}
    {mode==='Month'&&<div className="fgp-content fgp-calendar-scroll"><div className="fgp-month" style={{minWidth:fitToScreen?0:340}}><div className="fgp-week-days" style={{gridTemplateColumns:`repeat(${showWeekends?7:5},minmax(0,1fr))`}}>{WEEKDAYS.filter((name,i)=>showWeekends||(i!==0&&i!==6)).map(name=><span key={name}>{name}</span>)}</div><div className="fgp-month-grid" style={{gridTemplateColumns:`repeat(${showWeekends?7:5},minmax(0,1fr))`}}>{renderedDays.map(d=>{const matches=dayCards(d);return <div className={`fgp-month-day ${d.getMonth()!==cursor.getMonth()?'outside':''} ${sameDay(d,new Date())?'today':''} ${isDrop(d)?'drop-target':''}`} key={dayKey(d)} {...dragProps(d)}><div className="fgp-month-head"><button type="button" className="fgp-day-number" onClick={()=>{chooseDate(d);onModeChange('Day')}}>{d.getDate()}</button><button type="button" className="fgp-mini-add" title={`Add card on ${dayKey(d)}`} aria-label={`Add card on ${dayKey(d)}`} disabled={readOnly} onClick={()=>openCreate(d)}><Plus size={12}/></button></div><div className="fgp-month-events">{matches.slice(0,3).map(c=>eventPill(c,dayKey(d)))}{matches.length>3&&<button type="button" className="fgp-more-events" onClick={()=>{chooseDate(d);onModeChange('Day')}}>+{matches.length-3} more</button>}</div></div>})}</div></div></div>}
    {(mode==='Day'||mode==='Week'||mode==='Custom')&&<div className="fgp-content fgp-hours-scroll"><div className="fgp-hour-calendar" style={{'--fgp-cols':Math.max(1,renderedDays.length),minWidth:fitToScreen?0:Math.max(360,renderedDays.length*105)}}><div className="fgp-hour-head"><span className="fgp-hour-label">GMT {-(new Date().getTimezoneOffset()/60)>=0?'+':''}{-(new Date().getTimezoneOffset()/60)}</span>{renderedDays.map(d=><button type="button" className={sameDay(d,new Date())?'today':''} key={dayKey(d)} onClick={()=>{chooseDate(d);onModeChange('Day')}}><small>{WEEKDAYS[d.getDay()]}</small><strong>{d.getDate()}</strong></button>)}</div><div className="fgp-all-day"><span className="fgp-hour-label">All day</span>{renderedDays.map(d=><div key={dayKey(d)} className={`fgp-all-day-cell ${isDrop(d)?'drop-target':''}`} {...dragProps(d)}>{dayCards(d).filter(c=>!String(c.due||'').includes('T')).slice(0,2).map(c=>eventPill(c,dayKey(d)))}</div>)}</div>{Array.from({length:17},(_,i)=>i+6).map(hour=><div className="fgp-hour-row" key={hour}><span className="fgp-hour-label">{String(hour).padStart(2,'0')}:00</span>{renderedDays.map(d=><div key={`${dayKey(d)}-${hour}`} className={`fgp-hour-cell ${isDrop(d,hour)?'drop-target':''}`} {...dragProps(d,hour)}><button type="button" className="fgp-hour-add" aria-label={`Add card on ${dayKey(d)} at ${hour}:00`} disabled={readOnly} onClick={()=>openCreate(d,hour)}><Plus size={12}/></button>{dayCards(d).filter(c=>String(c.due||'').includes('T')&&dueHour(c)===hour).map(c=>eventPill(c,`${dayKey(d)}:${hour}`))}</div>)}</div>)}</div></div>}
    {showUnscheduled&&<aside className="fgp-unscheduled"><div className="fgp-unscheduled-head"><strong>Unscheduled cards</strong><span>{unscheduled.length}</span><button type="button" title="Hide unscheduled" aria-label="Hide unscheduled" onClick={()=>setShowUnscheduled(false)}><EyeOff size={14}/></button></div><small>Drag a card to a date or use + to schedule it.</small><div className="fgp-unscheduled-list">{unscheduled.map(c=><div key={c.id} className="fgp-unscheduled-card" draggable={!readOnly} onDragStart={e=>startDrag(e,c)} onDragEnd={()=>setActiveDrag(null)}><button type="button" className="fgp-unscheduled-title" onClick={()=>pickCard(c)}>{c.title}</button><button type="button" onClick={()=>openCreate(cursor,null,c)} aria-label={`Schedule ${c.title}`} disabled={readOnly}><Plus size={15}/></button></div>)}{!unscheduled.length&&<small>All cards have dates.</small>}</div></aside>}
    {draft&&<div className="fgp-dialog-layer" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDraft(null)}}><form className="fgp-dialog" onSubmit={create} role="dialog" aria-modal="true" aria-label={draft.card?'Schedule card':'Create scheduled card'}><header><strong>{draft.card?'Schedule card':'Add scheduled card'}</strong><button type="button" aria-label="Close" onClick={()=>setDraft(null)}><X size={17}/></button></header>{draft.card?<p className="fgp-selected-card">{draft.card.title}</p>:<label>Card title<input autoFocus required maxLength={240} placeholder="What needs to be done?" value={draftTitle} onChange={e=>setDraftTitle(e.target.value)}/></label>}<label>Date<input type="date" required value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label><label>Time<select value={draft.hour===null?'all':draft.hour} onChange={e=>setDraft({...draft,hour:e.target.value==='all'?null:Number(e.target.value)})}><option value="all">All day</option>{Array.from({length:24},(_,n)=><option key={n} value={n}>{String(n).padStart(2,'0')}:00</option>)}</select></label>{!draft.card&&<label>List<select required value={draftList} onChange={e=>setDraftList(e.target.value)}>{activeLists.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>}<footer><button type="button" onClick={()=>setDraft(null)}>Cancel</button><button type="submit" disabled={readOnly||(!draft.card&&(!draftTitle.trim()||!draftList))}>{draft.card?'Schedule':'Add card'}</button></footer></form></div>}
  </div>;
}
