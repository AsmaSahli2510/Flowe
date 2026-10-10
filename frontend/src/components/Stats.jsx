import { ListTodo, Users, ArrowUpRight } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import Avatar from "./Avatar";
function CircleIcon() {
  return <span className="circle-icon">◌</span>;
}
export default function Stats() {
  const { tasks, setPage } = useFlowe();
  return (
    <div className="stats">
      {[
        [ListTodo, tasks.length + 1, "Tasks due this week", "pink"],
        [
          CircleIcon,
          tasks.filter((t) => t.status === 1).length + 1,
          "In progress",
          "yellow",
        ],
        [Users, 8, "Team members", "purple"],
        [ArrowUpRight, "68%", "Project progress", "green"],
      ].map(([I, v, l, c], i) => (
        <div className={"stat " + c} key={l}>
          <span className="stat-icon">
            <I size={24} />
          </span>
          <div>
            <strong>{v}</strong>
            <small>{l}</small>
            {i === 2 ? (
              <div className="tiny-avatars">
                {[0, 1, 2].map((p) => (
                  <Avatar key={p} person={p} small />
                ))}
                <button onClick={() => setPage("Team")}>+</button>
              </div>
            ) : (
              <div className="bar">
                <i
                  style={{
                    width: [45, 68, 0, 68][i] + "%",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
