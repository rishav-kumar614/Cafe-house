// Layout of the virtual cafe (metres). Interior spans x -10..10, z -8..8; the street front is +z.
// Each zone is a camera viewpoint; stations are the counters that serve menu categories.

export const ZONES = [
  { id: 'exterior', label: 'Outside', pos: [0, 3.6, 27], target: [0, 2.6, 8], max: 34 },
  { id: 'entrance', label: 'Entrance', pos: [0, 1.75, 6.9], target: [0, 1.45, 0], max: 9, blurb: 'Step through the doors into the main hall.' },
  {
    id: 'coffee-bar',
    label: 'Coffee Bar',
    pos: [-5.9, 1.95, -1.6],
    target: [-6.5, 1.15, -6.4],
    max: 7,
    station: 'coffee-bar',
    blurb: 'Espresso drinks, chai, shakes and coolers made to order at the bar.',
  },
  {
    id: 'pastry-case',
    label: 'Bakery & Desserts',
    pos: [-6.1, 1.65, 1.1],
    target: [-9.0, 1.05, -0.3],
    max: 7,
    station: 'pastry-case',
    blurb: 'Glass display counters of fresh bakes, cakes and desserts.',
  },
  {
    id: 'kitchen',
    label: 'Open Kitchen',
    pos: [4.0, 2.25, -2.75],
    target: [4.0, 1.15, -6.8],
    max: 9,
    blurb: 'Watch the pizza oven, grill, wok and tandoor stations at work.',
  },
  { id: 'pizza-oven', label: 'Pizza Oven', parent: 'kitchen', pos: [7.2, 1.85, -2.9], target: [8.0, 1.15, -6.8], max: 5, station: 'pizza-oven' },
  { id: 'grill', label: 'Grill Station', parent: 'kitchen', pos: [5.2, 1.85, -3.0], target: [5.2, 1.0, -6.6], max: 5, station: 'grill' },
  { id: 'wok', label: 'Wok Station', parent: 'kitchen', pos: [2.6, 1.85, -3.0], target: [2.6, 1.0, -6.6], max: 5, station: 'wok' },
  { id: 'tandoor', label: 'Tandoor & Curries', parent: 'kitchen', pos: [0.0, 1.85, -3.0], target: [0.0, 1.0, -6.6], max: 5, station: 'tandoor' },
  { id: 'dining', label: 'Dining Hall', pos: [2.9, 4.2, 6.2], target: [1.2, 0.6, -0.8], max: 10, blurb: 'Tables for two and four under warm pendant lights.' },
  { id: 'lounge', label: 'Sofa Lounge', pos: [4.4, 1.7, 1.6], target: [8.7, 0.75, -1.0], max: 6, blurb: 'Deep sofas, a reading shelf and slow coffee.' },
  { id: 'window', label: 'Window Seats', pos: [-5.6, 1.7, 3.7], target: [-5.6, 1.0, 7.6], max: 6, blurb: 'A long counter facing the street for solo visits.' },
  {
    id: 'reception',
    label: 'Order Counter',
    pos: [4.6, 1.85, 1.6],
    target: [7.3, 1.1, 5.2],
    max: 6,
    station: 'reception',
    blurb: 'Billing and pick-up. Place an order here or online.',
  },
  { id: 'patio', label: 'Garden Patio', pos: [-8.6, 2.6, 18.5], target: [-5.5, 0.8, 11], max: 14, blurb: 'Outdoor tables, umbrellas and string lights.' },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

/** Station -> world position of its hotspot marker. */
export const STATIONS = {
  'coffee-bar': { label: 'Coffee Bar', zone: 'coffee-bar', pos: [-6.6, 2.15, -5.4], categories: ['coffee-hot', 'cold-beverages'], demo: 'Brew a latte' },
  'pastry-case': { label: 'Bakery & Desserts', zone: 'pastry-case', pos: [-9.0, 1.95, 0.0], categories: ['bakery', 'desserts'], demo: 'Plate a dessert' },
  'pizza-oven': { label: 'Pizza Oven', zone: 'pizza-oven', pos: [8.1, 2.75, -6.6], categories: ['pizza', 'italian'], demo: 'Make a pizza' },
  grill: { label: 'Grill', zone: 'grill', pos: [5.2, 2.2, -6.5], categories: ['burgers', 'sandwiches', 'wraps-rolls', 'snacks-sides'], demo: 'Build a burger' },
  wok: { label: 'Wok', zone: 'wok', pos: [2.6, 2.2, -6.5], categories: ['chinese', 'momos'], demo: 'Toss some noodles' },
  tandoor: { label: 'Tandoor', zone: 'tandoor', pos: [0.0, 2.2, -6.5], categories: ['indian', 'main-course'], demo: 'Fire the tandoor' },
  reception: { label: 'Order Counter', zone: 'reception', pos: [7.3, 2.05, 5.2], categories: [], demo: null },
};

// Keyboard shortcuts 1-9 map to these zones.
export const QUICK_ZONES = ['entrance', 'coffee-bar', 'pastry-case', 'kitchen', 'dining', 'lounge', 'window', 'reception', 'patio'];
