import { Inbox, CalendarDays, Columns3 } from "lucide-react";

export const VIEW_META = {
  inbox: {
    label: "Inbox",
    Icon: Inbox,
    color: "pink",
    note: "Catch what matters",
  },
  planner: {
    label: "Planner",
    Icon: CalendarDays,
    color: "yellow",
    note: "Shape your time",
  },
  board: {
    label: "Board",
    Icon: Columns3,
    color: "lavender",
    note: "Grow the work",
  },
};

export const PETAL_POSITIONS = [
  { x: -118, y: -54, rotate: -56, delay: 0.09 },
  { x: -46, y: -122, rotate: -18, delay: 0.035 },
  { x: 46, y: -122, rotate: 18, delay: 0.035 },
  { x: 118, y: -54, rotate: 56, delay: 0.09 },
];

export const ATMOSPHERES = ["soft", "paper", "blush", "meadow", "lilac", "night"];

export const MENU_ANIM = {
  initial: { opacity: 0, y: 7, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 5, scale: 0.98 },
  transition: { duration: 0.16 },
};

