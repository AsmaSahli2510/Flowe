import { motion, AnimatePresence } from 'motion/react';
import { Archive, ChevronLeft, ChevronRight, Info, Leaf, Lock, Palette, Plus, SquarePen, Star, Tag, UserPlus, X, Zap } from 'lucide-react';
import { GardenMetric, IconButton } from './WorkspacePrimitives';
import logo from '../../../assets/images/logoTransparent.png';

export default function BoardDrawer({boardMenuOpen, setBoardMenuOpen, drawerPanel, setDrawerPanel, activeBoard, boardStats, shareBoard, cycleVisibility, updateBoard, notify, cycleBoardTone, setAutomationOpen, palette, setFilters, canManage, renameLabel, removeLabel, addNewLabel, newLabelName, setNewLabelName, newLabelColor, setNewLabelColor, lists, restoreList, patchCard}) {
  return (
<AnimatePresence>
        {boardMenuOpen && (
          <>
            <motion.div
              className="fw-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBoardMenuOpen(false)}
            />
            <motion.aside
              className="fw-board-drawer"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 330, damping: 34 }}
            >
              <header>
                <div>
                  <span>Board garden</span>
                  <strong>
                    {drawerPanel === "root" ? "Tools & settings" : drawerPanel}
                  </strong>
                </div>
                <div>
                  {drawerPanel !== "root" && (
                    <IconButton
                      Icon={ChevronLeft}
                      label="Back"
                      onClick={() => setDrawerPanel("root")}
                    />
                  )}
                  <IconButton
                    Icon={X}
                    label="Close board menu"
                    onClick={() => setBoardMenuOpen(false)}
                  />
                </div>
              </header>
              {drawerPanel === "root" ? (
                <>
                  <div className="fw-drawer-hero">
                    <img src={logo} alt="" width="40" height="40" />
                    <div>
                      <strong>{activeBoard?.name}</strong>
                      <span>
                        {boardStats.progress}% thriving · {boardStats.total}{" "}
                        cards · {boardStats.lists} paths
                      </span>
                    </div>
                  </div>
                  <div className="fw-drawer-list">
                    <button onClick={shareBoard}>
                      <UserPlus size={18} />
                      <span>Share this garden</span>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setDrawerPanel("About")}>
                      <Info size={18} />
                      <span>About this board</span>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={cycleVisibility}>
                      <Lock size={18} />
                      <span>
                        Visibility · {activeBoard?.visibility || "Private"}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => {
                        updateBoard({ favorite: !activeBoard?.favorite });
                        notify(
                          activeBoard?.favorite
                            ? "Removed from favorites"
                            : "Added to favorites",
                        );
                      }}
                    >
                      <Star
                        size={18}
                        fill={activeBoard?.favorite ? "currentColor" : "none"}
                      />
                      <span>
                        {activeBoard?.favorite ? "Favorited" : "Favorite"}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={cycleBoardTone}>
                      <Palette size={18} />
                      <span>Change atmosphere</span>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setDrawerPanel("Labels")}>
                      <Tag size={18} />
                      <span>Labels</span>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={() => {setBoardMenuOpen(false);setAutomationOpen(true)}}>
                      <Zap size={18} />
                      <span>Automation</span>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setDrawerPanel("Archive")}>
                      <Archive size={18} />
                      <span>Archived cards</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              ) : drawerPanel === "About" ? (
                <div className="fw-drawer-detail">
                  <span className="fw-detail-orb">
                    <Info size={22} />
                  </span>
                  <h3>{activeBoard?.name}</h3>
                  <p>
                    {activeBoard?.subtitle}. A living place for work in
                    progress.
                  </p>
                  <div className="fw-atlas-metrics">
                    <GardenMetric value={boardStats.total} label="cards" />
                    <GardenMetric value={boardStats.done} label="bloomed" />
                    <GardenMetric
                      value={`${boardStats.progress}%`}
                      label="growth"
                    />
                  </div>
                </div>
              ) : drawerPanel === "Labels" ? (
                <div className="fw-drawer-detail">
                  <span className="fw-detail-orb">
                    <Tag size={22} />
                  </span>
                  <h3>Label palette</h3><p>Manage reusable labels and filter the cards by label.</p>
                  <div className="fw-label-manager">{palette.map(l=><div key={l.name}><button className="fw-label-swatch" style={{background:l.color}} title="Filter cards by this label" onClick={()=>{setFilters(f=>({...f,label:l.name}));setBoardMenuOpen(false)}}>{l.name}</button><button title="Rename label" disabled={!canManage} onClick={()=>renameLabel(l.name)}><SquarePen size={14}/></button><button title="Remove label" disabled={!canManage} onClick={()=>removeLabel(l.name)}><X size={14}/></button></div>)}</div>
                  <form className="fw-new-label" onSubmit={addNewLabel}><input required placeholder="New label name" maxLength={60} value={newLabelName} onChange={e=>setNewLabelName(e.target.value)}/><input type="color" aria-label="Label color" value={newLabelColor} onChange={e=>setNewLabelColor(e.target.value)}/><button disabled={!canManage}><Plus size={15}/>Add label</button></form>
                </div>
              ) : (
                <div className="fw-drawer-detail">
                  <span className="fw-detail-orb">
                    <Archive size={22} />
                  </span>
                  <h3>Seed vault</h3>
                  <p>
                    Archived cards will rest here until you need them again.
                  </p>
                  {lists.filter(l=>l.archived).map(l=><button className="fw-archive-row" key={l.id} onClick={()=>restoreList(l.id)}><Archive size={15}/>{l.title} · Restore list</button>)}
                  {lists.flatMap(l=>l.cards.filter(c=>c.archived).map(c=>({...c,listId:l.id}))).map(c=><button className="fw-archive-row" key={c.id} onClick={()=>patchCard(c.id,{archived:false})}><Archive size={15}/>{c.title} · Restore</button>)}
                  {!lists.some(l=>l.archived||l.cards.some(c=>c.archived))&&<div className="fw-empty-state"><Leaf size={28}/><strong>Nothing archived.</strong></div>}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
  );
}
