import test from 'node:test';
import assert from 'node:assert/strict';
import { monthGrid, rangeDays, stepCursor, plannerCards, cardsForDay, schedulePatch, timeForDay } from '../src/features/planner/utils/plannerData.js';
import { dayKey } from '../src/features/views/utils/viewData.js';

test('month grid has six complete weeks and retains leap year dates', () => {
  const grid=monthGrid(new Date(2028,1,10));
  assert.equal(grid.length,42);
  assert.equal(grid[0].getDay(),0);
  assert.ok(grid.some(d=>dayKey(d)==='2028-02-29'));
});
test('day, week, custom and agenda ranges have correct lengths', () => {
  const anchor=new Date(2026,10,25);
  assert.equal(rangeDays('Day',anchor).length,1);
  assert.equal(rangeDays('Week',anchor).length,7);
  assert.equal(rangeDays('Custom',anchor,3).length,3);
  assert.equal(rangeDays('Agenda',anchor,3,14).length,14);
  assert.equal(dayKey(rangeDays('Week',anchor)[0]),'2026-11-22');
  assert.equal(dayKey(stepCursor(anchor,'Month',1)),'2026-12-25');
});
test('planner reads real dated cards, ignores archived items', () => {
  const lists=[{id:1,title:'To do',cards:[
    {id:10,title:'Event',due:'2026-11-25'},
    {id:11,title:'Range',start:'2026-11-23',due:'2026-11-27'},
    {id:12,title:'Old',due:'2026-11-25',archived:true},
  ]},{id:2,archived:true,cards:[{id:13,due:'2026-11-25'}]}];
  const cards=plannerCards(lists);
  assert.equal(cards.length,2);
  assert.deepEqual(cardsForDay(cards,new Date(2026,10,25)).map(c=>c.id),[10,11]);
});
test('scheduling preserves spans and dates, and updates timed events', () => {
  const target=new Date(2026,10,29);
  assert.deepEqual(schedulePatch({due:''},target),{due:'2026-11-29'});
  assert.deepEqual(schedulePatch({start:'2026-11-20',due:'2026-11-22'},target),{start:'2026-11-29',due:'2026-12-01'});
  assert.deepEqual(schedulePatch({due:'2026-11-22T14:45'},target),{due:'2026-11-29T14:45'});
  assert.deepEqual(schedulePatch({due:'2026-11-22T14:45'},target,9),{due:'2026-11-29T09:00'});
  assert.equal(timeForDay(target,17),'2026-11-29T17:00');
});
