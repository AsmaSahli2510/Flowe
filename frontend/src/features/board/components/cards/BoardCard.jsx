import MemberAvatar from '../../../../components/ui/MemberAvatar';
import { AlignLeft, Check, CheckCircle2, Clock3, MessageSquare, Paperclip, SquarePen } from 'lucide-react';
import { countChecks, formatDate } from '../../utils/cardBadges';
import { motion } from 'motion/react';

export default function BoardCard({ card, list, activityCounts, members, palette, project, workspaceId, readOnly, onOpenCard, onComplete, onPointerDown, onKeyboardMove }) {
    const {total,done} = countChecks(card);
    const badge = activityCounts[String(card.id)]||{};
    const labels = (card.labels||[]).filter(Boolean);
    const assignee = members.find(m=>m.user._id===card.assignee)?.user;
    const photo = card.coverImageId ? `/api/workspaces/${workspaceId}/projects/${project._id}/files/${card.coverImageId}?inline=1` : null;
    return <motion.article layout="position" transition={{layout:{type:"spring",stiffness:460,damping:38}}} className={`kb-card ${card.completed?'is-complete':''}`} key={card.id}
      draggable={false} tabIndex={0} role="button" aria-label={`Open card ${card.title}`}
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
      data-live-id={`card:${card.id}`} data-kb-card-id={card.id}
      onPointerDown={e=>onPointerDown(e,card,list)}
      onKeyDown={e=>{
        if(e.target!==e.currentTarget)return;
        if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpenCard(card,list.id)}
        else if(e.altKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {e.preventDefault();onKeyboardMove(card,list,e.key)}
      }}
      onClick={()=>onOpenCard(card,list.id)}>
      {photo ? <img className="kb-card-cover" src={photo} alt=""/> : card.coverColor ? <div className="kb-card-cover-color" style={{background:card.coverColor}}/> : null}
      {card.cover && !photo && !card.coverColor && <div className={`kb-card-cover-color kb-cover-${card.cover}`}/>}
      <div className="kb-card-content">
        {!!labels.length&&<div className="kb-labels" aria-label="Labels">{labels.map((name,i)=><span key={`${name}-${i}`} title={name} style={{background:palette.find(x=>x.name===name)?.color||'#c1afe2'}}/>)}</div>}
        <div className="kb-card-title">
          <button type="button" className={`kb-complete ${card.completed?'checked':''}`} disabled={readOnly}
            aria-label={card.completed?'Mark incomplete':'Mark complete'} title={card.completed?'Mark incomplete':'Mark complete'}
            onClick={e=>{e.stopPropagation();onComplete(card.id,!card.completed)}}>{card.completed?<Check size={13}/>:null}</button>
          <span>{card.title}</span>
        </div>
        <div className="kb-card-meta">
          {card.due&&<span className={`kb-due ${card.completed?'done':card.due<new Date().toLocaleDateString('en-CA')?'overdue':''}`} title="Due date"><Clock3 size={13}/>{formatDate(card.due)}</span>}
          {!!card.detail&&<span title="Description"><AlignLeft size={14}/></span>}
          {(badge.comments>0)&&<span title="Comments"><MessageSquare size={13}/>{badge.comments}</span>}
          {(badge.files>0)&&<span title="Attachments"><Paperclip size={13}/>{badge.files}</span>}
          {total>0&&<span className={done===total?'kb-checks-done':''} title="Checklist progress"><CheckCircle2 size={13}/>{done}/{total}</span>}
          {assignee&&<MemberAvatar user={assignee} size={27} showStatus={false}/>}
        </div>
      </div>
      <button className="kb-card-edit" type="button" title="Edit card" aria-label={`Edit ${card.title}`} onClick={e=>{e.stopPropagation();onOpenCard(card,list.id)}}><SquarePen size={15}/></button>
    </motion.article>;
  }
