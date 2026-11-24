import { ArrowRight, Inbox } from "lucide-react";
import logo from "../../../assets/images/logoTransparent.png";

export function Flower({ size = 32 }) {
  return (
    <img className="fd-flower" src={logo} width={size} height={size} alt="" />
  );
}
export function Panel({ title, action, onAction, children, className = "" }) {
  return (
    <section className={`fd-panel ${className}`}>
      <header className="fd-panel-head">
        <h2>{title}</h2>
        {action && (
          <button type="button" className="fd-link" onClick={onAction}>
            {action}
            <ArrowRight size={16} />
          </button>
        )}
      </header>
      {children}
    </section>
  );
}
export function EmptyNote({
  icon: Icon = Inbox,
  title,
  description,
  action,
  onAction,
}) {
  return (
    <div className="fd-empty-note">
      <span className="fd-empty-icon">
        <Icon size={20} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action && (
        <button className="fd-small-action" onClick={onAction}>
          {action}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
