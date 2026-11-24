import NotificationBell from '../features/notifications/components/NotificationBell';
import MemberAvatar from '../components/ui/MemberAvatar';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, MessageCircle, Bell, ChevronLeft, ChevronRight, Columns3, Inbox, Megaphone, PanelLeftClose, Pin, Plus, Search, Settings, Sparkles, SquarePen, UserPlus, Users } from 'lucide-react';
import logo from '../assets/images/logoTransparent.png';
import { ATMOSPHERES, MENU_ANIM } from '../features/board/constants/workspace';
import { IconButton } from '../features/board/components/WorkspacePrimitives';

export default function BoardNavbar({setBloomOpen, activeBoard, search, setSearch, setCreateOpen, setAccountOpen, notify, setAccountView, user, createOpen, visible, setVisible, lists, setNewList, setComposer, inboxInputRef, accountOpen, accountView, theme, setTheme, logout, navigate, profileVisible, setProfileVisible, shareBoard, setGardenPinned, gardenPinned, openGardenCreator, manageMembers=()=>{}, members=[], online=[], saveStatus='Saved', openMessages=()=>{}}) {
  return (
      <header className="fw-topbar">
        <div className="fw-brand-lockup">
          <button
            className="fw-logo-button"
            onClick={() => setBloomOpen((value) => !value)}
            aria-label="Open Flowe Bloom"
          >
            <img src={logo} alt="Flowe" />
          </button>
          <div className="fw-brand-copy">
            <strong>Flowe</strong>
            <span>{activeBoard?.name}</span>
          </div>
        </div>

        <div className="fw-command-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this bloom..."
          />
          <kbd>⌘ K</kbd>
        </div>

        <div className="fw-top-actions">
          <button
            className="fw-create-button"
            onClick={(event) => {
              event.stopPropagation();
              setCreateOpen((value) => !value);
              setAccountOpen(false);
            }}
          >
            <Plus size={17} /> Create
          </button>
          <span className={`fw-save-indicator ${saveStatus==='Not saved'?'is-error':''}`} title="Board save status">{saveStatus}</span>
          <button type="button" className="fw-top-icon" onClick={openMessages} title="Messages" aria-label="Open messages"><MessageCircle size={18}/></button>
          <NotificationBell/>
          <button
            className="fw-avatar"
            onClick={(event) => {
              event.stopPropagation();
              setAccountOpen((value) => !value);
              setAccountView("root");
              setCreateOpen(false);
            }}
          >
            <MemberAvatar user={user} online={true} self={true} size={31} showStatus={profileVisible}/>
          </button>
        </div>

        <AnimatePresence>
          {createOpen && (
            <motion.div
              className="fw-popover fw-create-popover"
              {...MENU_ANIM}
              onClick={(event) => event.stopPropagation()}
            >
              <span className="fw-popover-kicker">Plant something new</span>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  openGardenCreator();
                }}
              >
                <Columns3 size={17} />
                <span>
                  <strong>Garden board</strong>
                  <small>Start a fresh project ecosystem</small>
                </span>
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  if (!visible.includes("board"))
                    setVisible((current) => [...current, "board"]);
                  if (!lists.length) setNewList(true);
                  else setComposer(lists[0].id);
                }}
              >
                <SquarePen size={17} />
                <span>
                  <strong>Card</strong>
                  <small>Plant a task into the current board</small>
                </span>
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  if (!visible.includes("inbox"))
                    setVisible((current) => [...current, "inbox"]);
                  requestAnimationFrame(() => inboxInputRef.current?.focus());
                }}
              >
                <Inbox size={17} />
                <span>
                  <strong>Inbox thought</strong>
                  <small>Catch it before it disappears</small>
                </span>
                <ArrowRight size={15} />
              </button>
            </motion.div>
          )}
          {accountOpen && (
            <motion.div
              className="fw-popover fw-account-popover"
              {...MENU_ANIM}
              onClick={(event) => event.stopPropagation()}
            >
              {accountView === "root" ? (
                <>
                  <div className="fw-account-card">
                    <MemberAvatar user={user} size={39} online={true}/>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <button onClick={() => setAccountView("profile")}>
                    <Sparkles size={17} />
                    Profile & visibility
                    <ChevronRight size={15} />
                  </button>
                  <button onClick={() => setAccountView("members")}>
                    <Users size={17} />
                    Members
                    <ChevronRight size={15} />
                  </button>
                  <button onClick={() => setAccountView("settings")}>
                    <Settings size={17} />
                    Settings
                    <ChevronRight size={15} />
                  </button>
                  <div className="fw-menu-section-label">Atmosphere</div>
                  <div className="fw-theme-switcher">
                    {ATMOSPHERES.map((item) => (
                      <button
                        key={item}
                        className={theme === item ? "active" : ""}
                        onClick={() => {
                          setTheme(item);
                          notify(
                            `${item[0].toUpperCase() + item.slice(1)} atmosphere`,
                          );
                        }}
                      >
                        <span className={`fw-theme-dot ${item}`} />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                  <hr />
                  <button
                    onClick={() => {
                      void logout()
                        .then(() => navigate("/login"))
                        .catch((e) => notify(e.message));
                    }}
                  >
                    <PanelLeftClose size={17} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="fw-account-back"
                    onClick={() => setAccountView("root")}
                  >
                    <ChevronLeft size={16} /> Back to account
                  </button>
                  {accountView === "profile" && (
                    <div className="fw-account-subview">
                      <span className="fw-detail-orb">
                        <Sparkles size={20} />
                      </span>
                      <strong>Profile & visibility</strong>
                      <small>
                        Choose how present you feel inside shared gardens.
                      </small>
                      <label className="fw-toggle-row">
                        <span>
                          <strong>Show my status dot</strong>
                          <small>Display the online indicator on my avatar</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={profileVisible}
                          onChange={(event) =>
                            setProfileVisible(event.target.checked)
                          }
                        />
                      </label>
                    </div>
                  )}
                  {accountView === "members" && (
                    <div className="fw-account-subview">
                      <span className="fw-detail-orb">
                        <Users size={20} />
                      </span>
                      <strong>Garden members</strong>
                      <small>People currently sharing this workspace.</small>
                      <div className="fm-member-row"><MemberAvatar user={user} online self size={32}/><span><b>You</b><small>Online · current account</small></span></div>
                      {members.filter(m=>m.user?._id!==user.id).map(m=><div className="fm-member-row" key={m.user._id}><MemberAvatar user={m.user} online={online.some(p=>p.id===m.user._id)} size={32}/><span><b>{m.user.name}</b><small>{online.some(p=>p.id===m.user._id)?'Online':'Offline'} · {m.role}</small></span></div>)}
                      {!members.some(m=>m.user?._id!==user.id)&&<small>No other members yet. Invite someone to collaborate.</small>}
                      <button
                        className="fw-account-action"
                        onClick={manageMembers}
                      >
                        <UserPlus size={15} /> Manage invitations
                      </button>
                    </div>
                  )}
                  {accountView === "settings" && (
                    <div className="fw-account-subview">
                      <span className="fw-detail-orb">
                        <Settings size={20} />
                      </span>
                      <strong>Workspace settings</strong>
                      <small>Small choices that change how Flowe feels.</small>
                      <button
                        className="fw-account-action"
                        onClick={() => {
                          setBloomOpen(true);
                          setAccountOpen(false);
                        }}
                      >
                        <img src={logo} alt="" width="18" height="18" /> Open
                        Bloom composer
                      </button>
                      <button
                        className="fw-account-action"
                        onClick={() => {
                          setGardenPinned((value) => !value);
                          notify(
                            gardenPinned
                              ? "Living Atlas unpinned"
                              : "Living Atlas pinned",
                          );
                        }}
                      >
                        <Pin size={15} />{" "}
                        {gardenPinned
                          ? "Unpin Living Atlas"
                          : "Pin Living Atlas"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
  );
}
