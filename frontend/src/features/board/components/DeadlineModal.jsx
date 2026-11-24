import { Modal } from '../../../components/ui/Modal';

export default function DeadlineModal({calendarOpen, setCalendarOpen, lists, setSelected}) {
  return (
<>
{calendarOpen && (
        <Modal
          title="A little clarity ahead"
          kicker="DEADLINES & DEPENDENCIES"
          close={() => setCalendarOpen(false)}
        >
          <div className="at-body">
            {lists
              .flatMap((l) => l.cards.map((c) => ({ ...c, listId: l.id })))
              .filter((c) => c.due && !c.archived)
              .sort((a, b) => a.due.localeCompare(b.due))
              .map((c) => (
                <div className="at-row" key={c.id}>
                  <span>
                    {c.title}
                    <small>
                      {c.due} ·{" "}
                      {c.completed
                        ? "Completed"
                        : c.due < new Date().toLocaleDateString("en-CA")
                          ? "Overdue"
                          : "Upcoming"}
                      {c.dependencies?.length
                        ? " · " + c.dependencies.length + " prerequisites"
                        : ""}
                    </small>
                  </span>
                  <button
                    onClick={() => {
                      setCalendarOpen(false);
                      setSelected(c);
                    }}
                  >
                    Open
                  </button>
                </div>
              ))}
            {!lists.some((l) => l.cards.some((c) => c.due && !c.archived)) && (
              <p className="at-empty">
                Add a deadline to a card and it will appear here.
              </p>
            )}
          </div>
        </Modal>
      )}
</>
  );
}
