import { motion } from "motion/react";
import { MENU_ANIM } from "../constants/workspace";

export function IconButton({ Icon, label, onClick, className = "", pressed }) {
  return (
    <button
      type="button"
      className={`fw-icon-button ${className}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
    >
      <Icon size={17} />
    </button>
  );
}

export function PanelChrome({
  icon: Icon,
  eyebrow,
  title,
  accent,
  actions,
  children,
  className = "",
}) {
  return (
    <motion.section
      layout
      className={`bloom-panel ${className}`}
      data-accent={accent}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
    >
      <div className="bloom-panel-glow" />
      <header className="bloom-panel-header">
        <div className="bloom-panel-title">
          <span className="bloom-panel-symbol">
            <Icon size={18} />
          </span>
          <div>
            <span>{eyebrow}</span>
            <strong>{title}</strong>
          </div>
        </div>
        <div className="bloom-panel-actions">{actions}</div>
      </header>
      {children}
    </motion.section>
  );
}

export function Menu({ className = "", children }) {
  return (
    <motion.div className={`fw-local-menu ${className}`} {...MENU_ANIM}>
      {children}
    </motion.div>
  );
}

export function GardenMetric({ value, label }) {
  return (
    <div className="fw-garden-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

