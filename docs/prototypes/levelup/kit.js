// One genome format (Session 807, B5 of docs/design/character-builder.md): a saved genome is JSON with a species and a
// version, {species: 'human' | 'creature', v: 1, seed, sliders, …}. people.js reads a person's, creatures.js a creature's;
// this reads either and builds it. The game's loader will be this file's two functions, and nothing of the builder page.
import { loadPack, makePerson, toSaved as personSaved, fromSaved as personFrom } from './people.js';
import { build, toSaved as creatureSaved, fromSaved as creatureFrom } from './creatures.js';

export const SPECIES = ['human', 'creature'];
let pack = null; // the people's body pack (mh_pack.py), fetched once and only when a person is built
export const needPack = () => pack || (pack = loadPack());

// JSON (text or object) -> { species, G }: the genome in the form its builder takes. Throws on anything it cannot read.
export function readGenome(J) {
  if (typeof J === 'string') J = JSON.parse(J);
  if (J?.species === 'human') return { species: 'human', G: personFrom(J) };
  if (J?.species === 'creature') return { species: 'creature', G: creatureFrom(J) };
  throw new Error('not a genome: species is ' + JSON.stringify(J?.species) + ', not one of ' + SPECIES.join(', '));
}
export const saveGenome = (species, G) => species === 'human' ? personSaved(G) : creatureSaved(G);

// a saved genome -> its built body: { species, root, … } (a person from makePerson, a creature from build)
export async function make(J) {
  const { species, G } = readGenome(J);
  if (species === 'human') { await needPack(); return { species, G, ...makePerson(G) }; }
  return { species, G, ...build(G) };
}
