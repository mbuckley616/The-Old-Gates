// The clergy's dress (the bodies builder, Session 2570; backlog L1, the wardrobe matrix's clergy column, owed since Session 2504:
// "the priest's dress, the Church's to say"). Every church in the game has a keeper whose role is 'Priest' (83-world-generator.js), and on
// the new look the kit dresses that keeper as anyone of their people, the trade rolled over the top (32-people.js `hbTradeDress`) with
// nothing for a priest: the old rig gave them a hood. This page dresses one man and one woman of each people as their town's priest,
// three ways, so Michael can say how the calling shows. Nothing here is new geometry: every piece is the kit's (people.js) already, the
// robe, the scapular (the tabard), the cord, the cowl, the book, the lantern, the shuttle on the breast (Session 2242).
//
// What the canon fixes: the Gatelands keep the six gods' temples (§4.1, the Irish-register culture; Sister Elidan of the shrines, cream
// robe and crimson scapular, Session 2414, and Brother Oswin of the Ashenmoor Oratory); the Church of the Weaver is Aurenne's (§1.3, the
// Compact; its sign the red shuttle, #1540 B, worn by Brother Alain; OG-091's Mother Amani in white, blue and gold); the Mark scorns
// priests (§1.2) and keeps roofed timber shrines with a lamp always lit (OG-113). OG-110's clergy row draws "a brown habit with a book".
//
//   a  one habit everywhere (OG-110's row as drawn): a brown wool robe to the ground, the cowl, a rope cord, a book in the right fist, on
//      every island; only the body is the people's;
//   b  by island (recommended): the Gatelands a habit of undyed wool under a green scapular, a cord, the cowl, the book (the six gods'
//      temples, Elidan's cut in the temples' own colour); Aurenne the Church's white robe and white scapular with the red shuttle on the
//      breast, a gold cord, a woman's white head-cloth (Amani's and Alain's, as the Church's ordinary dress); the Mark no priest: its
//      church's keeper in the Mark's own wool, a lit lamp in the fist (the shrine's lamp, OG-113);
//   c  b with the office shown: the Gatelander's short cape over the shoulders on a bronze brooch; the Aurennais robe bordered in gold
//      under a blue sash (Amani's own); the Markish keeper in the formal tunic's woven bands and a fur-collared cloak.
// CLERGY[key] is the sheet; clergyGenome(key, level, P) makes the genome, as faith.js's faithGenome does (P carries people.js's
// rollGenome, heightFor, GARMENTS and DRESS_FLAGS). Colours are linear [r,g,b] as in CAST.

const UNDYED = [.6, .56, .48], BROWN = [.26, .18, .11], ROPE = [.55, .48, .36], WHITE = [.86, .85, .8], GOLD = [.74, .56, .2], BLUE = [.08, .16, .42],
  MOSS = [.17, .25, .16], BRONZE = [.62, .47, .22], LEATHER = [.22, .14, .09], BOOK = [.3, .17, .1], IRON = [.22, .22, .22], RED = [.62, .1, .08];

// one habit everywhere (a): OG-110's brown habit
const HABIT = { tunic: BROWN, robe: BROWN, cord: ROPE, cowl: BROWN, boots: LEATHER, book: BOOK };
const habit = (sandals) => sandals ? { ...HABIT, boots: null, sandals: [.4, .28, .18] } : { ...HABIT };

