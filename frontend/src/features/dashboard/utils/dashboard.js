export const timeLabel = (value) => {
  if (!value) return "Recently";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const diff = Math.max(0, Date.now() - time);
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};
export const totalCards = (project) =>
  (project.lists || []).flatMap((list) => list.cards || []);
export const projectProgress = (project) => {
  const cards = totalCards(project);
  if (!cards.length) return null;
  return Math.round(
    (cards.filter((c) => c.completed).length * 100) / cards.length,
  );
};
export const accent = ["lavender", "mint", "butter", "pink"];
export const initials = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0] || "")
    .join("")
    .toUpperCase();
