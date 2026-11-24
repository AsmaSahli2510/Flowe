import { Paperclip, ExternalLink, Trash2, Image } from 'lucide-react';

export default function CardAttachments({activity, fileInput, readOnly, coverUrl, deleteFile, change}) {
  return (
<section className="cd-section"><header><h3><Paperclip size={19}/>Attachments</h3><button disabled={readOnly} onClick={()=>fileInput.current?.click()}>Add</button></header>
            {activity.files.map(f=><div className="cd-file" key={f._id}>
              <div className="cd-file-preview">{f.mime?.startsWith('image/')?<img src={coverUrl(f._id)} alt=""/>:<span>{f.name.split('.').pop().slice(0,4).toUpperCase()}</span>}</div>
              <div className="cd-file-name"><strong>{f.name}</strong><small>{new Date(f.createdAt).toLocaleString()}</small></div>
              <a title="Open attachment" aria-label={`Open ${f.name}`} href={coverUrl(f._id)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/></a>
              <button title="More file options" aria-label={`Remove ${f.name}`} disabled={readOnly} onClick={()=>deleteFile(f)}><Trash2 size={15}/></button>
              {f.mime?.startsWith('image/')&&<button title="Use as cover" aria-label={`Use ${f.name} as cover`} disabled={readOnly} onClick={()=>{change('coverImageId',f._id);change('coverColor','')}}><Image size={15}/></button>}
            </div>)}
          </section>
  );
}
