// Port Solace world: city grid, player on foot / in car, traffic, pedestrians,
// police & wanted stars, cash pickups, and two repeatable missions. No DOM here.
import { WORLD, PLAYER, CAR, PLACES, CAR_COLORS, BUILDING_COLORS } from './config.js';
export const EVENT_OVER = 4;
export const EVENT_CRIME = 8;
export const EVENT_CASH = 16;
export const EVENT_MISSION = 32;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function isRoad(x,y){ return (x % WORLD.block) < WORLD.road || (y % WORLD.block) < WORLD.road; }
function circleRect(cx,cy,r,b){ const nx=clamp(cx,b.x,b.x+b.w), ny=clamp(cy,b.y,b.y+b.h); return Math.hypot(cx-nx,cy-ny) < r; }
function pushOut(p,r,b){ // push circle centre out of rect (expanded by r)
  const ex=b.x-r, ey=b.y-r, ew=b.w+2*r, eh=b.h+2*r;
  if (p.x>ex && p.x<ex+ew && p.y>ey && p.y<ey+eh){
    const dl=p.x-ex, dr=ex+ew-p.x, dt=p.y-ey, db=ey+eh-p.y, m=Math.min(dl,dr,dt,db);
    if (m===dl)p.x=ex; else if(m===dr)p.x=ex+ew; else if(m===dt)p.y=ey; else p.y=ey+eh;
  }
}
export const CHECKPOINTS = [{x:540,y:60},{x:1020,y:540},{x:1500,y:1020},{x:1980,y:1500},{x:540,y:1980}];
export const DELIVERY_PICKUP = { x:60, y:540, label:'Compass Cafe' };
export const DELIVERY_DROP = { x:1500, y:60, label:'Harborlight Clinic' };

