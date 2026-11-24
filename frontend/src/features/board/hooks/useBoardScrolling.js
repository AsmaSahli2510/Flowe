import { useCallback, useEffect, useRef, useState } from 'react';

/** Horizontal track panning. Pinned lists live outside this scroller. */
export function useBoardScrolling(dependencies = []) {
  const scrollRef = useRef(null);
  const panRef = useRef(null);
  const [edges, setEdges] = useState({left: false, right: false});
  const updateEdges = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const next = {
      left: node.scrollLeft > 2,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 2,
    };
    setEdges(old => old.left === next.left && old.right === next.right ? old : next);
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null;
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    window.addEventListener('resize', updateEdges);
    const id = requestAnimationFrame(updateEdges);
    return () => { observer?.disconnect(); window.removeEventListener('resize', updateEdges); cancelAnimationFrame(id); };
  }, [updateEdges, ...dependencies]);
  const scrollByPage = useCallback(direction => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({left: direction * Math.max(260, el.clientWidth * 0.7), behavior: 'smooth'});
  }, []);
  const onWheel = useCallback(event => {
    // Trackpads scroll natively. Shift + mouse wheel pans like a horizontal wheel.
    if (!event.shiftKey || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (scrollRef.current?.scrollWidth <= scrollRef.current?.clientWidth) return;
    event.preventDefault();
    scrollRef.current.scrollLeft += event.deltaY;
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // React's wheel listeners may be passive; preventDefault needs a native listener.
    el.addEventListener('wheel', onWheel, {passive:false});
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);
  const onPointerDown = useCallback(event => {
    if (event.button !== 0 || event.target.closest('button, input, textarea, select, a, .kb-list, .kb-new-list, .kb-add-list')) return;
    const el = scrollRef.current;
    if (!el) return;
    // Preserve the ability to drag the browser's native horizontal scrollbar.
    if (el.scrollWidth > el.clientWidth && event.clientY >= el.getBoundingClientRect().bottom - 14) return;
    panRef.current = {pointerId: event.pointerId, x: event.clientX, scrollLeft: el.scrollLeft};
    el.setPointerCapture?.(event.pointerId);
    el.classList.add('is-panning');
  }, []);
  const onPointerMove = useCallback(event => {
    if (!panRef.current || panRef.current.pointerId !== event.pointerId) return;
    const el = scrollRef.current;
    if (el) el.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.x);
  }, []);
  const finishPan = useCallback(event => {
    if (!panRef.current || (event && panRef.current.pointerId !== event.pointerId)) return;
    panRef.current = null;
    scrollRef.current?.classList.remove('is-panning');
  }, []);
  return {scrollRef, edges, updateEdges, scrollByPage, onWheel, onPointerDown, onPointerMove, finishPan};
}
