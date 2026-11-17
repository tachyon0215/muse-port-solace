// Port Solace boot & loop. ?seed=N fixes the city. ?shot=start|play|end stages a scene,
// paints twice and sets window.__shotReady (same contract as the starter).
import { STEP, SAVE_KEY } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
const MAX_FRAME=0.25;
const params=new URLSearchParams(location.search); const shot=params.get('shot');
const seedParam=Number.parseInt(params.get('seed')??'',10); const seed=Number.isInteger(seedParam)?seedParam:Math.floor(Math.random()*4294967296);
const canvas=document.getElementById('game'); const status=document.getElementById('status');
const world=createWorld(createRandom(seed)); const renderer=createRenderer(canvas);
function loadSave(){ try{ const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); return v&&typeof v==='object'?v:null; }catch{ return null; } }
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({ money: Math.floor(world.state.player.money), done: world.state.mission.done, best: Math.max(loadSave()?.best||0, Math.floor(world.state.player.money)) })); }catch{} }
function runShot(name){ world.state._marker=world.marker(); const scene=stageShot(name,world); let n=0;
  function paint(){ renderer.draw(world.state,scene.screen,scene.best); if(++n<2) requestAnimationFrame(paint); else window.__shotReady=true; } requestAnimationFrame(paint); }
function runGame(){
  const input=createInput(canvas); let screen=SCREEN_TITLE; let acc=0,last=performance.now(),saveTimer=0;
  const saved=loadSave(); let best=saved?.best||0;
  if(saved){ world.state.player.money=saved.money||world.state.player.money; world.state.mission.done=saved.done||0; }
  const announce=(m)=>{ status.textContent=m; };
  function start(){ world.reset(); const sv=loadSave(); if(sv){ world.state.player.money=sv.money||60; world.state.mission.done=sv.done||0; } screen=SCREEN_PLAY; announce('Playing Port Solace.'); }
  let pendingInteract=false;
  function frame(now){ requestAnimationFrame(frame); acc+=Math.min((now-last)/1000,MAX_FRAME); last=now;
    if(input.drainInteract()) pendingInteract=true;
    const act=input.takeActions();
    if((act&ACTION_CONFIRM)&&(screen===SCREEN_TITLE||screen===SCREEN_OVER)) start();
    else if((act&ACTION_PAUSE)&&screen===SCREEN_PLAY){ screen=SCREEN_PAUSED; announce('Paused.'); }
    else if((act&(ACTION_PAUSE|ACTION_CONFIRM))&&screen===SCREEN_PAUSED){ screen=SCREEN_PLAY; announce('Playing.'); }
    if(screen===SCREEN_PLAY||screen===SCREEN_TITLE){
      const harmless=screen===SCREEN_TITLE; let interact=pendingInteract; pendingInteract=false;
      while(acc>=STEP&&(screen===SCREEN_PLAY||screen===SCREEN_TITLE)){ const v=input.vector();
        const ev=world.step(STEP,{x:v.x,y:v.y,sprint:input.sprint(),interact},harmless); interact=false; acc-=STEP;
        world.state._marker=world.marker();
        if(ev&EVENT_OVER){ screen=SCREEN_OVER; persist(); best=Math.max(best,Math.floor(world.state.player.money)); announce(`Busted. Money $${Math.floor(world.state.player.money)}.`); break; } }
      if(screen===SCREEN_PLAY){ saveTimer+=1/60; if(saveTimer>4){ saveTimer=0; persist(); } }
    } else acc=0;
    renderer.draw(world.state,screen,best);
  }
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&screen===SCREEN_PLAY) screen=SCREEN_PAUSED; });
  announce('Port Solace. Press Space or click to start.'); requestAnimationFrame(frame);
}
if(shot) runShot(shot); else runGame();
