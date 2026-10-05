
const NPC_DEF=[
  {x:33,z:31,name:'Sera',    role:'Village Guard',    ico:'⚔',  bCol:0x505060,sCol:0x808090,
    greeting:["Halt — oh, it's just you. Stay out of trouble.",
               "The old gates are restless tonight. Be on guard.",
               "I've seen braver folk than you go into those dungeons and not come back."],
    topics:[
      {label:'Any advice for the old gates?', response:"Kill fast, block faster. And for the love of the gods — find a key before you start hammering on locked doors. Those treasure rooms don't open themselves.",
        follow:[
          {label:'What about the enemies?',response:"Skeletons are dumb but numerous. Goblins are quick little devils. The trolls — don't let them hit you. You'll understand why when one does.",
            follow:[{label:"Anything stranger down there?",response:"Traders who've been deep come back with stories. Statues that aren't statues. Chests that bite. Best advice I can give: after a dungeon or two, when you're past the easy floors — don't trust what doesn't move. And approach every chest like it might be the last one you open."}]}
        ]},
      {label:'What is that gate in the hillside?', response:"Old gate. Dungeon of Shadows lies past it. They've been there since before my grandmother's time. Nobody knows who carved them. Best not to ask. Best not to go in, either, but people never listen.",
        follow:[{label:'And the others?',response:"Crypt of Embers to the east smells like brimstone — nasty magic from that one. The Vault of the Tide is furthest out, half-flooded they say. Start with the Shadows if you're new."}]},
      {label:'Tell me about Ashenmoor.', response:"Quiet village. Mostly farmers, a few merchants. Bram keeps us in weapons, Mira keeps us alive. Pip keeps us... confused. It's a good life.",
        follow:[{label:'Anything unusual lately?',response:"More monsters than usual crawling out of the Dungeon of Shadows. I've been doing double watches. If you're going in there, do us a favor and thin the herd."}]},
      {label:'Farewell.', bye:true},
    ]},
  {x:57,z:56,name:'Edna',    role:'Village Elder',    ico:'👵', bCol:0x5a3a28,sCol:0xa07858,
    greeting:["Ooh, a young adventurer! My old knees can't take those dungeons anymore, but you look sturdy enough.",
               "Have you tried the morning dew off mountain herbs? Does wonders for the joints.",
               "I used to be an adventurer, you know. Then I took an axe to the knee. ...Actually it was a bad step off a stool."],
    topics:[
      {label:'Any wisdom for me, Elder?', response:"Don't run when you can walk. Don't fight when you can think. And always carry a health potion — Mira's prices are fair but nothing's free when you're bleeding.",
        follow:[{label:'What about magic?',response:"Magic comes from understanding, not just power. Old books carry more than their weight — if you find one in a dungeon, read it, don't sell it. A clever mind will unlock it faster than a brute one."}]},
      {label:'What herbs do you know of?', response:"Firemoss for fevers, silverleaf for wounds — Mira has most of it. But the real treasure is heartroot, grows near dungeon entrances. Said to boost constitution permanently. I've never found one, mind you.",
        follow:[{label:'Any other old secrets?',response:"The Vault of the Tide has phosphorescent mushrooms growing in the lower chambers. Useless as medicine but they glow beautifully. Worth the trip if you're not dead."}]},
      {label:'Tell me about Bram the blacksmith.', response:"Bram? Steady man. Steadier than most of us deserve. I patched him back together the winter he nearly died of fever — oh, thirty years back now? Long before I had these knees. He thinks he still owes me. He doesn't. He's paid it back in iron and in being where he said he'd be for thirty straight years, which is more than any coin.",
        follow:[{label:"Is he the last of his family?",response:"His grandfather built that forge. His father ran it. Bram's got no children, never married — the work was his wife, he used to say. If anything happens to him, the forge goes quiet. There's no one waiting to take it up. He says that doesn't bother him. I don't believe him."}]},
      {label:'Tell me something funny.', response:"My husband once tried to wrestle a golem on a dare. The golem won. Humphrey was fine — the golem tripped on his own foot and fell on him, actually knocked the poor thing out cold. True story.",
        follow:[{label:'Ha — what happened to Humphrey?',response:"Oh, he became very good at moving quickly after that. Fastest man in three villages. Died at ninety-two, peacefully in bed. Golem’s still down that gate somewhere, I imagine."}]},
      {label:'Farewell.', bye:true},
    ]},
  {x:31,z:39,name:'Tom',    role:'Local Farmer',     ico:'🌾', bCol:0x604820,sCol:0x907060,
    greeting:["The old gates have been restless these past weeks. Can't sleep properly.",
               "You another one of these adventurers? Fields don't plow themselves, you know.",
               "I'll tell you what I told the last one — the dungeons bring trouble. Every time someone goes in, something worse comes out."],
    topics:[
      {label:'What do you know about the old gates?', response:"Been here my whole life. Those gates were already old when my grandfather was young. Every few years someone seals one up, swears it's done for. Week later it's open again. Whatever's inside — it wants to stay open.",
        follow:[{label:'Has anything strange come through them?',response:"Three years ago a wraith came through the Dungeon of Shadows in broad daylight. Killed two chickens and panicked old Bess the cow so bad she jumped the fence. We lost her for a week. Lost the chickens permanently."}]},
      {label:'Hard times farming here?', response:"Soil's decent enough this far from the gates. East fields, though — near the Crypt of Embers — nothing grows right. The wheat comes up grey. We don't eat that wheat.",
        follow:[{label:'So what do you do with the grey wheat?',response:"Burn it. Every year. Costs me half a harvest. Compensation from the village council? Precisely nothing. I've filed seventeen complaints. Sera stamps them and files them away. Very efficient, that filing."}]},
      {label:'Any tips for surviving out there?', response:"Don't get hit. I know that sounds obvious but you'd be amazed. Also — if you find a book in a chest, don't sell it to Barnaby. Read it first. Some of those old books carry knowledge you can't get anywhere else.",
        follow:[{label:'What about equipment?',response:"Bram's good for weapons. For armor, Sera's guardhouse stocks better than people think. Don't let the cobwebs fool you — that chain mail's proper quality."}]},
      {label:'Farewell.', bye:true},
    ]},
  {x:39,z:35,name:'Finn',   role:'Village Kid',      ico:'🧒', bCol:0x6a4a20,sCol:0xb08060,
    greeting:["Are you going down the old gate?! I totally would but Mum says no.",
               "I found a GOLD coin once near the cave entrance. I kept it forever. Until I spent it on cake.",
               "Sera won't let me get within twenty paces of the old gates. She has EYES EVERYWHERE."],
    topics:[
      {label:'What do you know about the old gates?', response:"There are SECRET treasure rooms! You need a key to get in. My friend Wick says the keys are hidden far from the doors — like the gate is TRYING to make it hard. Which it probably is.",
        follow:[{label:'Anything else?',response:"Wick also says the treasure chests inside give WAY better stuff than regular chests. Gold and swords and everything. Wick's never been inside either, so who knows, but it sounds right."}]},
      {label:'Any dungeon tips?', response:"Run past the slow ones! The troll things are SO slow. And the ghost things that shoot magic? Stay far from those. Also jump more. I feel like jumping helps. Maybe. Probably not but it feels good.",
        follow:[{label:'What about magic?',response:"Finn's mom says never touch a Mystic Scroll. Finn definitely has not touched a Mystic Scroll. ...There was a really small fire but it went out on its own, mostly."}]},
      {label:"What's fun to do in Ashenmoor?", response:"Race to the well and back! I always win because I'm the fastest. Also Pip's shop has an enchanted ring that GLOWS if you hold it. Pip won't let me hold it for long but it's worth going in just to see.",
        follow:[{label:"What about Pip's shop?",response:"Pip's weird in the best way. He has stuff nobody knows what it does. He has stuff HE doesn't know what it does. Once he sold something to a traveler and it turned his boots inside out. Pip thought that was hilarious."}]},
      {label:'Bye!', bye:true},
    ]},
  {x:27,z:35,name:'Corwin', role:'Traveling Merchant',ico:'🧳', bCol:0x3a5a6a,sCol:0x709090,
    greeting:["Just passing through on my way to the coast — these old gates make fine waypoints between towns.",
               "I've traded in a dozen towns this past season. Nowhere quite like Ashenmoor — three old gates and one pub. Remarkable.",
               "Seen anything good drop from the dungeon lately? I pay well for unusual items."],
    topics:[
      {label:'Tell me about other dungeons you know.', response:"These three you have here are mid-tier. The Dungeon of Shadows is a classic — old, well-mapped by now. The Crypt of Embers is fire-touched, nasty magic. The Vault of the Tide I've heard has water on the lower floors. Unusual architecture.",
        follow:[{label:'Which is most dangerous?',response:"Vault of the Tide, without question. The enemies there are older — less predictable. But the loot from the treasure rooms is reportedly extraordinary. High risk, high reward, as always."}]},
      {label:'Tips from your travels?', response:"Sell early, sell often. Bag space is more valuable than any single item. And always — ALWAYS — buy a health potion before entering a dungeon, not after you need one.",
        follow:[{label:'What about leveling up?',response:"The attributes matter more than gear at high levels. Might makes your strikes land harder, but Fortune? I've seen Fortune-specced adventurers pull legendary items from plain dead-end chests. Worth investing."}]},
      {label:'What do you trade in?', response:"Anything with a margin. Weapons east-to-west, herbs south-to-north, and dungeon loot whenever I can get it. The enchanted rings alone — you'd be surprised what the city mages pay for those. Better margins than wheat, I'll tell you.",
        follow:[{label:'Any advice for a newcomer?',response:"Talk to everyone. I know that sounds soft but information is currency. Edna knows more about those dungeons than she lets on. Tom's complaints are 90% grumbling but the other 10% is real data. And Finn — ignore Finn."}]},
      {label:'Safe travels.', bye:true},
    ]},
];

