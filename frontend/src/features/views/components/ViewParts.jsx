import { CheckCircle2, Clock3 } from 'lucide-react';
import { cardLabels, chartPalette } from '../utils/viewData';
export function CardTitle({card,onOpen}){return <button className="bv-card-title" type="button" title={card.title} onClick={()=>onOpen(card)}>{card.completed&&<CheckCircle2 size={14}/>}<span>{card.title}</span></button>}
export function LabelPips({card,palette=[]}){return <span className="bv-label-pips">{cardLabels(card).slice(0,4).map((l,i)=><i key={l} title={l} style={{background:palette.find(p=>p.name===l)?.color||chartPalette[i%chartPalette.length]}}/>)}</span>}
export function DateMark({card}){return card.due?<span className={`bv-date-mark ${!card.completed&&String(card.due).slice(0,10)<new Date().toLocaleDateString('en-CA')?'overdue':''}`}><Clock3 size={13}/>{String(card.due).slice(5,10)}</span>:null}
export function ViewEmpty({text}){return <div className="bv-empty-state">{text}</div>}
