import './MemberAvatar.css';
// Stable color derived from account ID; never tied to a transient socket ID.
const COLORS=['#b892de','#e9a3bd','#76baa5','#e4ac69','#84aee0','#c89b8d','#81b4b8','#adabda','#d6909e','#9bbd75'];
export function avatarColor(id=''){
  let hash=0;for(const c of String(id))hash=(hash*31+c.charCodeAt(0))>>>0;
  return COLORS[hash%COLORS.length];
}
export default function MemberAvatar({user,online=false,self=false,size=30,showStatus=true,className=''}){
  const name=user?.name||'Member';
  const id=user?._id||user?.id||name;
  const initials=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  return <span className={`fm-avatar ${className}`} title={`${name}${self?' (you)':''} · ${online?'Online':'Offline'}`} aria-label={`${name} ${online?'online':'offline'}`} style={{width:size,height:size,background:avatarColor(id)}}>
    {initials}{showStatus&&<i className={`fm-status ${online?'online':'offline'}`}/>}
  </span>;
}