// ── DIALOG SYSTEM ─────────────────────────────────────────────
// Dialog trees for indoor shopkeepers
const SHOP_DIALOG={
  Bram:{ico:'⚒',role:'Blacksmith',
    greeting:["Welcome to my forge! Finest blades in Ashenmoor — and the only blades, but still.",
               "Good timing — just finished sharpening a batch. What do you need?",
               "A proper weapon is the difference between a clean fight and a messy one. Let me help."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Any weapon advice?', response:"Lighter weapons let you swing more often — less stamina per strike. Heavier ones hit harder but you'll tire fast. Match your style. Fast fighter? Shortsword. Power build? Battle Axe.",
        follow:[{label:'What about shields?',response:"A shield changes everything. Block damage, parry at the right moment and your enemy staggers — use that window. Steel Shield is the best I stock. Worth every coin."}]},
      {label:'Tell me about yourself.', response:"Bram. Thirty years at the forge. My grandfather built it, my father ran it, and I'll run it until my arms give out. Ashenmoor grew around the old gates — not ideal for property values, but good for business. Edna stitched me back together the winter the fever took half the village. I haven't forgotten.",
        follow:[
          {label:"Edna patched you up?",
           response:"A bad winter. I was twenty-eight, strong as an ox, and flat on my back for three weeks. She came every morning. Wouldn't take coin. Said the village needed a working forge more than it needed owed favors. Thirty years later I still owe her. She pretends she's forgotten, but she hasn't."},
          {label:'Do the old gates worry you?',
           response:"Every day. But the adventurers keep what comes out of the gates in check. Without folk like you coming through, those things would be swarming the village by now. So — thank you. And buy a sword."},
        ]},
      {label:'Goodbye.', bye:true},
    ]},
  Mira:{ico:'⚗',role:'Apothecary',
    greeting:["Welcome, traveler. What ails you today — or what do you fear will ail you tomorrow?",
               "Come in, come in. The herbs are fresh and the potions are strong.",
               "Careful near those shelves — the Mana Draught and the floor polish look very similar."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Any tips on staying alive?', response:"Potions work instantly but you must USE them — I've found folk dead with a full potion in their bag. Also mana regenerates naturally, so don't panic if it's low. Give it a moment.",
        follow:[{label:'What about magic?',response:"Intelligence governs which spells you can learn. And those Mystic Scrolls grant spells — but only if your mind is ready for them. A too-low Intelligence will leave the knowledge out of reach. It stores itself and unlocks later when you've grown."}]},
      {label:'What do you know about healing?', response:"Max HP increases as you level and invest in Fortitude. But the base potions only heal so much — a Greater Potion heals significantly more for tougher moments. Keep at least one Greater Potion when you enter deeper dungeons.",
        follow:[{label:'Anything about mana?',response:"Mana Draughts are underused. Magic can turn a losing fight — a Healing Light or Frost Nova at the right moment is worth ten sword swings. If you use spells, keep a Draught or two."}]},
      {label:'Goodbye.', bye:true},
    ]},
  Barnaby:{ico:'🎒',role:'General Merchant',
    greeting:["Ha! Another one! Come in, come in — Barnaby's Goods has what you need and several things you didn't know you needed.",
               "Best selection in Ashenmoor — admittedly limited competition, but still.",
               "Dungeon Map's selling well lately. Though I will note that nobody who bought one came back to say it helped."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Heard any rumors lately?', response:"Always. The Crypt of Embers has been more active — bigger creatures coming out of it. Travelers heading east have reported lights in the sky above it. Red lights. That's never good.",
        follow:[{label:'Anything about the Vault of the Tide?',response:"A diver from the coast stopped in two weeks ago. Said the lower level of the Vault is half-submerged now. More than before. Whatever's down there is making the water rise. He didn't go back in. Smart man."}]},
      {label:'What IS a Mystic Scroll exactly?', response:"Pages from ancient spellbooks, far as anyone can tell. Wizards used to tear out single spells to trade — safer than giving someone the whole book. Read one and the knowledge tries to transfer to your mind. Takes Intelligence to process it fully.",
        follow:[{label:'What if I\'m not smart enough?',response:"The knowledge waits. Like water in a locked jar — it's there, just held back. Invest in Intelligence when you level up and the spells you've half-learned will unlock on their own. Very elegant magic, really."}]},
      {label:'Goodbye.', bye:true},
    ]},
  'Captain Vorn':{ico:'🛡',role:'Guard Captain',
    greeting:["State your business — oh, shopping. Fine. We have armor. Good armor.",
               "The guardhouse stocks the finest protective equipment in town. Keeps the village alive, that does.",
               "Don't touch the weapons rack on the left wall. Those are for guardsmen. The ones on the right rack are for sale."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Any combat advice?', response:"Block early, not late. A perfect parry — blocking before the blow lands — costs you nothing and staggers the attacker. A late block reduces damage. No block at all? That's how people die.",
        follow:[{label:'What about multiple enemies?',response:"Don't let them surround you. Keep moving, keep one in front. The ranged ones — Phantoms, Wraiths — prioritize them. A magic orb through a crowd will ruin your whole day."}]},
      {label:'Tell me about the guardhouse.', response:"Three permanent guards plus me. We patrol the village perimeter, keep the peace, and discourage anything crawling out of the old gates from getting too comfortable. Moderately successful at that last one.",
        follow:[{label:'Is the village in danger?',response:"Not immediately. The gates produce a manageable flow. But that flow has been increasing. We handle what we can. The rest — well, that's what adventurers are for. If you're heading in, you're doing us a genuine service."}]},
      {label:'Goodbye.', bye:true},
    ]},
  Pip:{ico:'✨',role:'Curiosity Dealer',
    greeting:["OHH a customer! Come look come look — I got new stock in from a traveling wizard who owed me a favor!",
               "Everything in here is authentic, mostly harmless, and quite possibly magical!",
               "Fair warning — the glowing one on the middle shelf? Don't ask what it does. I genuinely don't know."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'What IS half this stuff?', response:"Excellent question! That ring pulses warmly in the gates — Fortune enhancement, I believe. The scrolls are Mystic — proper spells waiting to be learned. The map is... a map. The dungeon keeps changing shape though so accuracy is approximate.",
        follow:[{label:'What about the Enchanted Ring?',response:"Increases luck in the finest, most mathematically real sense. More Fortune means better loot from chests, higher critical strike chance. I've seen it change the course of a fight. Mostly because the wearer felt more confident. Still counts."}]},
      {label:'Where do you even GET this stuff?', response:"Sources! I have sources. Traveling merchants, dungeon salvagers, estate sales from adventurers who didn't... return. It's a whole ecosystem really. Someone goes in, something comes back out, I put a price on it.",
        follow:[{label:'Isn\'t that a bit morbid?',response:"Everything is morbid if you think about it too hard. I prefer to think of it as honoring their memory by making sure their equipment finds a good home. Also I need rent money."}]},
      {label:'Goodbye.', bye:true},
    ]},
  Edna:{ico:'🌿',role:'Herbalist',
    greeting:["Sit, sit — tea's on. Well, metaphorical tea. I don't actually have tea at the moment.",
               "Bless you for coming. It gets quiet here. The old gates don't make great company.",
               "I was just sorting my herb stocks. Firemoss, silverleaf — the usual. Nothing interesting, unlike you."],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Any wisdom for me, Elder?', response:"Patience. Everything in those dungeons wants to kill you quickly — if you outlast that first rush, you'll find most enemies make mistakes. Let them. Punish the mistake. Don't be the one making them.",
        follow:[{label:'What about the magic?',response:"Intelligence is more than just magic. It improves how you barter, what spells you can hold in your mind. A few points into it goes a long way. Don't neglect it just because you want to hit things."}]},
      {label:'Tell me about your past adventures.', response:"Oh, I've been in all three. The Dungeon of Shadows twice — once at your age, once when I was foolishly older and should have known better. The Crypt of Embers once. I have scars from that one.",
        follow:[{label:'What did you find in the Crypt?',response:"Fire golems. Tougher than the regular kind. And a treasure chest in a side room with enough gold to buy my cottage outright. Worth the scars, just. I went home after that and I stayed home."}]},
      {label:'Goodbye.', bye:true},
    ]},
  'Brother Oswin':{ico:'✝',role:'Keeper of the Oratory',
    greeting:["The door is always open, friend. Come in from the grey.",
               "This oratory has stood longer than any house in Ashenmoor. That gives me some comfort.",
               "You look like someone who has seen the inside of a dungeon. Rest here a while."],
    topics:[
      {label:"What do you know about the old gates?", response:"I know what the old texts say, which is more than most. They were not built by men. The sigil patterns on the deep walls — I have copies here — match no known written language. They predate the village by centuries. Whatever sealed those things below us, it was deliberate and it was careful. And something is making it less careful.",
        follow:[{label:'What do you mean, less careful?',response:"The binding sigils fail from the outside in. Something is rewriting them. I have documented seventeen changes to the marks in the gate’s mouth over the past two years alone. No creature does that. Something with intention does that."}]},
      {label:"Can you bless me before I go in?", response:"I can. It won't stop a blade or a claw — I won't pretend otherwise. But clarity of mind is worth something in the dark. Hold still.",
        follow:[{label:'Thank you.',response:"Come back. That is all I ask. Come back and tell me what you found."}]},
      {label:'Goodbye.', bye:true},
    ]},
  'Sister Aveline':{ico:'✝',role:'Chapel Sister',
    greeting:["The chapel is open to all. Soldier, merchant, wanderer — it makes no distinction.",
               "Lord Caldric allows us to remain. He is practical about such things. The garrison needs somewhere to go before a hard patrol.",
               "You have the look of someone who has been underground recently. Sit. Breathe."],
    topics:[
      {label:"What role does the chapel play here?", response:"Practically? We provide calm. Ironhaven is a military town — everything here is about readiness, threat assessment, response. We provide the one thing the garrison doesn't train: stillness. The soldiers who visit us regularly make fewer mistakes. That is the Commander's own assessment.",
        follow:[{label:'And spiritually?',response:"We maintain records of the dead. Every name from the gate patrols is written in the record book on that stand. Over three hundred now. It matters to have a name written down. It matters to be counted."}]},
      {label:"Do you know anything about the trouble at the gates?", response:"More than I discuss openly. The pattern of creature emergence correlates with lunar cycles — I have twenty years of records. More troublingly, the variety of creatures is changing. We're seeing things from the Vault of the Tide now that weren't there five years ago. Something is moving them. Herding them, almost.",
        follow:[{label:'What do you think is behind it?',response:"I think whatever is rewriting the binding sigils is also reorganizing what's inside. That's not a natural process. That's management. Something is preparing for something. I don't know what. The scholars in the capital don't believe me. Lord Caldric does."}]},
      {label:'Goodbye.', bye:true},
    ]},
  // v61: Hearthwick innkeeper
  Oda:{ico:'🍲',role:'Innkeeper',
    greeting:[
      "Come in, come in — I'll not have travellers eating my door. Sit anywhere.",
      "You look like a bowl of stew would mean something to you right now.",
      "Fire's going, bread's fresh, and nobody's stabbed anyone in a week. A good day at Oda's.",
    ],
    topics:[
      {label:'Browse your wares.',trade:true},
      {label:'Tell me about the road.', response:"The Bealach's been soft lately. Wolves at the south bend — a pair, working together, they don't come near the road in daylight. The Deepwood's the harder leg. Forest Trolls aren't supposed to push this far south but they have been. Keep your axe loose, not sheathed.",
        follow:[
          {label:'Any advice on the Deepwood?', response:"Stay on the path. Every traveler who told me a Deepwood story started with 'I stepped off the path for a moment.' The trees let you in just fine. They're slower about letting you back out."},
        ]},
      {label:'Who passes through here?', response:"Merchants mostly. A guard patrol out of Ironhaven every few weeks — they don't stop, they just count heads. Adventurers come through in streaks, like birds. Last month three in one week, then nothing. I charge them all the same. Coin is coin.",
        follow:[
          {label:'Anyone memorable recently?', response:"A scholar heading north. Thin man, soft hands, wouldn't give a name. Asked me odd questions about the sigils in the Deepwood — as if I'd know. I told him I run an inn, not a library. He paid double and left before breakfast. Left an odd taste, that one."},
        ]},
      {label:'Goodbye.', bye:true},
    ]},
  // v61e1: Thorngate road-warden — peripheral outpost south of the Deepwood.
  // Per lore: "neglected, ivy-grown, peripheral. A skeleton crew of guards."
  // Edwin is Anglo-Saxon-coded (commoner register), posted here long enough
  // that he doesn't expect orders from anyone. Stocks rations and basic gear.
  'Warden Edwin':{ico:'🪓',role:'Road-Warden',
    greeting:[
      "You came up the south road. Anyone behind you, or just you?",
      "The thornbush is winning. Watch your sleeves on the way through.",
      "Posted here eleven years. They forget to rotate me out. I've stopped reminding them.",
    ],
    topics:[
      {label:'Browse your wares.', trade:true},
      {label:'What is this place?', response:"A watchpost. Six of us when I came up. Three now. We log what comes south out of the forest and what goes north into it. Mostly we count our own boots.",
        follow:[{label:'Anything come south lately?', response:"More than used to. Wolves further from their territory. A pair of trolls a fortnight ago — turned at the gate, didn't press it. That's the part I don't like. Trolls don't usually decide."}]},
      {label:'Tell me about the Deepwood.', response:"You'll feel the sound change about fifty paces past my gate. Birds first, then your own footsteps. Some folk find it peaceful. Most don't. The road's marked but if you wander you'll wander a long way.",
        follow:[{label:'Anything I should avoid?', response:"The Standing Stones west of the road. Don't stop there at dusk. I'm not telling you a story — I'm telling you what the patrol logs say. Two of mine sat down to rest there. Only one of them stood back up."}]},
      {label:'Goodbye.', bye:true},
    ]},
  // v61e1: La Porte Grise quartermaster — properly staffed checkpoint between
  // forest and Ironhaven. Per lore: "institutional, French-coded, official.
  // Properly staffed. The kind of place where 'papers, please' is muttered."
  // Roland is Norman-French-coded; treats the post as a real career step.
  'Quartermaster Roland':{ico:'📜',role:'Royal Quartermaster',
    greeting:[
      "Papers? No, no — I see you're not carrying anything sealed. State your business briefly, then.",
      "Welcome to La Porte Grise. The road behind you ends here; the one ahead is Ironhaven's. Mind the difference.",
      "Through the forest, I take it. Sit if you need to. The bench is the only courtesy I extend without paperwork.",
    ],
    topics:[
      {label:'Browse your wares.', trade:true},
      {label:'What is this place?', response:"A border post. Quartermaster's office, a half-section of guard, a cellar that's a cellar in name only — it's where we keep the records that don't go to Ironhaven and don't go to the capital. The road is officially the king's; in practice it's Lord Caldric's, and he's reasonable.",
        follow:[{label:'Records of what?', response:"Who comes through. What they carried. Whether they came back. Patterns, mostly. The patterns have not been encouraging this season."}]},
      {label:'What does Ironhaven need to know?', response:"That my logs show fewer travellers returning than departing, and that the ones who do return are quieter. I send the numbers up weekly. Aldwyn reads them; whether anyone above him does, I can't say.",
        follow:[{label:'You report to Aldwyn?', response:"To his office. He's the Royal Herald — that's the formal channel. He treats my numbers seriously, which is more than the previous officeholder did. Tell him Roland sends regards if you see him. He'll know I mean it."}]},
      {label:'Goodbye.', bye:true},
    ]},
};

// v61ad: post-burn dialog overrides. Looked up first in the interior dialog
// resolver (see goToInterior flow) when worldState.ashenmoorBurned is true.
// Only keepers who actually survive the burn get entries here — currently only
// Edna. Everyone else fled to Ironhaven or fell in the attack; their houses
// render as 'destroyed' in ASHENMOOR_BURNED_BUILDINGS and can't be entered.
const SHOP_DIALOG_BURNED={
  Edna:{ico:'🌿',role:'Village Elder',
    greeting:[
      "Sit, if you can. I can't stand long, so I won't.",
      "You came back. Most wouldn't have. Sit.",
      "I won't offer tea. There isn't any. Sit anyway.",
    ],
    topics:[
      // v61ae: free-standing topics. Quest-state-aware topics are injected by
      // buildQuestTopicsForNPC:
      //   - Q7 available: "📜 The Rubbing" accept topic
      //   - Q7 active, Bram+Oswin done: "📜 I saw to them both." handoff topic
      //   - Q7 active, in progress: "📋 The Rubbing (in progress)" reminder
      //   - Q7 complete: only the free-standing topics remain
      // The mark-on-the-wall reveal and the rubbing handoff both live inside
      // the Q7 flow, not in these free-standing topics.
      {label:'What happened here?',
       response:"You tell me what you saw on the way in and I'll tell you which of them were ours. Bram went out at the forge. He went out the way he was going to. Corwin got the children into a cart and drove them east — I don't know if they made the Bealach road before nightfall. Mira and Barnaby and Tom went together up the Ironhaven road. Sera fought. I watched her fight. I didn't see her after.",
       follow:[
         {label:"Who did this?",
          response:"I have a guess and Aldwyn has the name. I'll keep mine to myself tonight. What came to Ashenmoor were the kind of things that come out of the Shadows. More than I'd ever seen. They didn't come to fight. They came to erase."},
         {label:"You weren't hurt worse?",
          response:"Oh, I was. I walked out of the cottage with my hip broken and sat down against the garden wall and counted the ones I could hear screaming. When I'd counted everyone I knew, I pulled myself back inside and I watched the rest through the window. My hip will mend. The counting won't."},
       ]},
      {label:"Why didn't you leave with the others?",
       response:"I told them to go and I told myself I'd follow. I haven't, yet. My knees were giving before this and they're giving more now. And I wanted to see the village once more in daylight, whatever state it was in. That's the honest answer. Everything else is pride."},
      {label:"What about the old gate?",
       response:"Still there. Still open. The gate didn't close — why would it? What was holding things in is what broke. If you go back through, don't expect the same dungeon. Whatever he did to the anchors, it shows in the lower floors first. Be careful. I won't be patching you up this time."},
      {label:"Take care of yourself, Edna.",
       bye:true},
    ]},
  // v61ae: post-burn dialog for the priest of the Ashenmoor Oratory. Oswin
  // survived by staying inside. He heard the village die through the door
  // and did not open it. He knows it was the right tactical choice and he
  // cannot stop treating it as a failure. He is not suicidal or theatrical
  // about it — he is exhausted and deeply ashamed in a quiet way. Player
  // arrives to find him sitting at the altar.
  'Brother Oswin':{ico:'✝',role:'Keeper of the Oratory',
    greeting:[
      "You're not one of them. I can hear that much. Thank — no. I don't deserve to say that today.",
      "Come in, if you're coming. The door held. It's the one thing that did.",
      "You should sit. I won't get up. I'm sorry. I've been trying to and I can't.",
    ],
    topics:[
      // v61an: "Edna sent me to check on you." was removed from the static
      // topic list here — it's now injected as a quest topic via
      // buildQuestTopicsForNPC based on whether the player has actually
      // spoken to Edna yet. If ednaDone: "Edna sent me." If not:
      // "I came looking for you." Either fits the moment without putting the
      // player in an order-dependent bind.
      {label:"What happened here?",
       response:"Someone pounded on the door. I know who — I recognized the voice. One of the Glenn children, the middle one. I didn't open it. I heard her for a while and then I didn't. That was perhaps an hour in. I stopped counting after that. There were other voices. I didn't know all of them.",
       follow:[
         {label:"You couldn't have opened it.",
          response:"I know. I know that. I am a grown man who did not open a door when a child was dying behind it, and I know with my whole intellect that opening the door would have meant both of us dying in the next minute. I know that. It does not help."},
         {label:"You survived. That matters.",
          response:"It does. Someone needs to remember the names and someone needs to say the last words over what can be found. I will do both of those things. Tomorrow. Today I cannot."},
       ]},
      {label:"Why didn't you fight?",
       response:"I am not a fighting man. I haven't been since I was seventeen and I went to the capital and saw what a fighting man actually was, and came home and asked the old priest here to teach me something else. I would have died in the first minute. I would have saved no one. All of that is true. All of that can be true and the shame can still be the shape it is.",
       follow:[
         {label:"That's not cowardice.",
          response:"I know. I'll get to knowing it. Give me time."},
       ]},
      {label:"Will you stay here?",
       response:"I'll walk to Ironhaven when my legs work. Not tonight. There's work here first — the people I can find, I will say the words over. I don't want company for it. It isn't a brave thing I'm doing. It's the only thing I know how to do, and it still has to be done."},
      {label:"What about the old gate?",
       response:"I've been writing about those sigils for eleven years and I have never been so afraid of them as I have been this afternoon. Whatever he did, it wasn't a binding being strained. It was a binding being edited. That is a different kind of harm. Tell Aldwyn I said so. He'll understand what I mean."},
      {label:"Rest, Brother. I'll come back.",
       bye:true},
    ]},
};

