import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_WEIGHTS = {inbox: 1, planner: 1.1, board: 1.65};
const ORDER = ['inbox', 'planner', 'board'];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const STORAGE_KEY = 'flowe:workspace-pane-widths:v1';

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.fromEntries(ORDER.map(id => [id,
      Number.isFinite(saved[id]) && saved[id] > 0.1 && saved[id] < 10 ? saved[id] : DEFAULT_WEIGHTS[id]
    ]));
  } catch { return {...DEFAULT_WEIGHTS}; }
}

/** Resizable Inbox / Planner / Board columns, retaining the Flowe panel layout. */
export function useResizableWorkspace(visible) {
  const containerRef = useRef(null);
  const pointerRef = useRef(null);
  const [weights, setWeights] = useState(restore);
  const [resizing, setResizing] = useState(false);
  const ordered = useMemo(() => ORDER.filter(id => visible.includes(id)), [visible]);
  const weightsRef = useRef(weights);
  weightsRef.current = weights;

  const template = useCallback((values = weightsRef.current) => ordered.map((id, index) =>
    `${index ? '12px ' : ''}minmax(0, ${values[id]}fr)`
  ).join(' '), [ordered]);
  const columns = template(weights);

  const adjustPair = useCallback((leftId, rightId, delta, widths) => {
    const previous = widths || {
      left: containerRef.current?.querySelector(`.${leftId}-panel`)?.getBoundingClientRect().width || 300,
      right: containerRef.current?.querySelector(`.${rightId}-panel`)?.getBoundingClientRect().width || 300,
    };
    const total = previous.left + previous.right;
    const minimum = Math.min(260, Math.max(140, total * .25));
    const newLeft = clamp(previous.left + delta, minimum, total - minimum);
    const currentWeights = weightsRef.current;
    const combined = currentWeights[leftId] + currentWeights[rightId];
    const next = {...currentWeights,
      [leftId]: Math.max(.1, combined * newLeft / total),
      [rightId]: Math.max(.1, combined * (total - newLeft) / total),
    };
    weightsRef.current = next;
    containerRef.current?.style.setProperty('--flowe-panel-columns', template(next));
    return next;
  }, [template]);

  const persist = useCallback(next => {
    setWeights(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  }, []);

  const startResize = useCallback((event, leftId, rightId) => {
    if (event.button !== 0) return;
    const workspace = containerRef.current;
    const left = workspace?.querySelector(`.${leftId}-panel`);
    const right = workspace?.querySelector(`.${rightId}-panel`);
    if (!left || !right) return;
    event.preventDefault();
    const original = {...weightsRef.current};
    const widths = {left: left.getBoundingClientRect().width, right: right.getBoundingClientRect().width};
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const oldCursor = document.body.style.cursor;
    const oldSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    workspace.classList.add('is-resizing');
    setResizing(true);

    const move = e => {
      if (e.pointerId !== pointerId) return;
      adjustPair(leftId, rightId, e.clientX - startX, widths);
    };
    const clean = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', done);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('blur', cancel);
      document.body.style.cursor = oldCursor;
      document.body.style.userSelect = oldSelect;
      workspace.classList.remove('is-resizing');
      setResizing(false);
      pointerRef.current = null;
    };
    const done = e => {
      if (e.pointerId !== pointerId) return;
      clean();
      persist({...weightsRef.current});
    };
    const cancel = () => {
      clean();
      weightsRef.current = original;
      workspace.style.setProperty('--flowe-panel-columns', template(original));
      setWeights(original);
    };
    const keydown = e => { if (e.key === 'Escape') cancel(); };
    pointerRef.current = clean;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', done);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', keydown);
    window.addEventListener('blur', cancel);
  }, [adjustPair, persist, template]);

  const onResizeKeyDown = useCallback((event, leftId, rightId) => {
    if (!['ArrowLeft','ArrowRight','Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') {
      const next = {...weightsRef.current, [leftId]: DEFAULT_WEIGHTS[leftId], [rightId]: DEFAULT_WEIGHTS[rightId]};
      weightsRef.current = next;
      persist(next);
    } else {
      const next = adjustPair(leftId, rightId, event.key === 'ArrowLeft' ? -32 : 32);
      persist(next);
    }
  }, [adjustPair, persist]);
  const resetWidths = useCallback(() => persist({...DEFAULT_WEIGHTS}), [persist]);

  useEffect(() => () => { pointerRef.current?.(); }, []);
  return {containerRef, ordered, columns, resizing, startResize, onResizeKeyDown, resetWidths};
}
