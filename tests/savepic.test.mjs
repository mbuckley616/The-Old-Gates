// The picture of a save (Session 653, Michael's B on DECISION #199): each save keeps a 320×180 JPEG of the view as it was
// written, in its own row beside the save (`ssPicKey`), flagged `pic:1` on its index entry. The save menu shows it on the
// row; deleting the save deletes it; a character file carries it out and an import brings it back.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await g.frames(3);
const r = await page.evaluate(async () => {
  const stat = (url) => new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 16) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; s += v; s2 += v * v; n++; } const mean = s / n;
    res({ w: im.width, h: im.height, mean: +mean.toFixed(1), sd: +Math.sqrt(Math.max(0, s2 / n - mean * mean)).toFixed(1) }); }; im.onerror = () => res(null); im.src = url; });
  const out = {};
  const m = await saveToSlot(0); out.slot = { pic: m && m.pic, size: m && m.size };
  const u = await ssPic(m.key); out.url = u ? u.slice(0, 23) : null; out.kb = u ? +(u.length / 1024).toFixed(1) : 0; out.img = u ? await stat(u) : null;
  delete SS.cache[ssPicKey(m.key)]; const u2 = await ssPic(m.key); out.stored = u2 === u;
  SS.lastAuto = 0; const a = await ssAutosave(); out.auto = { pic: a && a.pic, has: !!(a && await ssPic(a.key)) };
  const loaded = await ssLoad(m.key); out.loads = !!(loaded && loaded.level != null);
  // the menu's rows
  openSLMenu('load'); await new Promise(r => setTimeout(r, 400));
  const thumbs = [...document.querySelectorAll('#sl-slots .sl-thumb')]; out.thumbs = thumbs.length; out.thumbsLoaded = thumbs.filter(t => /^data:image\/jpeg/.test(t.src)).length;
  closeSLMenu();
  // an entry from before this build: no flag, no picture, no thumbnail
  const old = Object.assign({}, m, { key: m.charId + '_manual_7', slot: 7 }); delete old.pic; SS.idx.push(old);
  out.oldPic = await ssPic(old.key); openSLMenu('save'); await new Promise(r => setTimeout(r, 300));
  const oldRow = [...document.querySelectorAll('#sl-slots .sl-slot')].find(d => d.dataset.key === old.key); out.oldThumb = oldRow ? !!oldRow.querySelector('.sl-thumb') : 'no row';
  closeSLMenu(); SS.idx = SS.idx.filter(e => e !== old); ssSaveIndex();
  // export carries it; import brings it back as a second character
  let file = null; const D0 = ssDownload; ssDownload = (str) => { file = str; }; try { await ssExportChar(m.charId, false); } finally { ssDownload = D0; }
  const doc = JSON.parse(file); out.exported = doc.saves.filter(s => /^data:image\/jpeg/.test(s.pic || '')).length; out.exportedOf = doc.saves.length;
  const metas = await ssImportFiles([new File([file], 'x.json', { type: 'application/json' })]);
  out.imported = metas ? metas.length : 0; out.importedPics = 0; if (metas) for (const im of metas) if (im.pic && await ssPic(im.key)) out.importedPics++;
  // delete takes the picture with it
  await ssDelete(m.key); delete SS.cache[ssPicKey(m.key)]; out.afterDelete = await ssGet(ssPicKey(m.key));
  return out;
});
console.log(JSON.stringify(r));
check('a slot save keeps a picture, flagged on its entry', r.slot.pic === 1 && r.url === 'data:image/jpeg;base64,', r.slot);
check(`the picture is 320×180, about 15 KB (${r.kb} KB), and shows the view (not one flat colour)`, r.img && r.img.w === 320 && r.img.h === 180 && r.kb > 3 && r.kb < 60 && r.img.sd > 8, r.img);
check('it is stored, not only cached', r.stored);
check('an autosave keeps one too', r.auto.pic === 1 && r.auto.has, r.auto);
check('the save still loads', r.loads);
check('the menu shows the picture on each row that has one', r.thumbs >= 2 && r.thumbsLoaded === r.thumbs, { thumbs: r.thumbs, loaded: r.thumbsLoaded });
check('a save from before this build shows no picture', r.oldPic === null && r.oldThumb === false, { pic: r.oldPic, thumb: r.oldThumb });
check('the character file carries each picture, and an import brings them back', r.exported === r.exportedOf && r.exported >= 2 && r.imported === r.exportedOf && r.importedPics === r.imported, { exported: r.exported, of: r.exportedOf, imported: r.imported, pics: r.importedPics });
check('deleting a save deletes its picture', r.afterDelete === null, r.afterDelete && r.afterDelete.slice(0, 30));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
