import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
export default function CalendarWidget({ full = false }) {
  const { month, setMonth, tasks, selected, setSelected, setModal } =
    useFlowe();
  let first = new Date(2026, month, 1).getDay();
  first = (first + 6) % 7;
  let days = new Date(2026, month + 1, 0).getDate();
  return (
    <section className={"panel calendar " + (full ? "full-calendar" : "")}>
      <div className="panel-heading">
        <b>
          {new Date(2026, month).toLocaleString("en", {
            month: "long",
          })}{" "}
          {new Date(2026, month).getFullYear()}
        </b>
        <div>
          <button
            aria-label="Previous month"
            onClick={() => setMonth(month - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button aria-label="Next month" onClick={() => setMonth(month + 1)}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <label key={d}>{d}</label>
        ))}
        {Array.from(
          {
            length: first,
          },
          (_, i) => (
            <span key={"blank" + i} />
          ),
        )}
        {Array.from(
          {
            length: days,
          },
          (_, i) => {
            let day = i + 1;
            let ts = month === 9 ? tasks.filter((t) => t.day === day) : [];
            return (
              <button
                key={day}
                onClick={() => setSelected(day)}
                className={
                  (selected === day ? "selected " : "") +
                  ([6, 14, 23].includes(day) ? "date-color date-" + day : "")
                }
              >
                <span>{day}</span>
                {full &&
                  ts.map((t) => (
                    <em
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({
                          ...t,
                        });
                      }}
                      key={t.id}
                    >
                      {t.title}
                    </em>
                  ))}
              </button>
            );
          },
        )}
      </div>
    </section>
  );
}
