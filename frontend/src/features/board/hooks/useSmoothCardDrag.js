import { useCallback, useEffect, useRef, useState } from 'react';

const START_DISTANCE = 6;
const EDGE = 55;
const limit = (value, min, max) => Math.min(max, Math.max(min, value));
const sameId = (a, b) => String(a) === String(b);

/**
 * Pointer-based sortable cards: a compositor-driven preview, live insertion marker,
 * edge auto-scroll and one persistent move at drop. No dependency on native HTML5
 * drag images (which jump and don't behave consistently inside scroll containers).
 */
export function useSmoothCardDrag({ lists, filterCards, readOnly, onMoveCard, scrollRef }) {
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const cleanupRef = useRef(null);
  const clickBlockUntil = useRef(0);
  const listsRef = useRef(lists);
  const filterRef = useRef(filterCards);
  const moveRef = useRef(onMoveCard);
  listsRef.current = lists;
  filterRef.current = filterCards;
  moveRef.current = onMoveCard;

  const stop = useCallback((commit = false) => {
    const session = dragRef.current;
    if (!session) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (session.raf) cancelAnimationFrame(session.raf);
    session.ghost?.remove();
    session.plannerNode?.classList.remove('fgp-cross-drop-hover');
    document.body.classList.remove('kb-card-is-dragging');
    dragRef.current = null;
    setDrag(null);
    if (!session.active) return;

    clickBlockUntil.current = Date.now() + 180;
    if (!commit) return;
    // Planner and Board may be side by side. Dropping a smooth-drag card on
    // any planner day/hour schedules it without moving it between lists.
    if(session.plannerTarget){
      window.dispatchEvent(new CustomEvent('flowe-planner-drop',{detail:{cardId:session.cardId,...session.plannerTarget}}));
      return;
    }
    if (!session.target) return;
    const { listId, beforeId } = session.target;
    const origin = listsRef.current.find(list => sameId(list.id, session.sourceList));
    const sourceCards = origin ? filterRef.current(origin).filter(c => !c.archived) : [];
    const originalIndex = sourceCards.findIndex(c => sameId(c.id, session.cardId));
    const originalNext = sourceCards[originalIndex + 1]?.id ?? null;
    const unchanged = sameId(session.sourceList, listId) &&
      (beforeId === originalNext || (beforeId == null && originalNext == null));
    if (!unchanged) moveRef.current(session.cardId, listId, beforeId);
  }, []);

  useEffect(() => () => {
    // On navigation/unmount, remove window listeners and any drag preview.
    cleanupRef.current?.();
    if (dragRef.current?.raf) cancelAnimationFrame(dragRef.current.raf);
    dragRef.current?.ghost?.remove();
    dragRef.current?.plannerNode?.classList.remove('fgp-cross-drop-hover');
    document.body.classList.remove('kb-card-is-dragging');
  }, []);

  const onPointerDown = useCallback((event, card, list) => {
    if (readOnly || event.button !== 0 || dragRef.current ||
      event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const session = {
      cardId: card.id, sourceList: list.id, pointerId: event.pointerId,
      initialX: event.clientX, initialY: event.clientY,
      x: event.clientX, y: event.clientY,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      rect, element, active: false, raf: null, ghost: null, target: null,
      plannerNode:null, plannerTarget:null,
    };
    dragRef.current = session;

    const findTarget = () => {
      const currentLists = listsRef.current.filter(l => !l.archived);
      const elements = Array.from(document.querySelectorAll('[data-kb-list-id]'));
      let nearest = null;
      let distance = Infinity;
      for (const item of elements) {
        const bounds = item.getBoundingClientRect();
        // Ignore geometrically nearby cards which are clipped by a scroller.
        // They must never receive a drop under a pinned list.
        const viewport = item.closest('.kb-scrolling-region-scroll, .kb-pinned-region');
        const clip = viewport?.getBoundingClientRect();
        if (clip && (bounds.right <= clip.left || bounds.left >= clip.right ||
            session.x < clip.left || session.x > clip.right)) continue;
        const left = Math.max(bounds.left, clip?.left ?? bounds.left);
        const right = Math.min(bounds.right, clip?.right ?? bounds.right);
        const gap = session.x < left ? left - session.x :
          session.x > right ? session.x - right : 0;
        if (gap > 40 || session.y < bounds.top - 45 || session.y > bounds.bottom + 75) continue;
        if (gap < distance) { distance = gap; nearest = item; }
      }
      if (!nearest) return null;
      const targetList = currentLists.find(l => sameId(l.id, nearest.dataset.kbListId));
      if (!targetList) return null;

      const cards = filterRef.current(targetList).filter(c => !c.archived && !sameId(c.id, session.cardId));
      const knownIds = new Map(cards.map(card => [String(card.id), card.id]));
      let beforeId = null;
      // Read each card rect once per frame; avoids O(cards^2) DOM queries.
      for (const node of nearest.querySelectorAll('[data-kb-card-id]')) {
        const actualId = knownIds.get(node.dataset.kbCardId);
        if (actualId === undefined) continue;
        const bounds = node.getBoundingClientRect();
        if (session.y < bounds.top + bounds.height / 2) {
          beforeId = actualId;
          break;
        }
      }
      return { listId: targetList.id, beforeId };
    };

    const frame = () => {
      session.raf = null;
      if (!session.active) return;
      session.ghost.style.transform = `translate3d(${session.x - session.offsetX}px, ${session.y - session.offsetY}px, 0) rotate(2deg) scale(1.025)`;

      let autoScrolling = false;
      // Auto-pan only the unpinned track. The pinned lane never shifts.
      const scroller = scrollRef.current;
      if (scroller) {
        const b = scroller.getBoundingClientRect();
        if (session.y >= b.top && session.y <= b.bottom &&
            session.x >= b.left && session.x <= b.right) {
          let speed = 0;
          if (session.x < b.left + EDGE) speed = -limit((b.left + EDGE - session.x) / EDGE, 0, 1) * 19;
          else if (session.x > b.right - EDGE) speed = limit((session.x - (b.right - EDGE)) / EDGE, 0, 1) * 19;
          if (Math.abs(speed) > 0.1 && scroller.scrollWidth > scroller.clientWidth) {
            const previous = scroller.scrollLeft;
            scroller.scrollLeft += speed;
            autoScrolling ||= scroller.scrollLeft !== previous;
          }
        }
      }

      const hovered = document.elementFromPoint(session.x, session.y)?.closest('[data-kb-list-id]');
      const stack = hovered?.querySelector('.kb-card-stack');
      if (stack) {
        const b = stack.getBoundingClientRect();
        if (session.y >= b.top - 16 && session.y <= b.bottom + 16) {
          let speed = 0;
          if (session.y < b.top + EDGE) speed = -13 * limit((b.top + EDGE - session.y) / EDGE, 0, 1);
          if (session.y > b.bottom - EDGE) speed = 13 * limit((session.y - (b.bottom - EDGE)) / EDGE, 0, 1);
          if (Math.abs(speed) > 0.1 && stack.scrollHeight > stack.clientHeight) {
            const previous = stack.scrollTop;
            stack.scrollTop += speed;
            autoScrolling ||= stack.scrollTop !== previous;
          }
        }
      }
      // elementFromPoint still sees the planner because the preview has
      // pointer-events:none. Highlight its date cell during cross-panel drag.
      const dayNode=document.elementFromPoint(session.x,session.y)?.closest('[data-fgp-drop-date]');
      if(dayNode!==session.plannerNode){
        session.plannerNode?.classList.remove('fgp-cross-drop-hover');
        dayNode?.classList.add('fgp-cross-drop-hover');
        session.plannerNode=dayNode||null;
      }
      session.plannerTarget=dayNode?{
        date:dayNode.dataset.fgpDropDate,
        hour:dayNode.dataset.fgpDropHour ?? null,
      }:null;
      const destination = session.plannerTarget ? null : findTarget();
      if (destination && (!session.target || !sameId(destination.listId, session.target.listId) || destination.beforeId !== session.target.beforeId)) {
        session.target = destination;
        const next = { cardId: session.cardId, height: session.rect.height, ...destination };
        setDrag(next);
      }
      // Keep ticking only while actually auto-scrolling. Otherwise render
      // frames on pointer moves instead of burning 60 layout reads per second.
      if (autoScrolling) session.raf = requestAnimationFrame(frame);
    };

    const move = e => {
      if (e.pointerId !== session.pointerId) return;
      session.x = e.clientX;
      session.y = e.clientY;
      if (!session.active) {
        if (Math.hypot(session.x - session.initialX, session.y - session.initialY) < START_DISTANCE) return;
        session.active = true;
        session.ghost = session.element.cloneNode(true);
        session.ghost.removeAttribute('id');
        session.ghost.setAttribute('aria-hidden', 'true');
        session.ghost.setAttribute('inert', '');
        session.ghost.classList.add('kb-drag-ghost');
        session.ghost.style.width = `${session.rect.width}px`;
        document.body.appendChild(session.ghost);
        document.body.classList.add('kb-card-is-dragging');
        const source = listsRef.current.find(l => sameId(l.id, session.sourceList));
        const sourceCards = source ? filterRef.current(source) : [];
        const nextId = sourceCards[sourceCards.findIndex(c => sameId(c.id, session.cardId)) + 1]?.id ?? null;
        session.target = { listId: session.sourceList, beforeId: nextId };
        const next = {cardId: session.cardId, height: session.rect.height, ...session.target};
        setDrag(next);
        // A drag is not a card click, including when released over the original card.
        clickBlockUntil.current = Date.now() + 180;
      }
      e.preventDefault();
      if (!session.raf) session.raf = requestAnimationFrame(frame);
    };
    const up = e => { if (e.pointerId === session.pointerId) stop(true); };
    const cancel = () => stop(false);
    const escape = e => { if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
    const clean = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', escape);
    };
    cleanupRef.current = clean;
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', escape);
  }, [readOnly, scrollRef, stop]);

  const shouldIgnoreClick = useCallback(() => Date.now() < clickBlockUntil.current, []);
  return { drag, onPointerDown, shouldIgnoreClick, cancelDrag: () => stop(false) };
}
