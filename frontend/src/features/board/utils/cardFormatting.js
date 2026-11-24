export const COVER_PALETTE=['#d7bcec','#e7a0ba','#edbb72','#a9d8c5','#90c8e1','#f1c2aa','#e9e5dd'];
export const initials = value => (value||'?').split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
export const formatDate = date => date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';

