import MemberAvatar from "../../components/ui/MemberAvatar";
import BoardDrawer from "./components/BoardDrawer";
import DeadlineModal from "./components/DeadlineModal";
import BloomComposer from "./components/BloomComposer";
import GardenPicker from "./components/GardenPicker";
import NewGardenModal from "./components/NewGardenModal";
import BoardNavbar from "../../layouts/BoardNavbar";
import { VIEW_META, ATMOSPHERES } from "./constants/workspace";
import { IconButton, PanelChrome, Menu, GardenMetric } from "./components/WorkspacePrimitives";
import BoardViews from "../views/components/BoardViews";
import KanbanBoard from "./components/BoardCanvas";
import Planner from "../planner/components/Planner";
import WorkspaceResizeHandle from "./components/WorkspaceResizeHandle";
import { useResizableWorkspace } from "./hooks/useResizableWorkspace";
import CardDetails from "./components/cards/CardDetailsModal";
import AutomationStudio from "../automation/components/AutomationStudio";
import { executeRule, runTimedRule } from "../automation/utils/boardAutomation";
import {
  AtelierBar,
  matchesCard,
  Modal,
} from "./components/cards/CardEditor";
import ProjectSettings from "../settings/components/ProjectSettings";
import { api } from "../../services/apiClient";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { AlignLeft, Archive, ArrowRight, BarChart3, Table2, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Columns3, CopyPlus, Ellipsis, Eye, Filter, Inbox, Leaf, ListFilter, Mail, Palette, PanelLeftClose, Pin, Plus, Search, Send, Share2, Sparkles, Star, UserPlus, WandSparkles, Zap } from "lucide-react";
import logo from "../../assets/images/logoTransparent.png";
import "./Workspace.css";

