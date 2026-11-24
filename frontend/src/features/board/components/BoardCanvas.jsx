import BoardCard from "./cards/BoardCard";
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Archive, ArrowDownAZ, ArrowLeftRight, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Ellipsis, Eye, EyeOff, Pin, Plus, SquarePen, SquarePlus, Tag, X, Zap } from 'lucide-react';
import { api } from '../../../services/apiClient';
import { useSmoothCardDrag } from '../hooks/useSmoothCardDrag';
import { useBoardScrolling } from '../hooks/useBoardScrolling';
import './BoardCanvas.css';
import { LIST_COLORS, listColor } from '../constants/listColors';

export default function KanbanBoard({
  lists, project, workspaceId, user, members, palette, readOnly, filterCards,
  onCreateList, onCreateCard, onCopyCard, onMoveCard, onMoveList, onRenameList,
  onCopyList, onMoveAll, onRepositionList, onSort, onColor, onPin, onWatch, onArchive,
  onArchiveCards, onComplete, onOpenCard, onAutomation,
}) {
  const [collapsed, setCollapsed] = useState([]);
  const [composer, setComposer] = useState(null);
  const [newList, setNewList] = useState(false);
  const [title, setTitle] = useState('');
  const [listTitle, setListTitle] = useState('');
  const [menu, setMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({top: 0, left: 0});
  const [sortOpen, setSortOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [templateList, setTemplateList] = useState(null);
  const [renameId,setRenameId] = useState(null);
  const [renameValue,setRenameValue] = useState('');
  const [moveDestination,setMoveDestination] = useState(null);
  const [movePosition,setMovePosition] = useState(false);
  const [activityCounts, setActivityCounts] = useState({});
  const [dragged, setDragged] = useState(null); // Native list reordering only
  const menuNode = useRef(null);
  const allCards = useMemo(() => lists.flatMap(l=>l.cards.filter(c=>!c.archived).map(c=>({...c,listId:l.id}))), [lists]);
  const active = lists.filter(l=>!l.archived);
  const pinned = active.filter(l=>l.pinned);
  const ordinary = active.filter(l=>!l.pinned);
  const {scrollRef, edges, updateEdges, scrollByPage, onPointerDown: onPanStart,
    onPointerMove: onPanMove, finishPan} = useBoardScrolling([ordinary.length, pinned.length, newList]);
  const {drag, onPointerDown: onCardPointerDown, shouldIgnoreClick} = useSmoothCardDrag({
    lists, filterCards, readOnly, onMoveCard, scrollRef,
  });
  const openCardSafely = (card,listId) => { if(!shouldIgnoreClick()) onOpenCard(card,listId) };
  const moveCardByKeyboard = (card,list,key) => {
    if(readOnly)return;
    const orderedLists = [...pinned, ...ordinary]; // visual order (pinned lane first)
    const li = orderedLists.findIndex(l=>l.id===list.id);
    if(key==='ArrowLeft'||key==='ArrowRight') {
      const destination=orderedLists[li+(key==='ArrowLeft'?-1:1)];
      if(destination)onMoveCard(card.id,destination.id,null);
    } else {
      const cards=filterCards(list).filter(c=>!c.archived);
      const i=cards.findIndex(c=>c.id===card.id);
      if(key==='ArrowUp' && i>0)onMoveCard(card.id,list.id,cards[i-1].id);
      if(key==='ArrowDown' && i<cards.length-1)onMoveCard(card.id,list.id,cards[i+2]?.id||null);
    }
  };
  useEffect(() => {
    let mounted = true;
    const refresh = () => api(`/workspaces/${workspaceId}/projects/${project._id}/card-badges`)
      .then(data => {if(mounted) setActivityCounts(data.badges||{});}).catch(()=>{});
    refresh();
    window.addEventListener('flowe-activity-changed', refresh);
    return () => {mounted=false;window.removeEventListener('flowe-activity-changed',refresh)};
  }, [workspaceId,project._id]);
  useEffect(() => {
    if (!menu) return;
    const close = e => {if(!menuNode.current?.contains(e.target) && !e.target.closest('[data-list-menu-trigger]'))setMenu(null)};
    const esc = e => {if(e.key==='Escape')setMenu(null)};
    window.addEventListener('pointerdown',close);
    window.addEventListener('keydown',esc);
    return () => {window.removeEventListener('pointerdown',close);window.removeEventListener('keydown',esc)};
  }, [menu]);
  const showMenu = (event, id) => {
    event.stopPropagation();
    if(menu === id){setMenu(null);return}
    const r = event.currentTarget.getBoundingClientRect();
    setMenuPos({ top: Math.min(r.bottom+6,window.innerHeight-130),
      left: Math.max(10,Math.min(r.right-302, window.innerWidth-316)) });
    setSortOpen(false);setColorsOpen(true);setAutomationOpen(false);setMoveDestination(null);setMovePosition(false);setMenu(id);
  };
  const closeMenu = fn => {fn?.();setMenu(null)};
  const addCard = (listId,e) => {
    e?.preventDefault();
    if (!title.trim()) return;
    onCreateCard(listId,title.trim());setComposer(null);setTitle('');
  };
  const addList = e => {
    e.preventDefault();if(!listTitle.trim())return;
    onCreateList(listTitle.trim());setListTitle('');setNewList(false);
  };
  const openComposer = id => {setTitle('');setComposer(id);setTemplateList(null)};
  const onDrop = (e,listId,beforeId) => {
    e.preventDefault();e.stopPropagation();
    if(!dragged || readOnly)return;
    if(dragged.type==='list' && beforeId==null)onMoveList(dragged.id,listId);
    // Card sorting uses pointer events and a live placeholder instead.
    setDragged(null);
  };
  const renderList = list => {
    const isCollapsed = collapsed.includes(list.id);
    const watching = list.watchers?.includes(user.id);
    const cards = filterCards(list);
    return <section key={list.id} data-kb-list-id={list.id} className={`kb-list ${isCollapsed?'kb-collapsed':''} ${list.pinned?'kb-pinned-list':''}`}
      data-live-id={`list:${list.id}`} style={{'--kb-list-tint':listColor(list.color)}}
      onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,list.id)}>
      <header className="kb-list-head" draggable={!readOnly} onDragStart={e=>{setDragged({type:'list',id:list.id});e.dataTransfer.setData('text/plain',`list:${list.id}`)}} onDragEnd={()=>setDragged(null)}>
        <div className="kb-head-main" title={list.title}>
          {renameId===list.id?<form className="kb-rename-form" onSubmit={e=>{e.preventDefault();if(renameValue.trim())onRenameList(list.id,renameValue.trim());setRenameId(null)}} onDragStart={e=>e.stopPropagation()}><input autoFocus aria-label="Rename list" value={renameValue} maxLength={80} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setRenameId(null)}}}/><button type="submit" aria-label="Save list name"><Check size={15}/></button></form>:<strong>{list.title}</strong>}
          {watching&&<Eye size={14} aria-label="Watching list"/>}
          {list.pinned&&<Pin size={14} aria-label="Pinned list"/>}
          <span className="kb-count" title="Number of cards">{list.cards.filter(c=>!c.archived).length}</span>
        </div>
        <div className="kb-list-head-actions">
          <button type="button" title={isCollapsed?'Expand list':'Collapse list'} aria-label={isCollapsed?'Expand list':'Collapse list'} onClick={()=>setCollapsed(xs=>isCollapsed?xs.filter(x=>x!==list.id):[...xs,list.id])}><ArrowLeftRight size={16}/></button>
          <button type="button" title="List actions" aria-label={`Actions for ${list.title}`} data-list-menu-trigger onClick={e=>showMenu(e,list.id)}><Ellipsis size={18}/></button>
        </div>
      </header>
      {!isCollapsed&&<>
        <div className="kb-card-stack">{cards.filter(card=>!drag || String(card.id)!==String(drag.cardId)).map(card=><ReactCardSlot key={card.id} card={card} before={drag?.listId===list.id && drag?.beforeId===card.id} height={drag?.height}>
          <BoardCard {...{card,list,activityCounts,members,palette,project,workspaceId,readOnly,onComplete}}
            onOpenCard={openCardSafely} onPointerDown={onCardPointerDown} onKeyboardMove={moveCardByKeyboard}/>
        </ReactCardSlot>)}
          {drag?.listId===list.id && drag.beforeId==null && <div className="kb-drop-placeholder" style={{height:drag.height}} aria-hidden="true"/>}
        </div>
        {composer===list.id?<form className="kb-composer" onSubmit={e=>addCard(list.id,e)}>
          <textarea autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Enter a title or paste a link" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addCard(list.id)}}}/>
          <div className="kb-compose-buttons"><button type="submit" className="kb-primary">Add card</button><button type="button" aria-label="Cancel card" onClick={()=>setComposer(null)}><X size={17}/></button></div>
        </form>:<footer className="kb-list-foot">
          <button className="kb-add-card" disabled={readOnly} onClick={()=>openComposer(list.id)}><Plus size={19}/> Add a card</button>
          <button className="kb-foot-icon" disabled={readOnly} title="Create from a template" aria-label="Create from a template" onClick={()=>{setTemplateList(templateList===list.id?null:list.id);setComposer(null)}}><SquarePlus size={17}/></button>
          <button className="kb-foot-icon" disabled={readOnly} title="List automation" aria-label="List automation" onClick={()=>onAutomation()}><Zap size={17}/></button>
        </footer>}
        {templateList===list.id&&<div className="kb-template-picker"><div><strong>Create from a card template</strong><button aria-label="Close templates" onClick={()=>setTemplateList(null)}><X size={14}/></button></div>
          {allCards.length ? allCards.slice(0,24).map(card=><button type="button" key={card.id} onClick={()=>{onCopyCard(card,list.id);setTemplateList(null)}}><Copy size={14}/>{card.title}</button>) : <p>No cards available yet. Create a card first.</p>}
        </div>}
      </>}
    </section>;
  };
  const focusedList = lists.find(l=>l.id===menu);
  return <div className={`kb-board-scroll ${pinned.length?'has-pinned-lists':''}`} aria-label="Kanban board">
    {pinned.length>0&&<div className="kb-pinned-region" aria-label="Pinned lists">{pinned.map(renderList)}</div>}
    <div className="kb-scrolling-region-scroll" ref={scrollRef} onScroll={updateEdges}
      onPointerDown={onPanStart} onPointerMove={onPanMove}
      onPointerUp={finishPan} onPointerCancel={finishPan} onLostPointerCapture={finishPan} aria-label="Scrollable lists">
    <div className="kb-board-track">
      <div className="kb-scrolling-region">{ordinary.map(renderList)}</div>
      {newList?<form className="kb-new-list" onSubmit={addList}>
        <input autoFocus value={listTitle} onChange={e=>setListTitle(e.target.value)} maxLength={80} placeholder="Enter list name..." aria-label="List name"/>
        <div className="kb-compose-buttons"><button className="kb-primary" type="submit">Add list</button><button type="button" aria-label="Cancel new list" onClick={()=>setNewList(false)}><X size={17}/></button></div>
      </form>:<button className="kb-add-list" disabled={readOnly} onClick={()=>setNewList(true)}><Plus size={20}/> Add another list</button>}
    </div>
    </div>
    {(edges.left||edges.right)&&<nav className="kb-scroll-controls" aria-label="Move across board">
      <button type="button" title="Scroll board left" aria-label="Scroll board left" disabled={!edges.left} onClick={()=>scrollByPage(-1)}><ChevronLeft size={17}/></button>
      <button type="button" title="Scroll board right" aria-label="Scroll board right" disabled={!edges.right} onClick={()=>scrollByPage(1)}><ChevronRight size={17}/></button>
    </nav>}
    {focusedList&&menu&&createPortal(<div className="kb-popover" ref={menuNode} role="menu" aria-label="List actions"
      style={{top:menuPos.top,left:menuPos.left}}>
      <div className="kb-popover-title"><strong>List actions</strong><button aria-label="Close list actions" onClick={()=>setMenu(null)}><X size={17}/></button></div>
      <button role="menuitem" disabled={readOnly} onClick={()=>closeMenu(()=>openComposer(menu))}><Plus size={16}/>Add card</button>
      <button role="menuitem" disabled={readOnly} onClick={()=>closeMenu(()=>onCopyList(menu))}><Copy size={16}/>Copy list</button>
      <button role="menuitem" disabled={readOnly} onClick={()=>closeMenu(()=>{setRenameId(menu);setRenameValue(focusedList.title)})}><SquarePen size={16}/>Rename list</button>
      <button role="menuitem" disabled={readOnly} onClick={()=>setMovePosition(v=>!v)}><ArrowLeftRight size={16}/>Move list <ChevronDown size={15}/></button>
      {movePosition&&<div className="kb-submenu"><label>Choose position<select aria-label="Move list to position" defaultValue="" onChange={e=>{if(e.target.value!=='')closeMenu(()=>onRepositionList(menu,Number(e.target.value)))}}><option value="" disabled>Position…</option>{active.map((l,i)=><option key={l.id} value={i}>{i+1} · {l.id===menu?'Current position':l.title}</option>)}</select></label></div>}
      <button role="menuitem" disabled={readOnly} onClick={()=>setMoveDestination(v=>v===menu?null:menu)}><ArrowRight size={16}/>Move all cards in this list <ChevronDown size={15}/></button>
      {moveDestination===menu&&<div className="kb-submenu"><label>Destination<select aria-label="Move all cards to" defaultValue="" onChange={e=>{if(e.target.value)closeMenu(()=>onMoveAll(menu,Number(e.target.value)))}}><option value="" disabled>Choose a list…</option>{active.filter(l=>l.id!==menu).map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label></div>}
      <button role="menuitem" onClick={()=>setSortOpen(v=>!v)}><ArrowDownAZ size={16}/>Sort by <ChevronDown size={15}/></button>
      {sortOpen&&<div className="kb-submenu"><button disabled={readOnly} onClick={()=>closeMenu(()=>onSort(menu,'title'))}>Name (A–Z)</button><button disabled={readOnly} onClick={()=>closeMenu(()=>onSort(menu,'due'))}>Due date</button></div>}
      <button role="menuitem" disabled={readOnly} onClick={()=>closeMenu(()=>onPin(menu))}><Pin size={16}/>{focusedList.pinned?'Unpin list':'Pin list'}</button>
      <button role="menuitem" onClick={()=>closeMenu(()=>onWatch(menu))}>{focusedList.watchers?.includes(user.id)?<EyeOff size={16}/>:<Eye size={16}/>} {focusedList.watchers?.includes(user.id)?'Unwatch list':'Watch list'}</button>
      <div className="kb-menu-divider"/>
      <button className="kb-menu-section" onClick={()=>setColorsOpen(v=>!v)}><PaletteIcon/>Change list color <ChevronDown size={15}/></button>
      {colorsOpen&&<><div className="kb-color-grid">{LIST_COLORS.map(([name,color])=><button key={name} title={name} aria-label={`${name} list color`} disabled={readOnly} className={focusedList.color===name?'active':''} style={{background:color}} onClick={()=>closeMenu(()=>onColor(menu,name))}>{focusedList.color===name&&<Check size={18}/>}</button>)}</div><button disabled={readOnly} onClick={()=>closeMenu(()=>onColor(menu,'neutral'))}><X size={15}/>Remove color</button></>}
      <div className="kb-menu-divider"/>
      <button className="kb-menu-section" onClick={()=>setAutomationOpen(v=>!v)}><Zap size={16}/>Automation <ChevronDown size={15}/></button>
      {automationOpen&&<div className="kb-submenu"><button onClick={()=>closeMenu(()=>onAutomation({name:'Card added to list',trigger:'on-move',action:'label',label:'New',sourceList:String(menu)}))}>When a card is added to the list</button><button onClick={()=>closeMenu(()=>onAutomation({name:'Daily due-date sorting',trigger:'daily',action:'sort',targetList:String(menu),hour:9}))}>Every day, sort list by</button><button onClick={()=>closeMenu(()=>onAutomation())}>Create a rule</button></div>}
      <div className="kb-menu-divider"/>
      <button role="menuitem" disabled={readOnly} onClick={()=>closeMenu(()=>onArchive(menu))}><Archive size={16}/>Archive this list</button>
      <button role="menuitem" disabled={readOnly || !focusedList.cards.some(c=>!c.archived)} onClick={()=>closeMenu(()=>onArchiveCards(menu))}><Archive size={16}/>Archive all cards in this list</button>
    </div>,document.body)}
  </div>;
}
function PaletteIcon(){return <Tag size={16}/>}

function ReactCardSlot({card, before, height, children}) {
  return <>{before&&<div className="kb-drop-placeholder" style={{height}} aria-hidden="true"/>}{children}</>;
}
