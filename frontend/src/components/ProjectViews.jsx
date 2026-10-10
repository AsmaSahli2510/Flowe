import {
  CalendarDays,
  Files,
  ChartNoAxesColumn,
  Plus,
  MoreHorizontal,
  SlidersHorizontal,
  ArrowUpRight,
  LayoutGrid,
  PanelTop,
} from "lucide-react";
import { useFlowe } from "../context/FloweContext";
import { columns } from "../data/demoData";
import TaskCard from "./TaskCard";
import CalendarWidget from "./CalendarWidget";
import FilesPanel from "./FilesPanel";
export default function ProjectViews() {
  const {
    tasks,
    tab,
    setTab,
    setModal,
    filter,
    setFilter,
    high,
    setHigh,
    workspace,
    visible,
    done,
    move,
    create,
  } = useFlowe();
  return (
    <>
      <div className="tabs">
        <div>
          {[
            ["Board", LayoutGrid],
            ["Timeline", ChartNoAxesColumn],
            ["Calendar", CalendarDays],
            ["Files", Files],
            ["Overview", PanelTop],
          ].map(([n, I]) => (
            <button
              className={tab === n ? "current" : ""}
              key={n}
              onClick={() => setTab(n)}
            >
              <I size={14} />
              {n}
            </button>
          ))}
        </div>
        <button
          className={high ? "filter-enabled" : ""}
          onClick={() => setFilter(!filter)}
        >
          <SlidersHorizontal size={14} />
          Filter
        </button>
      </div>
      {filter && (
        <div className="filter-box">
          <label>
            <input
              type="checkbox"
              checked={high}
              onChange={(e) => setHigh(e.target.checked)}
            />{" "}
            High priority only
          </label>
          <button
            onClick={() => {
              setHigh(false);
              setFilter(false);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {tab === "Board" ? (
        <>
          <div className="board">
            {columns.map((c, i) => (
              <section
                className={"column col" + i}
                key={c}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  move(Number(e.dataTransfer.getData("text/plain")), i);
                }}
              >
                <div className="column-title">
                  <b>{c}</b>
                  <span>{visible.filter((t) => t.status === i).length}</span>
                  <MoreHorizontal size={18} />
                </div>
                {visible
                  .filter((t) => t.status === i)
                  .map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                <button className="add-task" onClick={() => create(i)}>
                  <Plus size={17} />
                  Add a task
                </button>
              </section>
            ))}
          </div>
          <div className="bottom-row">
            <p className="board-hint">
              Drag tasks between columns to update your workflow.
            </p>
            <section className="panel progress-panel">
              <b>Project Progress</b>
              <div>
                <div className="donut">
                  <span>68%</span>
                </div>
                <ul>
                  {columns.map((n, i) => (
                    <li key={n}>
                      <i className={"dot" + i} />
                      {n}
                      <strong>
                        {tasks.filter((t) => t.status === i).length}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </>
      ) : tab === "Calendar" ? (
        <CalendarWidget full />
      ) : tab === "Timeline" ? (
        <section className="panel timeline">
          <h3>October sprint</h3>
          {visible.map((t) => (
            <div
              key={t.id}
              onClick={() =>
                setModal({
                  ...t,
                })
              }
            >
              <span>{t.title}</span>
              <section>
                <i
                  style={{
                    marginLeft: (t.day - 5) * 3 + "%",
                    width: "24%",
                    background: ["#ffc7dc", "#ffe39b", "#d6c6fa", "#bdebc0"][
                      t.status
                    ],
                  }}
                >
                  Oct {t.day} · {columns[t.status]}
                </i>
              </section>
            </div>
          ))}
        </section>
      ) : tab === "Files" ? (
        <FilesPanel />
      ) : (
        <section className="panel overview">
          <h2>{workspace}</h2>
          <p>
            A collaborative workspace for designing a better digital experience.
          </p>
          <h3>Our workflow</h3>
          <p>Research → Design → Development → Review → Launch</p>
          <p>
            {done} of {tasks.length} tasks completed. Next milestone: client
            presentation, October 16.
          </p>
          <button className="create" onClick={() => setTab("Board")}>
            Open board <ArrowUpRight size={16} />
          </button>
        </section>
      )}
    </>
  );
}
