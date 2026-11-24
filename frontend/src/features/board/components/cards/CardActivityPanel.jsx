import { MessageSquare, Send, SmilePlus, Paperclip } from 'lucide-react';
import { initials } from '../../utils/cardFormatting';

export default function CardActivityPanel({setShowActivity, postComment, commentBox, comment, readOnly, setComment, busy, allowed, entries, editingComment, editText, setEditText, changeComment, reactionPicker, setReactionPicker, setEditingComment, reactToComment, user, coverUrl}) {
  return (
<aside className="cd-right"><div className="cd-activity-head"><h3><MessageSquare size={17}/>Comments and activity</h3><button onClick={()=>setShowActivity(false)}>Hide details</button></div>
          <form onSubmit={postComment} className="cd-comment-form"><textarea aria-label="Comment" ref={commentBox} placeholder="Write a comment..." value={comment} disabled={readOnly} maxLength={4000} onChange={e=>setComment(e.target.value)} rows={comment?'3':'1'}/>{!!comment&&<><div className="cd-mention-helper">{['@board','@card',...allowed.map(m=>'@'+m.user.name.replace(/\s+/g,''))].slice(0,6).map(v=><button type="button" key={v} onClick={()=>setComment(c=>`${c}${c&&!c.endsWith(' ')?' ':''}${v} `)}>{v}</button>)}</div><button className="cd-comment-send" disabled={busy||!comment.trim()||readOnly}><Send size={15}/>Post comment</button></>}</form>
          <div className="cd-activity-feed">
            {entries.map(({type,value})=>type==='event'?<div className="cd-entry cd-change-entry" key={`event-${value._id}`}>
              <span className="cd-avatar">{initials(value.actor)}</span><div><p><strong>{value.actor}</strong> {value.text}</p><time>{new Date(value.createdAt).toLocaleString()}</time></div>
            </div>:type==='comment'?<div className="cd-entry" key={`comment-${value._id}`}><span className="cd-avatar">{initials(value.name)}</span><div><p><strong>{value.name}</strong><time>{new Date(value.createdAt).toLocaleString()}</time></p>
              {editingComment===value._id?<><textarea aria-label="Edit comment" value={editText} onChange={e=>setEditText(e.target.value)}/><div className="cd-comment-actions"><button disabled={!editText.trim()} onClick={()=>changeComment(value._id,'edit')}>Save</button><button onClick={()=>setEditingComment('')}>Cancel</button></div></>:<div className="cd-comment-message">{value.text}</div>}
              <div className="cd-comment-actions"><button disabled={readOnly} title="React to comment" aria-label="React to comment" onClick={()=>setReactionPicker(v=>v===value._id?null:value._id)}><SmilePlus size={14}/></button><button onClick={()=>{setComment(s=>`@${value.name.replace(/\s+/g,'')} ${s}`);commentBox.current?.focus()}}>Reply</button>{value.author===user.id&&editingComment!==value._id&&<><button disabled={readOnly} onClick={()=>{setEditingComment(value._id);setEditText(value.text)}}>Edit</button><button disabled={readOnly} onClick={()=>changeComment(value._id,'delete')}>Delete</button></>}</div>
              {reactionPicker===value._id&&<div className="cd-reaction-picker">{['👍','❤️','🎉','😊'].map(emoji=><button aria-label={`React ${emoji}`} disabled={readOnly} key={emoji} onClick={()=>reactToComment(value._id,emoji)}>{emoji}</button>)}</div>}
              {!!value.reactions?.length&&<div className="cd-reactions">{[...new Set(value.reactions.map(r=>r.emoji))].map(emoji=><button key={emoji} disabled={readOnly} className={value.reactions.some(r=>r.user===user.id&&r.emoji===emoji)?'active':''} onClick={()=>reactToComment(value._id,emoji)}>{emoji} {value.reactions.filter(r=>r.emoji===emoji).length}</button>)}</div>}
            </div></div>:<div className="cd-entry" key={`file-${value._id}`}><span className="cd-avatar"><Paperclip size={15}/></span><div><p><strong>Attachment added</strong><time>{new Date(value.createdAt).toLocaleString()}</time></p><a className="cd-activity-link" href={coverUrl(value._id)} target="_blank" rel="noopener noreferrer">{value.name}</a>{value.mime?.startsWith('image/')&&<img className="cd-activity-image" src={coverUrl(value._id)} alt="Attached preview"/>}</div></div>)}
            {!entries.length&&<p className="cd-activity-empty">Comments, attachments, and changes will appear here.</p>}
          </div>
        </aside>
  );
}
