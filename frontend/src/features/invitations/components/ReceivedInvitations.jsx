import {useEffect,useState} from 'react';
import {MailCheck,ArrowRight,Clock3} from 'lucide-react';
import {api} from '../../../services/apiClient';
import './ReceivedInvitations.css';
export default function ReceivedInvitations(){
 const [items,setItems]=useState([]),[busy,setBusy]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let alive=true;const refresh=()=>api('/invitations/received/list').then(d=>alive&&setItems(d.invitations||[])).catch(e=>alive&&setError(e.message));refresh();const poll=setInterval(()=>document.visibilityState==='visible'&&refresh(),30000);window.addEventListener('focus',refresh);window.addEventListener('flowe-notification',refresh);return()=>{alive=false;clearInterval(poll);window.removeEventListener('focus',refresh);window.removeEventListener('flowe-notification',refresh)}},[]);
 async function accept(item){setBusy(item._id);setError('');try{const data=await api(`/invitations/received/${item._id}/accept`,{method:'POST'});sessionStorage.setItem('flowe-workspace',data.workspaceId);window.location.assign('/workspace')}catch(e){setError(e.message);setBusy('')}}
 if(!items.length)return null;
 return <section className="fi-inbox" aria-label="Workspace invitations"><header><span><MailCheck size={19}/> Workspace invitations <b>{items.length}</b></span><small>Invitations sent to your Flowe account</small></header><div className="fi-list">{items.map(i=><div key={i._id} className="fi-item"><span className="fi-icon"><MailCheck size={19}/></span><span><strong>{i.workspace?.name||'Workspace'}</strong><small><Clock3 size={12}/> Expires {new Date(i.expiresAt).toLocaleDateString()}</small></span><button disabled={!!busy} onClick={()=>accept(i)}>{busy===i._id?'Joining…':'Accept invitation'} <ArrowRight size={15}/></button></div>)}</div>{error&&<p className="fi-error" role="alert">{error}</p>}</section>;
}