export const CLERGY = {
  glMan: { label: 'a Gatelands priest', island: 'gatelands', people: 'gatelander', g: 1, age: .6, metres: 1.76,
    a: habit(),
    b: { tunic: UNDYED, robe: UNDYED, tabard: MOSS, tabardLen: .85, cord: ROPE, cowl: UNDYED, boots: LEATHER, book: BOOK },
    c: { tunic: UNDYED, robe: UNDYED, tabard: MOSS, tabardLen: .85, cord: ROPE, boots: LEATHER, book: BOOK, cloak: MOSS, cape: true, cloakLen: 1, brooch: BRONZE } },
  glWoman: { label: 'a Gatelands priest', island: 'gatelands', people: 'gatelander', g: 0, age: .5, metres: 1.64,
    a: habit(),
    b: { tunic: UNDYED, robe: UNDYED, tabard: MOSS, tabardLen: .85, cord: ROPE, cowl: UNDYED, boots: LEATHER, book: BOOK },
    c: { tunic: UNDYED, robe: UNDYED, tabard: MOSS, tabardLen: .85, cord: ROPE, boots: LEATHER, book: BOOK, cloak: MOSS, cape: true, cloakLen: 1, brooch: BRONZE } },
  mkMan: { label: 'a Markish shrine-keeper', island: 'mark', people: 'markman', g: 1, age: .65, metres: 1.84,
    a: habit(),
    b: { tunic: [.3, .32, .4], trousers: [.24, .22, .2], boots: LEATHER, belt: LEATHER, legWraps: [.36, .32, .26], lantern: IRON },
    c: { tunic: [.3, .32, .4], trousers: [.24, .22, .2], boots: LEATHER, belt: LEATHER, legWraps: [.36, .32, .26], lantern: IRON, skirt: 'knee',
      bands: [.5, .14, .12], bandsMotif: [.74, .62, .36], cloak: [.24, .2, .16], cloakLen: .9, cloakFur: [.46, .4, .32], brooch: [.6, .6, .62] } },
  mkWoman: { label: 'a Markish shrine-keeper', island: 'mark', people: 'markman', g: 0, age: .55, metres: 1.72,
    a: habit(),
    b: { tunic: [.3, .32, .4], skirtColor: [.26, .24, .22], boots: LEATHER, belt: LEATHER, apron: [.5, .44, .34], lantern: IRON },
    c: { tunic: [.3, .32, .4], skirtColor: [.3, .32, .4], boots: LEATHER, belt: LEATHER, lantern: IRON,
      bands: [.5, .14, .12], bandsMotif: [.74, .62, .36], cloak: [.24, .2, .16], cloakLen: .9, cloakFur: [.46, .4, .32], brooch: [.6, .6, .62] } },
  auMan: { label: 'a priest of the Church', island: 'aurenne', people: 'aurennais', g: 1, age: .55, metres: 1.75,
    a: habit(true),
    b: { tunic: WHITE, robe: WHITE, tabard: WHITE, tabardLen: .85, tabardSign: 'shuttle', tabardSignCol: RED, cord: GOLD, sandals: [.4, .28, .18], book: BOOK },
    c: { tunic: WHITE, robe: WHITE, gownBorder: GOLD, sash: BLUE, sashPrint: false, cord: GOLD, sandals: [.4, .28, .18], book: BOOK } },
  auWoman: { label: 'a priest of the Church', island: 'aurenne', people: 'aurennais', g: 0, age: .5, metres: 1.68,
    a: habit(true),
    b: { tunic: WHITE, robe: WHITE, tabard: WHITE, tabardLen: .85, tabardSign: 'shuttle', tabardSignCol: RED, cord: GOLD, sandals: [.4, .28, .18], wrap: WHITE, book: BOOK },
    c: { tunic: WHITE, robe: WHITE, gownBorder: GOLD, sash: BLUE, sashPrint: false, cord: GOLD, sandals: [.4, .28, .18], wrap: WHITE, earrings: GOLD, book: BOOK } } };
export const ORDER = ['glMan', 'glWoman', 'mkMan', 'mkWoman', 'auMan', 'auWoman'];

// the genome: rolled from the key for the face and hair (the people's own), the sheet's age and height, then the level's whole wardrobe
export function clergyGenome(key, level, P) {
  const S = CLERGY[key], G = P.rollGenome('clergy:' + key, { people: S.people, g: S.g });
  if (S.age != null) G.age = S.age;
  const D = JSON.parse(JSON.stringify(S[level] || S.b));
  const skirt = D.skirt || (D.robe ? 'long' : (S.g ? 'short' : 'long')); delete D.skirt;
  G.pose = { ...(G.pose || {}), stoop: 0 }; G.scar = null; G.marks = null;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt, ...D };
  G.height = P.heightFor(G, S.metres); G.clergy = key; return G;
}
