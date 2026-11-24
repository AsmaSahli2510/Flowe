// Small deterministic automation engine shared by live board updates and scheduled work.
// Rules are data, not executable user scripts. Each event is evaluated once.
const key = x => String(x ?? '');
export function executeRule(lists, rule, cardId) {
  const cardList = lists.find(l=>l.cards.some(c=>c.id===cardId));
  const card = cardList?.cards.find(c=>c.id===cardId);
  if (!card && rule.action !== 'sort') return lists;
  switch(rule.action) {
    case 'label':
      if(card && rule.label?.trim()) card.labels=[...new Set([...(card.labels||[]),rule.label.trim().slice(0,60)])];
      break;
    case 'complete': if(card) card.completed=true; break;
    case 'priority': if(card)card.priority='High'; break;
    case 'move': {
      const dest=lists.find(l=>key(l.id)===key(rule.targetList));
      if(card&&dest&&dest!==cardList){cardList.cards=cardList.cards.filter(c=>c.id!==cardId);dest.cards.push(card)}
      break;
    }
    case 'remind': break; // Reminders are sent only by the server scheduler.
    case 'sort': {
      const target=lists.find(l=>key(l.id)===key(rule.targetList));
      if(target)target.cards.sort((a,b)=>(a.due||'9999-99-99').localeCompare(b.due||'9999-99-99') || a.title.localeCompare(b.title));
      break;
    }
  }
  return lists;
}
const cardMap=lists=>new Map(lists.flatMap(l=>l.cards.map(c=>[c.id,{card:c,list:l.id}])));
export function applyBoardRules(before,after,rules=[]) {
  const previous=cardMap(before), now=cardMap(after);
  for(const [id,{card,list}] of now){
    const old=previous.get(id);
    for(const rule of rules){
      if(!rule.enabled)continue;
      let matches=false;
      if(rule.trigger==='on-move') matches=(!old||key(old.list)!==key(list))&&key(rule.sourceList)===key(list);
      if(rule.trigger==='on-complete') matches=!!card.completed && !old?.card.completed;
      if(rule.trigger==='on-checklist') matches=!!card.checklist?.length&&card.checklist.every(i=>i.done)&&!(old?.card.checklist?.length&&old.card.checklist.every(i=>i.done));
      if(matches) executeRule(after,rule,id);
    }
  }
  return after;
}
export function runTimedRule(lists,rule,now=new Date()) {
  const today=now.toISOString().slice(0,10);
  if(rule.trigger==='daily'||rule.trigger==='weekly') {
    if(rule.action==='sort') executeRule(lists,rule,null);
    else for(const l of [...lists])for(const c of [...l.cards])if(!c.archived)executeRule(lists,rule,c.id);
  } else if(rule.trigger==='due') {
    const horizon=new Date(now);horizon.setUTCDate(horizon.getUTCDate()+(Number(rule.daysBefore)||0));
    const target=horizon.toISOString().slice(0,10);
    for(const l of [...lists]) for(const c of [...l.cards]) if(!c.archived&&!c.completed&&c.due===target)executeRule(lists,rule,c.id);
  }
  return lists;
}
