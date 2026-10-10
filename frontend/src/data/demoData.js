export const columns = ["To Do", "In Progress", "Review", "Done"];
export const people = ["Asma", "Sarra", "Yassine", "Maha"];
export const initial = [
  ["Research user needs", "Research", "High", 0, 10, 0],
  ["Create wireframes", "Design", "Medium", 0, 12, 0],
  ["Define content structure", "Planning", "Low", 0, 15, 1],
  ["Design homepage", "Design", "High", 1, 14, 0],
  ["Develop components", "Development", "Medium", 1, 17, 2],
  ["Set up the database", "Development", "Medium", 1, 20, 1],
  ["UI kit and design system", "Design", "Medium", 2, 16, 2],
  ["Responsive design check", "Testing", "High", 2, 18, 3],
  ["Project kick-off", "Planning", "Low", 3, 5, 1],
  ["Team onboarding", "Management", "Low", 3, 7, 0],
  ["Create moodboard", "Design", "Low", 3, 9, 1],
].map((a, i) => ({
  id: i + 1,
  title: a[0],
  tag: a[1],
  priority: a[2],
  status: a[3],
  day: a[4],
  person: a[5],
  description: "Website Redesign · October sprint",
  comments: [3, 2, 1, 4, 3, 2, 3, 1, 0, 0, 0][i],
}));
