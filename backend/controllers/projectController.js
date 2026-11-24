import CardEvent from "../models/CardEvent.js";
import { applyBoardRules } from "../services/boardAutomation.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import {
  canRead,
  canManage,
  canWrite,
  evictProject,
} from "../services/permissions.js";
import Project from "../models/Project.js";
import { string, fail } from "../utils/http.js";
import { templates, templateLists } from "../services/templates.js";
export function listTemplates(req, res) {
  res.json({ templates });
}
export async function list(req, res) {
  res.json({
    projects: (
      await Project.find({ workspace: req.workspace._id }).sort({
        createdAt: 1,
      })
    ).filter((p) => canRead(p, req.workspace, req.session.userId)),
  });
}
export async function create(req, res) {
  if (!canWrite(req.workspace, req.session.userId))
    fail(403, "Readers cannot create projects");
  const template = req.body.template || "blank";
  let columns = [];
  if (template === "custom") {
    if (
      !Array.isArray(req.body.columns) ||
      req.body.columns.length < 1 ||
      req.body.columns.length > 12
    )
      fail(400, "Choose 1–12 columns");
    columns = req.body.columns.map((c) => string(c, "Column"));
    if (new Set(columns).size !== columns.length)
      fail(400, "Column names must be unique");
  }
  const lists = templateLists(template, columns);
  if (!lists) fail(400, "Unknown template");
  const project = await Project.create({
    workspace: req.workspace._id,
    name: string(req.body.name, "Project name"),
    subtitle:
      template === "custom"
        ? "Your own rhythm"
        : templates.find((t) => t.id === template).name,
    template,
    lists,
    createdBy: req.session.userId,
    visibility: req.body.visibility === "Private" ? "Private" : "Workspace",
    members: [],
  });
  req.app.locals.io?.to('w:'+req.workspace._id).emit('workspaceProjectsChanged',{workspace:String(req.workspace._id)});
  res.status(201).json({ project });
}
export async function update(req, res) {
  const patch = {};
  for (const key of [
    "name",
    "subtitle",
    "lists",
    "favorite",
    "tone",
    "visibility",
    "members",
    "archived",
    "customFields",
    "automations",
    "labelPalette",
  ])
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  if (patch.name !== undefined) patch.name = string(patch.name, "Project name");
  if (!Number.isInteger(req.body.revision) || req.body.revision < 0)
    fail(400, "A project revision is required");
  if (
    patch.lists &&
    (!Array.isArray(patch.lists) ||
      patch.lists.length > 30 ||
      patch.lists.some((l) => !Array.isArray(l.cards) || l.cards.length > 500))
  )
    fail(400, "Project is too large");
  // Document validation runs against a copy before the conditional atomic update.
  const current = await Project.findOne({
    _id: req.params.projectId,
    workspace: req.workspace._id,
  });
  if (!current || !canRead(current, req.workspace, req.session.userId))
    fail(404, "Project not found");
  if (!canWrite(req.workspace, req.session.userId))
    fail(403, "Readers cannot edit");
  if (
    ["visibility", "members", "archived", "customFields"].some(
      (k) => patch[k] !== undefined,
    ) &&
    !canManage(current, req.workspace, req.session.userId)
  )
    fail(
      403,
      "Only the project creator or workspace owner can change settings",
    );
  if (current.archived && patch.archived !== false)
    fail(403, "Restore the project before editing");
  if (
    patch.members &&
    (!Array.isArray(patch.members) ||
      patch.members.some(
        (id) => !req.workspace.members.some((m) => String(m.user) === id),
      ))
  )
    fail(400, "Choose workspace members");
  if (
    patch.customFields &&
    (!Array.isArray(patch.customFields) ||
      patch.customFields.length > 20 ||
      patch.customFields.some(
        (f) =>
          typeof f.name !== "string" ||
          !f.name.trim() ||
          f.name.length > 40 ||
          /[.$]/.test(f.name) ||
          ["__proto__", "constructor", "prototype"].includes(f.name),
      ) ||
      new Set(patch.customFields.map((f) => f.name)).size !==
        patch.customFields.length)
  )
    fail(
      400,
      "Choose up to 20 uniquely named fields without dots or dollar signs",
    );
  if (patch.labelPalette && (!Array.isArray(patch.labelPalette) || patch.labelPalette.length>40 ||
     patch.labelPalette.some(l=>!l.name?.trim()||l.name.length>60 || !/^#[0-9a-fA-F]{6}$/.test(l.color)) ||
     new Set(patch.labelPalette.map(l=>l.name.toLowerCase())).size!==patch.labelPalette.length)) fail(400,'Invalid labels');
  if (patch.automations) {
    if (!Array.isArray(patch.automations) || patch.automations.length > 40 ||
      patch.automations.some(r => !r.id || !r.trigger || !r.action) ||
      new Set(patch.automations.map(r=>r.id)).size !== patch.automations.length)
      fail(400, "Invalid automation rules");
  }
  if (patch.lists) {
    patch.lists = applyBoardRules(current.lists.map(l=>l.toObject()),patch.lists, current.automations || []);
    for(const list of patch.lists){
      if((list.watchers||[]).length>100 || (list.watchers||[]).some(id=>!req.workspace.members.some(m=>String(m.user)===id)))
        fail(400,'Invalid list watchers');
    }
    const cards = patch.lists.flatMap((l) => l.cards),
      ids = new Set(cards.map((c) => c.id));
    if (
      ids.size !== cards.length ||
      new Set(patch.lists.map((l) => l.id)).size !== patch.lists.length
    )
      fail(400, "IDs must be unique");
    const scope = { ...current.toObject(), ...patch };
    for (const c of cards) {
      if (
        c.assignee &&
        (!req.workspace.members.some((m) => String(m.user) === c.assignee) ||
          !canRead(scope, req.workspace, c.assignee))
      )
        fail(400, "Assignee must have project access");
      for (const date of [c.due,c.start]) if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
        fail(400, "Invalid card date");
      if ((c.latitude!==undefined && c.latitude!=='' && (!Number.isFinite(Number(c.latitude)) || Math.abs(Number(c.latitude))>90)) ||
          (c.longitude!==undefined && c.longitude!=='' && (!Number.isFinite(Number(c.longitude)) || Math.abs(Number(c.longitude))>180))) fail(400, "Invalid card coordinates");
      if (c.checklist) {
        c.checks = c.checklist.length;
        c.done = c.checklist.filter((i) => i.done).length;
      }
      if (c.dependencies?.some((id) => id === c.id || !ids.has(id)))
        fail(400, "Invalid prerequisite");
    }
    const visiting = new Set(),
      done = new Set(),
      byId = new Map(cards.map((c) => [c.id, c]));
    function visit(id) {
      if (visiting.has(id)) fail(400, "Circular dependency refused");
      if (done.has(id)) return;
      visiting.add(id);
      for (const d of byId.get(id).dependencies || []) visit(d);
      visiting.delete(id);
      done.add(id);
    }
    cards.forEach((c) => visit(c.id));
  }
  const candidate = new Project({ ...current.toObject(), ...patch });
  await candidate.validate();
  const project = await Project.findOneAndUpdate(
    {
      _id: current._id,
      workspace: req.workspace._id,
      revision: req.body.revision,
    },
    { $set: patch, $inc: { revision: 1 } },
    { new: true, runValidators: true },
  );
  if (!project)
    fail(
      409,
      "This project changed elsewhere. Reload to see the latest version.",
    );
  await evictProject(req.app.locals.io, project._id);
  req.app.locals.io?.to("p:" + project._id).emit("projectChanged", project);
  req.app.locals.io?.to('w:'+req.params.workspaceId).emit('workspaceProjectsChanged',{workspace:req.params.workspaceId});
  if (patch.lists) {
    const actor=await User.findById(req.session.userId).select('name');
    // Persist a readable, card-level change history for the details/activity panel.
    const before = new Map(current.lists.flatMap(l => l.cards.map(c => [c.id, { card:c, list:l }])));
    const events = [];
    for (const nextList of project.lists) for (const nextCard of nextList.cards) {
      const previous = before.get(nextCard.id);
      let message = '';
      if (!previous) message = `added this card to ${nextList.title}`;
      else if (previous.list.id !== nextList.id) message = `moved this card from ${previous.list.title} to ${nextList.title}`;
      else if (previous.card.completed !== nextCard.completed) message = nextCard.completed ? 'marked this card complete' : 'reopened this card';
      else if (previous.card.due !== nextCard.due) message = nextCard.due ? `set the due date to ${nextCard.due}` : 'removed the due date';
      else if (previous.card.start !== nextCard.start) message = 'updated the start date';
      else if (previous.card.title !== nextCard.title) message = 'renamed this card';
      else if (JSON.stringify(previous.card.labels) !== JSON.stringify(nextCard.labels)) message = 'updated card labels';
      else if (previous.card.done !== nextCard.done || previous.card.checks !== nextCard.checks) message = 'updated checklist progress';
      else if (previous.card.archived !== nextCard.archived) message = nextCard.archived ? 'archived this card' : 'restored this card';
      else if (previous.card.detail !== nextCard.detail) message = 'updated the description';
      if (message) events.push({project:String(project._id), card:nextCard.id, actor:actor?.name||'Teammate',kind:'change',text:message});
    }
    if (events.length) {
      try { await CardEvent.insertMany(events,{ordered:false}); }
      catch (error) { console.error('Card history unavailable:',error.message); }
    }
    for(const old of current.lists){
      const updated=project.lists.find(l=>l.id===old.id);
      if(!updated)continue;
      for(const watcher of updated.watchers||[]) {
        if((old.watchers||[]).some(id=>String(id)===String(watcher))||!canRead(project,req.workspace,watcher))continue;
        const note=await Notification.create({user:String(watcher),workspace:req.params.workspaceId,
          project:project.id,kind:'card',actor:actor?.name||'Flowe',text:`You are now watching “${updated.title}”. Changes will appear here.`});
        req.app.locals.io?.to('u:'+watcher).emit('notification',note);
      }
      const changedCards=JSON.stringify(old.cards)!==JSON.stringify(updated.cards);
      const changedSettings=['title','color','pinned','archived','collapsed'].some(key=>String(old[key])!==String(updated[key]));
      if(!changedCards&&!changedSettings)continue;
      for(const id of old.watchers||[]){
        if(!canRead(project,req.workspace,id))continue;
        const note=await Notification.create({user:id,workspace:req.params.workspaceId,project:project.id,actor:actor?.name||'Teammate',kind:'card',text:`${actor?.name||'Someone'} ${changedCards?'updated cards in':'changed settings for'} “${updated.title}”`});
        req.app.locals.io?.to('u:'+id).emit('notification',note);
      }
    }
  }
  res.json({ project });
}
