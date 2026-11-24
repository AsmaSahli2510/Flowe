import { listColor } from '../../board/constants/listColors.js';
export const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const toDate = value => {
  if(!value) return null;
  const raw=String(value).slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date=new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
export const advance = (date,days) => {const next=new Date(date);next.setDate(next.getDate()+days);return next};
export const dateOffset=(date,base)=>Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(base.getFullYear(),base.getMonth(),base.getDate()))/86400000);
export const dateToday=()=>dayKey(new Date());
export const weekStart=(date,sunday=true)=>advance(date,-((date.getDay()+(sunday?0:6))%7));
export const cardRange=card=>{
  const first=toDate(card.start||card.due),last=toDate(card.due||card.start);
  if(!first||!last)return null;
  return first<=last ? [first,last]:[last,first];
};
export const flattenLists=lists=>(lists||[]).filter(l=>!l.archived).flatMap(l=>(l.cards||[]).filter(c=>!c.archived).map(c=>({...c,listId:l.id,listName:l.title,listColor:l.color})));
export const shortDate=value=>toDate(value)?.toLocaleDateString(undefined,{month:'short',day:'numeric'})||'—';
export const listTint=list=>listColor(list?.color);
export const cardLabels=card=>(Array.isArray(card.labels)?card.labels:[]).filter(Boolean);
export const memberLabel=(members,id)=>members?.find(m=>String(m.user?._id??m.id)===String(id))?.user?.name||'Unassigned';
export const chartPalette=['#a78bca','#ee9dbc','#83c2a5','#e7ba6f','#84b6dc','#e59f8e','#b6a5d9','#82c7c1','#c6a69d'];
export function shiftCardToDate(card,target){
  const range=cardRange(card);
  if(!range)return {due:dayKey(target)};
  const days=dateOffset(range[1],range[0]);
  return card.start ? {start:dayKey(target),due:dayKey(advance(target,days))} : {due:dayKey(target)};
}
