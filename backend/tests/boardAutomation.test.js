import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBoardRules,executeRule,runTimedRule } from '../services/boardAutomation.js';
const initial=()=>[
 {id:1,title:'To do',cards:[{id:7,title:'Prepare slides',labels:[],completed:false,checklist:[{id:'a',text:'Draft',done:false}],due:'2026-11-28'}]},
 {id:2,title:'Review',cards:[]},
 {id:3,title:'Done',cards:[]}
];
test('moving card into review adds one label without changing other cards',()=>{
 const before=initial(),after=structuredClone(before),c=after[0].cards.shift();after[1].cards.push(c);
 applyBoardRules(before,after,[{trigger:'on-move',sourceList:'2',action:'label',label:'Needs review',enabled:true}]);
 assert.deepEqual(after[1].cards[0].labels,['Needs review']);
 applyBoardRules(before,after,[{trigger:'on-move',sourceList:'2',action:'label',label:'Needs review',enabled:true}]);
 assert.deepEqual(after[1].cards[0].labels,['Needs review']);
});
test('checklist completion can finish card',()=>{
 const before=initial(),after=structuredClone(before);after[0].cards[0].checklist[0].done=true;
 applyBoardRules(before,after,[{trigger:'on-checklist',action:'complete',enabled:true}]);
 assert.equal(after[0].cards[0].completed,true);
});
test('disabled rules never modify board',()=>{
 const before=initial(),after=structuredClone(before);after[0].cards[0].completed=true;
 applyBoardRules(before,after,[{trigger:'on-complete',action:'priority',enabled:false}]);
 assert.equal(after[0].cards[0].priority,undefined);
});
test('card button can move to target list and keep card id',()=>{
 const after=initial();executeRule(after,{action:'move',targetList:'3'},7);
 assert.equal(after[0].cards.length,0);assert.equal(after[2].cards[0].id,7);
});
test('due date rule flags cards on its horizon',()=>{
 const after=initial();runTimedRule(after,{trigger:'due',action:'label',daysBefore:1,label:'Due soon'},new Date('2026-11-27T10:00:00Z'));
 assert.deepEqual(after[0].cards[0].labels,['Due soon']);
});
test('scheduled sort prioritizes earlier deadlines',()=>{
 const after=initial();after[0].cards.push({id:8,title:'Later',due:'2026-11-29'});after[0].cards.unshift({id:9,title:'Soon',due:'2026-11-23'});
 runTimedRule(after,{trigger:'daily',action:'sort',targetList:'1'},new Date());
 assert.deepEqual(after[0].cards.map(c=>c.id),[9,7,8]);
});
