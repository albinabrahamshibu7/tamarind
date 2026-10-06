// Single source of truth for every fact, string and image on the site.
// Facts come from /Menu.md, /research and /design-system. Tags:
// REAL (verified source), DERIVED (written from real facts), CONFIRM (needs the owner's yes).

import { fullMenu, type FullGroup, type FullItem, type When } from './fullMenu';

export type { When };

/** true = pitch build: shows the "design prototype" footnote and photo credits. */
export const PROTOTYPE = true;

export const business = {
  name: 'Cafe Tamarind', // REAL - always in this order (design-system/README)
  descriptor: 'Smokehouse · Pala · Since 2018', // REAL - drawn into the logo
  tagline: 'Sixteen hours. Sliced to order.', // REAL - design-system cover line
  phoneRaw: '9747638246', // REAL - Google, Instagram, Restaurant Guru
  phoneDisplay: '97476 38246',
  whatsapp: '919747638246', // CONFIRM - same number, WhatsApp use not confirmed by the owner
  addressShort: 'Market Road, Kollappally, Pala', // REAL
  addressLines: ['Market Road, Anthinad', 'Kollappally, Pala', 'Kottayam, Kerala 686651'], // REAL - Google listing
  hoursLong: 'Open daily 12:30 PM to 11 PM · Wednesday till 10 PM', // REAL - Google listing
  hoursShort: '12:30 PM to 11 PM',
  openMinutes: 12 * 60 + 30,
  closeMinutes: 23 * 60,
  closeMinutesWed: 22 * 60,
  smokerMinutes: 18 * 60, // REAL - owner replies and Instagram say 6 PM (Google text says 5:30) - CONFIRM
  serviceModes: 'Dine in · Takeaway', // REAL - no delivery listing found
  mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=9.7647296,76.7011032', // REAL - listing coordinates
  placeUrl: 'https://www.google.com/maps/place/Tamarind+Cafe/@9.7647296,76.7011032,17z', // REAL
  instagramUrl: 'https://www.instagram.com/cafe_tamarind/', // REAL
  instagramHandle: 'cafe_tamarind',
  rating: '4.1', // REAL - Google listing, Oct 2026
  reviewCount: 956, // REAL - Google listing, Oct 2026
};

export const fryd = {
  name: "The Fry'D", // REAL
  endorsement: 'by Cafe Tamarind',
  address: 'Moozhayil Building, near Carmel School, Bypass Road, Pala', // REAL - @thefryd2026 bio
  hours: '2 PM to 11 PM', // REAL
  range: 'Wings, loaded fries, shawarma, momos, rolls, mojitos', // REAL
  url: 'https://www.instagram.com/thefryd2026/',
};

export const waLink = (text: string) => `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(text)}`;
export const telLink = `tel:+91${business.phoneRaw}`;

