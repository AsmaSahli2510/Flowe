import { useEffect, useState } from 'react';
import { BarChart3, ChartLine, ChartPie, CheckCircle2, Clock3, GripVertical, Plus, Settings2, Users, X } from 'lucide-react';
import { chartPalette, dateToday, memberLabel, toDate } from '../utils/viewData';

const DEFAULT_CHARTS=[{id:'lists',title:'Cards per list',kind:'bar',source:'lists',wide:false},{id:'priority',title:'Priority breakdown',kind:'bar',source:'priority',wide:false},{id:'progress',title:'Completion',kind:'pie',source:'status',wide:false},{id:'labels',title:'Cards per label',kind:'bar',source:'labels',wide:false}];
const SOURCES=[['lists','Cards per list'],['status','Card status'],['priority','Priority'],['labels','Labels'],['members','Members'],['due','Due dates by month']];
const KINDS=[['bar','Bar chart',BarChart3],['pie','Pie chart',ChartPie],['line','Line chart',ChartLine]];
function dataFor(source,cards,lists,members){
  const result=[];const add=(label,value)=>result.push({label,value});
  if(source==='lists')lists.filter(l=>!l.archived).forEach(l=>add(l.title,cards.filter(c=>c.listId===l.id).length));
  if(source==='status'){add('Complete',cards.filter(c=>c.completed).length);add('In progress',cards.filter(c=>!c.completed).length)}
  if(source==='priority')['High','Medium','Low'].forEach(p=>add(p,cards.filter(c=>(c.priority||'Medium')===p).length));
  if(source==='labels'){const labels=[...new Set(cards.flatMap(c=>c.labels||[]))].filter(Boolean);labels.forEach(l=>add(l,cards.filter(c=>c.labels?.includes(l)).length))}
  if(source==='members'){const names=[...new Set(cards.map(c=>memberLabel(members,c.assignee)))];names.forEach(n=>add(n,cards.filter(c=>memberLabel(members,c.assignee)===n).length))}
  if(source==='due'){
    const byMonth=new Map();cards.forEach(c=>{const d=toDate(c.due);if(!d)return;const k=d.toLocaleDateString(undefined,{year:'numeric',month:'short'});byMonth.set(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,{label:k,value:(byMonth.get(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)?.value||0)+1})});
    [...byMonth.keys()].sort().forEach(k=>result.push(byMonth.get(k)));
  }
  return result;
}
function ChartBody({chart,cards,lists,members}){
  const data=dataFor(chart.source,cards,lists,members);
  if(!data.length||data.every(d=>!d.value))return <div className="bv-chart-empty">Not enough data yet. Add cards to see this chart.</div>;
  const max=Math.max(1,...data.map(d=>d.value)),total=data.reduce((n,d)=>n+d.value,0);
  if(chart.kind==='bar')return <div className="bv-bars">{data.slice(0,15).map((d,i)=><div className="bv-bar-row" key={d.label}><span title={d.label}>{d.label}</span><div className="bv-bar-track"><i style={{width:`${100*d.value/max}%`,background:chartPalette[i%chartPalette.length]}}/></div><strong>{d.value}</strong></div>)}</div>;
  if(chart.kind==='pie'){
    let angle=0;const stops=data.map((d,i)=>{const from=angle;angle+=(d.value/total)*360;return `${chartPalette[i%chartPalette.length]} ${from}deg ${angle}deg`});
    return <div className="bv-pie-body"><div className="bv-donut" style={{background:`conic-gradient(${stops.join(',')})`}}><div><strong>{total}</strong><small>cards</small></div></div><div className="bv-chart-legend">{data.map((d,i)=><span key={d.label}><i style={{background:chartPalette[i%chartPalette.length]}}/>{d.label} <b>{d.value}</b></span>)}</div></div>
  }
  const w=440,h=175,pad=20;const points=data.length===1?[[w/2,h-20-(data[0].value/max)*(h-40)]]:data.map((d,i)=>[pad+(i*(w-2*pad)/(data.length-1)),h-pad-d.value/max*(h-2*pad)]);
  return <div className="bv-line-body"><svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`${chart.title} line chart`}>{[0,.25,.5,.75,1].map(n=><line key={n} x1="20" x2={w-20} y1={20+n*(h-40)} y2={20+n*(h-40)} stroke="#e9e0ef"/>)}<polyline points={points.map(p=>p.join(',')).join(' ')} fill="none" stroke="#9e79c7" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{points.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill={chartPalette[i%chartPalette.length]} stroke="white" strokeWidth="2"><title>{`${data[i].label}: ${data[i].value}`}</title></circle>)}</svg><div className="bv-line-labels">{data.slice(0,12).map(d=><small key={d.label} title={d.label}>{d.label}</small>)}</div></div>;
}
export default function DashboardView({cards,lists,members=[],projectId='default'}){
  const key=`flowe-board-charts:${projectId}`;
  const load=()=>{try{const stored=JSON.parse(localStorage.getItem(key));return Array.isArray(stored)?stored:DEFAULT_CHARTS}catch{return DEFAULT_CHARTS}};
  const [charts,setCharts]=useState(load);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [draft,setDraft]=useState({title:'',kind:'bar',source:'lists',wide:false});
  const [dragged,setDragged]=useState(null);
  useEffect(()=>{setCharts(load())},[projectId]);
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(charts))}catch{/* private browsing / disabled storage */}},[charts,key]);
  const total=cards.length,done=cards.filter(c=>c.completed).length,overdue=cards.filter(c=>!c.completed&&c.due&&String(c.due).slice(0,10)<dateToday()).length,unassigned=cards.filter(c=>!c.assignee).length;
  const openAdd=()=>{setEditing(null);setDraft({title:'',kind:'bar',source:'lists',wide:false});setModal(true)};
  const openEdit=chart=>{setEditing(chart.id);setDraft({...chart});setModal(true)};
  const save=e=>{e.preventDefault();const chart={...draft,title:draft.title.trim()||SOURCES.find(s=>s[0]===draft.source)?.[1]||'Chart',id:editing||`chart-${Date.now()}`};setCharts(old=>editing?old.map(c=>c.id===editing?chart:c):[...old,chart]);setModal(false)};
  const reorder=target=>{if(!dragged||dragged===target)return;setCharts(old=>{const result=[...old];const from=result.findIndex(c=>c.id===dragged),to=result.findIndex(c=>c.id===target);if(from<0||to<0)return old;result.splice(to,0,result.splice(from,1)[0]);return result});setDragged(null)};
  return <div className="bv-dashboard"><div className="bv-dashboard-top"><div><strong>Board overview</strong><p>Live charts from your cards · drag charts to rearrange</p></div><button type="button" className="bv-primary" onClick={openAdd}><Plus size={16}/> Add a chart</button></div>
    <div className="bv-kpis">{[['Total cards',total,BarChart3],['Completed',done,CheckCircle2],['Overdue',overdue,Clock3],['Unassigned',unassigned,Users]].map(([name,value,Icon])=><div key={name}><div className="bv-kpi-heading"><span>{name}</span><Icon size={18}/></div><strong>{value}</strong><small>{name==='Completed'?`${total?Math.round(done/total*100):0}% completion`:name==='Overdue'?'Require attention':name==='Unassigned'?'Need an owner':'On this board'}</small></div>)}</div>
    <div className="bv-chart-grid">{charts.map(chart=><section key={chart.id} draggable onDragStart={e=>{if(e.target.closest('button'))return;setDragged(chart.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',chart.id)}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();reorder(chart.id)}} onDragEnd={()=>setDragged(null)} className={`bv-chart-card ${chart.wide?'wide':''} ${dragged===chart.id?'dragging':''}`}><header><div className="bv-chart-title"><GripVertical size={15}/><strong>{chart.title}</strong></div><div><button aria-label={`Edit ${chart.title}`} title="Edit chart" type="button" onClick={()=>openEdit(chart)}><Settings2 size={16}/></button><button aria-label={`Remove ${chart.title}`} title="Remove chart" type="button" onClick={()=>setCharts(v=>v.filter(c=>c.id!==chart.id))}><X size={17}/></button></div></header><ChartBody chart={chart} cards={cards} lists={lists} members={members}/></section>)}<button type="button" className="bv-chart-add" onClick={openAdd}><Plus size={27}/><span>Add a chart</span></button></div>
    {modal&&<div className="bv-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="bv-dialog bv-chart-dialog" role="dialog" aria-modal="true" aria-label={editing?'Edit chart':'Add chart'} onSubmit={save}><div className="bv-dialog-title"><strong>{editing?'Customize chart':'Add a chart'}</strong><button type="button" onClick={()=>setModal(false)} aria-label="Close"><X size={17}/></button></div><p>Choose a chart type and the board data to display.</p><div className="bv-chart-types">{KINDS.map(([kind,label,Icon])=><button type="button" key={kind} className={draft.kind===kind?'active':''} onClick={()=>setDraft(d=>({...d,kind}))}><Icon size={27}/><span>{label}</span></button>)}</div><label>Data source<select value={draft.source} onChange={e=>setDraft(d=>({...d,source:e.target.value}))}>{SOURCES.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label><label>Chart title<input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder={SOURCES.find(s=>s[0]===draft.source)?.[1]}/></label><label className="bv-checkbox-line"><input type="checkbox" checked={draft.wide} onChange={e=>setDraft(d=>({...d,wide:e.target.checked}))}/> Span full dashboard width</label><div className="bv-dialog-actions"><button type="button" className="bv-control" onClick={()=>setModal(false)}>Cancel</button><button type="submit" className="bv-primary">{editing?'Save changes':'Add chart'}</button></div></form></div>}
  </div>;
}