let dlgOpen=false;
let dlgNPC=null; // current NPC being talked to (outdoor or indoor)
let dlgNode=null; // current node in the tree

// ── TTS (Text-to-Speech) ─────────────────────────────────────────────
// Uses the browser's built-in Web Speech API. On Windows/Chrome this gives
// Microsoft David/Zira — the 2006-era SAPI voices. No libraries, no network.
// Mute toggle on M key, persisted to localStorage under DOS_tts_muted.
let ttsEnabled=true;
let ttsVolume=0.6;  // 0..1 — sits behind music/SFX so dialog doesn't overpower the mix
let ttsVoices=[];
try{ if(localStorage.getItem('DOS_tts_muted')==='1') ttsEnabled=false; }catch(e){}
const ttsSupported=('speechSynthesis' in window);
if(ttsSupported){
  const _loadV=()=>{ttsVoices=speechSynthesis.getVoices();};
  _loadV();
  // Chrome loads voices async — the first getVoices() often returns []
  speechSynthesis.onvoiceschanged=_loadV;
}

// Prefer Microsoft voices (the period-charming SAPI tone). Fall back to any
// voice whose name includes the hint, then give up and let the browser pick.
function ttsFindVoice(nameHint){
  if(!nameHint||!ttsVoices.length) return null;
  return ttsVoices.find(v=>v.name.includes('Microsoft')&&v.name.includes(nameHint))
      || ttsVoices.find(v=>v.name.includes(nameHint))
      || null;
}

// Per-NPC voice profiles — voice identity hint + rate + pitch.
// Tuned per the voice_direction notes in lore_canon_v8. Unlisted NPCs
// get a deterministic David/Zira pick based on a name hash.
const VOICE_PROFILES={
  // Q1–Q6 givers
  Bram:            {voice:'David', rate:0.88, pitch:0.80},  // old blacksmith, slow, low
  Edna:            {voice:'Zira',  rate:0.98, pitch:1.20},  // folksy elder, a bit high
  Corwin:          {voice:'David', rate:1.08, pitch:1.05},  // merchant, quick, faintly amused
  Aldwyn:          {voice:'David', rate:0.95, pitch:0.92},  // scholar-mage, measured
  'Captain Brynn': {voice:'Zira',  rate:1.08, pitch:0.90},  // military, crisp
  'Lord Caldric':  {voice:'David', rate:0.85, pitch:0.75},  // lord, slow, commanding
  // Other named NPCs — lighter tuning, mostly distinct voice assignments
  Sera:            {voice:'Zira',  rate:1.02, pitch:1.00},  // village guard
  Tom:             {voice:'David', rate:0.95, pitch:0.95},  // farmer
  Finn:            {voice:'Zira',  rate:1.15, pitch:1.40},  // kid — fast and high
  Mira:            {voice:'Zira',  rate:1.00, pitch:1.10},  // apothecary
  Barnaby:         {voice:'David', rate:1.05, pitch:1.05},  // merchant
  Pip:             {voice:'David', rate:1.12, pitch:1.15},  // eccentric curios dealer
  'Brother Oswin': {voice:'David', rate:0.90, pitch:0.88},  // priest — older, soft, measured
  _default:        {voice:null,    rate:1.00, pitch:1.00},
};

function ttsProfileFor(npcName){
  if(!npcName) return VOICE_PROFILES._default;
  if(VOICE_PROFILES[npcName]) return VOICE_PROFILES[npcName];
  // Deterministic David/Zira pick by name hash — same NPC always gets the same voice
  let h=0;
  for(let i=0;i<npcName.length;i++) h=(h*31+npcName.charCodeAt(i))|0;
  return {voice:(h&1)?'David':'Zira', rate:1.00, pitch:1.00};
}

// Track the currently-live utterance so late events from cancelled ones can't
// stomp on the dialog text after a new line has started rendering.
let ttsCurrentId=0;

function speakLine(text,npcName,revealEl){
  // If TTS is off or unavailable, make sure the caller's reveal target shows the full line.
  if(!ttsSupported||!ttsEnabled||!text){
    if(revealEl) revealEl.textContent=text||'';
    return;
  }
  try{
    speechSynthesis.cancel();  // prevent overlap if player clicks through fast
    const myId=++ttsCurrentId;
    const u=new SpeechSynthesisUtterance(text);
    const p=ttsProfileFor(npcName);
    const v=ttsFindVoice(p.voice);
    if(v) u.voice=v;
    // Per-utterance jitter — ±0.03 drift keeps the same NPC from sounding
    // robotically identical across lines. Small enough to stay "in character".
    u.rate=p.rate+(Math.random()-0.5)*0.06;
    u.pitch=p.pitch+(Math.random()-0.5)*0.06;
    u.volume=ttsVolume;
    // Word-sync reveal: onboundary fires at each word. e.charIndex is the start
    // of the upcoming word, so slicing [0, charIndex) gives us everything said
    // so far. Some engines don't fire boundary events — if we haven't seen one
    // within 500ms of speech starting, fall back to full text reveal.
    if(revealEl){
      let boundaryFired=false;
      u.onboundary=e=>{
        if(myId!==ttsCurrentId) return;  // stale — newer utterance is live
        if(e.name&&e.name!=='word') return;  // ignore 'sentence' boundaries
        boundaryFired=true;
        revealEl.textContent=text.slice(0,e.charIndex);
      };
      u.onstart=()=>{
        setTimeout(()=>{
          if(myId!==ttsCurrentId) return;
          if(!boundaryFired) revealEl.textContent=text;
        },500);
      };
      u.onend=()=>{ if(myId===ttsCurrentId) revealEl.textContent=text; };
      u.onerror=()=>{ if(myId===ttsCurrentId) revealEl.textContent=text; };
    }
    speechSynthesis.speak(u);
  }catch(e){
    if(revealEl) revealEl.textContent=text;
  }
}

function ttsStop(){ if(ttsSupported){ try{speechSynthesis.cancel();}catch(e){} } }

// v61ae: resolve a quest's customActiveDialog entry for a specific NPC.
// Two supported shapes for qDef.customActiveDialog:
//   (a) Single-NPC form — object with {label, response, follow}. Applies to
//       whichever NPC is a talk_to target. Used by Q3 (Aldwyn-only talk target).
//   (b) Multi-NPC form — object keyed by NPC name: { 'Edna': {...}, 'Aldwyn':
//       {...} }. Each entry may have its own `prereqIndices` gate — the entry
//       is only returned when all listed prior objectives on this quest are
//       complete. Used by Q7's four-stage shape so Aldwyn's scripted scene
//       shows only after the Edna handoff has happened (obj 2 done).
// Returns null if no entry applies (wrong NPC or prereqs unmet).
function resolveCustomActiveDialog(qDef, npcName){
  const cad = qDef && qDef.customActiveDialog;
  if(!cad) return null;
  // Single-NPC form: {label, response, follow} — apply to any NPC.
  // Multi-NPC form: {npcName: {...}} — apply only to matching key.
  const entry = (cad.label !== undefined) ? cad : cad[npcName];
  if(!entry) return null;
  if(entry.prereqIndices && entry.prereqIndices.length){
    const qs = QS[qDef.id];
    const prereqsDone = entry.prereqIndices.every(idx=>{
      const p = qs && qs.objectives && qs.objectives[idx];
      const needed = (qDef.objectives[idx].count||1);
      return p && p.current >= needed;
    });
    if(!prereqsDone) return null;
  }
  return entry;
}

function ttsToggleMute(){
  ttsEnabled=!ttsEnabled;
  if(!ttsEnabled) ttsStop();
  try{localStorage.setItem('DOS_tts_muted',ttsEnabled?'0':'1');}catch(e){}
  showMsg(ttsEnabled?'🔊 Dialog voice on':'🔇 Dialog voice muted', ttsEnabled?'#88ccff':'#999999');
}

// v80 S236 — the quest zone of the place you stand in. The main quest names 'ironhaven' or 'overworld' (Ashenmoor's
// legacy zone); in the open world both are settlements, so the world's Ironhaven (or a house of it) counts as 'ironhaven'.
function questZoneNow(){
  if(activeZoneId==='ironhaven')return 'ironhaven';
  if(activeZoneId==='world'&&typeof WORLD!=='undefined'){try{
    const h=(typeof currentHouse!=='undefined')?currentHouse:null;
    if(h&&h.siteId)return h.siteId==='ironhaven'?'ironhaven':'overworld';
    const t=WORLD.siteAnywhere('ironhaven');if(t&&Math.hypot(px-t.x,pz-t.z)<(t.pad||60)+40)return 'ironhaven';
  }catch(e){}}
  return 'overworld';
}
// S550 — a feast day's greeting (FEASTS, 60-shop.js) replaces the stock one for anyone who lives in a generated town
function dlgGreeting(n){const G=n.greeting,f=typeof feastGreeting==='function'?feastGreeting(n):null;if(f)return f;return G[Math.floor(Math.random()*G.length)];}
function openDialog(npc){
  _releasePointerLockForMenu();
  try{
    dlgOpen=true;
    dlgNPC=npc;
    document.getElementById('dlg-portrait').textContent=npc.ico;
    document.getElementById('dlg-name').textContent=npc.name;
    document.getElementById('dlg-role').textContent=npc.role;
    // v61d6 — Caldric safehouse grant scene. Auto-fires on the first dialog
    // open with Caldric while the player is commissioned (Q7-complete) but
    // hasn't yet been granted the safehouse. Skips the regular greeting +
    // topics render entirely until the scene resolves; the final node sets
    // worldState.safehouseGranted = true via the c.grantSafehouse resolver,
    // and subsequent visits fall through to normal Caldric dialog.
    //
    // The scene is two beats: Caldric's opening monologue (4 paragraphs)
    // with TWO player choices that branch on tilt-engagement (A: "What
    // other things?" surfaces the asset framing more openly; B: "I
    // understand." accepts subtext quietly). Both branches converge on
    // the gift announcement (the safehouse description) and a single final
    // closer ("My thanks, Lord Caldric.") that resolves the scene.
    //
    // Restrained register throughout — Caldric is a pragmatist who says
    // what he means rather than implying it. The closer line ("Thank
    // Aldwyn. He is the reason I am giving you a house instead of a
    // contract.") is the single most pointed Act II setup beat.
    if(npc.name==='Lord Caldric' && worldState.commissioned && !worldState.safehouseGranted){
      const _giftLine = "There is a house in the south-west of the town, near the chapel. Modest. Burgundy door, you cannot mistake it. It belonged to a sworn man of mine who fell at the Vault of the Tide. His widow has been at the capital for two years and has, with my help, been re-housed. The deed has been transferred to your name. The key is in the lock; the lock answers to no other key in this town.\n\nThis is not lodging. This is yours. There is a bed in it, and a chest, and the chest is the only one in the Reach that I will guarantee against my own household. Use it.";
      const _closingLine = "Thank Aldwyn. He is the reason I am giving you a house instead of a contract. I prefer contracts. He persuaded me you respond better to trust. We will see if he is right. Go. Brynn will not detain you on your way out.";
      // After the player picks ANY of the final closers, the scene resolves
      // via grantSafehouse. The closer line is rendered, then the dialog
      // closes on the player's next click.
      const _finalChoice = {
        label: "My thanks, Lord Caldric.",
        response: _closingLine,
        grantSafehouse: true,
      };
      // Branch A — "What other things?" — surfaces the asset framing.
      const _branchA = {
        label: "What other things?",
        response: "It is a question of who acts when nothing official can act. The capital has not answered three ravens. Aldwyn writes letters that do not move policy. You are not a soldier and not a scholar and not under the academies' jurisdiction. That is — usefully — what you are. I am being plain because I respect you enough to be plain. Now, here.\n\n" + _giftLine,
        follow: [_finalChoice],
      };
      // Branch B — "I understand." — accepts the subtext quietly.
      const _branchB = {
        label: "I understand.",
        response: "Yes. I think you do. Now, here.\n\n" + _giftLine,
        follow: [_finalChoice],
      };
      const _opening = "You are the one Aldwyn signed for. Sit, if you want. Stand if you prefer. I will not keep you long.\n\nI have read the rubbing. I have read the Mark — Aldwyn's transcription of what he is willing to commit to paper, which is not all of it. I have read his commission, which I countersigned in the small hours of yesterday because he came to me in the small hours of yesterday. He does not do that often.\n\nThere is a question I do not yet have an answer to. There is a man who has been doing this work for two centuries, and whatever he is doing matters more than anything else this office has dealt with in my lifetime. I cannot send a regiment after him. I cannot send a herald. I have sent a young scholar who would not have come back, and I have sent two soldiers who did not come back. I am, at present, sending you.\n\nAldwyn frames this as a scholarly matter. It is a scholarly matter. It is also other things.";
      renderDialogNode(_opening, [_branchA, _branchB]);
      document.getElementById('dlg').style.display='block';
      lvAct.npcTalks++;
      if(typeof sndTabSwitch==='function') sndTabSwitch();
      return;
    }
    // Fire talk_to quest event — but only for objectives without custom dialog
    // (custom dialog quests complete via questComplete in the dialog branch itself).
    // v61ae: supports two customActiveDialog forms — single-NPC (top-level
    // `label` field, applies to any talk_to target) and multi-NPC (keyed by
    // NPC name, only triggers for the matching NPC). Q7 uses the multi-NPC
    // form to keep Oswin's/Edna's talk_to events firing normally while only
    // Aldwyn triggers the custom dialog.
    const greet=dlgGreeting(npc);
    const npcZone=questZoneNow();
    // v61ae: use the hoisted resolver so prereqIndices are respected here too.
    // hasCustomDialog should ONLY block talk_to auto-fire if the custom dialog
    // actually surfaces for this NPC in this state — an NPC with an unmet
    // prereq shouldn't block the event (their objective still needs to tick).
    const hasCustomDialog=QUEST_DEFS.some(q=>{
      if(qState(q.id)!=='active')return false;
      if(!resolveCustomActiveDialog(q, npc.name))return false;
      return q.objectives.some(o=>o.type==='talk_to'&&o.npc===npc.name&&o.zone===npcZone);
    });
    if(!hasCustomDialog) checkQuestProgress('talk_to',{npc:npc.name,zone:npcZone});
    // Build topics: inject quest topics based on state
    const baseTopics=[...(npc.topics||[])];
    const questTopics=buildQuestTopicsForNPC(npc.name,npcZone);
    const allTopics=[...questTopics,...baseTopics];
    renderDialogNode(greet, allTopics);
    document.getElementById('dlg').style.display='block';
    lvAct.npcTalks++;
    if(typeof sndTabSwitch==='function') sndTabSwitch();
  }catch(err){
    console.error('openDialog error:',err);
    dlgOpen=false;dlgNPC=null;dlgNode=null;
    document.getElementById('dlg').style.display='none';
    showMsg('(Could not open dialog — see console)','#cc4444');
  }
}

