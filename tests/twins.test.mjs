// Names and faces (Session 248): the critic found Dunmore's Cathal keeping the apothecary, standing guard and living in a
// house, Róisín keeping a shop and on guard, Ruairí the innkeeper and the night watch, Niamh the Archmage and the mayor.
// A town of fifty draws from a bank of twelve names a sex, residents first, so the bank is spent before the keepers,
// guards and lord are named, and the face is seeded from name|town: each pair was one man. Now anyone with a post takes a
// name no other post-holder has (a resident's name if it must), and the second holder of a name is another face.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id);
    const key = (name, tw) => name + '|' + id + (tw ? '#' + tw : '');
    const folk = S.npcs.filter(n => n.def && n.def.name);
    const posts = folk.filter(n => n.def.role !== 'Villager').map(n => n.def.name + ' (' + n.def.role + ')');
    const guilds = [];
    const postNames = [...posts, ...guilds].map(x => x.replace(/ \(.*$/, ''));
    const dupPosts = [...posts, ...guilds].filter((x, i, a) => postNames.indexOf(postNames[i]) !== i);
    const keys = folk.map(n => key(n.def.name, n.def._twin)); const rest = S.residents.filter(x => !folk.some(n => n.def === x.def)); const allKeys = [...keys, ...rest.map(x => key(x.def.name, x.def._twin))];
    const dupKeys = allKeys.filter((k, i) => allKeys.indexOf(k) !== i);
    const names = [...folk.map(n => n.def.name), ...rest.map(x => x.def.name)]; const shared = names.filter((x, i) => names.indexOf(x) !== i).length;
    // the face behind the counter is the one in the street
    const indoor = S.houses.filter(h => h.keeper && h.type !== 'castle' && !/guild/.test(h.type)).map(h => ({ h: h.name, k: key(h.keeper, h._twin) }));
    const noMatch = indoor.filter(x => !allKeys.includes(x.k) || (keys.includes(x.k) && !PEOPLE_GENOMES.has(x.k)));
    return { folk: folk.length, residents: S.residents.length, posts: posts.length + guilds.length, dupPosts, shared, dupKeys, indoor: indoor.length, noMatch }; }, id);
  console.log(' ', id, JSON.stringify(r));
  check(`${id}: no two people with a post (keeper, guard, watch, lord, guild head) share a name`, r.dupPosts.length === 0, r.dupPosts);
  check(`${id}: no two townsfolk share a face, though ${r.shared} share a name`, r.dupKeys.length === 0, r.dupKeys);
  check(`${id}: every keeper and resident indoors has the face they wear in the street`, r.noMatch.length === 0, r.noMatch);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
