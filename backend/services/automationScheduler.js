import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import Notification from '../models/Notification.js';
import {canRead} from './permissions.js';
import { runTimedRule } from './boardAutomation.js';
// UTC scheduler. A conditional revision update prevents duplicate execution across instances.
export async function tickAutomations(io, now=new Date()) {
  const day=now.toISOString().slice(0,10);
  const candidates=await Project.find({'automations.enabled':true,'automations.trigger':{$in:['daily','weekly','due']}});
  for(const project of candidates){
    const due=(project.automations||[]).filter(r=>r.enabled && ['daily','weekly','due'].includes(r.trigger) && r.lastRun!==day && (r.trigger==='due'||(r.hour===now.getUTCHours() && (r.trigger!=='weekly'||Number(r.weekday??1)===now.getUTCDay()))));
    if(!due.length)continue;
    const lists=project.lists.map(l=>l.toObject());
    for(const rule of due)runTimedRule(lists,rule,now);
    const automations=project.automations.map(r=>({...r.toObject(),lastRun:due.some(x=>x.id===r.id)?day:r.lastRun}));
    const updated=await Project.findOneAndUpdate({_id:project.id,revision:project.revision},{$set:{lists,automations},$inc:{revision:1}},{new:true,runValidators:true});
    if(updated){
      io?.to('p:'+project.id).emit('projectChanged',updated);
      const reminders=due.filter(r=>r.trigger==='due'&&r.action==='remind');
      if(reminders.length){
        const workspace=await Workspace.findById(project.workspace);
        if(!workspace)continue;
        for(const rule of reminders){
          const horizon=new Date(now);horizon.setUTCDate(horizon.getUTCDate()+Number(rule.daysBefore||0));
          const target=horizon.toISOString().slice(0,10);
          for(const list of project.lists)for(const card of list.cards){
            if(card.archived||card.completed||card.due!==target)continue;
            const selected=new Set([card.assignee,...(list.watchers||[])].filter(Boolean).map(String));
            // Cards without assignee or watchers remind the project creator.
            if(!selected.size)selected.add(String(project.createdBy));
            for(const id of selected){
              if(!workspace.members.some(m=>String(m.user)===id)||!canRead(project,workspace,id))continue;
              const note=await Notification.create({user:id,workspace:String(workspace._id),project:String(project._id),card:card.id,kind:'reminder',actor:'Flowe',text:`Reminder: “${card.title}” is due ${card.due} in ${project.name}`.slice(0,240)});
              io?.to('u:'+id).emit('notification',note);
            }
          }
        }
      }
    }
  }
}
