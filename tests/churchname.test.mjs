// Church names (Session 249): the critic read *The La Grise Oratory* over La Grise's church. A place whose name already
// carries an article (La Grise, Le…, Les…, The…) now drops the church's *The*: *La Grise Oratory*; Dunmore keeps *The Dunmore Oratory*.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const names = {};
for (const id of ['la_grise', 'dunmore']) { await g.settle(id);
  names[id] = await page.evaluate((id) => { const S = WORLD.settle.get(id); const h = S.houses.find(x => x.type === 'church');
    const signs = []; S.group.traverse(o => { if (o.userData && o.userData.sign && h && Math.hypot(o.position.x - h.doorX, o.position.z - h.doorZ) < 2) signs.push(o.userData.sign); });
    return h ? { name: h.name, board: [...new Set(signs)] } : null; }, id); }
console.log(' ', JSON.stringify(names));
check('La Grise\'s church is *La Grise Oratory*, and its board says so', names.la_grise && names.la_grise.name === 'La Grise Oratory' && names.la_grise.board[0] === 'La Grise Oratory', names.la_grise);
check('Dunmore\'s keeps its article: *The Dunmore Oratory*', names.dunmore && names.dunmore.name === 'The Dunmore Oratory', names.dunmore);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
