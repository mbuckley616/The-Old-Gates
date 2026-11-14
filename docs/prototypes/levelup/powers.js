// The powers' costume (the concept artist, 14 Nov 2026; backlog L1, "The powers' costume", OG-042): the dress and things of rank put on
// the canon's real powers (lore_canon §1.1–1.3, §1.5, §3), not the sheet's offices. OG-042 drew a High Chieftain of the Gatelanders, a
// Lord Admiral's sea captain, an Aurennais magistrate, Keepers who tend the gates and a foreign governor; the canon has none of them. Its
// powers are: the Crown's lords over towns and the Elders over villages (the Gatelands, crimson and gold); the Captains' League's
// captains over garrisons and reeves over towns (the Mark, black and iron, office by acclamation, "nothing decorative that does not also
// keep out cold"); the Compact's Priors over the Church's towns and Factors over the merchant houses' ports (Aurenne, blue and white);
// and the Old Blood, who rule nobody, whose elders give the marks' rite. Seven figures, one an office.
//
// Everything is the people kit's own garments (people.js: GARMENTS and DRESS_FLAGS, as CAST dresses Bram and Aldwyn): nothing new is
// modelled here, so what the builder lifts is a table of sheets. Three levels of how loudly rank shows:
//   a  the token alone: the office's everyday dress as its people roll it, and one thing of office (the lord's gold chain, the elder's
//      carved staff, the captain's sword, the reeve's ash staff, the prior's blue stole, the factor's ledger, the Old Blood
//      elder's charms);
//   b  dressed by rank, by nation (recommended): the canon's colours and each people's pride; the Gatelands' lord in crimson and fur
//      with gold, the Mark's captain in black and iron with a wolf collar and the reeve in plain good wool, the Compact's prior in white
//      and blue with a circlet and the factor in an ivory gown with a blue and gold border, a ledger and a seal; the Old Blood elder
//      in undyed grey with the carved staff, the charms and the marks shown;
//   c  OG-042 as drawn: one court register for every power, fur, gold and a gown or long coat whatever the people (the Mark's captain
//      in a navy coat and charts, the factor a magistrate in purple and gold, the elders in fur and gold), the canon's colours set aside.
// POWERS[key] is the sheet; powerGenome(key, level, roll) makes the genome (roll is people.js's rollGenome, passed in so this file
// imports nothing). Colours are linear [r,g,b] as in CAST.
const CRIMSON = [.46, .07, .06], GOLD = [.74, .56, .2], IRON = [.42, .43, .45], BLACK = [.07, .07, .08], BLUE = [.1, .2, .46], WHITE = [.86, .84, .78],
  IVORY = [.84, .78, .64], PURPLE = [.26, .08, .3], UNDYED = [.62, .58, .5], GREY = [.36, .35, .34], FUR = [.5, .42, .32], WOLF = [.52, .5, .47];