function buildQuestTopicsForNPC(npcName, zone){
  const topics=[];
  // v61d6 — Brynn safehouse-relay topic. Surfaces when the player is
  // commissioned (Q7-complete) but hasn't yet been granted the safehouse
  // by Caldric. Brynn directs the player to the keep; the grant scene
  // auto-fires on first dialog with Caldric. Not tied to a QUEST_DEFS
  // entry — purely worldState-driven, so it lives outside the per-quest
  // forEach below. Single-shot label/response, no follow tree; the player
  // exits and walks to the keep on their own. Uses the {name} substitution
  // for the player name (renderDialogNode runs the regex pass at render time).
  if(npcName === 'Captain Brynn' && zone === 'ironhaven' &&
     worldState.commissioned && !worldState.safehouseGranted){
    topics.push({
      label: "You called for me?",
      response: "Lord Caldric wishes to see you. Now would be appropriate. Through the gatehouse, across the courtyard, the door at the back. The guards will not stop you — you are listed.",
    });
  }
  QUEST_DEFS.forEach(qDef=>{
    const state=qState(qDef.id);

    // v61an: state-aware opener for Q7's Brother Oswin. Oswin is a talk_to
    // target without a customActiveDialog, so the default flow below pushes
    // no quest topic for him. Here we inject an opener whose text depends on
    // whether the player has already spoken to Edna. The old static
    // "Edna sent me to check on you." topic lived in SHOP_DIALOG_BURNED and
    // was wrong when the player came to Oswin first — Edna had never sent
    // anyone. Now:
    //   ednaDone  → "Edna sent me to check on you."
    //   !ednaDone → "I came to see if you made it." (Oswin asks about Edna)
    // Gated on !rubbingDone — after the rubbing is handed over, the
    // triage is behind us and this opener is no longer appropriate.
    if(qDef.id === 'q7_the_rubbing' && state === 'active' &&
       npcName === 'Brother Oswin' && zone === 'overworld'){
      const qsq = QS[qDef.id];
      // v61c2: Edna was obj 3, now obj 4. Rubbing was obj 4, now obj 5.
      // Both shifted by +1 due to defeat_boss insertion at obj 1.
      // v61d0: indices shifted by +1 again — Edna is now obj 5, rubbing
      // is now obj 6, due to Mark-loot insertion at obj 2.
      const ednaDone    = qsq.objectives[5] && qsq.objectives[5].current >= 1;
      const rubbingDone = qsq.objectives[6] && qsq.objectives[6].current >= 1;
      if(!rubbingDone){
        if(ednaDone){
          topics.push({
            label:"Edna sent me to check on you.",
            response:"Edna. Edna is alive then. I didn't know — I heard her cry out near the end and then nothing, and I thought — tell her I'm sorry I wasn't the one who went out. Tell her that. And tell her I'm alive, and I will come see her when I can walk that far.",
            follow:[
              {label:"She said you'd be inside.",
               response:"She knows me. She knows what I am. She's a better judge of men than the men she judges."},
            ],
          });
        } else {
          topics.push({
            label:"I came to see if you made it.",
            response:"I'm alive. That's as much as I can honestly claim today.\n\nEdna — have you seen Edna? I haven't heard anything from her cottage. I've been sitting here imagining and unable to walk that far to know.",
            follow:[
              {label:"I'll go check on her next.",
               response:"Thank you. Tell her I'm alive. Tell her I will come to her when I can walk the distance. And tell her I'm sorry I wasn't the one who went out."},
            ],
          });
        }
      }
      return;
    }

    const isGiver=qDef.giver===npcName&&qDef.giverZone===zone;

    // v61ae: active customActiveDialog entry for THIS NPC. Uses the hoisted
    // resolver (see ttsStop region) which handles both single-NPC form
    // (backward-compat for Q3) and multi-NPC keyed form (Q7's Aldwyn entry),
    // and respects any prereqIndices on the entry. Returns null if no entry
    // applies — the caller falls through to the "📋 in progress" path for
    // givers, or skips adding a topic for non-giver talk targets.
    const activeCAD = (state==='active') ? resolveCustomActiveDialog(qDef, npcName) : null;

    // Check if this NPC is a talk_to target for an active quest with a
    // resolved customActiveDialog entry for THIS NPC specifically.
    const isTalkTarget = state==='active' && activeCAD &&
      qDef.objectives.some(o=>o.type==='talk_to'&&o.npc===npcName&&o.zone===zone);

    if(!isGiver && !isTalkTarget) return;

    if(isTalkTarget && !isGiver){
      // v61d0 — Q7+Aldwyn Mark-aware topic builder. If the player is
      // carrying The Faolchú's Mark (equipped on the amulet slot OR sitting
      // in BAG), Aldwyn's dialog opens with a "Wait, what's that..."
      // preamble: he notices the Mark before the rubbing, sets it on the
      // desk, examines it, then pivots back to the rubbing. The cascade
      // wraps the existing CAD response/follow as a deeper node so the
      // Branch A / Branch B / desk → commission tree is unchanged below.
      //
      // If the player doesn't have the Mark (skipped the loot, sold it
      // before v61d0's sell-protection landed on a legacy save, etc.),
      // fall through to the default push — existing rubbing-only flow.
      // The Mark beat is additive; missing-Mark players still complete Q7.
      //
      // The "around your neck" / "in your bag" clause is decided here at
      // topic-build time so Aldwyn names the Mark's actual location on
      // the player. The CAD entry in QUEST_DEFS is the static no-Mark
      // shape; the Mark cascade is built dynamically.
      if(qDef.id === 'q7_the_rubbing' && npcName === 'Aldwyn'){
        const markEquipped = EQ.amulet && EQ.amulet.name === "The Faolchú's Mark";
        const markInBag = BAG.some(b => b && b.name === "The Faolchú's Mark");
        if(markEquipped || markInBag){
          const where = markEquipped ? 'around your neck' : 'in your bag';
          topics.push({
            label: `📜 ${activeCAD.label}`,
            response: `Wait. What's that ${where}? — Set it on the desk before the rubbing. Carefully. The bone is fresher than it looks.`,
            follow: [{
              label: "I took it off the seam.",
              response: "Yes. The strokes are right. The order is wrong. This is the deep tongue — or it's trying to be. The script the binding's makers carved in. Not a hand at work here, traveler. The binding itself, misfiring.\n\nI have been waiting for one of these. Longer than I should admit.\n\nI will not translate this for you tonight. I want to be careful with it. What I can tell you is what it confirms — what is happening underground is not a strain that can be reinforced. It is a structure being unwritten, and the world is producing... transcription errors. Like this one. You killed the first I have heard of by name.\n\nNow. The rubbing.",
              follow: [{
                label: "Edna's rubbing. Here.",
                response: activeCAD.response,
                follow: activeCAD.follow
              }]
            }]
          });
          return;
        }
      }
      // Show the scripted exchange on the target NPC (not the giver)
      topics.push({label:`📜 ${activeCAD.label}`,response:activeCAD.response,follow:activeCAD.follow});
      return;
    }

    // Standard giver-based quest topics
    if(state==='available'){
      // Root topic shows quest description — follow choices let player accept or decline.
      // If the quest defines acceptResponses, each is a voiced accept that fires questAccept
      // and shows a short NPC rejoinder before closing. Fallback is the generic Accept button.
      let acceptFollow;
      if(qDef.acceptResponses&&qDef.acceptResponses.length){
        acceptFollow=qDef.acceptResponses.map(ar=>({
          label:ar.label, response:ar.response, questAccept:qDef.id
        }));
      } else {
        acceptFollow=[
          {label:`✔ Accept: ${qDef.title}`, questAccept:qDef.id},
          {label:`✘ Not right now.`, back:true},
        ];
      }
      topics.push({
        label:`📜 ${qDef.title}`,
        response:qDef.description,
        follow:acceptFollow,
      });
    } else if(state==='reward'){
      // Root topic confirms turn-in — rewardSpeech is the giver's reward line, and each
      // rewardResponse is a voiced player closer that fires questComplete and shows a
      // handoff rejoinder (usually pointing the player at the next quest's giver).
      const speech=qDef.rewardSpeech||`Well done. You've earned this.`;
      let rewardFollow;
      if(qDef.rewardResponses&&qDef.rewardResponses.length){
        rewardFollow=qDef.rewardResponses.map(rr=>({
          label:rr.label, response:rr.response, questComplete:qDef.id
        }));
      } else {
        rewardFollow=[
          {label:`Collect reward.`, questComplete:qDef.id},
          {label:`Come back later.`, back:true},
        ];
      }
      topics.push({
        label:`✅ Turn in: ${qDef.title}`,
        response:speech,
        follow:rewardFollow,
      });
    } else if(state==='active'){
      // v61ae: Q7 stage 3 — if player is talking to Edna (the giver) after
      // completing objectives 0 (read Bram) and 1 (talk to Oswin), show a
      // dedicated handoff topic that gives the rubbing and advances
      // objective 2. This replaces the default in-progress topic for Q7
      // specifically. Other quests fall through to the existing path.
      // v61ak: four-variant Edna dialog for Q7 triage state. Objective indices
      // are in the new 6-stage structure:
      //   obj 1 = read Bram's body (parallel)
      //   obj 2 = talk to Brother Oswin (parallel)
      //   obj 3 = talk to Edna (parallel, ticks on dialog-open)
      //   obj 4 = receive rubbing from Edna (the handoff — requires 1+2+3)
      //
      // Variant logic:
      //   - all three triage done, rubbing not yet taken → show the HANDOFF
      //   - Bram done, Oswin not → acknowledgment of Bram + prompt to check Oswin
      //   - Oswin done, Bram not → acknowledgment of Oswin + prompt to check Bram
      //   - neither done → "what do you need" triage request (used to be the
      //     stage-1 accept text; now lives as an in-progress topic since the
      //     quest is already active when the player arrives)
      //
      // Scenario Edna-first is safe: opening dialog ticks obj 3 via talk_to,
      // then buildQuestTopicsForNPC sees ednaTalk=true with bram=oswin=false
      // and falls into the "what do you need" branch.
      // v61c2: Q7 objective indices shifted by +1 due to defeat_boss
      // insertion at obj 1.
      // v61d0: indices shifted by +1 again due to Mark-loot insertion at
      // obj 2. New layout:
      //   obj 0 = enter_zone (arrival, ticked by burn trigger)
      //   obj 1 = defeat_boss faolchu (gates the triage objectives below)
      //   obj 2 = receive_item The Faolchú's Mark (parallel to triage)
      //   obj 3 = read Bram's body (parallel triage)
      //   obj 4 = talk to Oswin (parallel triage)
      //   obj 5 = talk to Edna (parallel, ticks on dialog-open)
      //   obj 6 = receive rubbing from Edna (the handoff — requires 3+4+5)
      //   obj 7 = talk to Aldwyn (final, requires 6)
      //
      // Variant logic unchanged — still gated on bramDone / oswinDone /
      // rubbingDone, just reading from the shifted indices.
      if(isGiver && qDef.id==='q7_the_rubbing'){
        const qsq = QS[qDef.id];
        const bramDone    = qsq.objectives[3] && qsq.objectives[3].current >= 1;
        const oswinDone   = qsq.objectives[4] && qsq.objectives[4].current >= 1;
        const rubbingDone = qsq.objectives[6] && qsq.objectives[6].current >= 1;
        if(bramDone && oswinDone && !rubbingDone){
          // All triage done — rubbing handoff topic. One topic, one follow
          // choice that executes the mid-quest give. Same beat as v61ae.
          topics.push({
            label:"📜 I saw to them both.",
            response:"Thank you for going. Bram — no, you don't have to say it. I watched it from the window. Someone going to him was what I needed. I'll grieve him. Later. Right now this is what I need you to do. Under that floorboard. No — the one next to the hearth. Yes. Bring it up. That's the one.\n\nThirty years. I made this rubbing when I was a younger woman than you probably think, and I couldn't read what was on the wall then and I still can't. But last summer — last summer someone carved something on the outside of my cottage that matches this. Not the same. Mirrored. Inverted. Like someone who could read it, rewriting it.\n\nTake this to Aldwyn in Ironhaven. Tell him Edna sent it and tell him the mark on my west wall is dated — I haven't scrubbed it. He'll know what that means. Go carefully. And take your time getting back.",
            follow:[
              {label:"I'll take it to him. Straight there.",
               response:"Good. And — one thing more. Aldwyn has been sitting on a name. He'll share it with you when he sees what I've sent. Don't press him for it on the road. Wait till you're in his office with the door shut. That's a scholar's conversation, not a market one. Go now.",
               questMidQuestGive:{
                 items:[{
                   name:"Edna's Rubbing", ico:'📜', type:'misc', unique:true,
                   buyPrice:0, sellMult:0,
                   desc:"A charcoal rubbing of a sigil Edna took thirty years ago. Creased from long storage. One of the strokes has been deliberately inverted — not by Edna.",
                 }],
                 questEvent:'receive_item',
                 eventData:{itemName:"Edna's Rubbing"},
               }},
            ],
          });
          return; // skip the default in-progress topic
        }
        if(bramDone && !oswinDone){
          // v61an: TWO topics, not one. Previously the news-report was the
          // only option — player couldn't ask Edna what she needed, which
          // read wrong because she hadn't yet told them anything. Now one
          // topic delivers the news (Bram) and the other asks what else.
          topics.push({
            label:"📜 I found Bram at the forge.",
            response:"I know. I felt it when you walked in. You don't have to say the rest — not yet. Later.\n\nI was watching through the window when it happened. I saw enough. Thank you for going to him.",
            follow:[
              {label:"What else do you need?",
               response:"Brother Oswin. He stayed inside the oratory when it started — I heard him barring the door. The door is stone and heavy; I believe he is alive in there. I cannot walk that far. Please — go and see."},
            ],
          });
          topics.push({
            label:"📜 What else do you need, Edna?",
            response:"Brother Oswin. He was inside the oratory when it started — I heard the door bar drop. The door is stone and heavy; I think he's alive in there. But I can't walk that far to know. Please. Walk to the oratory and see what you can see.",
            follow:[
              {label:"I'll go.",
               response:"Thank you. Come back to me when you've seen him. One way or the other."},
            ],
          });
          return;
        }
        if(!bramDone && oswinDone){
          // v61an: same pattern — news topic + triage-request topic.
          topics.push({
            label:"📜 Brother Oswin is alive. He's in the oratory.",
            response:"Thank God. Truly. I've been sitting here trying not to imagine the worst of it for him. That's one piece of news I needed and couldn't get for myself.",
            follow:[
              {label:"What else do you need?",
               response:"Bram. He went out the south side of the forge when they came. I watched him go. I watched him fall. Please — please walk to the forge and tell me what you see. I need to know for certain."},
            ],
          });
          topics.push({
            label:"📜 What else do you need, Edna?",
            response:"Bram. He went out the south side of the forge when they came. I watched him go. I watched him fall. I've been sitting with it since the morning. Please — walk to the forge and tell me what you see. I need to hear it said out loud.",
            follow:[
              {label:"I'll go to the forge.",
               response:"Thank you. Be gentle with him if he is what I think he is. And come back to me after."},
            ],
          });
          return;
        }
        // Neither Bram nor Oswin done yet — triage-request topic. This is the
        // text that used to live as the stage-1 accept dialog; now it's an
        // in-progress prompt the player sees if they reach Edna before either
        // of the other two.
        topics.push({
          label:"📜 What do you need from me, Edna?",
          response:"Two things. My legs won't carry me that far and I need to know. Go to the forge — Bram went out there, I watched him fall. Then walk to the oratory. Brother Oswin was inside when it started. The door is stone and heavy and I think he's alive in there, but I can't walk that far to check. See to both of them and come back to me. Then I'll tell you what I've been holding.",
          follow:[
            {label:"I'll go. I'll come back when I've seen them both.",
             response:"Thank you. Bram first or Oswin first — either way. Just come back."},
            {label:"What are you holding?",
             response:"Something I made thirty years ago that matches something that has been carved onto my west wall. That is the whole answer. You'll see the rest when you've checked on the others. Go. Please."},
          ],
        });
        return;
      }
      if(activeCAD){
        // Resolved dialog entry for THIS NPC specifically. For multi-NPC CAD
        // quests like Q7, activeCAD is null on non-targeted NPCs — the branch
        // below (in-progress fallback) runs instead.
        topics.push({label:`📜 ${activeCAD.label}`,response:activeCAD.response,follow:activeCAD.follow});
      } else {
        const prog=qDef.objectives.map((o,i)=>{
          const cur=QS[qDef.id].objectives[i].current;
          return `${o.label.split('(')[0].trim()} (${cur}/${o.count||1})`;
        }).join('; ');
        topics.push({
          label:`📋 ${qDef.title} (in progress)`,
          response:`${prog}. Keep at it.`,
          follow:[{label:'Understood.', back:true}],
        });
      }
    }
  });
  // v61b6: per-NPC introduction responses. Each named NPC gets a hand-
  // written reply in their voice when the player introduces themselves
  // for the first time. Generic fallback covers any NPC not in the table
  // (random villagers, future-added characters). Placeholders use {name}
  // so renderDialogNode's substitution pass handles the actual swap at
  // render time — keeps the table data clean and consistent with how
  // dialog text elsewhere in the game references the player.
  if(!metNPCs.has(npcName)){
    const intro = INTRO_RESPONSES[npcName] || `Pleased to make your acquaintance, ${playerName}.`;
    topics.push({
      label: `My name is ${playerName}.`,
      response: intro,
      markMet: true,
    });
  }
  return topics;
}

