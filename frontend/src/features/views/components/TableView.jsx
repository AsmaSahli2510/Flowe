import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Columns3, Download, GripVertical, Settings2 } from 'lucide-react';
import { cardLabels, memberLabel } from '../utils/viewData';
import { CardTitle, LabelPips, ViewEmpty } from './ViewParts';
import { cardsToCsv, saveFile } from '../utils/exportViews';

const COLUMNS=[['list','List'],['labels','Labels'],['members','Members'],['priority','Priority'],['due','Due date'],['progress','Checklist'],['complete','Done']];
function HeaderCell({column,sort,setSort,readOnly}){return <button type="button" className="bv-table-sort" onClick={()=>setSort(s=>s.key===column?{key:column,dir:s.dir===1?-1:1}:{key:column,dir:1})} title={`Sort by ${column}`}>{column==='list'?'List':COLUMNS.find(x=>x[0]===column)?.[1]} <span aria-hidden="true">{sort.key===column?(sort.dir===1?'↑':'↓'):'↕'}</span></button>}
export default function TableView({cards,lists,members,palette,readOnly,onOpen,onCardPatch,onMoveCard}){
  const [sort,setSort]=useState({key:'list',dir:1});
  const [shown,setShown]=useState(()=>COLUMNS.map(([key])=>key));
  const [settings,setSettings]=useState(false);
  const [grouped,setGrouped]=useState(true);
  const [collapsed,setCollapsed]=useState([]);
  const [dense,setDense]=useState(false);
  const [widths,setWidths]=useState({});
  const resizeRef=useRef(null);
  const active=lists.filter(l=>!l.archived);
  useEffect(()=>()=>resizeRef.current?.(),[]);
  const sorted=useMemo(()=>[...cards].sort((a,b)=>{
    let av=a[sort.key]??'',bv=b[sort.key]??'';
    if(sort.key==='list'){av=a.listName;bv=b.listName;}
    if(sort.key==='members'){av=memberLabel(members,a.assignee);bv=memberLabel(members,b.assignee);}
    if(sort.key==='progress'){av=(a.checks? (a.done||0)/a.checks:0);bv=(b.checks?(b.done||0)/b.checks:0);}
    return sort.dir*(typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true}));
  }),[cards,sort,members]);
  const groups=grouped?active.map(l=>({id:l.id,name:l.title,cards:sorted.filter(c=>c.listId===l.id)})).filter(g=>g.cards.length):[{id:'all',name:'All cards',cards:sorted}];
  const patch=(card,data)=>{if(!readOnly)onCardPatch(card.id,data)};
  const beginResize=(event,key)=>{
    event.preventDefault();event.stopPropagation();
    const x=event.clientX,start=widths[key]||event.currentTarget.parentElement.getBoundingClientRect().width;
    const move=e=>setWidths(w=>({...w,[key]:Math.max(96,Math.min(430,start+e.clientX-x))}));
    const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop)};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);resizeRef.current=stop;
  };
  return <div className={`bv-table-wrap ${dense?'is-dense':''}`}>
    <div className="bv-view-controls"><span className="bv-muted">{cards.length} cards · drag column borders to resize</span><button type="button" className="bv-control" onClick={()=>saveFile(cardsToCsv(cards),'flowe-board.csv','text/csv;charset=utf-8')}><Download size={15}/> Export CSV</button><button type="button" className="bv-control" onClick={()=>setGrouped(v=>!v)}><Columns3 size={15}/>{grouped?'Grouped by list':'Flat table'}</button><div className="bv-relative"><button className="bv-control" type="button" aria-expanded={settings} onClick={()=>setSettings(v=>!v)}><Settings2 size={15}/> Columns <ChevronDown size={14}/></button>{settings&&<div className="bv-dropdown"><strong>Visible columns</strong>{COLUMNS.map(([key,label])=><label key={key}><input type="checkbox" checked={shown.includes(key)} onChange={()=>setShown(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key])}/>{label}</label>)}<hr/><label><input type="checkbox" checked={dense} onChange={e=>setDense(e.target.checked)}/>Compact rows</label></div>}</div></div>
    <div className="bv-table-scroll"><table className="bv-table"><thead><tr><th style={{width:widths.task||300,minWidth:180}}><button className="bv-table-sort" onClick={()=>setSort(s=>({key:'title',dir:s.key==='title'?-s.dir:1}))}>Card ↕</button><span className="bv-col-resize" onPointerDown={e=>beginResize(e,'task')}/></th>{COLUMNS.filter(([k])=>shown.includes(k)).map(([key])=><th key={key} style={{width:widths[key]||(['labels','members'].includes(key)?175:145)}}><HeaderCell column={key} sort={sort} setSort={setSort}/><span className="bv-col-resize" onPointerDown={e=>beginResize(e,key)}/></th>)}</tr></thead><tbody>{groups.map(g=><FragmentGroup key={g.id} group={g} grouped={grouped} collapsed={collapsed.includes(g.id)} onCollapse={()=>setCollapsed(xs=>xs.includes(g.id)?xs.filter(x=>x!==g.id):[...xs,g.id])} colSpan={shown.length+1}>{!collapsed.includes(g.id)&&g.cards.map(c=><tr key={c.id}>
      <td><div className="bv-table-card"><GripVertical size={14} color="#b2a4be"/><CardTitle card={c} onOpen={onOpen}/></div></td>
      {shown.includes('list')&&<td><select aria-label={`List for ${c.title}`} className="bv-cell-select" disabled={readOnly} value={c.listId} onChange={e=>onMoveCard(c.id,Number(e.target.value),null)}>{active.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></td>}
      {shown.includes('labels')&&<td><div className="bv-table-labels"><LabelPips card={c} palette={palette}/><span>{cardLabels(c).slice(0,2).join(', ')||'—'}</span></div></td>}
      {shown.includes('members')&&<td>{memberLabel(members,c.assignee)}</td>}
      {shown.includes('priority')&&<td><select className="bv-cell-select" disabled={readOnly} aria-label={`Priority for ${c.title}`} value={c.priority||'Medium'} onChange={e=>patch(c,{priority:e.target.value})}>{['Low','Medium','High'].map(p=><option key={p}>{p}</option>)}</select></td>}
      {shown.includes('due')&&<td><input type="date" className="bv-cell-date" aria-label={`Due date for ${c.title}`} disabled={readOnly} value={String(c.due||'').slice(0,10)} onChange={e=>patch(c,{due:e.target.value})}/></td>}
      {shown.includes('progress')&&<td><span className="bv-progress-pill">{c.checks?`${c.done||0}/${c.checks}`:'—'}</span></td>}
      {shown.includes('complete')&&<td><label className="bv-check"><input type="checkbox" checked={!!c.completed} disabled={readOnly} onChange={e=>patch(c,{completed:e.target.checked})}/>{c.completed&&<CheckCircle2 size={14}/>}</label></td>}
    </tr>)}</FragmentGroup>)} </tbody></table>{!cards.length&&<ViewEmpty text="No matching cards. Change your filters or add a card to the board."/>}</div>
  </div>
}
function FragmentGroup({group,grouped,collapsed,onCollapse,colSpan,children}){return <>{grouped&&<tr className="bv-table-group"><td colSpan={colSpan}><button type="button" onClick={onCollapse}>{collapsed?<ChevronRight size={16}/>:<ChevronDown size={16}/>}<strong>{group.name}</strong><span>{group.cards.length}</span></button></td></tr>}{children}</>}