export const POWERS = {
  // a lord of a Crown town: grey-bearded, Norman over the Irish country; the Crown's crimson and gold
  lord: { label: 'A lord of the Crown', island: 'gatelands', people: 'gatelander', g: 1, age: .78, muscle: .6, weight: .55, metres: 1.8,
    hairCol: [.62, .6, .57], hair: { style: 'short', len: .45 }, beard: .5,
    a: { tunic: [.3, .26, .22], trousers: [.2, .18, .16], boots: [.22, .14, .09], belt: [.22, .14, .09], necklace: GOLD },
    b: { tunic: [.2, .16, .14], trousers: [.14, .12, .11], boots: [.16, .1, .07], belt: [.16, .1, .07], necklace: GOLD,
      cloak: CRIMSON, cape: true, cloakLen: .95, cloakFur: FUR, cloakHem: GOLD, brooch: GOLD, broochMake: 'herald', sword: [.62, .45, .22], swordMake: 'arming' },
    c: { tunic: [.2, .16, .14], trousers: [.14, .12, .11], boots: [.16, .1, .07], belt: [.16, .1, .07], necklace: GOLD,
      cloak: CRIMSON, cape: true, cloakLen: 1, cloakFur: [.62, .58, .52], cloakHem: GOLD, brooch: GOLD, broochMake: 'herald', sword: [.62, .45, .22], swordMake: 'arming' } },
  // an Elder of a Gatelands village: a woman of seventy, the wrap and the hazel stick; her standing is her age and her staff
  elder: { label: 'A village Elder', island: 'gatelands', people: 'gatelander', g: 0, age: .86, muscle: .3, weight: .48, metres: 1.6,
    hairCol: [.86, .85, .83], hair: { style: 'bun', len: .7 }, pose: { stoop: .3 },
    a: { tunic: [.5, .44, .34], skirtColor: [.36, .28, .2], boots: [.3, .2, .13], belt: [.36, .25, .16], staff: [.4, .3, .2], staffMake: 'hazel' },
    b: { tunic: [.62, .56, .44], skirtColor: [.3, .22, .16], boots: [.3, .2, .13], belt: [.36, .25, .16], cuffs: [.3, .36, .22],
      cloak: [.16, .26, .17], cape: true, cloakLen: .95, brooch: [.6, .6, .62], cloakHem: CRIMSON, staff: [.36, .26, .16], staffMake: 'carved' },
    c: { tunic: IVORY, skirtColor: [.3, .22, .16], boots: [.3, .2, .13], belt: [.36, .25, .16], necklace: GOLD,
      cloak: [.16, .26, .17], cape: true, cloakLen: 1, cloakFur: FUR, brooch: GOLD, cloakHem: GOLD, staff: [.36, .26, .16], staffMake: 'carved' } },
  // a captain of the League, over a garrison: a tall Markwoman, acclaimed by her fort; black and iron, the sword she would duel with
  captain: { label: 'A captain of the League', island: 'mark', people: 'markman', g: 0, age: .5, muscle: .75, weight: .45, metres: 1.82,
    hairCol: [.42, .14, .07], hair: { style: 'plait', len: .7 },
    a: { skirt: 'short', tunic: [.4, .36, .3], trousers: [.24, .22, .2], boots: [.2, .14, .1], belt: [.2, .14, .1], sword: [.42, .43, .45], swordMake: 'norse' },
    b: { tunic: [.16, .15, .15], trousers: [.1, .1, .1], boots: [.1, .08, .07], belt: [.12, .09, .07], coat: BLACK, coatLen: .7, coatFur: WOLF, coatTrim: IRON,
      sword: [.42, .43, .45], swordMake: 'norse' },
    c: { tunic: [.7, .66, .58], trousers: [.12, .12, .14], boots: [.1, .08, .07], belt: [.12, .09, .07], coat: [.06, .09, .2], coatLen: .9, coatFur: [.6, .55, .48], coatTrim: GOLD,
      maps: [.8, .72, .55] } },
  // a reeve of a free town: a broad man of fifty; the Mark's office has no dress, only the ash staff and good wool
  reeve: { label: 'A reeve of the Mark', island: 'mark', people: 'markman', g: 1, age: .68, muscle: .7, weight: .7, metres: 1.86,
    hairCol: [.7, .64, .5], hair: { style: 'tail', len: .5 }, beard: .7,
    a: { tunic: [.42, .38, .3], trousers: [.26, .24, .2], boots: [.24, .16, .1], belt: [.24, .16, .1], staff: [.4, .32, .22], staffMake: 'ash' },
    b: { tunic: [.3, .28, .25], trousers: [.18, .17, .16], boots: [.2, .13, .09], belt: [.2, .13, .09], waistcoat: [.24, .16, .1], waistcoatLeather: true,
      cloak: [.2, .2, .21], cape: true, cloakLen: .8, cloakFur: WOLF, brooch: IRON, staff: [.4, .32, .22], staffMake: 'ash' },
    c: { tunic: [.3, .28, .25], trousers: [.18, .17, .16], boots: [.2, .13, .09], belt: [.2, .13, .09], necklace: GOLD,
      cloak: [.3, .1, .08], cape: true, cloakLen: 1, cloakFur: [.62, .58, .52], cloakHem: GOLD, brooch: GOLD, staff: [.4, .32, .22], staffMake: 'carved' } },
  // a Prior of the Church of the Weaver, over a church town: a man of sixty; the Compact's white and blue
  prior: { label: 'A Prior of the Church', island: 'aurenne', people: 'aurennais', g: 1, age: .78, muscle: .35, weight: .5, metres: 1.72,
    hairCol: [.32, .3, .28], hair: { style: 'short', len: .2 }, beard: .3,
    a: { tunic: [.62, .58, .5], robe: [.62, .58, .5], skirtColor: [.62, .58, .5], sandals: [.4, .28, .18], cord: [.4, .3, .2], sash: BLUE, sashPrint: false, sashKnot: false },
    b: { tunic: WHITE, robe: WHITE, skirtColor: WHITE, sandals: [.3, .2, .12], cord: [.74, .6, .3], sash: BLUE, sashBorder: GOLD, sashPrint: false,
      amulet: GOLD, book: [.12, .18, .4], bookGilt: GOLD },
    c: { tunic: WHITE, robe: WHITE, skirtColor: WHITE, sandals: [.3, .2, .12], cord: GOLD, sash: PURPLE, sashBorder: GOLD, sashPrint: false,
      amulet: GOLD, necklace: GOLD, staff: [.62, .45, .22], staffMake: 'olive' } },
  // a Factor of a merchant house, over a port: a dark-haired woman of forty; the ledger, the seal, the house's blue
  factor: { label: 'A Factor of the Compact', island: 'aurenne', people: 'aurennais', g: 0, age: .55, muscle: .4, weight: .38, metres: 1.68,
    hairCol: [.08, .06, .05], hair: { style: 'braid', len: .6 },
    a: { tunic: [.7, .62, .48], skirtColor: [.5, .36, .22], sandals: [.4, .28, .18], belt: [.4, .28, .18], book: [.32, .18, .1] },
    b: { tunic: IVORY, skirtColor: IVORY, skirt: 'long', sandals: [.36, .24, .14], sash: BLUE, sashBorder: GOLD, gownBorder: BLUE, earrings: GOLD,
      circlet: GOLD, circletStone: BLUE, book: [.12, .18, .4], bookGilt: GOLD, seal: GOLD },
    c: { tunic: IVORY, skirtColor: IVORY, skirt: 'long', sandals: [.36, .24, .14], sash: PURPLE, sashBorder: GOLD, gownBorder: PURPLE, earrings: GOLD, necklace: GOLD,
      circlet: GOLD, circletStone: [.5, .05, .08], book: [.3, .08, .1], bookGilt: GOLD } },
  // an elder of the Old Blood: short, grey-pale, white hair long; rules nobody, gives the marks' rite; the carved staff of the makers
  oldblood: { label: 'An elder of the Old Blood', island: 'gatelands', people: 'oldblood', fixed: true, g: 1, age: .9, muscle: .3, weight: .3, metres: 1.58,
    hairCol: [.84, .84, .83], hair: { style: 'loose', len: .7 }, beard: .15, marks: .25, pose: { stoop: .25 },
    a: { tunic: GREY, trousers: [.24, .23, .22], boots: [.2, .15, .1], belt: [.2, .15, .1], charms: [.78, .74, .64] },
    b: { tunic: UNDYED, robe: UNDYED, skirtColor: UNDYED, boots: [.2, .15, .1], cord: [.3, .26, .2], charms: [.78, .74, .64], amulet: [.5, .5, .48],
      cloak: GREY, cape: true, cloakLen: .7, staff: [.24, .19, .15], staffMake: 'carved' },
    c: { tunic: UNDYED, robe: UNDYED, skirtColor: UNDYED, boots: [.2, .15, .1], cord: GOLD, charms: [.78, .74, .64], amulet: GOLD, necklace: GOLD,
      cloak: [.18, .18, .22], cape: true, cloakLen: 1, cloakFur: [.62, .58, .52], cloakHem: GOLD, staff: [.24, .19, .15], staffMake: 'carved' } } };
export const ORDER = ['lord', 'elder', 'captain', 'reeve', 'prior', 'factor', 'oldblood'];

// the genome: the office's name rolled for the face (as castGenome does), the sheet's body, then the level's whole wardrobe
export function powerGenome(key, level, P) {
  const S = POWERS[key], G = P.rollGenome('power:' + key, { people: S.people, g: S.g });
  for (const k of ['age', 'muscle', 'weight', 'hairCol', 'beard']) if (S[k] != null) G[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
  G.hair = { ...S.hair }; G.pose = { ...(G.pose || {}), stoop: 0, ...(S.pose || {}) }; G.scar = null; G.marks = S.people === 'oldblood' ? S.marks : null;
  const D = S[level] || S.b;
  G.dress = { ...Object.fromEntries(P.GARMENTS.map(k => [k, null])), ...P.DRESS_FLAGS, skirt: S.g ? 'short' : 'long', ...JSON.parse(JSON.stringify(D)) };
  G.height = P.heightFor(G, S.metres); G.power = key; return G;
}
