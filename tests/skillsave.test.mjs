// Skills in the save (Session 941; skills and perks A, the build sheet's `skillsave` and `skillmigrate`): `skills`, `majors` and
// `minors` are the character's and ride the character row, never the world row; the character row alone, loaded into a fresh
// world, brings all 22 back. A character saved before skills is migrated once from its archetype and level: majors at 25 + 2 a
// level past the first, minors at 15 + 1, both to 60, the rest at 5; its attributes are left as they were.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = {};
  skillsInit('scout', 1); SKILLS.bow = { lv: 37, p: 12 }; SKILLS.cooking = { lv: 9, p: 3 }; SKILLS.locks = { lv: 61, p: 0 };
  const want = JSON.stringify(SKILLS);
  const d = JSON.parse(ssStringify(_buildSavePayload())); const rows = ssSplitPayload(d);
  out.inC = !!rows.c.skills && Object.keys(rows.c.skills).length === 22 && rows.c.majors.join() === SKILL_ARCH.scout.maj.join() && rows.c.minors.join() === SKILL_ARCH.scout.min.join();
  out.inW = ['skills', 'majors', 'minors'].filter(k => k in rows.w);
  // the character alone, into a fresh world: a guest's load
  skillsInit('warrior', 1); _applyLoadData(JSON.parse(JSON.stringify(rows.c)), null);
  out.back = JSON.stringify(SKILLS) === want; out.bow = SKILLS.bow; out.maj = skillMajors.slice();
  // the migration: a level-12 Duelist from a save made before skills
  const old = JSON.parse(JSON.stringify(rows.c)); delete old.skills; delete old.majors; delete old.minors;
  old.pArch = 'duelist'; old.level = 12; old.ATTRS = { might: 9, fortitude: 4, finesse: 14, swiftness: 11, resolve: 2, intelligence: 1, charisma: 3, fortune: 0 };
  skillsInit('warrior', 1); _applyLoadData(old, null);
  out.mig = Object.fromEntries(Object.keys(SKILL_DEF).map(k => [k, skillLv(k)])); out.attrs = { ...ATTRS }; out.arch = playerArchetype; out.migMaj = skillMajors.slice();
  out.oldAttrs = old.ATTRS;
  return out; });
check('skillsave: the character row carries all 22 skills, the majors and the minors', r.inC, r);
check(`skillsave: the world row carries none of them (${r.inW.join(', ') || 'none'})`, r.inW.length === 0, r.inW);
check(`skillsave: the character row alone, into a fresh world, brings them back (Bow ${r.bow && r.bow.lv}, ${r.bow && r.bow.p} toward the next)`, r.back && r.maj.join() === 'bow,athletics,stealth,acrobatics,woodcutting', r);
const M = r.mig;
check(`skillmigrate: a level-12 Duelist saved before skills: Blade ${M.blade}, Guard ${M.guard}, Speech ${M.speech} (47); Bow ${M.bow}, Locks ${M.locks} (26); Tine ${M.tine} (5)`,
  r.arch === 'duelist' && ['blade', 'guard', 'acrobatics', 'athletics', 'speech'].every(k => M[k] === 47) && ['bow', 'stealth', 'armour', 'locks', 'gaoth'].every(k => M[k] === 26)
  && Object.keys(M).filter(k => M[k] === 5).length === 12, M);
check('skillmigrate: the attributes are unchanged', JSON.stringify(r.attrs) === JSON.stringify(r.oldAttrs), { now: r.attrs, saved: r.oldAttrs });
// the game plays on
await g.spin(null, 120); await g.frames(3);
check('skillmigrate: the game plays on (120 ticks, no page errors)', g.errs.length === 0, g.errs);
await g.close();
