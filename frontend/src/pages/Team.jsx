import { useFlowe } from "../context/FloweContext";
import { people } from "../data/demoData";
import Avatar from "../components/Avatar";
export default function Team() {
  const { tasks } = useFlowe();
  return (
    <div className="team-grid">
      {people.map((p, i) => (
        <section className="panel member" key={p}>
          <Avatar person={i} />
          <h3>{p}</h3>
          <p>
            {
              [
                "Product Designer",
                "UX Designer",
                "Developer",
                "Project Manager",
              ][i]
            }
          </p>
          <span className="status-online">● Available</span>
          <p>{tasks.filter((t) => t.person === i).length} assigned tasks</p>
        </section>
      ))}
    </div>
  );
}
