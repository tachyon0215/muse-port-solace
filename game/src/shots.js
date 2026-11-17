// Screenshot scenes ?shot=start|play|end — deterministic for a given seed.
// start: title over a live city. play: Rin driving with a mission active, traffic,
// pedestrians and a 2-star Harbor Patrol chase. end: the busted / game-over screen.
import { STEP } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
function driveToward(world,target){
  const s=world.state, c=s.player.inCar, pos=c||s.player;
  const dx=target.x-pos.x, dy=target.y-pos.y;
  if(!c) return { x:Math.sign(dx), y:Math.sign(dy), sprint:true };
  // Steer car: desired angle vs car angle -> left/right, mostly forward.
  const want=Math.atan2(dy,dx); let d=want-c.angle; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
  return { x: d>0.25?1:d<-0.25?-1:0, y:-1 };
}
export function stageShot(name, world){
  world.reset(); const s=world.state;
  if(name!=='play' && name!=='end'){
    for(let i=0;i<5/STEP;i++) world.step(STEP,{x:0,y:0},true);
    s._marker=world.marker(); return { screen: SCREEN_TITLE, best: 0 };
  }
  if(name==='play'){
    // Walk to the parked car at (150,60) and get in, then drive toward the cafe marker.
    for(let i=0;i<3/STEP;i++){ const c=s.cars[0]; const ctrl = s.player.inCar? driveToward(world,world.marker()) : { x: Math.sign(c.x-s.player.x), y: Math.sign(c.y-s.player.y), interact:false };
      if(!s.player.inCar && Math.hypot(c.x-s.player.x,c.y-s.player.y)<40) ctrl.interact=true;
      world.step(STEP,ctrl,false); }
    if(!s.player.inCar){ // guarantee the staged scene shows driving
      const c=s.cars[0]; s.player.inCar=c; c.parked=false; c.x=300; c.y=60; c.angle=0; s.player.x=c.x; s.player.y=c.y;
      for(let i=0;i<1/STEP;i++) world.step(STEP,{x:0,y:-1},false);
    }
    s.player.wanted=2; s.mission={id:1,stage:1,time:0,done:0}; s.message='Parcel aboard! Deliver it to Harborlight Clinic.';
    // Spawn patrol close enough to be in frame.
    s.police.length=0; s.police.push({x:s.player.x-260,y:s.player.y+140,angle:0.6,speed:200,police:true,color:'#e8edf2'},{x:s.player.x-340,y:s.player.y-120,angle:-0.4,speed:200,police:true,color:'#e8edf2'});
    s._marker=world.marker(); return { screen: SCREEN_PLAY, best: s.player.money };
  }
  // end: play briefly, then show the busted screen with banked stats.
  for(let i=0;i<4/STEP;i++) world.step(STEP,{x:1,y:0},true);
  s.player.money=410; s.mission.done=2; s.player.health=0; s.over=true; s._marker=world.marker();
  return { screen: SCREEN_OVER, best: 410 };
}
