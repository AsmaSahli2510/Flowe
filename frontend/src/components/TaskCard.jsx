import {
  CalendarDays,
  MessageCircle,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import Avatar from "./Avatar";
export default function TaskCard({ task: t }) {
  const { setModal, move } = useFlowe();
  return (
    <article
      key={t.id}
      className="task"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(t.id))}
      onClick={() =>
        setModal({
          ...t,
        })
      }
      tabIndex="0"
      onKeyDown={(e) =>
        e.key === "Enter" &&
        setModal({
          ...t,
        })
      }
    >
      <div className="task-title">
        <button
          className={"check " + (t.status === 3 ? "checked" : "")}
          aria-label="Toggle task completion"
          onClick={(e) => {
            e.stopPropagation();
            move(t.id, t.status === 3 ? 0 : 3);
          }}
        >
          {t.status === 3 && <Check size={12} />}
        </button>
        <strong>{t.title}</strong>
        <MoreHorizontal size={14} className="dots" />
      </div>
      {t.id === 4 && (
        <div className="mini-design">
          <span />
          <span />
          <span />
          <i>flowe</i>
          <b>
            Make room
            <br />
            for great ideas.
          </b>
        </div>
      )}
      {t.id === 7 && (
        <div className="mini-palette">
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
      <div className="tags">
        <span className={t.tag.toLowerCase()}>{t.tag}</span>
        {t.status === 0 && (
          <span className={t.priority.toLowerCase()}>{t.priority}</span>
        )}
      </div>
      <footer>
        <Avatar person={t.person} small />
        <span>
          <CalendarDays size={11} /> Oct {t.day}
        </span>
        <span className="comments">
          <MessageCircle size={12} />
          {t.comments || ""}
        </span>
      </footer>
    </article>
  );
}
