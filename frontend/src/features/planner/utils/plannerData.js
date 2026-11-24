// Shared date calculations for the Time Garden. All date-only values use local calendar days.
import { advance, cardRange, dayKey, flattenLists, shiftCardToDate, toDate, weekStart } from '../../views/utils/viewData.js';

export { advance, cardRange, dayKey, shiftCardToDate, toDate, weekStart };
export const PLANNER_MODES = ['Agenda', 'Day', 'Week', 'Month', 'Custom'];
export const sameDay = (a, b) => !!a && !!b && dayKey(a) === dayKey(b);
export const isComplete = card => !!card.completed || (card.checks > 0 && card.done >= card.checks);
export const plannerCards = lists => flattenLists(lists);
export const dueHour = card => {
  const time = String(card.due || '').match(/T(\d{2}):(\d{2})/);
  return time ? Math.max(0, Math.min(23, Number(time[1]))) : 9;
};
export const startOfMonth = date => new Date(date.getFullYear(),date.getMonth(),1);
export const monthGrid = date => {
  const first = weekStart(startOfMonth(date),true);
  return Array.from({length:42},(_,i)=>advance(first,i));
};
export const rangeDays = (mode, anchor, customDays=5, agendaDays=14) => {
  if(mode === 'Month')return monthGrid(anchor);
  const start = mode === 'Week' ? weekStart(anchor,true) : anchor;
  const count = mode === 'Week' ? 7 : mode === 'Custom' ? customDays : mode === 'Agenda' ? agendaDays : 1;
  return Array.from({length:count},(_,i)=>advance(start,i));
};
export const stepCursor = (date, mode, direction, customDays=5, agendaDays=14) => {
  if(mode==='Month')return new Date(date.getFullYear(),date.getMonth()+direction,Math.min(date.getDate(),28));
  return advance(date,direction*(mode==='Week'?7:mode==='Custom'?customDays:mode==='Agenda'?agendaDays:1));
};
export const cardsForDay = (cards,date) => cards.filter(card=>{
  const range=cardRange(card);
  const key=dayKey(date);
  return range && dayKey(range[0]) <= key && dayKey(range[1]) >= key;
});
export const unscheduledCards = cards => cards.filter(card=>!cardRange(card));
export const timeForDay = (date,hour) => `${dayKey(date)}T${String(hour).padStart(2,'0')}:00`;
export const schedulePatch = (card,date,hour=null) => {
  const patch=shiftCardToDate(card,date);
  if(hour!==null){patch.due=timeForDay(toDate(patch.due)||date,hour);}
  else if(card.due && /T\d{2}:\d{2}/.test(card.due)){
    patch.due=`${String(patch.due).slice(0,10)}${String(card.due).slice(10)}`;
  }
  return patch;
};
