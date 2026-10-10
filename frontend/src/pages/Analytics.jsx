import { useFlowe } from "../context/FloweContext";
import { columns } from "../data/demoData";
export default function Analytics() {
  const { tasks, done } = useFlowe();
  return (
    <section className="panel overview">
      <h2>Team performance</h2>
      {columns.map((c, i) => (
        <div className="analytic" key={c}>
          <span>{c}</span>
          <div>
            <i
              style={{
                width:
                  (tasks.filter((t) => t.status === i).length / tasks.length) *
                    100 +
                  "%",
                background: ["#ffafca", "#ffd362", "#bfa5f7", "#9ed27b"][i],
              }}
            />
          </div>
          <b>{tasks.filter((t) => t.status === i).length}</b>
        </div>
      ))}
      <p>{Math.round((done / tasks.length) * 100)}% of tasks completed</p>
    </section>
  );
}
