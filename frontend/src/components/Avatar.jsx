import { people } from "../data/demoData";
export default function Avatar({ person = 0, small = false }) {
  return (
    <span
      className={"avatar a" + person + (small ? " small" : "")}
      title={people[person]}
    >
      {["AS", "SZ", "YB", "MH"][person]}
    </span>
  );
}
