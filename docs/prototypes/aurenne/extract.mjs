// node docs/prototypes/aurenne/extract.mjs -> today.js: today's Aurenne houses (WORLD.houseProto, the inspector's call) and two
// Aurennais townsfolk in their bind pose (personBake), as plain arrays, so the prototype page draws the game's own meshes
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot();
const out = await g.page.evaluate(() => {
  // packed small: positions in centimetres (Int16), normals ×127 (Int8), colours ×255 (Uint8), each base64
  const b64 = ta => { const u = new Uint8Array(ta.buffer); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
  const flat = (geo, k = 1) => { const G = geo.index ? geo.toNonIndexed() : geo; const P = G.attributes.position.array, N = G.attributes.normal.array, C = G.attributes.color && G.attributes.color.array;
    return { n: P.length / 3, pos: b64(Int16Array.from(P, x => Math.round(x * k * 100))), nor: b64(Int8Array.from(N, x => Math.round(x * 127))), col: C ? b64(Uint8Array.from(C, x => Math.max(0, Math.min(255, Math.round(x * 255))))) : null }; };
  const houses = [[7, 6, 11, false], [7, 6, 29, true]].map(([w, d, s, two]) => {
    const h = WORLD.houseProto('aurenne', w, d, s, { chimney: true, twoStory: two }); return { w, d, variant: h.variant, hi: flat(h.hi), tris: h.hi.attributes.position.count / 3, loTris: h.lo ? (h.lo.index ? h.lo.index.count : h.lo.attributes.position.count) / 3 : 0 }; });
  const people = [{ name: 'Yasmin', female: true, people: 'aurennais', role: 'merchant' }, { name: 'Idris', female: false, people: 'aurennais', role: 'villager' }].map(def => {
    const gn = personGenome(def, { nation: 'aurenne', key: 'proto' }); const b = personBake(gn, 1); const k = gn.height * PW.BODY; b.geo.computeBoundingBox(); return { name: def.name, h: (b.geo.boundingBox.max.y - b.geo.boundingBox.min.y) * k, ...flat(b.geo, k) }; });
  return { houses, people };
});
fs.writeFileSync(path.join(here, 'today.js'), '// written by extract.mjs from the game (build ' + process.env.BUILD + ')\nwindow.TODAY=' + JSON.stringify(out) + ';\n');
console.log(out.houses.map(h => [h.variant, h.tris, h.loTris]), out.people.map(p => [p.name, p.h.toFixed(3)]), g.errs.slice(0, 5));
await g.close();
