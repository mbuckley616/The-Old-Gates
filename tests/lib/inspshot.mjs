// A picture of inspector pieces on its stage: shots(g, [[key, file], ...]) selects each by key and screenshots the stage
// to docs/prototypes/<file>. Used by the look builder's before/after pictures of a piece Michael noted.
import fs from 'fs';
export async function inspShots(g, list) {
  const { page } = g; fs.mkdirSync('docs/prototypes', { recursive: true });
  await page.evaluate(() => { if (!INSPECTOR.open) openInspector(); });
  for (const [key, file, setup] of list) {
    await page.evaluate(([k, s]) => { INSPECTOR.unpinAll(); INSPECTOR.select(k); if (s) (0, eval)(s); for (let i = 0; i < 6; i++) INSPECTOR.frame(performance.now() + i * 40); }, [key, setup || null]);
    await g.frames(2);
    await page.screenshot({ path: 'docs/prototypes/' + file, timeout: 120000 });
  }
}