// v61b6: hand-written introduction responses for the named cast. Each
// 1-2 sentences, in that NPC's voice. Approached as the first time you
// volunteer your name, not as a deep reveal — the player has only just
// arrived in Ashenmoor (or wherever) and these characters are reacting
// to a stranger they've never seen before. Voices tuned to existing
// dialog patterns and the per-NPC voice_direction notes from earlier
// sessions. {name} placeholder is substituted at render time.
const INTRO_RESPONSES = {
  // ── Ashenmoor village ──────────────────────────────────────────
  Bram:
    "Bram. Smith here, as you can see. {name}, then. I'll remember it if it lasts.",
  Mira:
    "Mira. Welcome to Ashenmoor, {name}. You look as though you've been through something. The cot in the back is for paying customers, but the kettle is for everyone.",
  Barnaby:
    "Barnaby, proprietor. {name}. Coin spends the same whatever the name on it, so we'll get along.",
  Pip:
    "{name}! What a name! I don't believe I've heard one quite like it before — well, perhaps once, in Coeur de Vie, from a woman selling enchanted thimbles, but she insisted hers was different. Pip, by the way. Pip's the name. Pip's the shop. Pip's the everything, really.",
  Edna:
    "Oh, {name}, is it? That's a fine name, fine indeed. Sit a moment if your knees will let you — mine won't, anymore, but I'm older than the cottage.",
  'Brother Oswin':
    "Welcome, {name}. The Oratory keeps no register, and asks for none. You've been named, and that's enough for now.",
  Sera:
    "Sera. Village guard. You'll forgive me if I don't take that name on faith just yet, {name} — strangers come through Ashenmoor more than they used to.",
  Tom:
    "Tom. Pleased, I suppose. Names don't grow turnips, {name}, but it's good to know what to call you when something needs hauling.",
  Finn:
    "{NAME}? That's so cool! I'm Finn! I'm gonna be an adventurer too one day. Did you fight anything getting here?? Was it scary??",
  Corwin:
    "{name}. Hm. Travelled far to get here, I'd wager. I'm Corwin — no permanent address worth speaking of, which I find suits me. We'll cross paths again, I should think.",

  // ── Ironhaven ──────────────────────────────────────────────────
  Aldwyn:
    "Welcome to Ironhaven, {name}. Aldwyn — the Royal Herald, in such capacity as the Reach still has need of one. Do come in. There's tea, of a sort.",
  'Captain Brynn':
    "Brynn. Captain of the Gatehouse. I'll log the name, {name}. If it turns out to be the wrong one, that's information too.",
  'Lord Caldric':
    "{name}. Yes. We've been informed of your presence — Brynn's people are thorough. Stand at ease. The Reach has more visitors than friends these days; I'd prefer to know which you intend to be.",

  // ── Salthaven (v61em) ──────────────────────────────────────────
  Hilda:
    "Hilda. Harbormaster forty years next winter, if I last that long. {name} — that's a name from the south road. We don't get many south-road names this far west. You're welcome here regardless.",
  Wystan:
    "Wystan. Run the Salt House — me and my brother before he went east. {name}, eh. Tell you what, you carry that name around and people remember you. Mine, they forget by morning. Suits me fine.",
  'Old Aelflin':
    "{name}. Lovely to meet you, dear. I'm Aelflin. Well — that's what they call me here. Had another name before I came up the coast, but it's been so long I almost forget it myself. Sit, if you've a moment. I have salves if you need them.",
  Brand:
    "Brand. Anchor Inn's mine, has been since I came off the boats. {name} — sit if you want to sit. I'm not going to ask where you've been.",
};
// Special-case: Finn has {NAME} in upper case for his shouting. Swap at
// render time to caps version of playerName. Done as a second regex pass
// in the topic injection above, but for now we just make it work via the
// {name} substitution (renderDialogNode handles {name} → playerName) and
// accept Finn won't actually shout. If it bothers anyone we can extend
// the regex pass to handle {NAME} → playerName.toUpperCase() later.

function renderDialogNode(text, choices){
  // v61at / v61b9: name substitution. Both NPC text and player choice labels
  // are run through a regex pass that replaces '{name}' with the live
  // playerName, and '{NAME}' with playerName.toUpperCase() (used by Finn
  // for shouting and reserved for any future NPC who shouts the player's
  // name). Done at render time (not at definition) so the literal token
  // stays in the dialog data — surviving across character creation,
  // save/load, and any cross-quest text reuse without baking a specific
  // name in. Cheap (two regex passes per render, fired only on dialog
  // progression).
  const _pn = playerName || 'Traveller';
  const _sub = s => (typeof s==='string') ? s.replace(/\{name\}/g, _pn).replace(/\{NAME\}/g, _pn.toUpperCase()) : s;
  text = _sub(text);
  dlgNode={text,choices};
  const textEl=document.getElementById('dlg-text');
  // If TTS is live, start with an empty bubble and let speakLine fill it
  // word-by-word via onboundary. Otherwise render the full line immediately.
  textEl.textContent=text; // v80 — the whole line at once
  if(ttsSupported&&ttsEnabled){
    speakLine(text, dlgNPC&&dlgNPC.name, null);
  } else {
  }
  const el=document.getElementById('dlg-choices');
  el.innerHTML='';
  choices.forEach((c,i)=>{
    const btn=document.createElement('button');
    btn.className='dlg-choice'+(c.trade?' dlg-trade':c.bye?' dlg-bye':c.quest?' dlg-quest':''); // v80 S13
    btn.innerHTML=`<span class="dlg-choice-num">${i+1}.</span> ${_sub(c.label)}`;
    btn.onclick=()=>pickDialogChoice(i);
    el.appendChild(btn);
  });
}

function pickDialogChoice(i){
  if(!dlgNPC||!dlgNode)return;
  try{
  const c=dlgNode.choices[i];
  if(!c)return;
  // v61at: introduction action — mark the current NPC as known to the
  // player. Fires BEFORE any other action handler so the metNPCs update
  // is independent of the topic's response/follow shape. The intro topic
  // itself is a normal {label, response} entry; this flag is just the
  // side-effect that gates the topic on subsequent dialog opens.
  if(c.markMet && dlgNPC && dlgNPC.name){
    metNPCs.add(dlgNPC.name);
  }
  if(c.bye){closeDialog();return;}
  if(typeof c.fn==='function'){const r=c.fn(c);if(typeof r==='string')c.response=r;} // v80 S12 — dynamic topics (guild tasks)
  if(c.trade){
    // v61e2: outdoor trade:true recovery. openShop() returns silently if
    // currentHouse is null, which only ever gets set by goToInterior(). So
    // a trade:true topic on an outdoor NPC's topics array (talked to via
    // talkNPC → openDialog) closes dialog and calls openShop against null —
    // dead button, no error. Fix: when currentHouse is null, look up the
    // active zone's houses array and find the entry whose keeper matches
    // the speaking NPC. Set currentHouse to that entry, then proceed. The
    // shop renders against the right stock; the player gets what they
    // asked for. Falls through silently on miss (preserves prior behavior).
    // Lifts Oda + Edwin + Roland + every future outdoor-shop NPC.
    if(!currentHouse && dlgNPC && dlgNPC.name){
      const zHouses=(ZONES[activeZoneId]&&ZONES[activeZoneId].houses)||null;
      if(zHouses){
        const match=zHouses.find(h=>h.keeper===dlgNPC.name);
        if(match) currentHouse=match;
      }
    }
    closeDialog();setTimeout(()=>openShop(),80);return;
  }
  // v61d6 — Safehouse grant resolution. Set as the c.grantSafehouse flag
  // on the final scene node. Flips worldState.safehouseGranted (which gates
  // the safehouse door + retires the auto-fire scene), persists the save
  // so a browser close immediately after doesn't lose the grant, and emits
  // a journal log entry so the player has a record of receiving the house.
  // c.response (if present) renders normally as the closing line; the
  // standard 'Goodbye' closer ends the scene.
  if(c.grantSafehouse){
    worldState.safehouseGranted = true;
    // v61e6 Session A: cinematic time-lock. The grant scene reads more
    // formal/ceremonial in evening light. No strong canonical demand, but
    // tonally aligned with the Q7 turn-in evening lock that immediately
    // precedes this scene in the canonical order. If the player happened
    // to delay between Q7 and visiting Caldric, this snaps the clock back
    // to evening for the scene.
    forceTime('evening');
    if(typeof addLog==='function') addLog('🔑','Lord Caldric granted you the safehouse');
    if(typeof saveGame==='function') saveGame();
    if(c.response){
      renderDialogNode(c.response, [{label:'Goodbye.',bye:true}]);
    } else {
      closeDialog();
    }
    return;
  }
  if(c.back){
    // Rebuild topics fresh (quest state may have changed)
    const npcZone=questZoneNow();
    const questTopics=buildQuestTopicsForNPC(dlgNPC.name,npcZone);
    const allTopics=[...questTopics,...(dlgNPC.topics||[])];
    renderDialogNode(dlgGreeting(dlgNPC), allTopics);
    return;
  }
  // Quest state transitions — if the choice has a response, render it with a closer
  // button before dismissing. Lets voiced accepts/turn-ins keep the giver's reaction on screen.
  if(c.questAccept){
    acceptQuest(c.questAccept);
    if(c.response) renderDialogNode(c.response,[{label:'Goodbye.',bye:true}]);
    else closeDialog();
    return;
  }
  // v61ae: mid-quest item handoff. Used for multi-stage quests where the
  // giver NPC hands the player a quest item partway through — e.g. Q7
  // "The Rubbing" where Edna gives the charcoal rubbing only after the
  // player confirms they've checked on Bram and Brother Oswin. Spec:
  //   c.questMidQuestGive = {
  //     items: [ {name, ico, type, ...} ],   // pushed to bag
  //     questEvent: 'talk_to',                // optional quest event to fire
  //     eventData:  {npc:'Edna',zone:'overworld'},
  //   }
  // On execution: each item is bagAdd'd, then the event is fired (advances
  // prereq-gated objectives correctly via checkQuestProgress).
  if(c.questMidQuestGive){
    const mg = c.questMidQuestGive;
    (mg.items||[]).forEach(it=>bagAdd({...it, qty:1}));
    if(mg.questEvent){
      checkQuestProgress(mg.questEvent, mg.eventData||{});
    }
    if(mg.items && mg.items.length){
      const firstName = mg.items[0].name;
      showMsg(`Received: ${firstName}`, '#c8a84a');
    }
    if(c.response){
      renderDialogNode(c.response,[{label:'Goodbye.',bye:true}]);
    } else {
      closeDialog();
    }
    return;
  }
  if(c.questComplete){
    completeQuest(c.questComplete);
    // Same-NPC handoff: if the just-completed quest unlocks a new one whose giver is this same NPC,
    // show the closer response with a "continue speaking" button that re-enters the topic list
    // (rebuilt fresh, so the new quest's acceptance topic surfaces automatically).
    const _nextId=(()=>{const q=getQuest(c.questComplete);return q&&q.unlocks&&q.unlocks[0];})();
    const _nextQ=_nextId?getQuest(_nextId):null;
    const _npcZoneNow=questZoneNow();
    const _sameNPC=_nextQ && _nextQ.giver===dlgNPC.name && (_nextQ.giverZone||'overworld')===_npcZoneNow;
    if(c.response){
      const closer=_sameNPC
        ? [{label:`Continue speaking with ${dlgNPC.name} →`, back:true}]
        : [{label:'Goodbye.',bye:true}];
      renderDialogNode(c.response, closer);
    }
    else if(_sameNPC){
      const questTopics=buildQuestTopicsForNPC(dlgNPC.name,_npcZoneNow);
      const allTopics=[...questTopics,...(dlgNPC.topics||[])];
      renderDialogNode(dlgGreeting(dlgNPC), allTopics);
    }
    else closeDialog();
    return;
  }
  // questDialogComplete: used by customActiveDialog — marks objectives done then rewards.
  //
  // v61ao trace-through (no code change): worried this path could double-fire the
  // 'ready' popup alongside 'complete' at Q7 Aldwyn turn-in. It can't. The only
  // site that queues 'ready' is checkQuestProgress's allDone branch, and the
  // openDialog hasCustomDialog gate (see ~line 3300) blocks talk_to from firing
  // on any NPC that has a resolved customActiveDialog entry — so the final
  // objective never ticks via talk_to. The bulk assignment below is the only
  // thing that moves its `current` value, and it bypasses checkQuestProgress
  // entirely. Popup flow: 'complete' only.
  //
  // Latent caveat: because this path bypasses checkQuestProgress, any per-
  // objective `completionText` on an objective completed through this branch
  // will NOT fire its 'update' popup. If you ever want a reflective beat on the
  // final objective of a customActiveDialog quest, put it in `readyText` (fires
  // when qs.state flips to 'reward') or `completeText` — not completionText.
  if(c.questDialogComplete){
    const qs=QS[c.questDialogComplete];
    if(qs&&qs.state==='active'){
      // Mark all objectives complete
      const q=getQuest(c.questDialogComplete);
      if(q)q.objectives.forEach((_,i)=>{qs.objectives[i].current=q.objectives[i].count||1;});
      qs.state='reward';
      updateQuestDots();
    }
    completeQuest(c.questDialogComplete);
    // Same-NPC handoff (mirror of questComplete path above)
    const _nextId2=(()=>{const q=getQuest(c.questDialogComplete);return q&&q.unlocks&&q.unlocks[0];})();
    const _nextQ2=_nextId2?getQuest(_nextId2):null;
    const _npcZoneNow2=questZoneNow();
    const _sameNPC2=_nextQ2 && _nextQ2.giver===dlgNPC.name && (_nextQ2.giverZone||'overworld')===_npcZoneNow2;
    if(c.response){
      const closer=_sameNPC2
        ? [{label:`Continue speaking with ${dlgNPC.name} →`, back:true}]
        : [{label:'Goodbye.',bye:true}];
      renderDialogNode(c.response, closer);
    }
    else if(_sameNPC2){
      const questTopics=buildQuestTopicsForNPC(dlgNPC.name,_npcZoneNow2);
      const allTopics=[...questTopics,...(dlgNPC.topics||[])];
      renderDialogNode(dlgGreeting(dlgNPC), allTopics);
    }
    else closeDialog();
    return;
  }
  try{journalTold(dlgNPC,c);}catch(e){} // S490 — the answer is filed in the journal's topics (DECISION #132, C)
  if(c.follow){
    renderDialogNode(c.response, [...c.follow, {label:'← Back to topics', back:true}]);
  } else {
    renderDialogNode(c.response, [{label:'← Back to topics', back:true}]);
  }
  }catch(err){
    console.error('pickDialogChoice error:',err);
    closeDialog();
  }
}

