import { CalendarDays, Clock } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import Avatar from "./Avatar";
import CalendarWidget from "./CalendarWidget";
export default function RightSidebar() {
  const { tasks, setPage, setTab, setModal, setSelected, setToast } =
    useFlowe();
  return (
    <aside className="rightbar">
      {<CalendarWidget />}
      <section className="panel today">
        <div className="panel-heading">
          <b>
            Today <span>3</span>
          </b>
          <button
            onClick={() => {
              setPage("My Tasks");
              setTab("Board");
            }}
          >
            View all
          </button>
        </div>
        {[
          ["Design homepage", "10:00 – 12:00", "High", 0],
          ["Team meeting", "14:00 – 15:00", "Meeting", 2],
          ["Review UI components", "16:00 – 17:00", "Medium", 3],
        ].map(([n, time, tag, p], i) => (
          <div className="today-item" key={n}>
            <button
              aria-label={"Open " + n}
              className="check"
              onClick={() => {
                const task = tasks.find((t) => t.id === [4, 9, 7][i]);
                if (task)
                  setModal({
                    ...task,
                  });
                else setToast("This task has been deleted");
              }}
            />
            <div>
              <b>{n}</b>
              <small>
                <Clock size={11} />
                {time}
                <em className={tag.toLowerCase()}>{tag}</em>
              </small>
            </div>
            <Avatar person={p} small />
          </div>
        ))}
      </section>
      <section className="panel activity">
        <div className="panel-heading">
          <b>Team Activity</b>
          <button onClick={() => setPage("Messages")}>View all</button>
        </div>
        {[
          ["Sarra", "moved a task to", "Review", "2 min ago", 1],
          ["Yassine", "completed", "Wireframes", "15 min ago", 2],
          ["Maha", "added a comment", "", "1 hour ago", 3],
        ].map(([n, a, b, t, p]) => (
          <div className="activity-item" key={n}>
            <Avatar person={p} />
            <div>
              <p>
                <b>{n}</b> {a} <strong>{b}</strong>
              </p>
              <small>{t}</small>
            </div>
          </div>
        ))}
      </section>
      <section className="panel events">
        <div className="panel-heading">
          <b>Upcoming Events</b>
          <button
            onClick={() => {
              setPage("Calendar");
              setTab("Calendar");
            }}
          >
            View all
          </button>
        </div>
        {[
          ["Team sync", "Today, 14:00 – 15:00", "pink"],
          ["Client presentation", "Oct 16, 10:00 – 11:00", "purple"],
        ].map(([n, t, c]) => (
          <button
            className="event"
            key={n}
            onClick={() => {
              setPage("Calendar");
              setTab("Calendar");
              setSelected(n === "Team sync" ? 10 : 16);
            }}
          >
            <span className={c}>
              <CalendarDays size={17} />
            </span>
            <div>
              <b>{n}</b>
              <small>{t}</small>
            </div>
          </button>
        ))}
      </section>
    </aside>
  );
}
