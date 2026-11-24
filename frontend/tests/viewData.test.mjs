import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, cardRange, dayKey, dateOffset, flattenLists, shiftCardToDate, toDate, weekStart } from '../src/features/views/utils/viewData.js';
import { LIST_COLORS,listColor } from '../src/features/board/constants/listColors.js';
import { cardsToCsv, cardsToIcs } from '../src/features/views/utils/exportViews.js';

test('dates are parsed as local calendar days, including leap years',()=>{
  assert.equal(dayKey(toDate('2028-02-29')),'2028-02-29');
  assert.equal(dayKey(advance(toDate('2026-12-31'),1)),'2027-01-01');
  assert.equal(dayKey(weekStart(toDate('2026-11-22'))),'2026-11-22');
  assert.equal(dateOffset(toDate('2026-12-01'),toDate('2026-11-22')),9);
});
test('dragging a date range preserves its duration',()=>{
  const card={start:'2026-11-22',due:'2026-11-25'};
  assert.deepEqual(shiftCardToDate(card,toDate('2026-12-03')),{start:'2026-12-03',due:'2026-12-06'});
  assert.deepEqual(shiftCardToDate({due:'2026-11-22'},toDate('2026-12-03')),{due:'2026-12-03'});
  assert.deepEqual(shiftCardToDate({},toDate('2026-12-03')),{due:'2026-12-03'});
});
test('views exclude archived cards and preserve destination lists',()=>{
  const flat=flattenLists([{id:1,title:'A',color:'violet',cards:[{id:2,title:'A card'},{id:3,title:'Hidden',archived:true}]},{id:4,title:'Archived',archived:true,cards:[{id:5,title:'Not visible'}]}]);
  assert.deepEqual(flat.map(c=>[c.id,c.listId,c.listColor]),[[2,1,'violet']]);
});
test('all named list colors have a usable color value',()=>{
  assert.equal(LIST_COLORS.length,20);
  for(const [name] of LIST_COLORS)assert.match(listColor(name),/^#[0-9a-fA-F]{6}$/);
  assert.equal(listColor('unknown'),listColor('neutral'));
});

test('CSV escapes titles and ICS preserves all-day range with exclusive end date',()=>{
  const cards=[{id:9,title:'Hello, "world"',start:'2026-11-20',due:'2026-11-22',labels:['Design'],listName:'Planning'}];
  assert.match(cardsToCsv(cards),/"Hello, ""world"""/);
  assert.match(cardsToIcs(cards),/DTSTART;VALUE=DATE:20261120/);
  assert.match(cardsToIcs(cards),/DTEND;VALUE=DATE:20261123/);
});