export default function Workspace({
  initialBoards,
  initialIndex = 0,
  persist,
  user,
  logout,
  workspaceId,
  onlineMembers=[],
  saveStatus='Saved',
  openMessages=()=>{},
  leave,
}) {
  const navigate = leave;
  const openedLink = useRef(null);
  const [members, setMembers] = useState([]),
    [settingsOpen, setSettingsOpen] = useState(false),
    [calendarOpen, setCalendarOpen] = useState(false);
  const [filters, setFilters] = useState({
    priority: "",
    mine: "",
    due: "",
    label: "",
    archived: false,
  });
  useEffect(() => {
    let alive=true;
    const refresh=()=>api(`/workspaces/${workspaceId}/members`).then(d=>alive&&setMembers(d.members||[])).catch(()=>{});
    refresh();
    window.addEventListener('flowe-members-changed',refresh);
    window.addEventListener('focus',refresh);
    return()=>{alive=false;window.removeEventListener('flowe-members-changed',refresh);window.removeEventListener('focus',refresh)};
  }, [workspaceId]);
  const readOnly =
    members.find((m) => m.user._id === user.id)?.role === "reader" ||
    initialBoards[initialIndex].archived;
  useEffect(() => {
    const f = (e) => {
      const c = initialBoards[initialIndex].lists
        .flatMap((l) => l.cards.map((c) => ({ ...c, listId: l.id })))
        .find((c) => c.id === Number(e.detail));
      if (c) setSelected(c);
    };
    window.addEventListener("flowe-open-card", f);
    const id = new URLSearchParams(location.search).get("card");
    if (id && openedLink.current !== id) {
      openedLink.current = id;
      f({ detail: id });
    }
    return () => window.removeEventListener("flowe-open-card", f);
  }, [initialBoards, initialIndex]);
  useEffect(() => {
    setBoards(initialBoards);
    setLists(initialBoards[initialIndex].lists);
  }, [initialBoards, initialIndex]);
  const inboxInputRef = useRef(null);
  const [visible, setVisible] = useState(["board"]);
  const [bloomOpen, setBloomOpen] = useState(false);
  const [gardenOpen, setGardenOpen] = useState(false);
  const [gardenPinned, setGardenPinned] = useState(false);
  const [gardenSearch, setGardenSearch] = useState("");
  const [newGardenOpen, setNewGardenOpen] = useState(false);
  const [newGardenName, setNewGardenName] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountView, setAccountView] = useState("root");
  const [profileVisible, setProfileVisible] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [drawerPanel, setDrawerPanel] = useState("root");
  const [activeMenu, setActiveMenu] = useState(null);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("soft");
  const [boards, setBoards] = useState(initialBoards);
  const [boardIndex, setBoardIndex] = useState(initialIndex);
  const [lists, setLists] = useState(initialBoards[initialIndex].lists);
  const [inboxTasks, setInboxTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`flowe-inbox:${user.id}`) || '[]') } catch { return [] }
  });
  useEffect(() => { localStorage.setItem(`flowe-inbox:${user.id}`,JSON.stringify(inboxTasks)) },[inboxTasks,user.id]);
  const [inboxFilter, setInboxFilter] = useState("open");
  const [inboxSort, setInboxSort] = useState("newest");
  const [taskInput, setTaskInput] = useState("");
  const [composer, setComposer] = useState(null);
  const [draft, setDraft] = useState("");
  const [newList, setNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedList,setDraggedList] = useState(null);
  const [selected, setSelected] = useState(null);
  const [plannerMode, setPlannerMode] = useState("Agenda");
  const [boardFilter, setBoardFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [pulse, setPulse] = useState(0);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [automationStarter,setAutomationStarter]=useState(null);
  const [shareOpen,setShareOpen]=useState(false);
  const [newLabelName,setNewLabelName]=useState('');
  const [newLabelColor,setNewLabelColor]=useState('#ac94d4');
  const [boardView, setBoardView] = useState('Board');

  const activeBoard = boards[boardIndex];
  useEffect(() => {
    const saved=localStorage.getItem(`flowe-board-view:${activeBoard?._id}`);
    setBoardView(['Board','Table','Calendar','Timeline','Dashboard'].includes(saved)?saved:'Board');
  },[activeBoard?._id]);
  const canManage = members.some(m=>m.user._id===user.id && m.role==='owner') || String(activeBoard.createdBy)===user.id;
  const palette=[...(activeBoard.labelPalette||[])];
  const usedLabels=[...new Set(lists.flatMap(l=>l.cards.flatMap(c=>c.labels||[])))].filter(Boolean);
  usedLabels.forEach((name,i)=>{if(!palette.some(l=>l.name===name))palette.push({name,color:['#b39bd6','#e7a3bf','#e7c16e','#8cc7a3','#87b7df'][i%5]})});

  const activeCount = visible.length;
  const gridClass = `count-${activeCount}`;
  const {containerRef: paneContainerRef, columns: paneColumns, resizing: resizingPanes,
    startResize, onResizeKeyDown, resetWidths} = useResizableWorkspace(visible);
  // Keep the pinned Living Atlas precisely aligned with the actual panel rect,
  // even when filters wrap or the browser is resized.
  const [atlasBounds, setAtlasBounds] = useState(null);
  useLayoutEffect(() => {
    if (!gardenPinned || !paneContainerRef.current) return undefined;
    const stage = paneContainerRef.current;
    const update = () => {
      if (window.innerWidth <= 760) { setAtlasBounds(null); return; }
      const panel = stage.querySelector('.bloom-panel');
      const rect = panel?.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const styles = window.getComputedStyle(stage);
      const top = Math.round(rect?.top ?? stageRect.top + parseFloat(styles.paddingTop || '0'));
      const bottom = Math.round(window.innerHeight - (rect?.bottom ?? stageRect.bottom - parseFloat(styles.paddingBottom || '0')));
      setAtlasBounds(previous => previous?.top === top && previous?.bottom === bottom ? previous : { top, bottom: Math.max(0, bottom) });
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(stage);
    const panel = stage.querySelector('.bloom-panel');
    if (panel) observer?.observe(panel);
    window.addEventListener('resize', update);
    const frame = window.requestAnimationFrame(update);
    update();
    return () => { observer?.disconnect();window.removeEventListener('resize', update);window.cancelAnimationFrame(frame); };
  }, [gardenPinned, visible.length, paneContainerRef]);

  const boardStats = useMemo(() => {
    const cards = lists.filter(l=>!l.archived).flatMap((list) => list.cards.filter(c=>!c.archived));
    const total = cards.length;
    const done = cards.filter(
      (card) =>
        card.completed || (card.checks > 0 && card.done === card.checks),
    ).length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, progress, lists: lists.filter(l=>!l.archived).length };
  }, [lists]);

  const filteredInbox = useMemo(() => {
    let items = [...inboxTasks];
    if (inboxFilter === "open") items = items.filter((item) => !item.archived);
    if (inboxFilter === "archived")
      items = items.filter((item) => item.archived);
    if (search.trim())
      items = items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      );
    items.sort((a, b) =>
      inboxSort === "newest"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt,
    );
    return items;
  }, [inboxTasks, inboxFilter, inboxSort, search]);

  const filteredBoards = useMemo(
    () =>
      boards.filter((board) =>
        board.name.toLowerCase().includes(gardenSearch.toLowerCase()),
      ),
    [boards, gardenSearch],
  );

  const notify = (message, bloom = false) => {
    setToast(message);
    if (bloom) setPulse((value) => value + 1);
    window.clearTimeout(window.__floweToast);
    window.__floweToast = window.setTimeout(() => setToast(""), 2300);
  };

  const closeMenus = () => setActiveMenu(null);

  const toggleView = (id) => {
    setVisible((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          notify("Keep one petal open so your workspace stays alive.");
          return current;
        }
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const syncCurrentBoard = (nextLists = lists, save = true) => {
    setBoards((current) =>
      current.map((board, i) =>
        i === boardIndex ? { ...board, lists: nextLists } : board,
      ),
    );
    if (save) return persist(activeBoard._id, { lists: nextLists });
  };

  const saveAutomations = (rules) => {
    const saving=updateBoard({ automations: rules });
    notify('Automations saved');
    return saving;
  };
  const executeButtonRule = (rule, cardId=null) => {
    if (readOnly) return;
    const next = structuredClone(lists);
    if (!rule.enabled) return;
    if (['daily','weekly','due'].includes(rule.trigger)) runTimedRule(next, rule);
    else executeRule(next, rule, cardId);
    setLists(next);
    syncCurrentBoard(next);
    notify(`Executed: ${rule.name}`);
  };
  const patchCard = (id, patch) => {
    if(readOnly)return;
    const next=lists.map(l=>({...l,cards:l.cards.map(c=>c.id===id?{...c,...patch}:c)}));
    setLists(next);syncCurrentBoard(next);
  };
  const duplicateCard = (card) => {
    if(readOnly)return;
    const next=lists.map(l=>l.id===card.listId?{...l,cards:[...l.cards,{...card,id:Date.now(),title:card.title+' (copy)',completed:false,archived:false}]}:l);
    setLists(next);syncCurrentBoard(next);notify('Card copied');setSelected(null);
  };
  const archiveCard = (card) => {patchCard(card.id,{archived:true});setSelected(null);notify('Card archived — available in Archive');};
  const convertChecklistItem = async (card,item) => {
    const origin=lists.find(l=>l.cards.some(c=>c.id===card.id));
    if(!origin)return;
    const updated={...card,checklist:(card.checklist||[]).filter(x=>x.id!==item.id)};
    updated.checks=updated.checklist.length; updated.done=updated.checklist.filter(x=>x.done).length;
    const created={id:Date.now(),title:item.text,due:item.due||'',assignee:item.assignee||card.assignee||'',priority:card.priority||'Medium',labels:card.labels||[],source:`checklist:${card.id}`,checks:0,done:0};
    const next=lists.map(l=>({...l,cards:l.id===origin.id?[...l.cards.map(c=>c.id===card.id?updated:c),created]:l.cards}));
    const project=await persist(activeBoard._id,{lists:next});
    setLists(project?.lists||next);notify('Checklist item converted to a card');
  };
  const moveAllCards = (listId, destinationId) => {
    if (readOnly) return;
    const source = lists.find(l => l.id === listId);
    const destination = lists.find(l => l.id === destinationId && !l.archived);
    if (!source || !destination || source.id === destination.id) return;
    const next = lists.map(l => l.id === listId ? { ...l, cards: [] } : l.id === destination.id ? { ...l, cards: [...l.cards, ...source.cards] } : l);
    setLists(next);syncCurrentBoard(next);closeMenus();notify('Cards moved');
  };
  const sortList = (listId,mode='due') => {
    const next=lists.map(l=>l.id===listId?{...l,cards:[...l.cards].sort((a,b)=>mode==='title'?a.title.localeCompare(b.title):(a.due||'9999').localeCompare(b.due||'9999'))}:l);
    setLists(next);syncCurrentBoard(next);closeMenus();notify('List sorted');
  };
  const changeListColor = (listId,color) => {const next=lists.map(l=>l.id===listId?{...l,color}:l);setLists(next);syncCurrentBoard(next);closeMenus()};
  const pinList = listId => {const next=lists.map(l=>l.id===listId?{...l,pinned:!l.pinned}:l);setLists(next);syncCurrentBoard(next);closeMenus()};
  const watchList = listId => {const next=lists.map(l=>l.id===listId?{...l,watchers:l.watchers?.includes(user.id)?l.watchers.filter(x=>x!==user.id):[...(l.watchers||[]),user.id]}:l);setLists(next);syncCurrentBoard(next);closeMenus()};
  const convertInbox = task => {
    if(readOnly)return;
    const target=lists.find(l=>!l.archived);if(!target)return;
    const next=lists.map(l=>l.id===target.id?{...l,cards:[...l.cards,{id:Date.now(),title:task.title,detail:task.detail||'',labels:[],checklist:[],checks:0,done:0,source:'inbox'}]}:l);
    setLists(next);syncCurrentBoard(next);setInboxTasks(ts=>ts.filter(t=>t.id!==task.id));notify('Inbox note moved to your Board');
  };
  const changeBoard = (index) => {
    const next = boards[index];
    if (!next) return;
    void navigate(`/workspace/${workspaceId}/project/${next._id}`);
  };

  const openGardenCreator = () => {
    sessionStorage.setItem("flowe-workspace", workspaceId);
    navigate("/workspace");
  };
  const plantGarden = (event) => {
    event.preventDefault();
    openGardenCreator();
  };

  const addInboxTask = (event) => {
    event.preventDefault();
    if (!taskInput.trim()) return;
    setInboxTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title: taskInput.trim(),
        createdAt: Date.now(),
        archived: false,
      },
    ]);
    setTaskInput("");
    setInboxFilter("open");
    notify("Captured in Inbox", true);
  };

  const archiveInboxTask = (id) => {
    setInboxTasks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, archived: true } : item,
      ),
    );
    notify("Moved to the seed vault");
  };

  const restoreInboxTask = (id) => {
    setInboxTasks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, archived: false } : item,
      ),
    );
    notify("Restored to Inbox", true);
  };

  const addCard = (listId) => {
    if (readOnly) return;
    if (!draft.trim()) return;
    const next = lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            cards: [
              ...list.cards,
              { id: Date.now(), title: draft.trim(), checks: 0, done: 0 },
            ],
          }
        : list,
    );
    setLists(next);
    syncCurrentBoard(next);
    setComposer(null);
    setDraft("");
    notify("Card planted", true);
  };

  const addList = () => {
    if (readOnly) return;
    if (!newListName.trim()) return;
    const colors = ["lav", "yellow", "mint", "neutral"];
    const next = [
      ...lists,
      {
        id: Date.now(),
        title: newListName.trim(),
        color: colors[lists.length % colors.length],
        cards: [],
      },
    ];
    setLists(next);
    syncCurrentBoard(next);
    setNewListName("");
    setNewList(false);
    notify("A new path grew into place.", true);
  };

  const moveCard = (cardId, toListId, beforeId) => {
    if (readOnly) return;
    let moved;
    const without = lists.map((list) => {
      const found = list.cards.find((card) => card.id === cardId);
      if (found) moved = found;
      return {
        ...list,
        cards: list.cards.filter((card) => card.id !== cardId),
      };
    });
    if (moved) {
      const next = without.map((list) =>
        list.id === toListId
          ? {
              ...list,
              cards: beforeId
                ? [
                    ...list.cards.slice(
                      0,
                      list.cards.findIndex((c) => c.id === beforeId),
                    ),
                    moved,
                    ...list.cards.slice(
                      list.cards.findIndex((c) => c.id === beforeId),
                    ),
                  ]
                : [...list.cards, moved],
            }
          : list,
      );
      setLists(next);
      syncCurrentBoard(next);
    }
    setDraggedCard(null);
  };

  const reorderList = (listId, direction) => {
    if (readOnly) return;
    const i = lists.findIndex((l) => l.id === listId),
      j = i + direction;
    if (j < 0 || j >= lists.length) return;
    const next = [...lists];
    [next[i], next[j]] = [next[j], next[i]];
    setLists(next);
    syncCurrentBoard(next);
    closeMenus();
  };
  const reorderListTo = (fromId,toId) => {
    if(readOnly || fromId===toId)return;
    const next=[...lists],from=next.findIndex(l=>l.id===fromId),to=next.findIndex(l=>l.id===toId);
    if(from<0||to<0)return;
    const [source]=next.splice(from,1);
    next.splice(to,0,source);
    setLists(next);syncCurrentBoard(next);setDraggedList(null);
  };
  const renameList = (listId, name) => {
    if (readOnly || !name?.trim()) return;
    const next = lists.map(list => list.id === listId ? { ...list, title: name.trim() } : list);
    setLists(next);syncCurrentBoard(next);closeMenus();
  };

  const duplicateList = (listId) => {
    if (readOnly) return;
    const current = lists.find((list) => list.id === listId);
    if (!current) return;
    const next = [
      ...lists,
      {
        ...current,
        id: Date.now(),
        title: `${current.title} copy`,
        pinned: false,
        watchers: [],
        archived: false,
        cards: current.cards.map((card) => ({
          ...card,
          id: Date.now() + Math.random(),
        })),
      },
    ];
    setLists(next);
    syncCurrentBoard(next);
    closeMenus();
    notify("List duplicated");
  };

  const archiveList = (listId) => {if(readOnly)return;const next=lists.map(l=>l.id===listId?{...l,archived:true}:l);setLists(next);syncCurrentBoard(next);closeMenus();notify('List archived')};
  const restoreList = (listId) => {if(readOnly)return;const next=lists.map(l=>l.id===listId?{...l,archived:false}:l);setLists(next);syncCurrentBoard(next);notify('List restored')};
  const deleteList = (listId) => {
    if (readOnly) return;
    const source = lists.find((l) => l.id === listId);
    let destination;
    if (source.cards.length) {
      const choices = lists.filter((l) => l.id !== listId);
      if (!choices.length) {
        notify("Create another column before removing this one.");
        return;
      }
      const title = window.prompt(
        "Move these cards to which column? " +
          choices.map((l) => l.title).join(", "),
      );
      destination = choices.find((l) => l.title === title);
      if (!destination) return;
    }
    const next = lists
      .filter((list) => list.id !== listId)
      .map((l) =>
        destination?.id === l.id
          ? { ...l, cards: [...l.cards, ...source.cards] }
          : l,
      );
    setLists(next);
    syncCurrentBoard(next);
    closeMenus();
    notify("List moved to compost");
  };

  const shareBoard = () => setShareOpen(true);
  const copyBoardLink = async () => {
    const url = `${window.location.origin}/workspace/${workspaceId}/project/${activeBoard._id}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(url);
      notify('Board link copied');
    } catch {
      const input = document.querySelector('input[aria-label="Shareable board URL"]');
      input?.focus();
      input?.select();
      const copied = typeof document.execCommand === 'function' && document.execCommand('copy');
      notify(copied ? 'Board link copied' : 'Select the board link and press Ctrl+C');
    }
  };
  const manageMembers=()=>{sessionStorage.setItem('flowe-workspace',workspaceId);navigate('/workspace?members=1')};
  const renameLabel = (oldName) => {
    if(!canManage)return;
    const name=window.prompt('Rename label',oldName)?.trim();if(!name||name===oldName)return;
    if(palette.some(l=>l.name.toLowerCase()===name.toLowerCase())){notify('Label already exists');return}
    const next=lists.map(l=>({...l,cards:l.cards.map(c=>({...c,labels:c.labels?.map(x=>x===oldName?name:x)}))}));
    setLists(next);syncCurrentBoard(next,false);const nextPalette=palette.map(l=>l.name===oldName?{...l,name}:l);
    updateBoard({lists:next,labelPalette:nextPalette});notify('Label renamed');
  };
  const removeLabel = (name) => {
    if(!canManage)return;
    const next=lists.map(l=>({...l,cards:l.cards.map(c=>({...c,labels:c.labels?.filter(x=>x!==name)}))}));
    setLists(next);syncCurrentBoard(next,false);updateBoard({lists:next,labelPalette:palette.filter(l=>l.name!==name)});notify('Label removed');
  };
  const addNewLabel = e => {
    e.preventDefault();if(!canManage||!newLabelName.trim())return;
    if(palette.some(l=>l.name.toLowerCase()===newLabelName.trim().toLowerCase())){notify('Label already exists');return}
    updateBoard({labelPalette:[...palette,{name:newLabelName.trim(),color:newLabelColor}]});setNewLabelName('');notify('Label created');
  };
  const updateBoard = (patch) => {
    setBoards((current) =>
      current.map((board, index) =>
        index === boardIndex ? { ...board, ...patch, lists:patch.lists||lists } : board,
      ),
    );
    return persist(activeBoard._id, { ...patch, lists:patch.lists||lists });
  };
  const cycleVisibility = () => {
    if(!canManage){notify('Only the project organizer can change visibility');return}
    updateBoard({visibility:activeBoard.visibility==='Private'?'Workspace':'Private'});
    notify('Visibility updated');
  };

  const cycleBoardTone = () => {
    const next = ((activeBoard?.tone || 0) + 1) % 4;
    updateBoard({ tone: next });
    notify("Atmosphere changed", true);
  };

  useEffect(() => {
    document.documentElement.dataset.floweTheme = theme;
    return () => delete document.documentElement.dataset.floweTheme;
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setBloomOpen(false);
        setGardenOpen(false);
        setAccountOpen(false);
        setCreateOpen(false);
        setBoardMenuOpen(false);
        setSelected(null);
        setNewGardenOpen(false);
        closeMenus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".fw-command-search input")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const gardenPetals = [
    {
      id: "inbox",
      label: "Inbox",
      Icon: Inbox,
      color: "pink",
      onClick: () => toggleView("inbox"),
      active: visible.includes("inbox"),
    },
    {
      id: "planner",
      label: "Planner",
      Icon: CalendarDays,
      color: "yellow",
      onClick: () => toggleView("planner"),
      active: visible.includes("planner"),
    },
    {
      id: "board",
      label: "Board",
      Icon: Columns3,
      color: "lavender",
      onClick: () => toggleView("board"),
      active: visible.includes("board"),
    },
    {
      id: "garden",
      label: "Gardens",
      Icon: Leaf,
      color: "mint",
      onClick: () => setGardenOpen(true),
      active: gardenOpen || gardenPinned,
    },
  ];

  const boardCards = (list) => {
    return list.cards.filter((card) => {
      const matchesSearch =
        !search.trim() ||
        card.title.toLowerCase().includes(search.toLowerCase());
      const complete =
        card.completed || (card.checks > 0 && card.done === card.checks);
      const matchesFilter =
        boardFilter === "all" ||
        (boardFilter === "done" ? complete : !complete);
      return (
        matchesSearch && matchesFilter && matchesCard(card, filters, user.id)
      );
    });
  };

  return (
    <div
      className={`fw-app-shell theme-${theme} ${readOnly ? "at-readonly" : ""}`}
      data-board-tone={activeBoard?.tone || 0}
      onClick={(event) => {
        if (
          !event.target.closest(".fw-menu-anchor") &&
          !event.target.closest(".fw-local-menu")
        )
          closeMenus();
      }}
    >
      <div className="fw-ambient fw-ambient-one" />
      <div className="fw-ambient fw-ambient-two" />
      <div className="fw-ambient fw-ambient-three" />

      <BoardNavbar {...{setBloomOpen, activeBoard, search, setSearch, setCreateOpen, setAccountOpen, notify, setAccountView, user, createOpen, visible, setVisible, lists, setNewList, setComposer, inboxInputRef, accountOpen, accountView, theme, setTheme, logout, navigate, profileVisible, setProfileVisible, shareBoard, setGardenPinned, gardenPinned, openGardenCreator, manageMembers, members, online: onlineMembers, saveStatus, openMessages}} />
      <AtelierBar
        project={activeBoard}
        members={members}
        filters={filters}
        setFilters={setFilters}
        onSettings={() => setSettingsOpen(true)}
        onCalendar={() => setCalendarOpen(true)}
        readOnly={readOnly}
      />

      <AnimatePresence>
        {gardenPinned && (
          <motion.aside
            className="fw-garden-atlas"
            style={atlasBounds && {top:atlasBounds.top,bottom:atlasBounds.bottom}}
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="fw-atlas-vine" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <header className="fw-atlas-head">
              <div>
                <span className="fw-atlas-kicker">
                  <Leaf size={13} /> Living atlas
                </span>
                <strong>Your gardens</strong>
              </div>
              <div className="fw-menu-anchor">
                <IconButton
                  Icon={Pin}
                  label="Unpin gardens"
                  onClick={() => setGardenPinned(false)}
                  pressed
                />
                <IconButton
                  Icon={Ellipsis}
                  label="Atlas options"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveMenu(current => current === "atlas-menu" ? null : "atlas-menu");
                  }}
                />
                <AnimatePresence>
                  {activeMenu === "atlas-menu" && (
                    <Menu className="menu-right atlas-menu">
                      <span className="fw-menu-title">Atlas controls</span>
                      <button
                        onClick={() => {
                          setGardenOpen(true);
                          closeMenus();
                        }}
                      >
                        <Leaf size={15} />
                        <span>Open greenhouse</span>
                      </button>
                      <button
                        onClick={() => {
                          setVisible(["board"]);
                          closeMenus();
                          notify("Focused the current garden");
                        }}
                      >
                        <Eye size={15} />
                        <span>Focus this garden</span>
                      </button>
                      <button
                        onClick={() => {
                          const next =
                            ATMOSPHERES[
                              (ATMOSPHERES.indexOf(theme) + 1) %
                                ATMOSPHERES.length
                            ];
                          setTheme(next);
                          closeMenus();
                          notify(
                            `${next[0].toUpperCase() + next.slice(1)} atmosphere`,
                          );
                        }}
                      >
                        <Palette size={15} />
                        <span>Next atmosphere</span>
                      </button>
                      <button onClick={() => {toggleView('planner');closeMenus();}}>
                        <CalendarDays size={15}/><span>{visible.includes('planner')?'Hide Planner':'Show Planner'}</span>
                      </button>
                      <button onClick={() => {toggleView('inbox');closeMenus();}}>
                        <Inbox size={15}/><span>{visible.includes('inbox')?'Hide Inbox':'Show Inbox'}</span>
                      </button>
                      <hr />
                      <button
                        onClick={() => {
                          setGardenPinned(false);
                          closeMenus();
                        }}
                      >
                        <PanelLeftClose size={15} />
                        <span>Unpin Living Atlas</span>
                      </button>
                    </Menu>
                  )}
                </AnimatePresence>
              </div>
            </header>

            <section className="fw-atlas-current">
              <div
                className="fw-atlas-progress"
                style={{ "--progress": `${boardStats.progress * 3.6}deg` }}
              >
                <div>
                  <img src={logo} alt="" />
                  <strong>{boardStats.progress}%</strong>
                </div>
              </div>
              <div className="fw-atlas-current-copy">
                <span>NOW GROWING</span>
                <strong>{activeBoard?.name}</strong>
                <small>{activeBoard?.subtitle}</small>
              </div>
            </section>

            <div className="fw-atlas-metrics">
              <GardenMetric value={boardStats.total} label="cards" />
              <GardenMetric value={boardStats.lists} label="paths" />
              <GardenMetric value={boardStats.done} label="bloomed" />
            </div>

            <div className="fw-atlas-section-title">
              <span>Gardens</span>
              <small>{boards.length} planted</small>
              <button onClick={openGardenCreator}>
                <Plus size={14} />
              </button>
            </div>
            <div className="fw-atlas-board-list">
              {boards.map((board, index) => {
                const total = board.lists.flatMap((list) => list.cards).length;
                const done = board.lists
                  .flatMap((list) => list.cards)
                  .filter(
                    (card) =>
                      card.completed ||
                      (card.checks > 0 && card.done === card.checks),
                  ).length;
                const progress = total ? Math.round((done / total) * 100) : 0;
                return (
                  <button
                    key={board._id}
                    className={`fw-atlas-board ${index === boardIndex ? "active" : ""}`}
                    onClick={() => changeBoard(index)}
                  >
                    <span className={`fw-atlas-seed seed-${index % 4}`}>
                      <Leaf size={14} />
                    </span>
                    <span className="fw-atlas-board-copy">
                      <strong>{board.name}</strong>
                      <small>
                        {progress}% thriving · {total} cards
                      </small>
                    </span>
                    <span
                      className="fw-atlas-mini-ring"
                      style={{ "--progress": `${progress * 3.6}deg` }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="fw-atlas-focus">
              <span className="fw-atlas-section-title-text">
                Workspace petals
              </span>
              <div>
                {Object.entries(VIEW_META).map(([id, meta]) => {
                  const Icon = meta.Icon;
                  return (
                    <button
                      key={id}
                      className={visible.includes(id) ? "active" : ""}
                      onClick={() => toggleView(id)}
                    >
                      <Icon size={15} />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="fw-atlas-open-library"
              onClick={() => setGardenOpen(true)}
            >
              <Sparkles size={15} />
              <span>
                <strong>Open the greenhouse</strong>
                <small>Search, switch, or plant a garden</small>
              </span>
              <ArrowRight size={15} />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <LayoutGroup>
        <main
          ref={paneContainerRef}
          className={`bloom-workspace ${gridClass} ${activeCount>1?'has-splitters':''} ${resizingPanes?'is-resizing':''} ${gardenPinned ? "with-garden-atlas" : ""}`}
          style={{'--flowe-panel-columns':paneColumns}}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.includes("inbox") && (
              <PanelChrome
                key="inbox"
                icon={Inbox}
                eyebrow="Catch tray"
                title="Inbox"
                accent="pink"
                className="inbox-panel"
                actions={
                  <>
                    <span className="fw-live-dot">live</span>
                    <span className="fw-menu-anchor">
                      <IconButton
                        Icon={Filter}
                        label="Filter Inbox"
                        pressed={activeMenu === "inbox-filter"}
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveMenu(
                            activeMenu === "inbox-filter"
                              ? null
                              : "inbox-filter",
                          );
                        }}
                      />
                      <AnimatePresence>
                        {activeMenu === "inbox-filter" && (
                          <Menu className="menu-right">
                            <span className="fw-menu-title">Show</span>
                            {[
                              ["open", "Active thoughts"],
                              ["all", "Everything"],
                              ["archived", "Seed vault"],
                            ].map(([value, label]) => (
                              <button
                                key={value}
                                className={
                                  inboxFilter === value ? "active" : ""
                                }
                                onClick={() => {
                                  setInboxFilter(value);
                                  closeMenus();
                                }}
                              >
                                <span>{label}</span>
                                {inboxFilter === value && <Check size={14} />}
                              </button>
                            ))}
                          </Menu>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="fw-menu-anchor">
                      <IconButton
                        Icon={Ellipsis}
                        label="Inbox menu"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveMenu(
                            activeMenu === "inbox-menu" ? null : "inbox-menu",
                          );
                        }}
                      />
                      <AnimatePresence>
                        {activeMenu === "inbox-menu" && (
                          <Menu className="menu-right wide">
                            <span className="fw-menu-title">Inbox garden</span>
                            <button
                              onClick={() => {
                                setInboxSort(
                                  inboxSort === "newest" ? "oldest" : "newest",
                                );
                                closeMenus();
                              }}
                            >
                              <ListFilter size={15} />
                              <span>
                                Sort{" "}
                                {inboxSort === "newest"
                                  ? "oldest first"
                                  : "newest first"}
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setInboxFilter("archived");
                                closeMenus();
                              }}
                            >
                              <Archive size={15} />
                              <span>Open seed vault</span>
                            </button>
                            <button
                              onClick={() => {
                                setTheme(theme === "soft" ? "paper" : "soft");
                                closeMenus();
                              }}
                            >
                              <Palette size={15} />
                              <span>Change atmosphere</span>
                            </button>
                          </Menu>
                        )}
                      </AnimatePresence>
                    </span>
                  </>
                }
              >
                <div className="fw-inbox-canvas">
                  <div className="fw-inbox-intro">
                    <span className="fw-orbit-dot" />
                    <p>Thoughts land here before they become plans.</p>
                  </div>
                  <form className="fw-capture-box" onSubmit={addInboxTask}>
                    <Sparkles size={18} />
                    <input
                      ref={inboxInputRef}
                      value={taskInput}
                      onChange={(event) => setTaskInput(event.target.value)}
                      placeholder="Catch a thought..."
                    />
                    <button type="submit" aria-label="Add to Inbox">
                      <Send size={16} />
                    </button>
                  </form>
                  <div className="fw-inbox-stack">
                    {filteredInbox.length === 0 && (
                      <div className="fw-empty-state">
                        <img src={logo} alt="" width="34" height="34" />
                        <strong>Quiet soil.</strong>
                        <span>Nothing matches this view yet.</span>
                      </div>
                    )}
                    {filteredInbox.map((task, index) => (
                      <motion.div
                        layout
                        key={task.id}
                        className="fw-inbox-note"
                        whileHover={{ y: -3, rotate: index % 2 ? 0.18 : -0.18 }}
                      >
                        <button className="fw-note-main" onClick={() => convertInbox(task)} title="Send to first list on the Board">
                          <div className="fw-note-seed">
                            <span />
                          </div>
                          <div>
                            <strong>{task.title}</strong>
                            <span>
                              <Mail size={13} /> captured just now{" "}
                              <AlignLeft size={13} />
                            </span>
                          </div>
                        </button>
                        <button className="fw-inbox-promote" onClick={()=>convertInbox(task)} title="Move to Board"><ArrowRight size={15}/></button>
                        <button
                          className="fw-note-archive"
                          onClick={() =>
                            task.archived
                              ? restoreInboxTask(task.id)
                              : archiveInboxTask(task.id)
                          }
                          title={task.archived ? "Restore" : "Archive"}
                        >
                          {task.archived ? (
                            <ArrowRight size={15} />
                          ) : (
                            <Archive size={15} />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <button
                  className="fw-consolidate"
                  onClick={() => {
                    const count = inboxTasks.filter(
                      (item) => !item.archived,
                    ).length;
                    notify(
                      `${count} active thought${count === 1 ? "" : "s"} gathered into one flow.`,
                      true,
                    );
                  }}
                >
                  <WandSparkles size={16} />
                  <span>Consolidate my scattered to-dos</span>
                  <ChevronRight size={15} />
                </button>
              </PanelChrome>
            )}
            {visible.includes("inbox") && (visible.includes("planner") || visible.includes("board")) &&
              <WorkspaceResizeHandle key="resize-after-inbox" left="inbox" right={visible.includes("planner")?'planner':'board'}
                onPointerDown={startResize} onKeyDown={onResizeKeyDown} onReset={resetWidths}/>}

            {visible.includes("planner") && (
              <PanelChrome
                key="planner"
                icon={CalendarDays}
                eyebrow="Time garden"
                title="Planner"
                accent="yellow"
                className="planner-panel"
              >
                <Planner
                  lists={lists}
                  palette={palette}
                  mode={plannerMode}
                  onModeChange={setPlannerMode}
                  readOnly={readOnly}
                  onOpenCard={card => setSelected(card)}
                  onCardPatch={patchCard}
                  onCreateCard={(listId,title,due) => {
                    if (readOnly || !title.trim()) return;
                    const next=lists.map(list=>list.id===listId
                      ? {...list,cards:[...list.cards,{id:Date.now()+Math.floor(Math.random()*1000),title,due,checks:0,done:0,labels:[],checklist:[]}]}
                      : list);
                    setLists(next);syncCurrentBoard(next);notify('Card scheduled in Planner',true);
                  }}
                />
              </PanelChrome>
            )}
            {visible.includes("planner") && visible.includes("board") &&
              <WorkspaceResizeHandle key="resize-after-planner" left="planner" right="board"
                onPointerDown={startResize} onKeyDown={onResizeKeyDown} onReset={resetWidths}/>}

            {visible.includes("board") && (
              <PanelChrome
                key="board"
                icon={Columns3}
                eyebrow="Growing now"
                title={activeBoard?.name || "Board"}
                accent="lavender"
                className="board-panel"
                actions={
                  <>
                    <div className="fm-presence-stack" aria-label="Workspace members">
                      {members.filter(m=>m.user?._id!==user.id).slice(0,5).map(m=><MemberAvatar key={m.user._id} user={m.user} online={onlineMembers.some(x=>x.id===m.user._id)} size={29}/>)}
                    </div>
                    <button className="fw-share-button" onClick={shareBoard}>
                      <Share2 size={15} /> Share
                    </button>
                    <IconButton
                      Icon={Ellipsis}
                      label="Board menu"
                      onClick={() => {
                        setDrawerPanel("root");
                        setBoardMenuOpen(true);
                      }}
                    />
                  </>
                }
              >
                <div className="fw-board-subbar">
                  {activeBoard?.favorite && (
                    <Star
                      className="fw-board-favorite"
                      size={13}
                      fill="currentColor"
                    />
                  )}
                  <div className="fw-board-tools">
                    <div className="fw-view-pills" role="tablist" aria-label="Board views">
                      {['Board','Table','Calendar','Timeline','Dashboard'].map(v=>{const Icon={Board:Columns3,Table:Table2,Calendar:CalendarDays,Timeline:ListFilter,Dashboard:BarChart3}[v];return <button key={v} role="tab" aria-selected={boardView===v} className={boardView===v?'selected':''} onClick={()=>{setBoardView(v);localStorage.setItem(`flowe-board-view:${activeBoard._id}`,v);if(v!=='Board')setVisible(['board'])}}><Icon size={14}/>{v}</button>})}
                    </div>
                    {(activeBoard.automations||[]).filter(r=>r.enabled&&r.trigger==='board-button').map(r=><button className="fw-run-button" key={r.id} onClick={()=>executeButtonRule(r)} title="Run board automation"><Zap size={14}/>{r.name}</button>)}
                    <button
                      className={automationOpen ? "active" : ""}
                      onClick={() => setAutomationOpen(true)}
                    >
                      <Zap size={15} /> Automate
                    </button>
                    <button
                      onClick={() =>
                        setBoardFilter((value) =>
                          value === "all"
                            ? "open"
                            : value === "open"
                              ? "done"
                              : "all",
                        )
                      }
                    >
                      <ListFilter size={15} /> Filter: {boardFilter}
                    </button>
                    <button onClick={() => setGardenOpen(true)}>
                      <Leaf size={15} /> Gardens
                    </button>
                  </div>
                </div>
                {boardView==='Board' ? <KanbanBoard
                  lists={lists} project={activeBoard} workspaceId={workspaceId}
                  user={user} members={members} palette={palette} readOnly={readOnly}
                  filterCards={boardCards}
                  onCreateList={name=>{
                    const colors=['neutral','lav','pink','yellow','mint','blue','peach'];
                    const next=[...lists,{id:Date.now()+Math.floor(Math.random()*1000),title:name,color:colors[lists.length%colors.length],cards:[]}];
                    setLists(next);syncCurrentBoard(next);notify('List added',true);
                  }}
                  onCreateCard={(listId,title)=>{
                    const next=lists.map(l=>l.id===listId?{...l,cards:[...l.cards,{id:Date.now()+Math.floor(Math.random()*1000),title,checks:0,done:0,labels:[],checklist:[]}]}:l);
                    setLists(next);syncCurrentBoard(next);notify('Card added',true);
                  }}
                  onCopyCard={(source,toListId)=>{
                    const created={...structuredClone(source),id:Date.now()+Math.floor(Math.random()*1000),listId:undefined,completed:false,archived:false,checks:0,done:0,checklist:(source.checklist||[]).map(item=>({...item,id:crypto.randomUUID(),done:false}))};
                    created.checks=created.checklist.length;
                    const next=lists.map(l=>l.id===toListId?{...l,cards:[...l.cards,created]}:l);
                    setLists(next);syncCurrentBoard(next);notify('Card created from template');
                  }}
                  onMoveCard={moveCard}
                  onMoveList={reorderListTo}
                  onRepositionList={(id,index)=>{
                    if(readOnly)return;
                    const visible=lists.filter(l=>!l.archived);
                    const source=visible.findIndex(l=>l.id===id);
                    if(source<0||index<0||index>=visible.length)return;
                    const [moved]=visible.splice(source,1);
                    visible.splice(index,0,moved);
                    const next=[...visible,...lists.filter(l=>l.archived)];
                    setLists(next);syncCurrentBoard(next);
                  }}
                  onRenameList={renameList}
                  onCopyList={duplicateList}
                  onMoveAll={moveAllCards}
                  onSort={sortList}
                  onColor={changeListColor}
                  onPin={pinList}
                  onWatch={watchList}
                  onArchive={archiveList}
                  onArchiveCards={listId=>{
                    const next=lists.map(l=>l.id===listId?{...l,cards:l.cards.map(c=>({...c,archived:true}))}:l);
                    setLists(next);syncCurrentBoard(next);notify('Cards archived');
                  }}
                  onComplete={(id,completed)=>patchCard(id,{completed})}
                  onOpenCard={(card,listId)=>setSelected({...card,listId})}
                  onAutomation={preset=>{setAutomationStarter(preset||null);setAutomationOpen(true)}}
                /> : <BoardViews mode={boardView} lists={lists} members={members} palette={palette} projectId={activeBoard?._id} readOnly={readOnly} openCard={c=>setSelected(c)} onCardPatch={patchCard} onMoveCard={moveCard} onCreateCard={(listId,title,due)=>{if(readOnly)return;const next=lists.map(l=>l.id===listId?{...l,cards:[...l.cards,{id:Date.now()+Math.floor(Math.random()*1000),title,due,checks:0,done:0,labels:[],checklist:[]}]}:l);setLists(next);syncCurrentBoard(next);notify('Card scheduled',true)}}/>}
              </PanelChrome>
            )}
          </AnimatePresence>
        </main>
      </LayoutGroup>

      <BloomComposer {...{bloomOpen, gardenPetals, pulse, setBloomOpen, activeCount}} />

      <GardenPicker {...{gardenOpen, setGardenOpen, gardenPinned, setGardenPinned, notify, gardenSearch, setGardenSearch, filteredBoards, boards, boardIndex, changeBoard, openGardenCreator, boardStats, visible, setVisible, setPlannerMode, shareBoard, manageMembers, setBoardView, activeBoard, theme, setTheme}} />

      <NewGardenModal {...{newGardenOpen, setNewGardenOpen, plantGarden, newGardenName, setNewGardenName}} />

      <BoardDrawer {...{boardMenuOpen, setBoardMenuOpen, drawerPanel, setDrawerPanel, activeBoard, boardStats, shareBoard, cycleVisibility, updateBoard, notify, cycleBoardTone, setAutomationOpen, palette, setFilters, canManage, renameLabel, removeLabel, addNewLabel, newLabelName, setNewLabelName, newLabelColor, setNewLabelColor, lists, restoreList, patchCard}} />

      {shareOpen && <Modal title="Share this board" kicker="INVITE YOUR TEAM" close={()=>setShareOpen(false)}><div className="at-body"><p>People with access to this project can use the link below. Workspace administrators can invite new members.</p><label>Board link<input aria-label="Shareable board URL" readOnly onFocus={e=>e.target.select()} value={`${window.location.origin}/workspace/${workspaceId}/project/${activeBoard._id}`}/></label><p className="fw-share-help">Workspace access is required to open this board. Share a workspace invitation with new teammates first.</p><div className="at-inline"><button onClick={copyBoardLink}><CopyPlus size={15}/>Copy link</button><button onClick={()=>{setShareOpen(false);manageMembers()}}><UserPlus size={15}/>Manage members</button></div></div></Modal>}
      {automationOpen && <AutomationStudio starter={automationStarter} rules={activeBoard.automations||[]} lists={lists.filter(l=>!l.archived)} readOnly={readOnly} onClose={()=>{setAutomationOpen(false);setAutomationStarter(null)}} onSave={saveAutomations} onRun={executeButtonRule}/>}
      {selected && (
        <CardDetails
          card={selected}
          project={{ ...activeBoard, lists }}
          workspaceId={workspaceId}
          members={members}
          user={user}
          readOnly={readOnly}
          onClose={() => setSelected(null)}
          onDuplicate={duplicateCard}
          onArchive={archiveCard}
          onConvertStep={convertChecklistItem}
          onCreateLabel={(name,color)=>{
            if(palette.some(l=>l.name.toLowerCase()===name.toLowerCase()))return;
            updateBoard({labelPalette:[...palette,{name,color}]});
          }}
          cardButtons={(activeBoard.automations||[]).filter(r=>r.enabled&&r.trigger==='card-button')}
          onCardButton={executeButtonRule}
          onOpenAutomation={()=>{setSelected(null);setAutomationOpen(true)}}
          onSave={async (card) => {
            const original = lists.find((l) =>
              l.cards.some((c) => c.id === card.id),
            );
            const next = lists.map((l) => ({
              ...l,
              cards:
                l.id === card.listId
                  ? original.id === l.id
                    ? l.cards.map((c) => (c.id === card.id ? card : c))
                    : [...l.cards, card]
                  : l.cards.filter((c) => c.id !== card.id),
            }));
            const project = await persist(activeBoard._id, { lists: next });
            setLists(project?.lists || next);
          }}
        />
      )}
      {settingsOpen && (
        <ProjectSettings
          project={activeBoard}
          members={members}
          user={user}
          close={() => setSettingsOpen(false)}
          onSave={(patch) => persist(activeBoard._id, patch)}
        />
      )}
      <DeadlineModal {...{calendarOpen, setCalendarOpen, lists, setSelected}} />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fw-toast"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
          >
            <span className="fw-toast-seed">
              <Sparkles size={14} />
            </span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
