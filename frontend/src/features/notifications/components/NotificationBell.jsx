import {io} from 'socket.io-client';
import {useEffect,useRef,useState} from 'react';
import {Bell,CheckCheck,Mail,MessageSquare,CalendarClock,CheckCircle2,X} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {api} from '../../../services/apiClient';
import './NotificationBell.css';
const kindIcons={invitation:Mail,invitation_accepted:CheckCircle2,message:MessageSquare,reminder:CalendarClock};
export default function NotificationBell({className=''}){
 const [open,setOpen]=useState(false),[items,setItems]=useState([]),[error,setError]=useState('');
 const navigate=useNavigate(),wrap=useRef(null);
 useEffect(()=>{
  let alive=true;
  const reload=()=>api('/notifications').then(d=>{if(alive){setItems(d.notifications||[]);setError('')}}).catch(e=>alive&&setError(e.message));
  const onVisibility=()=>{if(document.visibilityState==='visible')reload()};
  reload();
  // A personal socket receives invitations even before joining any workspace.
  const socket=io({withCredentials:true});
  socket.on('notification',reload);
  const interval=setInterval(onVisibility,20000);
  window.addEventListener('flowe-notification',reload);window.addEventListener('focus',reload);document.addEventListener('visibilitychange',onVisibility);
  return ()=>{alive=false;socket.disconnect();clearInterval(interval);window.removeEventListener('flowe-notification',reload);window.removeEventListener('focus',reload);document.removeEventListener('visibilitychange',onVisibility)};
 },[]);
 useEffect(()=>{const handler=e=>{if(e.key==='Escape'||(e.type==='pointerdown'&&!wrap.current?.contains(e.target)))setOpen(false)};document.addEventListener('pointerdown',handler);document.addEventListener('keydown',handler);return()=>{document.removeEventListener('pointerdown',handler);document.removeEventListener('keydown',handler)}},[]);
 const go=async n=>{try{await api(`/notifications/${n._id}/read`,{method:'PATCH'});setItems(xs=>xs.map(x=>x._id===n._id?{...x,seen:true}:x));setOpen(false);if(n.project&&n.workspace)navigate(`/workspace/${n.workspace}/project/${n.project}${n.card?`?card=${n.card}`:''}`);else if(n.workspace){sessionStorage.setItem('flowe-workspace',n.workspace);navigate('/workspace')}else navigate('/workspace')}catch(e){setError(e.message)}};
 const unread=items.filter(n=>!n.seen).length;
 return <div className={`fn-wrap ${className}`} ref={wrap}><button type="button" className="fn-bell" aria-expanded={open} aria-label={`Notifications, ${unread} unread`} title="Notifications" onClick={()=>setOpen(v=>!v)}><Bell size={19}/>{unread>0&&<b className="fn-counter">{unread>9?'9+':unread}</b>}</button>{open&&<div className="fn-popover" role="dialog" aria-label="Notifications"><div className="fn-head"><div><strong>Notifications</strong><small>{unread} unread</small></div><div><button type="button" title="Mark all as read" disabled={!unread} onClick={async()=>{try{await api('/notifications/read-all',{method:'POST'});setItems(xs=>xs.map(x=>({...x,seen:true})))}catch(e){setError(e.message)}}}><CheckCheck size={17}/></button><button type="button" title="Close" onClick={()=>setOpen(false)}><X size={16}/></button></div></div>{error&&<p role="alert" className="fn-error">{error}</p>}<div className="fn-list">{!items.length&&<p>You're all caught up. Updates from your team will appear here.</p>}{items.map(n=>{const Icon=kindIcons[n.kind]||Bell;return <button type="button" key={n._id} className={n.seen?'':'unread'} onClick={()=>go(n)}><span className="fn-icon"><Icon size={16}/></span><span>{n.text}<small>{new Date(n.createdAt).toLocaleString()}</small></span>{!n.seen&&<i className="fn-unread"/>}</button>})}</div></div>}</div>;
}
