// Persisted, named colors used across Kanban, table, timeline and charts.
// Names must also be allowed by backend/models/Project.js.
export const LIST_COLORS = [
  ['neutral', '#e9e5eb'], ['lav', '#c7a8eb'], ['lilac', '#dac1f4'],
  ['violet', '#a68fd7'], ['plum', '#c19cbf'], ['pink', '#f5a8c9'],
  ['rose', '#ed91b4'], ['coral', '#f2a0a1'], ['red', '#e98e91'],
  ['peach', '#f3b99c'], ['orange', '#efb170'], ['yellow', '#efcc73'],
  ['lemon', '#eedf99'], ['mint', '#a2d9c1'], ['sage', '#a8c6a1'],
  ['teal', '#93d2c9'], ['blue', '#92bfe9'], ['sky', '#a1cfec'],
  ['slate', '#aeb6ce'], ['sand', '#d5bba8'],
];
export const listColor = value => LIST_COLORS.find(x => x[0] === value)?.[1] || LIST_COLORS[0][1];
