import { useFlowe } from "../context/FloweContext";
import { people } from "../data/demoData";
import Avatar from "../components/Avatar";
export default function Messages() {
  const { setToast } = useFlowe();
  return (
    <section className="panel overview">
      <h2>Team messages</h2>
      {[
        "The new wireframes are ready for review.",
        "Great work on the design system!",
        "See you at the team sync at 14:00.",
      ].map((m, i) => (
        <div className="message" key={m}>
          <Avatar person={i + 1} />
          <div>
            <b>{people[i + 1]}</b>
            <p>{m}</p>
          </div>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const inp = e.currentTarget.elements.message;
          if (inp.value.trim()) {
            setToast("Message saved in this demo");
            inp.value = "";
          }
        }}
      >
        <input name="message" required placeholder="Write a message..." />
        <button className="create">Send</button>
      </form>
    </section>
  );
}