export const nav = [
  { label: 'About', href: '/#about' },
  { label: 'Menu', href: '/#menu' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Reserve', href: '/#order' },
];

// ---------------------------------------------------------------------------
// Availability - the rule that stops the one-star reviews. Every smoked item carries its time.
// ---------------------------------------------------------------------------
export const whenLabel: Record<When, string> = {
  now: 'All day',
  evening: 'From 6 PM',
  weekend: 'Sat & Sun · from 6 PM',
};

// ---------------------------------------------------------------------------
// Menu plumbing - one data file (fullMenu.ts) feeds the landing card, the full menu page
// and the order tray, so a price changes in one place.
// ---------------------------------------------------------------------------
const groups: FullGroup[] = fullMenu.flatMap((s) => s.groups);
const groupById = new Map(groups.map((g) => [g.id, g]));

/** Sep 2026 sheets are current; anything older is shown as a dated price. */
export const isDated = (g: FullGroup) => g.asOf !== 'Sep 2026';

const prefixed = new Set(['classic-fried', 'peri-fried', 'classic-strips', 'peri-strips']);
const orderName = (g: FullGroup, it: FullItem) => {
  if (prefixed.has(g.id)) return `${g.title}, ${it.name}`;
  if (g.id === 'burgers' && it.note) return `${it.name} (${it.note})`;
  return it.name;
};

export const itemId = (g: FullGroup, index: number) => `${g.id}-${index}`;

/** Flat lookup used by the order tray. */
export const allItems = groups.flatMap((g) =>
  g.items.map((it, i) => ({ id: itemId(g, i), fullName: orderName(g, it), when: g.when })),
);

export type CardItem = {
  id: string;
  name: string;
  price: number | null;
  dated: boolean;
  desc?: string;
};

/** Pick one item for the landing page, optionally with a shorter label. */
function pick(groupId: string, name: string, label?: string, desc?: string): CardItem {
  const g = groupById.get(groupId);
  const i = g ? g.items.findIndex((it) => it.name === name) : -1;
  if (!g || i < 0) throw new Error(`menu item not found: ${groupId} / ${name}`);
  const it = g.items[i];
  const auto = it.serves ? `Serves ${it.serves}` : groupId.startsWith('smoked') || groupId === 'brisket' ? it.note?.split(' · ')[0] : undefined;
  return { id: itemId(g, i), name: label ?? it.name, price: it.price, dated: isDated(g), desc: desc ?? auto };
}

export type CardCategory = { id: string; title: string; when: When; note?: string; items: CardItem[] };

// Landing-page menu card: organised by when, not only by what (design-system rule).
export const menuCard: CardCategory[] = [
  {
    id: 'weekend',
    title: 'Weekend brisket',
    when: 'weekend',
    note: '16 hours in the smoker. Until it runs out.',
    items: [pick('brisket', 'Smoked Beef Brisket', undefined, '250 g, with all the sides')],
  },
  {
    id: 'burgers',
    title: 'Burgers & sandwiches',
    when: 'now',
    items: [
      pick('burgers', 'Smashed Beef Cheese Burger', 'Smashed Beef Cheese Burger', 'Single patty. Double is ₹340'),
      pick('burgers', 'Smoked Beef Brisket Burger'),
      pick('burgers', 'Smoked Pulled Pork Burger'),
      pick('burgers', 'Smoked Pulled Chicken Burger'),
      pick('sandwiches', 'Smashed Beef Brisket Sandwich'),
      pick('sandwiches', 'Smoked Pulled Beef Sandwich'),
    ],
  },
  {
    id: 'smokehouse',
    title: 'Smokehouse',
    when: 'evening',
    note: 'With toasted bread, fries, mac & cheese, coleslaw, pickles, chimichurri and house BBQ sauce.',
    items: [
      pick('smoked-pork', 'Smoked Pork Ribs'),
      pick('smoked-pork', 'Smoked Pork Belly'),
      pick('smoked-pork', 'Smoked Pulled Pork'),
      pick('smoked-beef', 'Smoked Pulled Beef'),
      pick('smoked-beef', 'Smoked Beef Tenderloin'),
      pick('smoked-chicken', 'Classic Texas Style Smoked BBQ Chicken', 'Texas Smoked BBQ Chicken', 'Half chicken'),
      pick('smoked-chicken', 'Smoked Chicken with Alabama Sauce and Cheddar Cheese', 'Smoked Chicken, Alabama & Cheddar', 'Half chicken. Four sauces at this price'),
    ],
  },
  {
    id: 'alfaham',
    title: 'Al-faham',
    when: 'now',
    note: 'Quarter chicken with 2 rumali, mayonnaise and salad.',
    items: [
      pick('alfaham', 'Pepper Al-Faham', 'Pepper'),
      pick('alfaham', 'Peri Peri Al-Faham', 'Peri Peri'),
      pick('alfaham', 'Texas (Hot & Sweet) Al-Faham', 'Texas, Hot & Sweet'),
      pick('alfaham', 'Kashmiri Tawa Al-Faham', 'Kashmiri Tawa'),
      pick('alfaham', 'Creamy Afghani Al-Faham', 'Creamy Afghani'),
    ],
  },
  {
    id: 'platters',
    title: 'Platters',
    when: 'evening',
    note: 'Every platter comes with the full set of sides.',
    items: [
      pick('platters', 'Smoked Chicken Platter'),
      pick('platters', 'Smoked Pork Platter'),
      pick('platters', 'Smoked Beef Platter'),
      pick('platters', 'Smoked Mixed Platter'),
      pick('platters', 'Smoked Jumbo Platter'),
    ],
  },
  {
    id: 'kitchen',
    title: 'Momos & Chinese',
    when: 'now',
    items: [
      pick('momos', 'Steamed Momos', 'Steamed Chicken Momos'),
      pick('momos', 'Fried Momos', 'Fried Chicken Momos'),
      pick('momos', 'Peri Peri Dusted Momos'),
      pick('chinese-chicken', 'Chilli Chicken'),
      pick('chinese-chicken', 'Dragon Chicken'),
      pick('rice', 'Schezwan Chicken Fried Rice'),
      pick('starters', 'Beef Dry Fry'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Hero - round top-down plate cutouts, one per slide. Each slide shifts the headline colour.
// PLACEHOLDER: these five plates are the High Dive cutouts (public/hero/*.webp), kept until
// Cafe Tamarind's own dishes are shot. Names and tags below are real Tamarind menu lines.
// To swap a dish: drop <name>-1000.webp and <name>-560.webp (transparent, plate centred)
// into public/hero/ and change the entry here.
// ---------------------------------------------------------------------------
const plate = (name: string) => ({ image: `/hero/${name}-1000.webp`, imageSm: `/hero/${name}-560.webp` });

export const heroSlides: {
  when: When;
  /** headline colour while this slide is up; keep to the design-system warm palette */
  accent: string;
  image: string;
  imageSm: string;
  name: string;
  alt: string;
  chips: [string, string];
}[] = [
  {
    when: 'now',
    accent: '#e2632a', // ember-500
    ...plate('alfaham-biriyani'),
    name: 'Al-faham with Arabic rice',
    alt: 'Two charred al-faham chicken pieces on saffron rice, on a black plate',
    chips: ['From 12:30 PM', 'Five flavours'],
  },
  {
    when: 'now',
    accent: '#f3eadc', // paper-100
    ...plate('momos'),
    name: 'Chicken momos',
    alt: 'Eight steamed momos around a bowl of red chilli chutney, on a black plate',
    chips: ['From 12:30 PM', 'Eight kinds'],
  },
  {
    when: 'now',
    accent: '#e8b33c', // gold-400
    ...plate('alfaham-plate'),
    name: 'Al-faham',
    alt: 'Grilled al-faham chicken with kuboos, onion salad and lime, on a black plate',
    chips: ['From 12:30 PM', 'Nine flavours'],
  },
  {
    when: 'now',
    accent: '#d59a78', // accent (tamarind) on charcoal
    ...plate('chicken-noodles'),
    name: 'Chicken noodles',
    alt: 'Chicken noodles tossed with cabbage, carrot and spring onion, on a black plate',
    chips: ['From 12:30 PM', 'Ten kinds'],
  },
  {
    when: 'now',
    accent: '#f08a55', // brand-text on charcoal
    ...plate('dum-biriyani'),
    name: 'Rice combos',
    alt: 'Chicken on spiced rice with raita, onion rings and lime, on a black plate',
    chips: ['From 12:30 PM', 'Seven combos'],
  },
];

export const heroSub = 'Texas-style smokehouse in Kollappally, Pala. Brisket on Saturdays and Sundays from 6 PM, until it runs out.'; // DERIVED

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------
export const about = {
  paragraphs: [
    // DERIVED from the design-system business description
    'We opened in 2018 as a small cafe for momos, al-faham and mojitos. The smoker came later. Now most people drive out for the brisket.',
    'Beef brisket, 16 hours. Pork ribs, belly and pulled pork every evening. The cafe kitchen runs from 12:30 PM. Eat in the dark room or out in the yard, under the open sky.',
  ],
  photos: [
    { src: '/photos/place-pergola-dusk.webp', alt: 'The yard at dusk: a tree, string lights and long tables under the pergola' },
    { src: '/photos/place-room.webp', alt: 'The indoor room: charcoal walls, pine benches and a brass pendant light' },
    { src: '/photos/place-yard-night.webp', alt: 'The yard at night with the Texas BBQ counter lit in the distance' },
  ],
};

// ---------------------------------------------------------------------------
// Off the smoker - three smoked lines, current prices (Sep 2026 sheets).
// PLACEHOLDER: the plates are the High Dive cutouts and do not show these dishes, so alt
// stays empty (the name sits right under each plate). Give each a real alt with its photo.
// ---------------------------------------------------------------------------
const one = (c: CardItem, extra: { image: string; alt: string; when: When; plate?: boolean }) => ({ plate: false, ...c, ...extra });

export const specials = [
  one(pick('brisket', 'Smoked Beef Brisket'), {
    image: '/hero/alfaham-biriyani-560.webp',
    alt: '',
    plate: true,
    when: 'weekend',
  }),
  one(pick('platters', 'Smoked Mixed Platter'), {
    image: '/hero/dum-biriyani-560.webp',
    alt: '',
    plate: true,
    when: 'evening',
  }),
  one(pick('platters', 'Smoked Beef Platter'), {
    image: '/hero/chicken-noodles-560.webp',
    alt: '',
    plate: true,
    when: 'evening',
  }),
];

export const allDayPicks = [
  one(pick('alfaham', 'Peri Peri Al-Faham'), {
    image: '/hero/alfaham-plate-560.webp',
    alt: 'Grilled al-faham chicken with kuboos, onion salad and lime',
    plate: true,
    when: 'now',
  }),
  one(pick('momos', 'Steamed Momos', 'Steamed Chicken Momos'), {
    image: '/hero/momos-560.webp',
    alt: 'Chicken momos around a bowl of chilli chutney',
    plate: true,
    when: 'now',
  }),
];

// ---------------------------------------------------------------------------
// Big ticker - what comes out of the two kitchens.
// ---------------------------------------------------------------------------
export const tickerRows: string[][] = [
  ['Beef brisket', 'Pork ribs', 'Pork belly'],
  ['Pulled pork', 'Smoked chicken', 'Al-faham'],
  ['Momos', 'Burgers', 'Mojitos'],
];

// ---------------------------------------------------------------------------
// How we smoke - four facts, no adjectives.
// ---------------------------------------------------------------------------
export const beats = [
  { title: '16 hours.', body: 'That is how long the brisket stays in the smoker.' },
  { title: 'Sliced to order.', body: 'We cut it when you ask for it, not before.' },
  { title: 'On the tray.', body: 'Toasted bread, fries, mac & cheese, coleslaw, pickles, chimichurri, house BBQ sauce.' },
  { title: 'Until sold out.', body: 'When it is gone, it is gone. We will say so.' },
];

// ---------------------------------------------------------------------------
// Reviews - short excerpts from public Google reviews, names withheld. CONFIRM before launch.
// ---------------------------------------------------------------------------
export const reviews = [
  { quote: 'Perfectly cooked, tender, and juicy.', about: 'on the brisket', source: 'Google review', stars: 5 },
  { quote: 'Best steak available in Pala.', about: '', source: 'Google review', stars: 5 },
  { quote: 'One of the go-to spots for alfahams.', about: '', source: 'Google review', stars: 5 },
];

export const igCaption = {
  quote: 'Fresh out of the smoker. Freshly sliced.', // REAL - @cafe_tamarind post, June 2026
  source: '@cafe_tamarind on Instagram',
};

export const stories = [
  { src: '/photos/place-pergola-dusk.webp', caption: 'Under the open sky' },
  { src: '/photos/g-brisket-tray.webp', caption: 'Brisket, 16 hours' },
  { src: '/photos/place-room.webp', caption: 'The room' },
  { src: '/photos/g-mixed-platter.webp', caption: 'For the table' },
  { src: '/photos/g-yard-tree.webp', caption: 'From 6 PM' },
];

// ---------------------------------------------------------------------------
// Gallery - tilted card row.
// ---------------------------------------------------------------------------
export const gallery = [
  { src: '/photos/g-brisket-tray.webp', alt: 'Brisket slices, mac and cheese and coleslaw on a tray' },
  { src: '/photos/g-pergola-day.webp', alt: 'Steel chairs and a wooden table under the pergola in daylight' },
  { src: '/photos/g-burger.webp', alt: 'A burger and fries on printed butcher paper' },
  { src: '/photos/g-yard-tree.webp', alt: 'Guests at long tables under the tree at night' },
  { src: '/photos/g-cheese-chicken.webp', alt: 'Smoked chicken under melted cheese on a wooden board' },
  { src: '/photos/g-room-windows.webp', alt: 'Pine benches by the black grid windows indoors' },
  { src: '/photos/g-mojitos.webp', alt: 'A blue mojito and a lime drink on a wooden table' },
  { src: '/photos/g-alfaham-rice.webp', alt: 'Al-faham chicken on Arabic rice with a dip' },
];

// ---------------------------------------------------------------------------
// Before you come - the six things people wish they had known.
// ---------------------------------------------------------------------------
export const reasons = [
  { figure: '12:30 PM', title: 'The kitchen opens', body: 'Al-faham, momos, burgers and Chinese, all day.' },
  { figure: '6 PM', title: 'The smoker opens', body: 'Pork ribs, belly, pulled pork and smoked chicken, every day.' },
  { figure: 'Sat & Sun', title: 'Brisket days', body: 'From 6 PM until sold out. Not on weekdays.' },
  { figure: 'Call', title: 'Hold a portion', body: `${business.phoneDisplay}. Brisket goes fast.` },
  { figure: 'UPI', title: 'How to pay', body: 'UPI works. We do not take cards.' }, // CONFIRM - from a 2025 review
  { figure: 'Roadside', title: 'Parking', body: 'There is no car park. Two wheels are easier.' },
];

export const stripPills: string[] = [
  'Sixteen hours, sliced to order',
  'Brisket Sat & Sun from 6 PM',
  'Open daily from 12:30 PM',
  'Smoker from 6 PM',
  'Kollappally, Pala',
  `Call ${business.phoneDisplay}`,
];

export const topBar: string[] = [business.addressShort, 'Open daily from 12:30 PM · Brisket Sat & Sun from 6 PM', business.serviceModes];
