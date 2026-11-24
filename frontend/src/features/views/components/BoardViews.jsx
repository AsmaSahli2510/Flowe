import { useMemo, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import TableView from './TableView';
import CalendarView from './CalendarView';
import TimelineView from './TimelineView';
import DashboardView from './DashboardView';
import { flattenLists, dateToday } from '../utils/viewData';
import './BoardViews.css';

export default function BoardViews({mode,lists,members=[],palette=[],projectId,readOnly=false,openCard,onCardPatch,onMoveCard,onCreateCard}){
  const [query,setQuery]=useState('');
  const [listId,setListId]=useState('all');
  const [status,setStatus]=useState('all');
  const cards=useMemo(()=>flattenLists(lists),[lists]);
  const filtered=useMemo(()=>cards.filter(c=>{
    const text=`${c.title} ${(c.labels||[]).join(' ')} ${c.listName} ${c.detail||''}`.toLowerCase();
    return text.includes(query.trim().toLowerCase())&&
      (listId==='all'||String(c.listId)===listId)&&
      (status==='all'||(status==='done'?!!c.completed:status==='open'?!c.completed:(!c.completed&&c.due&&String(c.due).slice(0,10)<dateToday())));
  }),[cards,query,listId,status]);
  const common={cards:filtered,lists,members,palette,readOnly,onOpen:openCard,onCardPatch,onMoveCard,onCreateCard};
  const subtitle={Table:'Sort, group and edit cards inline',Calendar:'Schedule cards with drag and drop',Timeline:'Plan work across dates and lists',Dashboard:'Live reporting and customizable charts'}[mode];
  return <div className="bv-shell"><div className="bv-topbar"><div className="bv-heading"><strong>{mode}</strong><span>{subtitle}</span></div><div className="bv-global-filters"><label className="bv-search"><Search size={16}/><input aria-label="Search cards in view" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search cards…"/>{query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery('')}><X size={14}/></button>}</label><label className="bv-filter-select"><Filter size={15}/><select aria-label="Filter by list" value={listId} onChange={e=>setListId(e.target.value)}><option value="all">All lists</option>{lists.filter(l=>!l.archived).map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label><select className="bv-control" aria-label="Filter cards by status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All cards</option><option value="open">Incomplete</option><option value="done">Completed</option><option value="overdue">Overdue</option></select><span className="bv-count">{filtered.length} cards</span></div></div>
    {mode==='Table'&&<TableView {...common}/>}
    {mode==='Calendar'&&<CalendarView {...common}/>}
    {mode==='Timeline'&&<TimelineView {...common}/>}
    {mode==='Dashboard'&&<DashboardView {...common} projectId={projectId}/>}
  </div>;
}
