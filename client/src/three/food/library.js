import { burger, sandwich, wrap, combo } from './builders/grill.jsx';
import { pizza, pasta, lasagna, risotto, garlicBread, bruschetta } from './builders/oven.jsx';
import { noodles, friedRice, manchurian, chilliPaneer, springRolls, crispyVeg, momos } from './builders/wok.jsx';
import { cholePlate, pavBhaji, dosa, tikka, curryBowl, biryani, thali, rotiCurry, riceBowl, grilledChicken } from './builders/tandoor.jsx';
import { fries, nachos, onionRings, nuggets, cheeseBalls } from './builders/snacks.jsx';
import { croissant, muffin, cookies, cinnamonRoll, donut, pastry } from './builders/bakery.jsx';
import { brownie, cheesecake, tiramisu, lavaCake, waffle, pancakes, iceCream, sundae, fruitBowl } from './builders/desserts.jsx';
import { coffeeCup, chai, teaCup, coldDrink } from './builders/drinks.jsx';

/**
 * Procedural model registry. Products reference a key (plus optional params) in their
 * `model` field; admins pick from this list or upload a .glb instead.
 */
export const FOOD_MODELS = {
  burger: { build: burger, label: 'Burger', params: { patty: ['chicken', 'veg', 'paneer', 'crispy'], cheese: 'boolean', double: 'boolean', gourmet: 'boolean' } },
  sandwich: { build: sandwich, label: 'Sandwich', params: { filling: ['cheese', 'club', 'paneer', 'veg', 'chicken', 'corn'], grilled: 'boolean' } },
  wrap: { build: wrap, label: 'Wrap / roll / burrito', params: { style: ['wrap', 'burrito', 'kathi', 'loaded'], filling: ['paneer', 'veg', 'chicken', 'beans'] } },
  combo: { build: combo, label: 'Meal combo tray' },
  pizza: { build: pizza, label: 'Pizza', params: { toppings: 'list:basil,tomato,pepperoni,corn,paneer,capsicum,onion,olive,mushroom', cheese: ['mozzarella', 'four'] } },
  pasta: { build: pasta, label: 'Pasta bowl', params: { sauce: ['alfredo', 'arrabbiata', 'pesto', 'cheese'], shape: ['penne', 'spaghetti', 'elbow'] } },
  lasagna: { build: lasagna, label: 'Lasagna' },
  risotto: { build: risotto, label: 'Risotto' },
  garlicBread: { build: garlicBread, label: 'Garlic bread' },
  bruschetta: { build: bruschetta, label: 'Bruschetta' },
  noodles: { build: noodles, label: 'Noodles', params: { style: ['hakka', 'stirfry'] } },
  friedRice: { build: friedRice, label: 'Fried rice' },
  manchurian: { build: manchurian, label: 'Manchurian' },
  chilliPaneer: { build: chilliPaneer, label: 'Chilli paneer' },
  springRolls: { build: springRolls, label: 'Spring rolls' },
  crispyVeg: { build: crispyVeg, label: 'Crispy vegetables' },
  momos: { build: momos, label: 'Momos', params: { style: ['steamed', 'fried', 'tandoori', 'schezwan'], filling: ['veg', 'paneer', 'chicken'] } },
  cholePlate: { build: cholePlate, label: 'Chole with bread', params: { bread: ['kulcha', 'bhatura'] } },
  pavBhaji: { build: pavBhaji, label: 'Pav bhaji' },
  dosa: { build: dosa, label: 'Dosa' },
  tikka: { build: tikka, label: 'Tikka skewers', params: { protein: ['paneer', 'chicken'] } },
  curryBowl: { build: curryBowl, label: 'Curry bowl', params: { gravy: ['dal', 'paneer', 'veg', 'rajma', 'chole'], withRice: 'boolean' } },
  biryani: { build: biryani, label: 'Biryani handi', params: { meat: 'boolean' } },
  thali: { build: thali, label: 'Thali' },
  rotiCurry: { build: rotiCurry, label: 'Roti & curry' },
  riceBowl: { build: riceBowl, label: 'Rice bowl' },
  grilledChicken: { build: grilledChicken, label: 'Grilled chicken plate' },
  fries: { build: fries, label: 'Fries', params: { style: ['plain', 'peri', 'loaded'] } },
  nachos: { build: nachos, label: 'Nachos' },
  onionRings: { build: onionRings, label: 'Onion rings' },
  nuggets: { build: nuggets, label: 'Nuggets' },
  cheeseBalls: { build: cheeseBalls, label: 'Cheese balls' },
  croissant: { build: croissant, label: 'Croissant' },
  muffin: { build: muffin, label: 'Muffin', params: { flavor: ['chocolate', 'blueberry'] } },
  cookies: { build: cookies, label: 'Cookies' },
  cinnamonRoll: { build: cinnamonRoll, label: 'Cinnamon roll' },
  donut: { build: donut, label: 'Donut', params: { glaze: ['chocolate', 'strawberry', 'sugar'] } },
  pastry: { build: pastry, label: 'Cream pastry', params: { flavor: ['chocolate', 'pineapple', 'redvelvet'] } },
  brownie: { build: brownie, label: 'Brownie' },
  cheesecake: { build: cheesecake, label: 'Cheesecake slice' },
  tiramisu: { build: tiramisu, label: 'Tiramisu' },
  lavaCake: { build: lavaCake, label: 'Lava cake' },
  waffle: { build: waffle, label: 'Waffle' },
  pancakes: { build: pancakes, label: 'Pancake stack' },
  iceCream: { build: iceCream, label: 'Ice cream cone' },
  sundae: { build: sundae, label: 'Sundae' },
  fruitBowl: { build: fruitBowl, label: 'Fruit bowl' },
  coffeeCup: { build: coffeeCup, label: 'Coffee cup', params: { drink: ['espresso', 'americano', 'cappuccino', 'latte', 'flatwhite', 'mocha', 'hotchocolate'] } },
  chai: { build: chai, label: 'Chai kulhad' },
  teaCup: { build: teaCup, label: 'Tea glass', params: { tea: ['green', 'herbal'] } },
  coldDrink: { build: coldDrink, label: 'Cold drink glass', params: { liquid: 'color', glass: ['tall', 'mason', 'shake'], whipped: 'boolean', ice: 'boolean', layered: 'boolean', garnish: ['none', 'lemon', 'orange', 'mint', 'berry', 'cookie', 'chocolate', 'cherry'] } },
};

const CATEGORY_FALLBACK = {
  burgers: 'burger',
  pizza: 'pizza',
  italian: 'pasta',
  chinese: 'noodles',
  momos: 'momos',
  indian: 'thali',
  sandwiches: 'sandwich',
  'wraps-rolls': 'wrap',
  'snacks-sides': 'fries',
  'main-course': 'curryBowl',
  bakery: 'croissant',
  desserts: 'pastry',
  'coffee-hot': 'coffeeCup',
  'cold-beverages': 'coldDrink',
};

/** Resolves which procedural model to use for a product (explicit key, else by category). */
export function resolveProcedural(model, categorySlug) {
  if (model?.key && FOOD_MODELS[model.key]) return { key: model.key, params: model.params || {} };
  return { key: CATEGORY_FALLBACK[categorySlug] || 'coffeeCup', params: {} };
}

const built = new Map();

export function buildFood(key, params = {}, quality = 'high') {
  const id = `${key}|${JSON.stringify(params)}|${quality}`;
  if (!built.has(id)) {
    const entry = FOOD_MODELS[key] || FOOD_MODELS.coffeeCup;
    built.set(id, entry.build(params, { detail: quality }));
  }
  return built.get(id);
}