function closeDialog(){
  ttsStop();  // cancel any in-flight dialog voice
  dlgOpen=false;
  dlgNPC=null;
  dlgNode=null;
  document.getElementById('dlg').style.display='none';
}

let nbOpen=false;
function openNoticeBoard(nb){
  _releasePointerLockForMenu();
  nbOpen=true;
  document.getElementById('nb-title').textContent=nb.title;
  document.getElementById('nb-text').textContent=nb.text;
  document.getElementById('nb-popup').style.display='flex';
}
function closeNoticeBoard(){
  nbOpen=false;
  document.getElementById('nb-popup').style.display='none';
}

function talkNPC(){
  // v61d: ZONES[id].npcs is populated by every builder (see buildVillage /
  // buildTown / buildWildernessZone register-zone blocks). Fall back to the
  // overworld NPC roster if the active zone has no registered NPCs.
  const activeNPCs=(ZONES[activeZoneId]&&ZONES[activeZoneId].npcs)||OW_NPCS;
  let best=null,bd=3;
  // v61e9 — skip retreated NPCs. They're invisible at night (settlement
  // zones, post-Q7); allowing E-press to open dialog with an invisible
  // mesh reads broken. Player uses the Wait button to advance to dawn.
  activeNPCs.forEach(n=>{if(n._retreated)return;if(Math.abs(jumpY-n.g.position.y)>1.6)return;const d=Math.hypot(px-n.g.position.x,pz-n.g.position.z);if(d<bd){bd=d;best=n;}}); // v80 S13 — same level
  // v80 — a world NPC whose def carries `shop` is a merchant without a building: open the shop directly.
  if(best&&best.def&&best.def.shop){currentHouse=best.def.shop;openShop();return;}
  if(best&&activeZoneId==='world'&&typeof WORLD!=='undefined'&&WORLD.guild.onTalk(best.def)){return;} // v80 S12 — deliveries
  if(best){openDialog(best.def);}else showMsg('No one nearby.','#888');
}

// House data — matches the 6 houses in buildOW [{x,z,w,d}]
const HOUSES=[
  {id:'h0',doorX:28.1,doorZ:25, doorFace:'E', name:"Bram's Forge",  keeper:'Bram',  type:'weapon', tagline:'"Finest blades in Ashenmoor."',  bCol:0x6a3010,sCol:0x8a5020},
  {id:'h1',doorX:33.9,doorZ:24, doorFace:'W', name:"Mira's Apothecary",keeper:'Mira',    type:'potion', tagline:'"Herbs and remedies for the weary."',bCol:0x3a6a3a,sCol:0xc09070},
  {id:'h2',doorX:24.5,doorZ:37, doorFace:'S', name:"Barnaby's Goods",  keeper:'Barnaby', type:'misc',   tagline:'"Odds and ends from distant lands."',bCol:0x604820,sCol:0x907060},
  {id:'h3',doorX:39,  doorZ:44, doorFace:'S', name:"The Guardhouse",   keeper:'Captain Vorn', type:'armor',  tagline:'"Protection for those who venture forth."',bCol:0x505060,sCol:0x808090},
  {id:'h4',doorX:63,  doorZ:45, doorFace:'S', name:"Pip's Curiosities",keeper:'Pip',     type:'misc',   tagline:'"You never know what you\'ll find!"',bCol:0x6a4a20,sCol:0xb08060},
  {id:'h5',doorX:56,  doorZ:58, doorFace:'S', name:"The Old Cottage",  keeper:'Edna',    type:'potion', tagline:'"Rest your bones, traveller."',    bCol:0x5a3a28,sCol:0xa07858},
  {id:'h6',doorX:58,  doorZ:22, doorFace:'S', name:"The Ashenmoor Oratory", keeper:'Brother Oswin', type:'church', tagline:'"The door is always open."', bCol:0x5a5048,sCol:0xc0b890},
];

// v61al: helper — returns the matching ASHENMOOR_BURNED_BUILDINGS entry for
// a HOUSES entry ONLY when the burn has fired. Pre-burn, always returns null.
// Used by the interact-prompt and E-key handlers to suppress "Press E to
// enter Bram's Forge" when Bram's Forge has been reduced to rubble.
// Damaged-but-standing buildings (Edna's cottage, the oratory) return null
// here — they're entered normally, since their interiors are scripted Q7
// triage targets.
function _houseChrredState(house){
  if(!worldState.ashenmoorBurned) return null;
  if(typeof ASHENMOOR_BURNED_BUILDINGS==='undefined') return null;
  const b = ASHENMOOR_BURNED_BUILDINGS.find(bb=>bb.houseId===house.id);
  return b ? (b.charred||null) : null;
}
function _houseDestroyed(house){
  return _houseChrredState(house)==='destroyed';
}

// Shop stock per merchant type
// Shop stocks use makeItem — called after MATERIALS/WEAPON_TYPES/ARMOR_TYPES are defined
// Ashenmoor: starter tier (1-3, Wooden/Bronze/Iron)
const TORCH_ITEM={name:'Torch',ico:'🔦',type:'equip',slot:'offhand',torchType:'torch',def:0,buyPrice:8,sellMult:.3,tier:1,material:'Wooden',matCol:0x6a3e12};
// v64 — Arrow items. type:'ammo' is already accepted by canEquip (line ~1774
// from the v59 ammo-slot scaffold). EQ.ammo is the slot the bow firing path
// reads at release time. Iron Arrow is the v64 baseline; Silver Arrow (Act II,
// bypasses wraith resists per lore_canon) and Broadhead Arrow (slash-type)
// are placeholders deferred to Session 4 polish — adding their item defs now
// would mean shop-stock decisions before playtest confirms the iron baseline
// feel. Buy in stacks of 12 — quantity is the stack size, not a per-shot
// modifier. arrowDmg adds to the bow's atk roll at release time.
const ARROW_IRON={
  name:'Iron Arrow', ico:'🪶', type:'ammo', slot:'ammo',
  ammoType:'arrow', qty:12, bundle:12, buyPrice:2, sellMult:.4, weight:.05, // S366 — buyPrice is the dozen's; a piece sells by the piece
  arrowDmg:[3,6],   // additive to bow's atk roll
  // wType omitted → falls through to bow's wType ('pierce'). Silver and
  // Broadhead arrows will set wType explicitly to override.
  tier:2, material:'Iron', matCol:0xa8b0b8,
};

const SHOP_STOCK={
  weapon:[
    makeItem(1,WEAPON_TYPES.find(t=>t.type==='Sword'),   null, false),
    makeItem(2,WEAPON_TYPES.find(t=>t.type==='Dagger'),  null, false),
    makeItem(3,WEAPON_TYPES.find(t=>t.type==='Sword'),   null, false),
    makeItem(2,WEAPON_TYPES.find(t=>t.type==='Mace'),    null, false),
    makeItem(1,ARMOR_TYPES.find(t=>t.type==='Buckler'),  null, true),
    {name:'Health Potion',ico:'🧪',type:'potion',heal:25,buyPrice:18,sellMult:.4},
  ],
  potion:[
    {name:'Health Potion',   ico:'🧪',type:'potion',heal:25,      buyPrice:15,sellMult:.5},
    {name:'Greater Potion',  ico:'🫙',type:'potion',heal:60,      buyPrice:40,sellMult:.5},
    {name:'Mana Draught',    ico:'💧',type:'potion',heal:0,mana:40,buyPrice:30,sellMult:.5},
    {name:'Stamina Draught', ico:'🥤',type:'potion',stam:40,      buyPrice:22,sellMult:.5},
  ],
  armor:[
    makeItem(2,ARMOR_TYPES.find(t=>t.type==='Helmet'),   null, true),
    makeItem(3,ARMOR_TYPES.find(t=>t.type==='Cuirass'),  null, true),
    makeItem(2,ARMOR_TYPES.find(t=>t.type==='Gauntlets'),null, true),
    makeItem(2,ARMOR_TYPES.find(t=>t.type==='Greaves'),  null, true),
    makeItem(2,ARMOR_TYPES.find(t=>t.type==='Boots'),    null, true),
    makeItem(3,ARMOR_TYPES.find(t=>t.type==='Buckler'),  null, true),
  ],
  misc:[
    {...TORCH_ITEM},
    {name:'Dungeon Map',   ico:'🗺', type:'misc',              buyPrice:15,sellMult:.3},
    {name:'Lockpick',      ico:'🗝', type:'misc',weight:.05,   buyPrice:12,sellMult:.4}, // v80 S170 — as the locked door says; the loot table's price, one pick a unit
    {name:'Health Potion', ico:'🧪',type:'potion',heal:25,    buyPrice:18,sellMult:.4},
    // v64 — Barnaby's bow stock. T1 Wooden Bow (cheap, low-tier) — fits the
    // "odds and ends" register; he's not a real bowyer, he's a generalist
    // who keeps one in the corner. Arrows in bundles of 12.
    makeItem(1,WEAPON_TYPES.find(t=>t.type==='Bow'),  null, false),
    {...ARROW_IRON},
    // v65 — Barnaby's two-handed starter. Wooden Great Club at T1 — the most
    // lore-coherent wooden 2H (a heavy stick, not a wooden version of a metal
    // weapon). War-hammer family identity at entry tier: single-target focus,
    // moderate posture pressure, 40% block. Lets a Might-build player commit
    // to 2H from session 1 without leaving Ashenmoor. Wulfric scales the line
    // up at T3 with Claymore + War Hammer (Iron tier).
    makeItem(1,WEAPON_TYPES.find(t=>t.type==='GreatClub'),null, false),
  ],
  // v61: Hearthwick inn (Oda) — comfort food + travel essentials. No weapons or armor.
  inn:[
    {name:'Hot Stew',       ico:'🥣',type:'potion',heal:35,                buyPrice:14,sellMult:.3,weight:.4},
    {name:'Mulled Cider',   ico:'🍺',type:'potion',heal:0,stam:30,mana:10, buyPrice:18,sellMult:.3,weight:.5},
    {name:'Health Potion',  ico:'🧪',type:'potion',heal:25,                buyPrice:18,sellMult:.4},
    {name:'Stamina Draught',ico:'🥤',type:'potion',stam:40,                buyPrice:22,sellMult:.5},
    {name:'Road Rations',   ico:'🥖',type:'potion',heal:12,stam:15,        buyPrice:10,sellMult:.3,weight:.3},
    {...TORCH_ITEM},
  ],
  // v61e1: Thorngate road-warden — peripheral outpost between Hearthwick and
  // the Deepwood. Cheap rations, basic gear, nothing fine. Reflects the lore
  // "neglected, ivy-grown, peripheral. A skeleton crew of guards."
  outpost_warden:[
    {name:'Road Rations',   ico:'🥖',type:'potion',heal:12,stam:15,        buyPrice:10,sellMult:.3,weight:.3},
    {name:'Health Potion',  ico:'🧪',type:'potion',heal:25,                buyPrice:18,sellMult:.4},
    {name:'Stamina Draught',ico:'🥤',type:'potion',stam:40,                buyPrice:22,sellMult:.5},
    {...TORCH_ITEM},
    makeItem(1,WEAPON_TYPES.find(t=>t.type==='Dagger'),  null, false),
    makeItem(1,ARMOR_TYPES.find(t=>t.type==='Buckler'),  null, true),
  ],
  // v61e1: La Porte Grise royal quartermaster — properly staffed checkpoint
  // entering Ironhaven's territory. Standardized supply tier above Thorngate's
  // road-warden register: Mild elixirs, a tier-2 weapon, official-feeling.
  outpost_quartermaster:[
    {name:'Health Potion',     ico:'🧪',type:'potion',heal:25,             buyPrice:18,sellMult:.4},
    {name:'Greater Potion',    ico:'🫙',type:'potion',heal:60,             buyPrice:40,sellMult:.5},
    {name:'Mana Draught',      ico:'💧',type:'potion',heal:0,mana:40,      buyPrice:30,sellMult:.5},
    {name:'Stamina Draught',   ico:'🥤',type:'potion',stam:40,             buyPrice:22,sellMult:.5},
    {name:'Road Rations',      ico:'🥖',type:'potion',heal:12,stam:15,     buyPrice:10,sellMult:.3,weight:.3},
    {...TORCH_ITEM},
    makeItem(2,WEAPON_TYPES.find(t=>t.type==='Sword'),   null, false),
    makeItem(2,ARMOR_TYPES.find(t=>t.type==='Helmet'),   null, true),
  ],
  // v61em: Salthaven Harbormaster's Office — civic/institutional stock.
  // Hilda runs Salthaven's office of records-and-rope. Higher-quality misc
  // than Wystan's working-class Salt House. Maps, oilcloth, lantern oil,
  // signal whistles. Anglo-Saxon working-institutional register.
  harbor_office:[
    {...TORCH_ITEM},
    {name:'Dungeon Map',     ico:'🗺',type:'misc',                     buyPrice:15,sellMult:.3},
    {name:'Oilcloth Wrap',   ico:'📜',type:'misc',                     buyPrice:18,sellMult:.3,weight:.3},
    {name:'Lantern Oil',     ico:'🪔',type:'potion',stam:0,             buyPrice:14,sellMult:.3,weight:.3},
    {name:'Health Potion',   ico:'🧪',type:'potion',heal:25,            buyPrice:18,sellMult:.4},
    {name:'Greater Potion',  ico:'🫙',type:'potion',heal:60,            buyPrice:40,sellMult:.5},
    {name:'Road Rations',    ico:'🥖',type:'potion',heal:12,stam:15,    buyPrice:10,sellMult:.3,weight:.3},
  ],
  // v61em: Salthaven Salt House — working-class harbor stock. Wystan deals
  // in the daily working materials of a fishing village. Salt-cured rations,
  // tackle, twine, smoked fish. Cheaper, heavier-weight, more abundant.
  harbor_supplies:[
    {name:'Salted Fish',     ico:'🐟',type:'potion',heal:18,            buyPrice:9, sellMult:.3,weight:.3},
    {name:'Smoked Eel',      ico:'🐟',type:'potion',heal:14,stam:10,    buyPrice:11,sellMult:.3,weight:.3},
    {name:'Salt Pouch',      ico:'🧂',type:'misc',                     buyPrice:6, sellMult:.3,weight:.2},
    {name:'Coil of Rope',    ico:'🪢',type:'misc',                     buyPrice:8, sellMult:.3,weight:.5},
    {name:'Fishing Hooks',   ico:'🪝',type:'misc',                     buyPrice:5, sellMult:.3,weight:.1},
    {...TORCH_ITEM},
    {name:'Health Potion',   ico:'🧪',type:'potion',heal:25,            buyPrice:18,sellMult:.4},
  ],
};

