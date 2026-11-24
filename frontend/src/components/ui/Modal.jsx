import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ title, kicker, close, children, wide = false }) {
  useEffect(() => {
    const f = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [close]);
  return (
    <div
      className="at-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        className={"at-modal " + (wide ? "at-wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <small>{kicker || "FLOWE · ATELIER"}</small>
            <h2>{title}</h2>
          </div>
          <button aria-label="Close" onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