export function createWorld(random){
  const buildings=[];
  for(let by=0;by<5;by++) for(let bx=0;bx<5;bx++){
    const x=bx*WORLD.block+WORLD.road+28, y=by*WORLD.block+WORLD.road+28, w=300, h=300;
    buildings.push({x,y,w,h,color:BUILDING_COLORS[(bx*5+by)%BUILDING_COLORS.length],name:PLACES[bx*5+by]});
    buildings.push({x:x+170,y:y+190,w:110,h:90,color:BUILDING_COLORS[(bx+by+3)%BUILDING_COLORS.length],name:''});
  }
  const player={x:70,y:70,angle:0,health:PLAYER.health,money:60,wanted:0,inCar:null,face:0};
  const state={player,buildings,cars:[],peds:[],police:[],pickups:[],elapsed:0,crimeTimer:0,policeTimer:0,hurtTimer:0,
    mission:{id:0,stage:0,time:0,done:0}, message:'Explore Port Solace. Find the gold marker to start a job.', over:false};
  function roadCenter(i){ return i*WORLD.block + WORLD.road/2; }
  function makeCar(x,y,angle,color,traffic){ return {x,y,angle,speed:0,color,traffic:!!traffic,police:false,parked:!traffic,turnCd:0}; }
  function reset(){
    player.x=70; player.y=70; player.health=PLAYER.health; player.money=60; player.wanted=0; player.inCar=null; player.face=0;
    state.elapsed=0; state.crimeTimer=0; state.policeTimer=0; state.hurtTimer=0; state.over=false;
    state.mission={id:0,stage:0,time:0,done:0}; state.message='Explore Port Solace. Find the gold marker to start a job.';
    state.cars=[]; state.police=[]; state.peds=[]; state.pickups=[];
    // Parked cars the player can take (original model names in render only via colour).
    const spots=[[150,60,0],[60,330,Math.PI/2],[540,150,0],[1080,60,Math.PI],[60,1050,Math.PI/2],[1560,540,0],[2040,1080,Math.PI],[900,1980,0]];
    spots.forEach((s,i)=>state.cars.push(makeCar(s[0],s[1],s[2],CAR_COLORS[i%CAR_COLORS.length],false)));
    // Traffic AI: cars cruising straight along roads, turning at intersections.
    for(let i=0;i<14;i++){
      const horiz=random()<0.5, lane=Math.floor(random()*5), along=200+random()*2000, dir=random()<0.5?1:-1;
      const c=horiz? makeCar(along,roadCenter(lane)+(dir>0?28:-28),dir>0?0:Math.PI,CAR_COLORS[Math.floor(random()*CAR_COLORS.length)],true)
                   : makeCar(roadCenter(lane)+(dir>0?28:-28),along,dir>0?Math.PI/2:-Math.PI/2,CAR_COLORS[Math.floor(random()*CAR_COLORS.length)],true);
      c.speed=110+random()*70; c.dir=dir; state.cars.push(c);
    }
    // Pedestrians strolling on sidewalks beside roads.
    for(let i=0;i<18;i++){
      const horiz=random()<0.5, lane=Math.floor(random()*5);
      const px=horiz? 100+random()*2200 : roadCenter(lane)+WORLD.road/2+14;
      const py=horiz? roadCenter(lane)+WORLD.road/2+14 : 100+random()*2200;
      state.peds.push({x:px,y:py,angle:random()*Math.PI*2,speed:32+random()*30,color:CAR_COLORS[Math.floor(random()*CAR_COLORS.length)],down:0,axis:horiz?'x':'y',dir:random()<0.5?1:-1});
    }
    for(let i=0;i<8;i++) state.pickups.push({x:roadCenter(Math.floor(random()*5)),y:roadCenter(Math.floor(random()*5)),taken:false});
  }
  function addWanted(n){ if(state.crimeTimer<=0){ player.wanted=clamp(player.wanted+n,0,5); state.crimeTimer=1.2; } }
  function marker(){
    const m=state.mission;
    if(m.id===0) return {x:DELIVERY_PICKUP.x,y:DELIVERY_PICKUP.y,label:'Job: Package Run — go to Compass Cafe'};
    if(m.id===1) return m.stage===0?{x:DELIVERY_PICKUP.x,y:DELIVERY_PICKUP.y,label:'Pick up the parcel at Compass Cafe'}:{x:DELIVERY_DROP.x,y:DELIVERY_DROP.y,label:'Deliver the parcel to Harborlight Clinic'};
    if(m.id===2){ const c=CHECKPOINTS[m.stage]; return c?{x:c.x,y:c.y,label:`Checkpoint ${m.stage+1}/${CHECKPOINTS.length} — drive through it`}:{x:540,y:60,label:'Race done'}; }
    return {x:DELIVERY_PICKUP.x,y:DELIVERY_PICKUP.y,label:'Free roam — return to Compass Cafe for more work'};
  }
  function completeMission(reward,events){
    player.money+=reward; state.mission.done++;
    state.message=`Job complete! +$${reward}. Head to Compass Cafe for the next job.`;
    state.mission={id:0,stage:0,time:0,done:state.mission.done}; return events|EVENT_MISSION;
  }
  function updateMission(dt){
    let ev=0; const m=state.mission, mk=marker(); const pos=player.inCar||player;
    if(m.id===0){ if(dist(pos,mk)<44){ state.mission={id:(state.mission.done%2===0)?1:2,stage:0,time:0,done:m.done}; state.message= state.mission.id===1?'Package Run: collect the parcel.':'Harbor Loop: get in a car and hit every checkpoint!'; } return ev; }
    if(m.id===1){ if(m.stage===1) m.time+=dt; if(dist(pos,mk)<44){ if(m.stage===0){ m.stage=1; m.time=0; state.message='Parcel aboard! Fast delivery to Harborlight Clinic earns a bonus.'; ev|=EVENT_MISSION; } else { const bonus=Math.max(0,120-Math.floor(m.time)*2); ev=completeMission(250+bonus,ev); } } return ev; }
    if(m.id===2){ m.time+=dt; if(player.inCar && dist(pos,mk)<52){ m.stage++; ev|=EVENT_MISSION; if(m.stage>=CHECKPOINTS.length) ev=completeMission(400,ev); else state.message=`Checkpoint ${m.stage}/${CHECKPOINTS.length} cleared!`; } return ev; }
    return ev;
  }
  function collideBuildings(p,r){ for(const b of buildings) if(circleRect(p.x,p.y,r,b)) pushOut(p,r,b); p.x=clamp(p.x,16,WORLD.size-16); p.y=clamp(p.y,16,WORLD.size-16); }
  function step(dt,ctrl,harmless){
    let ev=0; if(state.over) return ev;
    state.elapsed+=dt; if(state.crimeTimer>0)state.crimeTimer-=dt; if(state.hurtTimer>0)state.hurtTimer-=dt;
    // Wanted slowly cools off when no fresh crime.
    state.policeTimer+=dt; if(state.policeTimer>26){ state.policeTimer=0; if(player.wanted>0 && !harmless) player.wanted--; }
    // --- player ---
    if(ctrl.interact && !harmless){
      if(player.inCar){ const c=player.inCar; player.inCar=null; player.x=c.x+26; player.y=c.y; c.parked=true; c.speed=0; collideBuildings(player,PLAYER.radius); }
      else { let best=null,bd=52; for(const c of state.cars){ const d=dist(player,c); if(d<bd){bd=d;best=c;} } if(best){ player.inCar=best; best.parked=false; } }
    }
    if(player.inCar){
      const c=player.inCar; const fwd=ctrl.y<0?1:ctrl.y>0?-1:0;
      if(fwd>0) c.speed=Math.min(CAR.maxSpeed,c.speed+CAR.accel*dt); else if(fwd<0) c.speed=Math.max(-CAR.reverse,c.speed-CAR.accel*dt);
      else c.speed*=Math.max(0,1-2.2*dt);
      if(Math.abs(c.speed)>4) c.angle += ctrl.x * CAR.turn * dt * (c.speed>0?1:-1) * clamp(Math.abs(c.speed)/160,0.35,1);
      c.x+=Math.cos(c.angle)*c.speed*dt; c.y+=Math.sin(c.angle)*c.speed*dt;
      collideBuildings(c,CAR.radius); player.x=c.x; player.y=c.y; player.face=c.angle;
      // Collisions with traffic / peds while driving.
      for(const o of state.cars){ if(o!==c && dist(c,o)<34){ o.x+=Math.cos(c.angle)*30; o.y+=Math.sin(c.angle)*30; if(!harmless){ addWanted(1); ev|=EVENT_CRIME; player.health-=2; } c.speed*=-0.25; } }
      for(const p of state.peds){ if(p.down<=0 && dist(c,p)<26 && Math.abs(c.speed)>40){ p.down=6; if(!harmless){ addWanted(1); ev|=EVENT_CRIME; state.message='You hit a pedestrian! The Harbor Patrol is after you.'; } } }
    } else {
      const len=Math.hypot(ctrl.x,ctrl.y)||1; const sp=ctrl.sprint?PLAYER.sprint:PLAYER.walk;
      if(ctrl.x||ctrl.y){ player.x+=ctrl.x/len*sp*dt; player.y+=ctrl.y/len*sp*dt; player.face=Math.atan2(ctrl.y,ctrl.x); }
      collideBuildings(player,PLAYER.radius);
      for(const o of state.cars){ if(o.traffic && dist(player,o)<28 && Math.abs(o.speed)>60){ if(state.hurtTimer<=0 && !harmless){ player.health-=12; state.hurtTimer=1; player.x+=Math.cos(o.angle)*24; player.y+=Math.sin(o.angle)*24; } } }
    }
    // --- traffic AI ---
    for(const c of state.cars){ if(!c.traffic) continue;
      c.x+=Math.cos(c.angle)*c.speed*dt; c.y+=Math.sin(c.angle)*c.speed*dt;
      if(c.x<20)c.x=WORLD.size-20; if(c.x>WORLD.size-20)c.x=20; if(c.y<20)c.y=WORLD.size-20; if(c.y>WORLD.size-20)c.y=20;
      c.turnCd-=dt;
      const nearCross = Math.abs((c.x%WORLD.block)-WORLD.road/2)<10 && Math.abs((c.y%WORLD.block)-WORLD.road/2)<10;
      if(nearCross && c.turnCd<=0 && random()<0.012){ c.angle += (random()<0.5?1:-1)*Math.PI/2; c.turnCd=3; }
      if(circleRect(c.x,c.y,CAR.radius,buildings[0])){} // buildings never sit on roads
    }
    // --- pedestrians ---
    for(const p of state.peds){ if(p.down>0){ p.down-=dt; continue; }
      if(p.axis==='x'){ p.x+=p.dir*p.speed*dt; if(p.x<30||p.x>WORLD.size-30)p.dir*=-1; p.angle=p.dir>0?0:Math.PI; }
      else { p.y+=p.dir*p.speed*dt; if(p.y<30||p.y>WORLD.size-30)p.dir*=-1; p.angle=p.dir>0?Math.PI/2:-Math.PI/2; }
    }
    // --- police ---
    const want = harmless?0:player.wanted;
    while(state.police.length < want){ const a=random()*Math.PI*2; state.police.push({x:clamp(player.x+Math.cos(a)*520,30,WORLD.size-30),y:clamp(player.y+Math.sin(a)*520,30,WORLD.size-30),angle:0,speed:0,police:true,color:'#e8edf2'}); }
    if(state.police.length > want) state.police.length = want;
    for(const cop of state.police){
      const target=player.inCar||player; const wantAngle=Math.atan2(target.y-cop.y,target.x-cop.x);
      let d=wantAngle-cop.angle; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
      cop.angle+=clamp(d,-2.4*dt,2.4*dt); const dd=dist(cop,target);
      cop.speed = dd>60 ? 300 : 140; cop.x+=Math.cos(cop.angle)*cop.speed*dt; cop.y+=Math.sin(cop.angle)*cop.speed*dt;
      collideBuildings(cop,CAR.radius);
      if(dd<34 && state.hurtTimer<=0 && !harmless){ player.health-=9; state.hurtTimer=0.8; state.message='Harbor Patrol is ramming you! Break away to cool your stars.'; if(player.inCar) player.inCar.speed*=0.4; }
    }
    // --- pickups & health ---
    for(const pk of state.pickups){ if(!pk.taken && dist(player,pk)<26){ pk.taken=true; if(!harmless){ player.money+=20; ev|=EVENT_CASH; } } }
    if(player.wanted===0 && player.health>0) player.health=Math.min(PLAYER.health,player.health+1.6*dt);
    if(!harmless) ev|=updateMission(dt);
    if(player.health<=0){ player.health=0; state.over=true; ev|=EVENT_OVER; }
    return ev;
  }
  reset();
  return { state, reset, step, marker };
}