// Sell price helper — what merchants pay for any item
// v80 — one icon family: a rounded badge coloured by material or tier, a glyph by kind
const ICO_MAT={wood:'#a0713a',wooden:'#a0713a',bronze:'#b87333',copper:'#b87333',iron:'#8a8f98',steel:'#c8ccd4',silver:'#dfe6ee',gold:'#e0c060',mithril:'#8fd0ff',leather:'#8a5a3a',hide:'#8a5a3a',cloth:'#c8b890',bone:'#e8e0d0',obsidian:'#3a3a46',ember:'#ff7a30'};
function iconHTML(it){if(!it)return '';const name=(it.name||'').toLowerCase();let col='#6a5a44';for(const k in ICO_MAT){if((it.material||'').toLowerCase()===k||name.startsWith(k+' ')){col=ICO_MAT[k];break;}}
  if(it.tier&&col==='#6a5a44')col=['#a0713a','#b87333','#8a8f98','#c8ccd4','#dfe6ee','#e0c060','#8fd0ff'][Math.min(6,it.tier-1)]||col;
  let g=it.ico||'▪';const t=it.type;
  if(t==='equip'){const sl=it.slot;g=sl==='weapon'?(it.weaponShape==='axe'?'🪓':it.weaponShape==='mace'?'🔨':it.weaponShape==='bow'?'🏹':it.weaponShape==='staff'?'🪄':'⚔'):sl==='head'?'🪖':sl==='chest'?'👕':sl==='legs'?'👖':sl==='feet'?'🥾':sl==='hands'?'🧤':sl==='ring'?'💍':sl==='amulet'?'📿':sl==='offhand'?(it.torchType?(it.ico||'🔦'):'🛡'):sl==='ammo'?'➶':g;}
  const eff=(it)=>{const e=it.effect||it.item||{};const has=k=>it[k]!=null||e[k]!=null;if(has('heal')||has('hp'))return '#b03030';if(has('mana')||has('mp'))return '#3a6ab8';if(has('stam')||has('stamina')||has('sta'))return '#3a9a3a';if(/mana|focus|draught|MP/i.test(name+(it.desc||'')))return '#3a6ab8';if(/stamina|vigor|energy/i.test(name+(it.desc||'')))return '#3a9a3a';if(/heal|health|HP/i.test(name+(it.desc||'')))return '#b03030';return null;};
  if(t==='potion'){g='🧪';col=eff(it)||'#7a5a9a';}
  else if(t==='herb'){g='🌿';col=eff(it)||'#4a7a3a';}else if(/lockpick/i.test(name)){g='🗝';col='#8a8f98';}else if(t==='spellbook'){g='📕';col='#7a3a5a';}else if(t==='rubbing'){g='📜';col='#c8b890';}else if(t==='scroll'){g='📜';col='#a08a60';}else if(t==='gold'){g='●';col='#e0c060';}
  const neutral=(t==='equip');
  return `<span class="ico-badge" style="display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:5px;background:${col};box-shadow:inset 0 0 0 1px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.4);font-size:13px;line-height:1;margin-right:6px"><span style="${neutral?'filter:grayscale(1) brightness(.28) contrast(1.4)':'filter:saturate(.85)'}">${g}</span></span>`;}
function _typeWord(it){return it.type==='equip'?(it.slot==='weapon'?'Weapon':it.slot==='offhand'?'Shield':it.slot==='ring'?'Ring':it.slot==='amulet'?'Amulet':'Armour — '+(it.slot||'').replace(/^./,c=>c.toUpperCase())):it.type==='potion'?'Potion':it.type==='herb'?'Herb':it.type==='spellbook'?'Spellbook':it.type==='rubbing'?'Rubbing':it.type==='scroll'?'Scroll':it.type==='misc'?'Sundries':(it.type||'—');}
function sellPrice(it){
  // S366 — ammo is priced by the bundle it is sold in (a dozen arrows for 2), so one piece is worth a twelfth of that:
  // under a coin, and nothing at the counter. Was the whole bundle's price a piece (a dozen bought for 2 sold for 12–60).
  if(it.type==='ammo')return Math.floor((it.buyPrice||2)*(it.sellMult||.4)/(it.bundle||12));
  if(it.buyPrice)return Math.max(1,Math.floor(it.buyPrice*(it.sellMult||.4)));
  if(it.type==='cargo')return 0; // S390 — trade goods go to a harbour's factor, not a counter
  if(it.type==='gold')return it.value||5;
  if(it.type==='herb')return Math.max(3,Math.floor((it.buyPrice||8)*(it.sellMult||.8)));
  if(it.type==='potion')return 8;
  if(it.type==='equip'){
    // Tier-based items: sell for ~30% of buyPrice (already set on makeItem)
    if(it.tier)return Math.max(5,Math.floor((it.buyPrice||10)*(it.sellMult||.45)));
    const atk=it.atk?it.atk[1]:0,def=it.def||0;return Math.max(3,atk*2+def*4);
  }
  if(it.type==='misc')return 10;
  return 5;
}

const OW_NPCS=[];
const OW_HERBS=[];
const FOREST_HERBS=[];
const IH_HERBS=[];
const OW_NOTICE_BOARDS=[];
// Active duration buffs: [{effect, duration, remaining, label, col}]
const ACTIVE_BUFFS=[];
// Persistent collect counts for hidden effect unlocks
const HERB_CONSUME_COUNTS={}; // tracks times each herb type has been consumed (eaten)
let owScene=null;
// v61ad: burned variant of Ashenmoor — lazy-built on first post-Q6 re-entry.
// Shares the overworld zone id; _syncAshenmoorZoneEntry() swaps ZONE_BUILDERS.overworld
// between owScene / owBurnedScene based on worldState.ashenmoorBurned.
let owBurnedScene=null;
// v61ae: animated smoke bookkeeping. Each destroyed building produces 4 slab
// meshes (one plume), and each plume owns its own material clone (so opacity
// cycling is per-plume, not global). tickBurnedSmoke iterates these arrays
// on every frame while the player is in burned Ashenmoor. Cleared and
// repopulated on rebuild (which only happens the first time the player
// re-enters after the burn fires).
const _burnedSmokeMeshes    = [];
const _burnedSmokeMaterials = [];

// v61ad: persistent cross-zone narrative flags. Lives alongside QS (per-quest state)// but tracks world-level events that aren't tied to a single quest's lifecycle.
// Serialized in save payload under key `wS` (short to keep slot size down).
//   ashenmoorBurned   — permanent post-Act-I flag; village swaps to ruins variant
//   ashenmoorPending  — transient; set on Q6 completion, flipped to burned on next
//                       overworld re-entry. Lets the burn fire cleanly when the
//                       player next returns home rather than right at Q6 turn-in.
//   commissioned      — Royal Mage Corps letter (Q7 reward); gates Dagna's full
//                       stock in Ironhaven and future carriage-fast-travel service.
//   bramBodyRead      — one-shot flavor text flag for Bram's body interact.
const worldState={
  ashenmoorBurned:false,
  ashenmoorPending:false,
  commissioned:false,
  bramBodyRead:false,
  // v61aw: gates the tutorial-crypt flow. New games start at false; ccBegin
  // sets it false explicitly, the patched goToOW flips it true on emergence
  // from the tutorial. Pre-v61aw saves get true on load (migration in
  // _applyLoadData) so existing characters bypass the tutorial entirely.
  tutorialDone:false,
  // v61c2: Faolchú boss defeat flag. Set to true when killZoneEnemy fires for
  // the boss in burned Ashenmoor. Gates Q7 obj 1 prereq for triage objectives,
  // and gates re-spawn on overworld re-entry (boss spawns once per playthrough,
  // persists in ZE as a corpse after defeat). Pre-v61c2 saves: defaults to true
  // for existing post-burn characters so they don't re-encounter the boss
  // mid-quest after upgrade — the corpse is just gone, but their Q7 has
  // already used the legacy obj structure so this is a clean no-op for them.
  faolchuDefeated:false,
  // v61d6: Caldric safehouse grant flag. Flips true when the player completes
  // the auto-fire grant scene with Caldric (Q7-complete + first dialog). Gates
  // (a) the safehouse door entry, (b) Brynn's "you called for me?" relay topic,
  // and (c) the auto-fire scene itself (one-shot — won't replay on revisits).
  // Pre-v61d6 saves default to false; existing post-Q7 characters can pick up
  // the relay topic on Brynn naturally on next visit, no migration drama.
  safehouseGranted:false,
  // v61e6 Session A — Day/Night clock state. Single integer tracking
  // in-game minutes since game start. Tick handler advances at 1 in-game
  // minute per real second (cadence locked in design_notes.md: "1 game-
  // hour per real-minute"). Persisted to save payload; restored on load.
  // Initial value 360 = 6:00 AM = dawn — deliberate so a fresh game opens
  // at first light, not midnight. The Q7 burn forces dawn regardless;
  // Aldwyn turn-in + Caldric grant force evening (19:00 = 1140).
  // gameHour(), gameTimeOfDay(), forceTime() helpers below operate on
  // this single field. Tide system reads from it via isTideOut().
  gameTimeMinutes:360,
};

// ── ZONE SYSTEM ───────────────────────────────────────────────
// Each zone: {scene, sol[], npcs[], enemies[], herbs[], gates[], size}
const ZONES={};

