import { advance, cardRange, dayKey } from './viewData.js';
const csvValue=value=>`"${String(value??'').replaceAll('"','""')}"`;
export function cardsToCsv(cards=[]){
  const cols=['Title','List','Labels','Assigned to','Priority','Start','Due','Completed','Checklist'];
  const rows=cards.map(c=>[c.title,c.listName,(c.labels||[]).join(' | '),c.assignee||'',c.priority||'Medium',c.start||'',c.due||'',c.completed?'Yes':'No',c.checks?`${c.done||0}/${c.checks}`:'']);
  return [cols,...rows].map(row=>row.map(csvValue).join(',')).join('\r\n');
}
const icsEscape=value=>String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
export function cardsToIcs(cards=[],projectId='flowe'){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Flowe//Board Calendar//EN','CALSCALE:GREGORIAN'];
  for(const card of cards){const range=cardRange(card);if(!range)continue;const [start,end]=range;
    const compact=d=>dayKey(d).replaceAll('-','');
    lines.push('BEGIN:VEVENT',`UID:card-${card.id}@${projectId}.flowe`,`DTSTART;VALUE=DATE:${compact(start)}`,`DTEND;VALUE=DATE:${compact(advance(end,1))}`,`SUMMARY:${icsEscape(card.title)}`,`DESCRIPTION:${icsEscape(card.listName||'Flowe board')}`,'END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.join('\r\n')+'\r\n';
}
export function saveFile(content,filename,mime){
  const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
