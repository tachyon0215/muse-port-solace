// Keyboard input: held keys give a movement vector; one-shot presses are queued as flags.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
const CONFIRM = new Set(['Space','Enter']);
const PAUSE = new Set(['KeyP','Escape']);
const INTERACT = new Set(['KeyE']);
export function createInput(target) {
  const held = new Set(); let actions = 0;
  window.addEventListener('keydown', (e) => {
    held.add(e.code);
    if (CONFIRM.has(e.code)) { if (!e.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(e.code)) { if (!e.repeat) actions |= ACTION_PAUSE; }
    else if (INTERACT.has(e.code)) { if (!e.repeat) actions |= ACTION_INTERACT; }
    else if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)) return;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  if (target) target.addEventListener('pointerdown', () => { actions |= ACTION_CONFIRM; });
  return {
    vector() {
      const x = (held.has('KeyD')||held.has('ArrowRight')?1:0) - (held.has('KeyA')||held.has('ArrowLeft')?1:0);
      const y = (held.has('KeyS')||held.has('ArrowDown')?1:0) - (held.has('KeyW')||held.has('ArrowUp')?1:0);
      return { x, y };
    },
    sprint() { return held.has('ShiftLeft')||held.has('ShiftRight'); },
    takeActions() { const t = actions; actions = 0; return t; },
    // Non-consuming peek used by main to route E to exactly one fixed step.
    drainInteract() { if (actions & ACTION_INTERACT) { actions &= ~ACTION_INTERACT; return true; } return false; },
  };
}
