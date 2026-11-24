import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardViews from '../features/views/components/BoardViews';

const lists=[{id:1,title:'To do',color:'lav',cards:[{id:11,title:'Build homepage',start:'2026-11-20',due:'2026-11-23',priority:'Medium',labels:['Design'],completed:false},{id:12,title:'Create notes',completed:false,labels:[]}]}];
const palette=[{name:'Design',color:'#c19bd9'}];
const events=()=>({onCardPatch:vi.fn(),onCreateCard:vi.fn(),onMoveCard:vi.fn(),openCard:vi.fn()});
const show=(mode,callbacks=events())=>{render(<BoardViews mode={mode} lists={lists} members={[]} palette={palette} projectId="demo-views" {...callbacks}/>);return callbacks};

beforeEach(()=>localStorage.clear());
describe('board alternate views',()=>{
  test('table can edit a priority in place',async()=>{
    const cb=show('Table');const user=userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Priority for Build homepage'),'High');
    expect(cb.onCardPatch).toHaveBeenCalledWith(11,{priority:'High'});
  });
  test('calendar switches between month and week and creates dated cards',async()=>{
    const cb=show('Calendar');const user=userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Calendar layout'),'Week');
    expect(document.querySelectorAll('.bv-cal-week')).toHaveLength(1);
    await user.click(screen.getAllByRole('button',{name:/Add card on/})[0]);
    await user.type(screen.getByPlaceholderText('What needs to get done?'),'New session');
    await user.click(screen.getByRole('button',{name:'Add card'}));
    expect(cb.onCreateCard).toHaveBeenCalledWith(1,'New session',expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
  test('timeline supports the five time scales and group selector',async()=>{
    show('Timeline');const user=userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Timeline scale'),'Quarter');
    await user.selectOptions(screen.getByLabelText('Timeline group by'),'Member');
    expect(screen.getByLabelText('Timeline scale').value).toBe('Quarter');
    expect(screen.getByLabelText('Timeline group by').value).toBe('Member');
  });
  test('dashboard creates and customizes charts',async()=>{
    show('Dashboard');const user=userEvent.setup();
    await user.click(screen.getAllByRole('button',{name:'Add a chart'})[0]);
    await user.click(screen.getByRole('button',{name:'Pie chart'}));
    await user.type(screen.getByPlaceholderText('Cards per list'),'Custom dashboard chart');
    await user.click(screen.getByRole('button',{name:'Add chart'}));
    expect(screen.getByText('Custom dashboard chart')).toBeTruthy();
  });
});
