export const formatDate = date => {
  if (!date) return '';
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', {month:'short',day:'numeric'});
};
export const countChecks = card => ({total: card.checklist?.length ?? card.checks ?? 0,
  done: card.checklist ? card.checklist.filter(x=>x.done).length : card.done||0});
