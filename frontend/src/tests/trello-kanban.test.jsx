
import {beforeEach,describe,expect,test,vi} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '../features/board/components/BoardCanvas';
import CardDetails from '../features/board/components/cards/CardDetailsModal';
import {api} from '../services/apiClient';
vi.mock('../services/apiClient',()=>({api:vi.fn()}));
const user={id:'me',name:'Maya'};
const members=[{user:{_id:'me',name:'Maya'},role:'owner'}];
const source={id:2,title:'Prepare materials',completed:false,due:'2026-11-25',labels:['Urgent','Design'],checklist:[{id:'a',text:'Check files',done:false}],checks:1,done:0};
const lists=[{id:1,title:'To do',color:'lav',pinned:false,watchers:[],cards:[source]}];
const project={_id:'p1',name:'Creative board',visibility:'Workspace',createdBy:'me',labelPalette:[{name:'Urgent',color:'#f28888'},{name:'Design',color:'#bd92df'}],lists};
const callbacks=()=>({onCreateList:vi.fn(),onCreateCard:vi.fn(),onCopyCard:vi.fn(),onMoveCard:vi.fn(),onMoveList:vi.fn(),onRepositionList:vi.fn(),onRenameList:vi.fn(),onCopyList:vi.fn(),onMoveAll:vi.fn(),onSort:vi.fn(),onColor:vi.fn(),onPin:vi.fn(),onWatch:vi.fn(),onArchive:vi.fn(),onArchiveCards:vi.fn(),onComplete:vi.fn(),onOpenCard:vi.fn(),onAutomation:vi.fn()});
function board(options={}){const events=callbacks();render(<KanbanBoard lists={lists} project={project} user={user} members={members} palette={project.labelPalette} workspaceId="w1" filterCards={l=>l.cards} {...events} {...options}/>);return {...events,...options}}
beforeEach(()=>{vi.clearAllMocks();api.mockResolvedValue({badges:{2:{comments:3,files:2}},comments:[],files:[],events:[]})});
describe('Trello-style board interactions',()=>{
  test('creates a list using an inline form instead of a browser prompt',async()=>{
    const u=userEvent.setup();const calls=board();
    await u.click(screen.getByRole('button',{name:/Add another list/i}));
    await u.type(screen.getByLabelText('List name'),'Review');
    await u.click(screen.getByRole('button',{name:'Add list'}));
    expect(calls.onCreateList).toHaveBeenCalledWith('Review');
  });
  test('creates a card from the list footer and collapses/expands the list',async()=>{
    const u=userEvent.setup();const calls=board();
    await u.click(screen.getByRole('button',{name:'Add a card'}));
    await u.type(screen.getByPlaceholderText('Enter a title or paste a link'),'New task');
    await u.click(screen.getByRole('button',{name:'Add card'}));
    expect(calls.onCreateCard).toHaveBeenCalledWith(1,'New task');
    await u.click(screen.getByRole('button',{name:'Collapse list'}));
    expect(screen.queryByText('Prepare materials')).toBeNull();
    await u.click(screen.getByRole('button',{name:'Expand list'}));
    expect(screen.getByText('Prepare materials')).toBeTruthy();
  });
  test('allows watching and pinning a list; colored labels remain compact',async()=>{
    const u=userEvent.setup();const calls=board();
    expect(document.querySelectorAll('.kb-labels span')).toHaveLength(2);
    await u.click(screen.getByRole('button',{name:'Actions for To do'}));
    await u.click(screen.getByRole('menuitem',{name:/Watch list/i}));
    expect(calls.onWatch).toHaveBeenCalledWith(1);
    await u.click(screen.getByRole('button',{name:'Actions for To do'}));
    await u.click(screen.getByRole('menuitem',{name:/Pin list/i}));
    expect(calls.onPin).toHaveBeenCalledWith(1);
  });
});
describe('Card detail modal',()=>{
  test('shows a dual-column panel, allows checklist items and hides activity',async()=>{
    const u=userEvent.setup();const save=vi.fn().mockResolvedValue(undefined);
    render(<CardDetails card={{...source,listId:1}} project={project} workspaceId="w1" user={user} members={members} onSave={save} onClose={vi.fn()}/>);
    expect(screen.getByText('Comments and activity')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getByText('Design')).toBeTruthy();
    await u.type(screen.getByLabelText('New checklist item'),'Test checklist');
    await u.click(screen.getByRole('button',{name:'Add an item'}));
    await u.click(screen.getByLabelText('Complete Test checklist'));
    await u.click(screen.getByRole('button',{name:'Hide details'}));
    expect(screen.queryByText('Comments and activity')).toBeNull();
    await u.click(screen.getByRole('button',{name:'Save changes'}));
    await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({checks:2,done:1})));
  });
});
