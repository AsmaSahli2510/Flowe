import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runTimedRule } from '../services/boardAutomation.js';

const board = () => [
  { id: 'todo', title: 'To do', cards: [
    { id: 1, title: 'Later', due: '2026-12-03', labels: [] },
    { id: 2, title: 'Soon', due: '2026-12-01', labels: [] }
  ] }
];

test('weekly deadline sort keeps early cards first', () => {
  const lists = board();
  runTimedRule(lists, { trigger: 'weekly', action: 'sort', targetList: 'todo' }, new Date('2026-11-30T08:00:00Z'));
  assert.deepEqual(lists[0].cards.map(c => c.id), [2, 1]);
});

test('deadline reminders are notification-only and never mutate card state', () => {
  const lists = board();
  const before = structuredClone(lists);
  runTimedRule(lists, { trigger: 'due', action: 'remind', daysBefore: 1 }, new Date('2026-11-30T09:00:00Z'));
  assert.deepEqual(lists, before);
});
