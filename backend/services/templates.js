const definitions = [
  {
    id: "study",
    name: "Study garden",
    eyebrow: "LEARN · PRACTICE · REMEMBER",
    description: "Turn a big subject into small, steady progress.",
    color: "#dcccf7",
    columns: ["Resources", "To learn", "Practising", "Mastered"],
  },
  {
    id: "scrum",
    name: "Scrum workflow",
    eyebrow: "PLAN · FOCUS · DELIVER",
    description: "A clear home for your team’s next sprint.",
    color: "#beedd0",
    columns: [
      "Product backlog",
      "Sprint backlog",
      "In progress",
      "Review",
      "Done",
    ],
  },
  {
    id: "blank",
    name: "Clean soil",
    eyebrow: "YOUR SPACE · YOUR RHYTHM",
    description: "Start empty and build your own way of working.",
    color: "#ffe18b",
    columns: [],
  },
];
export const templates = definitions;
export function templateLists(id, columns = []) {
  const titles =
    id === "custom" ? columns : definitions.find((t) => t.id === id)?.columns;
  if (!titles) return null;
  return titles.map((title, i) => ({
    id: i + 1,
    title,
    color: ["lav", "yellow", "mint", "neutral"][i % 4],
    cards: [],
  }));
}
