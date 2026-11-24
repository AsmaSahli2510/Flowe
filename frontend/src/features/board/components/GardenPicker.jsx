import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CalendarDays, Leaf, PanelLeftClose, Pin, Plus, Search, Settings, Table2, Users, X } from 'lucide-react';
import { IconButton } from './WorkspacePrimitives';
import logo from '../../../assets/images/logoTransparent.png';

export default function GardenPicker({gardenOpen, setGardenOpen, gardenPinned, setGardenPinned, notify, gardenSearch, setGardenSearch, filteredBoards, boards, boardIndex, changeBoard, openGardenCreator, boardStats, visible, setVisible, setPlannerMode, shareBoard, manageMembers, setBoardView, activeBoard, theme, setTheme}) {
  return (
<AnimatePresence>
        {gardenOpen && (
          <motion.div
            className="fw-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) =>
              event.target === event.currentTarget && setGardenOpen(false)
            }
          >
            <motion.div
              className="fw-garden-modal"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              <div className="fw-garden-modal-top">
                <div>
                  <span className="fw-modal-kicker">
                    <Leaf size={14} /> The greenhouse
                  </span>
                  <h2>Choose where you want to grow.</h2>
                  <p>
                    Every board is a garden with its own rhythm, color, and
                    stage of growth.
                  </p>
                </div>
                <div>
                  <IconButton
                    Icon={gardenPinned ? PanelLeftClose : Pin}
                    label={
                      gardenPinned ? "Unpin garden atlas" : "Pin garden atlas"
                    }
                    onClick={() => {
                      setGardenPinned((value) => !value);
                      notify(
                        gardenPinned
                          ? "Garden atlas unpinned"
                          : "Garden atlas pinned",
                        true,
                      );
                    }}
                  />
                  <IconButton
                    Icon={X}
                    label="Close"
                    onClick={() => setGardenOpen(false)}
                  />
                </div>
              </div>
              <div className="fw-garden-search">
                <Search size={17} />
                <input
                  value={gardenSearch}
                  onChange={(event) => setGardenSearch(event.target.value)}
                  placeholder="Find a garden..."
                />
              </div>
              <div className="fw-garden-grid">
                {filteredBoards.map((board) => {
                  const index = boards.indexOf(board);
                  const total = board.lists.flatMap(
                    (list) => list.cards,
                  ).length;
                  const done = board.lists
                    .flatMap((list) => list.cards)
                    .filter(
                      (card) =>
                        card.completed ||
                        (card.checks > 0 && card.done === card.checks),
                    ).length;
                  const progress = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <motion.button
                      key={board._id}
                      className={`fw-garden-card ${index === boardIndex ? "active" : ""}`}
                      onClick={() => changeBoard(index)}
                      whileHover={{ y: -5 }}
                    >
                      <div className={`fw-garden-art art-${index % 4}`}>
                        <span className="fw-art-orbit orbit-a" />
                        <span className="fw-art-orbit orbit-b" />
                        <div
                          className="fw-garden-art-progress"
                          style={{ "--progress": `${progress * 3.6}deg` }}
                        >
                          <img src={logo} alt="" />
                        </div>
                      </div>
                      <div>
                        <span className="fw-garden-status">
                          {index === boardIndex
                            ? "OPEN NOW"
                            : `${progress}% THRIVING`}
                        </span>
                        <strong>{board.name}</strong>
                        <small>
                          {board.subtitle} · {total} cards
                        </small>
                      </div>
                      <ArrowRight size={17} />
                    </motion.button>
                  );
                })}
                <motion.button
                  className="fw-garden-card new"
                  onClick={openGardenCreator}
                  whileHover={{ y: -5 }}
                >
                  <div className="fw-new-garden-orb">
                    <Plus size={25} />
                  </div>
                  <div>
                    <span className="fw-garden-status">NEW</span>
                    <strong>Plant a new garden</strong>
                    <small>Start with clean soil</small>
                  </div>
                  <ArrowRight size={17} />
                </motion.button>
              </div>
              <div className="fw-garden-footer">
                <button
                  onClick={() => {
                    setGardenOpen(false);
                    setBoardView('Table');
                    if(activeBoard?._id)localStorage.setItem(`flowe-board-view:${activeBoard._id}`,'Table');
                    setVisible(['board']);
                  }}
                >
                  <Table2 size={16} /> Table pulse
                </button>
                <button
                  onClick={() => {
                    setGardenOpen(false);
                    if (!visible.includes("planner"))
                      setVisible((current) => [...current, "planner"]);
                    setPlannerMode("Month");
                  }}
                >
                  <CalendarDays size={16} /> Calendar
                </button>
                <span />
                <button onClick={()=>{setGardenOpen(false);manageMembers()}}>
                  <Users size={16} /> Members
                </button>
                <button
                  onClick={() => setTheme(theme === "soft" ? "paper" : "soft")}
                >
                  <Settings size={16} /> Atmosphere
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
