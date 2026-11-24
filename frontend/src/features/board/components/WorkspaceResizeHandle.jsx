import { GripVertical } from 'lucide-react';

/** Drag a divider between adjacent workspace panels; double click to reset. */
export default function WorkspaceResizeHandle({left, right, onPointerDown, onKeyDown, onReset}) {
  return <div
    className="fw-workspace-resizer"
    role="separator"
    tabIndex={0}
    aria-label={`Resize ${left} and ${right} panels`}
    aria-orientation="vertical"
    title="Drag to resize panels · Double-click to reset · Arrow keys"
    onPointerDown={event => onPointerDown(event, left, right)}
    onKeyDown={event => onKeyDown(event, left, right)}
    onDoubleClick={onReset}
  >
    <span className="fw-workspace-resizer-grip"><GripVertical size={18}/></span>
  </div>;
}
