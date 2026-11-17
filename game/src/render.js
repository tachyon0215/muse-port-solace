// Canvas renderer: camera follows the player; HUD with health, money, wanted stars and minimap.
import { VIEW, WORLD, FONT, PALETTE } from './config.js';
export const SCREEN_TITLE='title'; export const SCREEN_PLAY='play'; export const SCREEN_PAUSED='paused'; export const SCREEN_OVER='over';
export function createRenderer(canvas){
  const ctx=canvas.getContext('2d'); const view={scale:1,x:0,y:0};
  function resize(){ const r=window.devicePixelRatio||1; canvas.width=Math.round(innerWidth*r); canvas.height=Math.round(innerHeight*r); view.scale=Math.min(canvas.width/VIEW.width,canvas.height/VIEW.height); view.x=(canvas.width-VIEW.width*view.scale)/2; view.y=(canvas.height-VIEW.height*view.scale)/2; }
  function text(s,x,y,size,color,align='left'){ ctx.font=`${size}px ${FONT}`; ctx.fillStyle=color; ctx.textAlign=align; ctx.textBaseline='top'; ctx.fillText(s,x,y); }
  function drawCar(c,flash){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.angle);
    ctx.fillStyle=c.police?'#e8edf2':c.color; ctx.fillRect(-22,-11,44,22);
    ctx.fillStyle='#1c2733'; ctx.fillRect(-8,-9,16,18); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(8,-9,5,18);
    ctx.fillStyle='#111'; [-14,14].forEach(wx=>[-12,10].forEach(wy=>ctx.fillRect(wx-4,wy,8,3)));
    if(c.police){ ctx.fillStyle=flash?'#e5534b':'#3a7bd5'; ctx.fillRect(-6,-4,12,8); }
    ctx.restore(); }
  function drawWorld(state){
    const p=state.player; const camX=Math.max(0,Math.min(WORLD.size-VIEW.width,p.x-VIEW.width/2)); const camY=Math.max(0,Math.min(WORLD.size-VIEW.height,p.y-VIEW.height/2));
    ctx.save(); ctx.translate(-camX,-camY);
    ctx.fillStyle=PALETTE.grass; ctx.fillRect(camX,camY,VIEW.width,VIEW.height);
    // roads
    ctx.fillStyle=PALETTE.road; for(let i=0;i<5;i++){ ctx.fillRect(i*WORLD.block,camY,WORLD.road,VIEW.height); ctx.fillRect(camX,i*WORLD.block,VIEW.width,WORLD.road); }
    ctx.fillStyle=PALETTE.sidewalk; for(let i=0;i<5;i++){ ctx.fillRect(i*WORLD.block+WORLD.road,camY,6,VIEW.height); ctx.fillRect(camX,i*WORLD.block+WORLD.road,VIEW.width,6); }
    // crosswalks at every intersection
    ctx.fillStyle='rgba(240,240,240,.5)'; for(let i=0;i<5;i++) for(let j=0;j<5;j++){ const ix=i*WORLD.block, iy=j*WORLD.block; if(ix+WORLD.road<camX||iy+WORLD.road<camY||ix>camX+VIEW.width||iy>camY+VIEW.height) continue; for(let sIdx=0;sIdx<5;sIdx++){ ctx.fillRect(ix+8+sIdx*22,iy+4,12,10); ctx.fillRect(ix+8+sIdx*22,iy+WORLD.road-14,12,10); } }
    ctx.strokeStyle=PALETTE.roadLine; ctx.setLineDash([18,16]); ctx.lineWidth=3; ctx.beginPath();
    for(let i=0;i<5;i++){ ctx.moveTo(i*WORLD.block+60,camY); ctx.lineTo(i*WORLD.block+60,camY+VIEW.height); ctx.moveTo(camX,i*WORLD.block+60); ctx.lineTo(camX+VIEW.width,i*WORLD.block+60); } ctx.stroke(); ctx.setLineDash([]);
    // buildings
    for(const b of state.buildings){ if(b.x+b.w<camX||b.y+b.h<camY||b.x>camX+VIEW.width||b.y>camY+VIEW.height)continue;
      ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,b.w,b.h); ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.strokeRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='rgba(255,235,170,.55)'; for(let wy=b.y+18;wy<b.y+b.h-14;wy+=34) for(let wx=b.x+16;wx<b.x+b.w-14;wx+=34) ctx.fillRect(wx,wy,14,10);
      if(b.name) text(b.name,b.x+b.w/2,b.y+b.h/2-10,17,'#ffffff','center'); }
    // mission marker
    const mk=state._marker; if(mk){ const bob=Math.sin(state.elapsed*4)*6; ctx.fillStyle=PALETTE.marker; ctx.beginPath(); ctx.arc(mk.x,mk.y+bob,20,0,7); ctx.fill(); ctx.fillStyle='#111'; text('!',mk.x,mk.y+bob-11,22,'#111','center'); ctx.strokeStyle=PALETTE.marker; ctx.beginPath(); ctx.arc(mk.x,mk.y,30+Math.sin(state.elapsed*4)*4,0,7); ctx.stroke(); }
    for(const pk of state.pickups){ if(pk.taken)continue; ctx.fillStyle='#7bd88a'; ctx.beginPath(); ctx.arc(pk.x,pk.y,10,0,7); ctx.fill(); text('$',pk.x,pk.y-8,14,'#0c2a12','center'); }
    for(const ped of state.peds){ ctx.fillStyle=ped.down>0?'#666':ped.color; ctx.beginPath(); ctx.arc(ped.x,ped.y,ped.down>0?12:8,0,7); ctx.fill(); ctx.fillStyle='#f2c9a0'; ctx.beginPath(); ctx.arc(ped.x,ped.y,4,0,7); ctx.fill(); }
    for(const c of state.cars) if(c!==p.inCar) drawCar(c,false);
    for(const cop of state.police) drawCar(cop,Math.floor(state.elapsed*4)%2===0);
    if(p.inCar) drawCar(p.inCar, false);
    else { ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(p.x,p.y,11,0,7); ctx.fill(); ctx.fillStyle='#264653'; ctx.beginPath(); ctx.arc(p.x+Math.cos(p.face)*5,p.y+Math.sin(p.face)*5,5,0,7); ctx.fill(); }
    ctx.restore(); return {camX,camY};
  }
  function drawMinimap(state){ const s=150, x=VIEW.width-s-16, y=16, k=s/WORLD.size;
    ctx.fillStyle='rgba(10,14,20,.8)'; ctx.fillRect(x,y,s,s); ctx.strokeStyle='#fff3'; ctx.strokeRect(x,y,s,s);
    ctx.fillStyle='#596068'; for(let i=0;i<5;i++){ ctx.fillRect(x+i*WORLD.block*k,y,WORLD.road*k,s); ctx.fillRect(x,y+i*WORLD.block*k,s,WORLD.road*k); }
    const dot=(o,c,r)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x+o.x*k,y+o.y*k,r,0,7); ctx.fill(); };
    state.cars.forEach(c=>dot(c,'#bbb',2)); state.police.forEach(c=>dot(c,'#4da3ff',3));
    if(state._marker) dot(state._marker,PALETTE.marker,4); dot(state.player,'#ffd166',4);
    text('PORT SOLACE',x+s/2,y+s+4,12,PALETTE.text,'center'); }
  function drawHud(state){ const p=state.player;
    ctx.fillStyle='rgba(10,14,20,.65)'; ctx.fillRect(14,14,300,86);
    text(`$${Math.floor(p.money)}`,26,20,28,PALETTE.money);
    ctx.fillStyle='#3a2020'; ctx.fillRect(26,56,180,16); ctx.fillStyle=PALETTE.health; ctx.fillRect(26,56,180*Math.max(0,p.health)/100,16);
    text(`HP ${Math.ceil(p.health)}`,212,54,16,PALETTE.text);
    let stars=''; for(let i=0;i<5;i++) stars+= i<p.wanted?'★':'☆'; text(stars,26,74,20,PALETTE.star);
    if(p.inCar) text(`DRIVING — E to exit · ${Math.round(Math.abs(p.inCar.speed)*0.24)} km/h`,330,20,16,PALETTE.text); else text('ON FOOT — E to enter a nearby car',330,20,16,PALETTE.text);
    if(state.mission.id===1&&state.mission.stage===1) text(`Parcel timer ${Math.floor(state.mission.time)}s — hurry for a bonus`,330,42,15,PALETTE.marker);
    if(state.mission.id===2) text(`Race time ${Math.floor(state.mission.time)}s`,330,42,15,PALETTE.marker);
    text(state.message,VIEW.width/2,VIEW.height-64,19,PALETTE.text,'center');
    if(state._marker) text(state._marker.label,VIEW.width/2,VIEW.height-36,16,PALETTE.marker,'center');
    drawMinimap(state); }
  function panel(title,lines,prompt){ ctx.fillStyle=PALETTE.panel; const w=680,h=150+lines.length*30; ctx.fillRect((VIEW.width-w)/2,(VIEW.height-h)/2,w,h);
    text(title,VIEW.width/2,(VIEW.height-h)/2+28,44,PALETTE.text,'center'); lines.forEach((l,i)=>text(l,VIEW.width/2,(VIEW.height-h)/2+96+i*30,20,PALETTE.muted,'center'));
    text(prompt,VIEW.width/2,(VIEW.height-h)/2+h-42,22,PALETTE.marker,'center'); }
  function draw(state,screen,best){ state._marker=state._marker||null;
    ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle=PALETTE.backdrop; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y); drawWorld(state);
    if(screen===SCREEN_TITLE){ panel('PORT SOLACE',['A small harbor city, one borrowed car at a time.','Play as courier Rin Vale: run parcels, loop the checkpoints,','dodge the Harbor Patrol, and bank your earnings.','WASD / Arrows move · E enter/exit car · Shift sprint · P pause',`Best earnings saved: $${best||0}`],'Press Space or click to start'); return; }
    drawHud(state);
    if(screen===SCREEN_PAUSED) panel('Paused',['The city waits.'],'Press P to resume');
    else if(screen===SCREEN_OVER) panel('BUSTED & BROKE',['Rin was stopped by the Harbor Patrol.',`Jobs done: ${state.mission.done} · Money banked: $${Math.floor(state.player.money)}`,`Best: $${best||0}`],'Press Space or click to try again');
  }
  resize(); addEventListener('resize',resize); return { draw };
}
