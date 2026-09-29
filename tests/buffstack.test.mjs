// Two buffs of one kind (Session 341): the stronger counts, and neither cuts the other short. A weaker one that outlasts
// the stronger waits underneath and holds again when the stronger ends. Before, the newest always replaced the old:
// a 60 s Firemoss ended a 30-minute Boon of the Arm, and a Shield ended the Boon of Stone.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const clear = () => { ACTIVE_BUFFS.length = 0; };
  const arm = { type: 'meleeDmg', mult: 1.2, duration: 1800, label: 'the Boon of the Arm' };
  const firemoss = { type: 'meleeDmg', mult: 1.10, duration: 60, label: 'Firemoss Rush' };
  const stone = { type: 'warding', mult: .75, duration: 1800, label: 'the Boon of Stone' };
  const shield = { type: 'warding', mult: .5, duration: 30, label: 'Shield' };
  const mind = { type: 'spellCost', mult: .7, duration: 1800, label: 'the Boon of the Mind' };
  const coldmoss = { type: 'spellCost', mult: .8, duration: 45, label: 'Coldmoss Clarity' };
  const o = {};
  clear(); _applyBuff(arm); _applyBuff(firemoss); o.armThenMoss = [_buffMult('meleeDmg', 1), ACTIVE_BUFFS.length];
  tickActiveBuffs(61); o.armAfter61 = [_buffMult('meleeDmg', 1), Math.round(ACTIVE_BUFFS[0].remaining)];
  clear(); _applyBuff(firemoss); _applyBuff(arm); tickActiveBuffs(61); o.mossThenArm = [_buffMult('meleeDmg', 1), Math.round(ACTIVE_BUFFS[0].remaining)];
  clear(); _applyBuff(stone); _applyBuff(shield); o.shieldOn = [_buffMult('warding', 1), ACTIVE_BUFFS[0].label];
  tickActiveBuffs(31); o.shieldOff = [_buffMult('warding', 1), ACTIVE_BUFFS[0] && ACTIVE_BUFFS[0].label, ACTIVE_BUFFS[0] && Math.round(ACTIVE_BUFFS[0].remaining), ACTIVE_BUFFS.length];
  clear(); _applyBuff(mind); _applyBuff(coldmoss); o.mindMoss = [_buffMult('spellCost', 1), ACTIVE_BUFFS[0].label, !!ACTIVE_BUFFS[0]._under];
  clear(); const tonic = { type: 'hpRegen', rate: .5, duration: 60, label: 'Mild' }; _applyBuff(tonic); tickActiveBuffs(30); _applyBuff(tonic);
  o.refresh = [ACTIVE_BUFFS.length, Math.round(ACTIVE_BUFFS[0].remaining), !!ACTIVE_BUFFS[0]._under];
  _applyBuff({ type: 'hpRegen', rate: 1.2, duration: 60, label: 'Strong' }); o.upgrade = [ACTIVE_BUFFS[0].rate, ACTIVE_BUFFS.length];
  clear(); _applyBuff(stone); _applyBuff(shield); tickActiveBuffs(1801); o.allGone = ACTIVE_BUFFS.length;
  clear(); return o;
});
check('Firemoss eaten under the Boon of the Arm: the boon holds at ×1.2, and is still there a minute later', r.armThenMoss[0] === 1.2 && r.armThenMoss[1] === 1 && r.armAfter61[0] === 1.2 && r.armAfter61[1] === 1739, r);
check('the Boon of the Arm taken over Firemoss replaces it', r.mossThenArm[0] === 1.2 && r.mossThenArm[1] === 1739, r);
check('a Shield cast under the Boon of Stone counts while it lasts, and the boon comes back after with its time run down', r.shieldOn[0] === .5 && r.shieldOff[0] === .75 && r.shieldOff[1] === 'the Boon of Stone' && r.shieldOff[2] === 1769 && r.shieldOff[3] === 1, r);
check('Coldmoss under the Boon of the Mind adds nothing (weaker and shorter)', r.mindMoss[0] === .7 && r.mindMoss[1] === 'the Boon of the Mind' && !r.mindMoss[2], r);
check('the same tonic again refreshes it; a stronger one replaces it', r.refresh[0] === 1 && r.refresh[1] === 60 && !r.refresh[2] && r.upgrade[0] === 1.2 && r.upgrade[1] === 1, r);
check('when both have run out, nothing is left', r.allGone === 0, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