// ── WORLD MAP GRAPH MODEL (v60) ─────────────────────────────────
// MAP_NODES and MAP_EDGES are the canonical model of the overworld. Every
// walkable place is a node; every walkable transit is an edge. The world-map
// SVG is the *picture* of this graph; the game code is the *implementation*.
//
// Node kinds:
//   'settlement' — walkable town (e.g. Ashenmoor, Hearthwick, Ironhaven).
//                  Has NPCs, may have shops, is a fast-travel target.
//   'wilderness' — walkable road segment between settlements, biome-tagged.
//                  Spawns enemies, may have herbs/portals. NOT a fast-travel
//                  target — you pass through these on the way somewhere.
//   'poi'        — flavor-only map location (not walkable). E.g. The Ashfeld,
//                  Hermit's Camp until given a proper zone.
//
// An edge just records {from, to, name} — the adjacency that the gates make
// walkable. The wilderness-zone node IS the edge-made-walkable; the edges
// array is for fast-travel pathfinding and for the map UI.
//
// Rollout plan (this session = Phase 1 plumbing only):
//   - Ashenmoor (settlement, existing) — live
//   - Ironhaven (settlement, existing) — live
//   - Deepwood Forest (wilderness, existing as 'forest' zone) — live, still
//     hand-built via buildForest(); will migrate to buildWildernessZone(cfg)
//     in the next phase
// Planned for Phase 1 completion:
//   - An Bealach Mór — South (wilderness, plains biome) — NOT YET BUILT
//   - Hearthwick (settlement stub with Oda the innkeeper) — NOT YET BUILT
// Future phases: Droichead, Cill Beag, Redwater Ford as settlements;
// remaining road edges as wilderness segments; biome variants
// (plains/swamp/desert/ruins/beach/mountains).
//
// Note: 'live' nodes/edges below are what the runtime currently honours.
// 'planned' nodes/edges are the canonical intent for Phase 1 completion —
// they're here so the graph is the source of truth, but they don't correspond
// to zones the runtime can yet load. Fast travel and gate routing filter by
// live-ness via MAP_NODES[id].live.
const MAP_NODES = {
  'overworld':      {kind:'settlement', displayName:'Ashenmoor',        biome:null,      act:'I', fastTravel:true,  live:true},
  'bealach_south':  {kind:'wilderness', displayName:'An Bealach Mór — South', biome:'plains', act:'I', fastTravel:false, live:true},
  'hearthwick':     {kind:'settlement', displayName:'Hearthwick',       biome:null,      act:'I', fastTravel:true,  live:true},
  'forest':         {kind:'wilderness', displayName:'The Deepwood',     biome:'forest',  act:'I', fastTravel:false, live:true},
  'ironhaven':      {kind:'settlement', displayName:'Ironhaven',        biome:null,      act:'I', fastTravel:true,  live:true},
  // v61e Act I scaffold additions — placeholder stubs via registerPlaceholderZone.
  'south_road':              {kind:'wilderness', displayName:'South Road',                biome:'plains', act:'I', fastTravel:false, live:true},
  'redwater_ford':           {kind:'settlement', displayName:'Redwater Ford',             biome:null,     act:'I', fastTravel:true,  live:true},
  'west_track':              {kind:'wilderness', displayName:'The West Track',            biome:'plains', act:'I', fastTravel:false, live:true},
  'salthaven':               {kind:'settlement', displayName:'Salthaven',                 biome:null,     act:'I', fastTravel:true,  live:true},
  'coastal_road_south':      {kind:'wilderness', displayName:'Coastal Road South',        biome:'plains', act:'I', fastTravel:false, live:true},
  'carraig_mor':             {kind:'settlement', displayName:'Carraig Mór',               biome:null,     act:'I', fastTravel:true,  live:true},
  'bealach_central':         {kind:'wilderness', displayName:'An Bealach Mór — Central',  biome:'plains', act:'I', fastTravel:false, live:true},
  'droichead':               {kind:'settlement', displayName:'Droichead',                 biome:null,     act:'I', fastTravel:true,  live:true},
  'cill_beag_path':          {kind:'wilderness', displayName:'Road to Cill Beag',         biome:'forest', act:'I', fastTravel:false, live:true},
  'cill_beag':               {kind:'settlement', displayName:'Cill Beag',                 biome:null,     act:'I', fastTravel:true,  live:true},
  'bealach_north_approach':  {kind:'wilderness', displayName:'An Bealach Mór — North Approach', biome:'forest', act:'I', fastTravel:false, live:true},
  'inis_rua':                {kind:'settlement', displayName:'Inis Rua',                  biome:null,     act:'II', fastTravel:true, live:true},
  // v61e Act II scaffold additions — placeholder stubs via registerPlaceholderZone.
  'northern_road':           {kind:'wilderness', displayName:'The Northern Road',         biome:'plains', act:'II', fastTravel:false, live:true},
  'la_grise':                {kind:'settlement', displayName:'La Grise',                  biome:null,     act:'II', fastTravel:true,  live:true},
  'foothill_track':          {kind:'wilderness', displayName:'The Foothill Track',        biome:'plains', act:'II', fastTravel:false, live:true},
  'colmans_rest':            {kind:'settlement', displayName:'Colmán\'s Rest',            biome:null,     act:'II', fastTravel:true,  live:true},
  'mountain_pass':           {kind:'wilderness', displayName:'The Mountain Pass',         biome:'forest', act:'II', fastTravel:false, live:true},
  'mur_pierre':              {kind:'settlement', displayName:'Mur Pierre',                biome:null,     act:'II', fastTravel:true,  live:true},
  'la_route_royale_west':    {kind:'wilderness', displayName:'La Route Royale — West',    biome:'plains', act:'II', fastTravel:false, live:true},
  'vieux_marche':            {kind:'settlement', displayName:'Vieux Marché',              biome:null,     act:'II', fastTravel:true,  live:true},
  'la_route_royale_south':   {kind:'wilderness', displayName:'La Route Royale — South',   biome:'plains', act:'II', fastTravel:false, live:true},
  // v61d7: dunmore_west_road removed — was a duplicate of la_route_royale_south
  // (both connected Vieux Marché ↔ Dunmore). Audit caught the redundancy.
  'dunmore':                 {kind:'settlement', displayName:'Dunmore',                   biome:null,     act:'II', fastTravel:true,  live:true},
  'coastal_road_north':      {kind:'wilderness', displayName:'The Coastal Road North',    biome:'plains', act:'II', fastTravel:false, live:true},
  'portclare':               {kind:'settlement', displayName:'Portclare',                 biome:null,     act:'II', fastTravel:true,  live:true},
  'capital_road':            {kind:'wilderness', displayName:'The Capital Road',          biome:'plains', act:'II', fastTravel:false, live:true},
  'coeur_de_vie':            {kind:'settlement', displayName:'Coeur de Vie',              biome:null,     act:'III', fastTravel:true, live:true},
  // v61eb: hollowed_wastes split into wastes_west and wastes_east (architectural
  // refactor — see The Hollowed Wastes block in placeholder zones for context).
  'wastes_west':             {kind:'wilderness', displayName:'The Wastes — West',         biome:'plains', act:'II', fastTravel:false, live:true},
  'wastes_east':             {kind:'wilderness', displayName:'The Wastes — East',         biome:'plains', act:'II', fastTravel:false, live:true},
  'hermit_camp':             {kind:'settlement', displayName:'Hermit\'s Camp',            biome:null,     act:'II', fastTravel:true,  live:true},
  'caer_uaigneach':          {kind:'settlement', displayName:'Caer Uaigneach',            biome:null,     act:'II', fastTravel:true,  live:true},
  'ashfeld':                 {kind:'wilderness', displayName:'The Ashfeld',               biome:'plains', act:'I',  fastTravel:false, live:true},
  // v61e1: outposts promoted from map labels to walkable settlement-kind
  // zones. They're 'settlement' so isSettlementZone returns true (unlocks
  // the notice-board prompt) and fastTravel:true so the world map allows
  // fast-travel to them once discovered.
  'thorngate':               {kind:'settlement', displayName:'The Thorngate',              biome:null,     act:'I',  fastTravel:true,  live:true},
  'la_porte_grise':          {kind:'settlement', displayName:'La Porte Grise',             biome:null,     act:'I',  fastTravel:true,  live:true},
};

// Directed edges map a gate walk to a destination zone. Each edge also serves
// as fast-travel pathfinding adjacency (fast travel uses the graph of
// settlement→settlement reachability with wilderness nodes as connectors).
// v61: the old direct overworld↔forest edges are superseded by the road chain
// overworld↔bealach_south↔hearthwick↔forest. Kept as dead rows for historical
// continuity (never referenced at runtime once `live:false`).
// v61e1: hearthwick→forest and forest→ironhaven now route through the new
// Thorngate / La Porte Grise outpost zones. Old direct edges marked superseded.
const MAP_EDGES = [
  // Live edges — the Phase 1 completed road chain
  {from:'overworld',     to:'bealach_south', name:"Ashenmoor's East Gate",           live:true},
  {from:'bealach_south', to:'overworld',     name:"Return to Ashenmoor",             live:true},
  {from:'bealach_south', to:'hearthwick',    name:"Hearthwick's West Road",          live:true},
  {from:'hearthwick',    to:'bealach_south', name:"Back toward Ashenmoor",           live:true},
  // v61e1: Hearthwick → Thorngate → Forest → La Porte Grise → ...
  {from:'hearthwick',    to:'thorngate',     name:"North to the Thorngate",          live:true},
  {from:'thorngate',     to:'hearthwick',    name:"South to Hearthwick",             live:true},
  {from:'thorngate',     to:'forest',        name:"Into the Deepwood",               live:true},
  {from:'forest',        to:'thorngate',     name:"South to the Thorngate",          live:true},
  {from:'forest',        to:'la_porte_grise',name:"Through La Porte Grise",          live:true},
  {from:'la_porte_grise',to:'forest',        name:"Back into the Deepwood",          live:true},
  // v61eh: la_porte_grise no longer connects directly to ironhaven (per spec
  // layout). New route: la_porte_grise → vieux_marche → la_route_royale_west →
  // ironhaven. Old direct edges marked superseded below.
  {from:'la_porte_grise',     to:'vieux_marche',         name:"East to Vieux Marché",          live:true},
  {from:'vieux_marche',       to:'la_porte_grise',       name:"West to La Porte Grise",        live:true},
  {from:'vieux_marche',       to:'la_route_royale_west', name:"East on La Route Royale",       live:true},
  {from:'la_route_royale_west', to:'vieux_marche',       name:"West to Vieux Marché",          live:true},
  {from:'la_route_royale_west', to:'ironhaven',          name:"East to Ironhaven",             live:true},
  {from:'ironhaven',          to:'la_route_royale_west', name:"West on La Route Royale",       live:true},
  // Superseded edges
  {from:'hearthwick',    to:'forest',        name:"Into the Deepwood (superseded)",  live:false},
  {from:'forest',        to:'hearthwick',    name:"South to Hearthwick (superseded)",live:false},
  {from:'forest',        to:'ironhaven',     name:"Through La Porte Grise (superseded)",live:false},
  {from:'ironhaven',     to:'forest',        name:"Back into the Deepwood (superseded)",live:false},
  // v61eh: la_porte_grise ↔ ironhaven direct edges retired (la_porte_grise
  // is no longer adjacent to ironhaven on the spec layout).
  {from:'la_porte_grise',to:'ironhaven',     name:"Approach to Ironhaven (superseded)", live:false},
  {from:'ironhaven',     to:'la_porte_grise',name:"West to La Porte Grise (superseded)", live:false},
  // Superseded edges (v60 direct routing) — retained for graph history only
  {from:'overworld',     to:'forest',        name:"Ashenmoor's East Gate (superseded)", live:false},
  {from:'forest',        to:'overworld',     name:"Return to Ashenmoor (superseded)",   live:false},
];

// Convenience lookups — computed from the above.
function isSettlementZone(id){ return MAP_NODES[id] && MAP_NODES[id].kind==='settlement'; }
function isWildernessZone(id){ return MAP_NODES[id] && MAP_NODES[id].kind==='wilderness'; }
function isLiveZone(id){ return MAP_NODES[id] && MAP_NODES[id].live; }

// BFS over MAP_EDGES to find the first-hop zone on the shortest route from
// fromZone to targetZone. Used by quest-marker routing to pick which gate to
// point the compass at when the target is multiple zones away (e.g. in the new
// overworld→bealach_south→hearthwick→forest→ironhaven road chain, the gate
// "toward Ironhaven from Ashenmoor" is the one pointing at bealach_south, not
// at ironhaven directly). Returns null if target is unreachable or is fromZone.
function nextHopZone(fromZone, targetZone){
  if(!targetZone||targetZone===fromZone)return null;
  const queue=[[fromZone,null]];
  const seen=new Set([fromZone]);
  while(queue.length){
    const [cur,firstHop]=queue.shift();
    for(const edge of MAP_EDGES){
      if(!edge.live||edge.from!==cur)continue;
      if(seen.has(edge.to))continue;
      const hop=firstHop||edge.to;
      if(edge.to===targetZone)return hop;
      seen.add(edge.to);
      queue.push([edge.to,hop]);
    }
  }
  return null;
}

let activeZoneId='overworld'; // tracks which zone the player is in
// Overworld zone populated in buildOW; forest/ironhaven built lazily
// Zone enemies — overworld-zone-specific combat array (separate from dungeon ENEMIES)
let ZE=[]; // active zone enemies; replaced on zone switch
let ZONE_CORPSES=[]; // active zone corpses; reset on zone switch. Unified with dungeon corpses at the loot-panel level.
let ZB=[]; // active zone projectile balls (overworld spells)

function currentZoneSolid(x,z){
  if(typeof isInterior==='function'&&isInterior()&&typeof intSolidAt==='function')return intSolidAt(x,z,.3,0); // v80 S241 — indoors, the room's own solids
  const z2=ZONES[activeZoneId];
  if(!z2)return owSolid(x,z);
  if(z2.solidFn)return z2.solidFn(x,z); // v80: streamed world supplies its own solid test
  const R=0.3,sz=z2.size||60;
  if(x<R||x>sz-R||z<R||z>sz-R)return true;
  for(const s of z2.sol)if(Math.abs(x-s.cx)<s.rx+R&&Math.abs(z-s.cz)<s.rz+R)return true;
  return false;
}
function isOverworldZone(){return activeZoneId==='world'||!!(MAP_NODES[activeZoneId]&&MAP_NODES[activeZoneId].live);}
// Interior
let interiorScene=null,currentHouse=null,intNPCMesh=null,intNPCPos={x:4,z:3};
// S365 — one step of the keeper's amble about the shop floor (was inline in the main loop): a heading held 1.5–5 s,
// .25 units a second, turned back off the room's bounds.
function intAmbleStep(m,dt){const am=m.userData.amble;
  am.wt-=dt;if(am.wt<=0){am.wa=Math.random()*Math.PI*2;am.wt=1.5+Math.random()*3.5;}
  const nx=m.position.x+Math.sin(am.wa)*am.speed*dt,nz=m.position.z+Math.cos(am.wa)*am.speed*dt;
  // S368 — a bound turns back the part of the heading that met it: x is sin(wa), so an x bound flips wa to −wa, a z bound to π−wa
  // (they were swapped, so a keeper at the counter's bound walked on into it, facing the strongbox, until the timer ran out)
  // S387 — the room's solids turn them back as the bounds do (the counter ran across the bounds, and a keeper walked through it
  // 14–40% of the day). One that ever stands in a solid steps to the nearest free spot first, so the strict step can't hold them there.
  const sol=(x,z)=>typeof intSolidAt==='function'&&typeof INT_SOL!=='undefined'&&intSolidAt(x,z,.22,0);
  if(sol(m.position.x,m.position.z)){out:for(let r=.1;r<=2.5;r+=.1)for(let k=0;k<16;k++){const ox=m.position.x+Math.sin(k*Math.PI/8)*r,oz=m.position.z+Math.cos(k*Math.PI/8)*r;
    if(ox>am.minX&&ox<am.maxX&&oz>am.minZ&&oz<am.maxZ&&!sol(ox,oz)){m.position.x=ox;m.position.z=oz;break out;}}}
  if(nx>am.minX&&nx<am.maxX&&!sol(nx,m.position.z))m.position.x=nx;else{am.wa=-am.wa;am.wt=0.5;}
  if(nz>am.minZ&&nz<am.maxZ&&!sol(m.position.x,nz))m.position.z=nz;else{am.wa=Math.PI-am.wa;am.wt=0.5;}
  m.rotation.y=Math.atan2(Math.sin(am.wa),Math.cos(am.wa));
  if(m===intNPCMesh){intNPCPos.x=m.position.x;intNPCPos.z=m.position.z;}}
// v61d4 — Safehouse interior interaction state. Set by buildInterior's
// safehouse branch; cleared on exitInterior (so stale positions from a
// previous safehouse visit don't trigger when the player walks past where
// the chest USED to be in another building). The proximity check in the
// main interact handler reads these to decide whether to surface the stash
// or rest prompt.
let intStashPos=null;     // {x,z} — chest position, or null if not in safehouse
let intBedPos=null;       // {x,z} — bed center, or null if not in safehouse
