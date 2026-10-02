// Today's book reader, notice board and examine text, for the reading page. A night in Dunmore's inn, and the street at dusk.
// node docs/prototypes/books/shoot-current.mjs  (writes current-*.png, backdrop-*.png and current.json beside this file)
import { boot, ROOT } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
// the texts the game shows, read from its files: Hearthwick's notice board and Droichead's keystones
const lz = src('40-legacy-zones.js'), tr = src('50-travel.js');
const hw = lz.slice(lz.indexOf("noticeBoardTitle:'Hearthwick"));
const notice = { title: 'Hearthwick — Wayfarer’s Notice', text: eval(hw.match(/noticeBoardText:(`[^`]*`)/)[1]) };
const ks = tr.slice(tr.indexOf("title:'The Keystones'"));
const examine = { title: 'The Keystones', text: eval(ks.match(/text:("(?:[^"\\]|\\.)*")/)[1]) };
const g = await boot(); const { page } = g;
const hideUI = () => page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') { e.dataset.v = e.style.visibility; e.style.visibility = 'hidden'; } });
const showUI = () => page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') e.style.visibility = e.dataset.v || ''; });
await g.intoWorld(); await g.settle('dunmore');
// the street at 6 pm, for the notice and the examine slip
await page.evaluate(() => { forceTime(18); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0];
  const cx = S.site.x, cz = S.site.z, dx = h.exitX - cx, dz = h.exitZ - cz, d = Math.hypot(dx, dz) || 1;
  px = cx + dx / d * 16; pz = cz + dz / d * 16; yaw = Math.atan2(dx, dz); pitch = .02; VM_SCENE.visible = false; });
await g.spin(null, 40); await g.frames(30); await g.hide();
await hideUI(); await page.screenshot({ path: path.join(here, 'backdrop-street.png'), clip: { x: 0, y: 0, width: 1280, height: 600 } }); await showUI();
await page.evaluate(() => { VM_SCENE.visible = true; }); await g.frames(3);
const data = { notice, examine };
await page.evaluate(n => openNoticeBoard(n), notice); await g.frames(4);
await page.screenshot({ path: path.join(here, 'current-notice.png') }); await page.evaluate(() => closeNoticeBoard());
await page.evaluate(n => openNoticeBoard(n), examine); await g.frames(4);
await page.screenshot({ path: path.join(here, 'current-examine.png') }); await page.evaluate(() => closeNoticeBoard());
// the inn at 10 pm, a book in the bag
await page.evaluate(() => { forceTime(22); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn' && x.keeper) || S.houses.find(x => x.keeper);
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4500);
await page.evaluate(() => { forceTime(22); if (typeof intNPCPos !== 'undefined' && intNPCPos) { px = intNPCPos.x + 1.2; pz = intNPCPos.z + 3.2; yaw = .3; pitch = -.1; } VM_SCENE.visible = false; });
await g.frames(30);
await hideUI(); await page.screenshot({ path: path.join(here, 'backdrop-inn.png'), clip: { x: 0, y: 0, width: 1280, height: 600 } }); await showUI();
await page.evaluate(() => { VM_SCENE.visible = true; }); await g.frames(3);
data.book = await page.evaluate(() => {
  const ids = ['aldrics_third', 'letters_from_ashwold']; for (const id of ids) bagAdd(makeBookItem(BOOKS.find(b => b.id === id)));
  const i = BAG.findIndex(it => it.bookId === 'aldrics_third'); const a0 = ATTRS.might; openBookReader(i);
  return { books: BOOKS.map(b => ({ id: b.id, name: b.name, attr: b.attr, pages: b.pages })), might: [a0, ATTRS.might],
    msg: (document.getElementById('msg') || {}).textContent || '', pag: document.getElementById('book-pagination').textContent,
    title: document.getElementById('book-title').textContent };
});
await g.frames(3); await page.screenshot({ path: path.join(here, 'current-book.png') });
await page.evaluate(() => bookNextPage()); await g.frames(3); await page.screenshot({ path: path.join(here, 'current-book-2.png') });
await page.evaluate(() => closeBookReader());
data.hint = await page.evaluate(() => (document.getElementById('build-tag') || document.querySelector('[id*=tag]') || {}).textContent || '');
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs);
await g.close();
