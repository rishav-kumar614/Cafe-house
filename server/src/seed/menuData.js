/**
 * Initial menu catalog used to seed the database.
 *
 * SAMPLE DATA: every price, description, ingredient list and veg / non-veg flag below is a
 * placeholder for demonstration. The cafe owner must review and edit them in the admin panel
 * (or here, then run `npm run seed -- --reset`) before taking real orders.
 *
 * Prices are written in whole rupees for readability; the seeder converts them to paise.
 * `model` points at a procedural 3D model in client/src/three/food/library.js. An admin can
 * replace it with an uploaded .glb file at any time.
 */

export const categories = [
  { slug: 'burgers', name: 'Burgers', station: 'grill', description: 'Stacked, grilled and built to order.' },
  { slug: 'pizza', name: 'Pizza', station: 'pizza-oven', description: 'Hand-stretched bases from the stone oven.' },
  { slug: 'italian', name: 'Italian', station: 'pizza-oven', description: 'Pasta, bakes and Italian small plates.' },
  { slug: 'chinese', name: 'Chinese', station: 'wok', description: 'Indo-Chinese favourites tossed in a hot wok.' },
  { slug: 'momos', name: 'Momos', station: 'wok', description: 'Hand-folded dumplings, steamed, fried or tandoori.' },
  { slug: 'indian', name: 'Indian', station: 'tandoor', description: 'Street food classics and home-style curries.' },
  { slug: 'sandwiches', name: 'Sandwiches', station: 'grill', description: 'Pressed, grilled and layered sandwiches.' },
  { slug: 'wraps-rolls', name: 'Wraps & Rolls', station: 'grill', description: 'Rolled-up meals for eating on the go.' },
  { slug: 'snacks-sides', name: 'Snacks & Sides', station: 'grill', description: 'Crispy things to share (or not).' },
  { slug: 'main-course', name: 'Main Course', station: 'tandoor', description: 'Hearty plates, bowls and meal combos.' },
  { slug: 'bakery', name: 'Bakery', station: 'pastry-case', description: 'Baked fresh through the day.' },
  { slug: 'desserts', name: 'Desserts', station: 'pastry-case', description: 'Cakes, waffles, sundaes and sweet endings.' },
  { slug: 'coffee-hot', name: 'Coffee & Hot Beverages', station: 'coffee-bar', description: 'Espresso drinks, chai and teas.' },
  { slug: 'cold-beverages', name: 'Cold Beverages', station: 'coffee-bar', description: 'Shakes, iced coffee, juices and coolers.' },
];

// ---------- Reusable size & option presets (rupees) ----------

const size = (key, label, priceDelta = 0) => ({ key, label, priceDelta });
const choice = (key, label, priceDelta = 0) => ({ key, label, priceDelta });

const SIZES = {
  drink: [size('regular', 'Regular'), size('large', 'Large', 40)],
  hot: [size('small', 'Small'), size('regular', 'Regular', 30), size('large', 'Large', 60)],
  pizza: [size('regular', 'Regular 8"'), size('medium', 'Medium 10"', 150), size('large', 'Large 12"', 300)],
  momos: [size('6pc', '6 pieces'), size('10pc', '10 pieces', 70)],
  side: [size('regular', 'Regular'), size('large', 'Large', 50)],
  plate: [size('half', 'Half'), size('full', 'Full', 90)],
  pack: [size('2pc', '2 pieces'), size('4pc', '4 pieces', 70)],
  scoop: [size('single', 'Single scoop'), size('double', 'Double scoop', 60)],
};

const OPTIONS = {
  spice: {
    key: 'spice',
    label: 'Spice level',
    type: 'single',
    required: true,
    choices: [choice('mild', 'Mild'), choice('medium', 'Medium'), choice('hot', 'Hot')],
  },
  burgerAddons: {
    key: 'addons',
    label: 'Add-ons',
    type: 'multi',
    maxChoices: 3,
    choices: [choice('cheese', 'Extra cheese slice', 30), choice('jalapeno', 'Jalapeños', 20), choice('onion', 'Caramelised onion', 25)],
  },
  crust: {
    key: 'crust',
    label: 'Crust',
    type: 'single',
    required: true,
    choices: [choice('classic', 'Classic hand-tossed'), choice('thin', 'Thin crust'), choice('cheese-burst', 'Cheese burst', 80)],
  },
  pizzaExtras: {
    key: 'extras',
    label: 'Extra toppings',
    type: 'multi',
    maxChoices: 4,
    choices: [
      choice('cheese', 'Extra cheese', 60),
      choice('olives', 'Black olives', 40),
      choice('jalapeno', 'Jalapeños', 30),
      choice('mushroom', 'Mushrooms', 40),
      choice('capsicum', 'Capsicum', 30),
    ],
  },
  pastaShape: {
    key: 'pasta',
    label: 'Pasta',
    type: 'single',
    required: true,
    choices: [choice('penne', 'Penne'), choice('spaghetti', 'Spaghetti'), choice('fusilli', 'Fusilli')],
  },
  milk: {
    key: 'milk',
    label: 'Milk',
    type: 'single',
    required: true,
    choices: [choice('regular', 'Regular milk'), choice('oat', 'Oat milk', 40), choice('almond', 'Almond milk', 40)],
  },
  coffeeExtras: {
    key: 'extras',
    label: 'Extras',
    type: 'multi',
    maxChoices: 3,
    choices: [choice('shot', 'Extra shot', 40), choice('vanilla', 'Vanilla syrup', 30), choice('hazelnut', 'Hazelnut syrup', 30), choice('caramel', 'Caramel syrup', 30)],
  },
  sugar: {
    key: 'sugar',
    label: 'Sweetness',
    type: 'single',
    required: true,
    choices: [choice('regular', 'Regular'), choice('less', 'Less sugar'), choice('none', 'No sugar')],
  },
  dips: {
    key: 'dips',
    label: 'Dips',
    type: 'multi',
    maxChoices: 2,
    choices: [choice('cheese', 'Cheese dip', 30), choice('mayo', 'Garlic mayo', 20), choice('salsa', 'Salsa', 20)],
  },
  bread: {
    key: 'bread',
    label: 'Bread',
    type: 'single',
    required: true,
    choices: [choice('white', 'White'), choice('brown', 'Brown', 10), choice('multigrain', 'Multigrain', 15)],
  },
  iceCream: {
    key: 'flavour',
    label: 'Flavour',
    type: 'single',
    required: true,
    choices: [choice('vanilla', 'Vanilla'), choice('chocolate', 'Chocolate'), choice('strawberry', 'Strawberry'), choice('butterscotch', 'Butterscotch')],
  },
  bread2: {
    key: 'bread',
    label: 'Bread',
    type: 'single',
    required: true,
    choices: [choice('butter-roti', 'Butter roti (2)'), choice('tandoori-roti', 'Tandoori roti (2)'), choice('naan', 'Plain naan', 10), choice('butter-naan', 'Butter naan', 20)],
  },
};

// ---------- Product helper ----------

function item(name, categories, price, isVeg, model, extra = {}) {
  return { name, categories, basePrice: price, isVeg, model, ...extra };
}
const m = (key, params = {}) => ({ kind: 'procedural', key, params });

export const products = [
  // ===== A. Burgers =====
  item('Classic Burger', ['burgers'], 189, false, m('burger', { patty: 'chicken' }), {
    description: 'Grilled chicken patty, lettuce, tomato, onion and house sauce in a toasted sesame bun.',
    ingredients: ['Sesame bun', 'Chicken patty', 'Lettuce', 'Tomato', 'Onion', 'House sauce'],
    options: [OPTIONS.burgerAddons],
    tags: ['grill', 'classic'],
  }),
  item('Cheese Burger', ['burgers'], 219, false, m('burger', { patty: 'chicken', cheese: true }), {
    description: 'Our classic chicken burger with a double layer of melted cheddar.',
    ingredients: ['Sesame bun', 'Chicken patty', 'Cheddar', 'Lettuce', 'Tomato', 'Pickles'],
    options: [OPTIONS.burgerAddons],
    tags: ['cheese'],
  }),
  item('Veg Burger', ['burgers'], 149, true, m('burger', { patty: 'veg' }), {
    description: 'Crisp mixed-vegetable patty with lettuce, tomato and mint mayo.',
    ingredients: ['Sesame bun', 'Vegetable patty', 'Lettuce', 'Tomato', 'Onion', 'Mint mayo'],
    options: [OPTIONS.burgerAddons],
  }),
  item('Paneer Burger', ['burgers'], 199, true, m('burger', { patty: 'paneer', cheese: true }), {
    description: 'Tandoori-spiced paneer slab, onion, lettuce and tikka mayo.',
    ingredients: ['Sesame bun', 'Paneer tikka slab', 'Cheese', 'Lettuce', 'Onion', 'Tikka mayo'],
    options: [OPTIONS.burgerAddons],
    tags: ['paneer'],
  }),
  item('Crispy Chicken Burger', ['burgers'], 229, false, m('burger', { patty: 'crispy' }), {
    description: 'Buttermilk-style fried chicken fillet, slaw and spicy mayo.',
    ingredients: ['Sesame bun', 'Fried chicken fillet', 'Coleslaw', 'Lettuce', 'Spicy mayo'],
    options: [OPTIONS.burgerAddons],
    tags: ['crispy', 'spicy'],
  }),
  item('Double Patty Burger', ['burgers'], 279, false, m('burger', { patty: 'chicken', cheese: true, double: true }), {
    description: 'Two grilled chicken patties, two cheese slices, the works.',
    ingredients: ['Sesame bun', 'Two chicken patties', 'Cheddar', 'Lettuce', 'Tomato', 'Onion'],
    options: [OPTIONS.burgerAddons],
    isFeatured: true,
  }),
  item('Gourmet Burger', ['burgers'], 299, true, m('burger', { patty: 'veg', cheese: true, gourmet: true }), {
    description: 'Signature mushroom-and-bean patty, smoked cheese, caramelised onion and rocket in a brioche-style bun.',
    ingredients: ['Brioche-style bun', 'Mushroom & bean patty', 'Smoked cheese', 'Caramelised onion', 'Rocket', 'Tomato'],
    options: [OPTIONS.burgerAddons],
    isSignature: true,
    isFeatured: true,
    tags: ['signature'],
  }),

  // ===== B. Pizza =====
  item('Margherita Pizza', ['pizza'], 249, true, m('pizza', { toppings: ['basil'] }), {
    description: 'Tomato sauce, mozzarella and fresh basil on a stone-baked base.',
    ingredients: ['Pizza base', 'Tomato sauce', 'Mozzarella', 'Basil'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
    tags: ['classic'],
  }),
  item('Farmhouse Pizza', ['pizza'], 329, true, m('pizza', { toppings: ['capsicum', 'onion', 'tomato', 'mushroom'] }), {
    description: 'Capsicum, onion, tomato and mushroom over mozzarella.',
    ingredients: ['Pizza base', 'Tomato sauce', 'Mozzarella', 'Capsicum', 'Onion', 'Tomato', 'Mushroom'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
  }),
  item('Corn and Cheese Pizza', ['pizza'], 289, true, m('pizza', { toppings: ['corn'] }), {
    description: 'Sweet corn and a generous blanket of mozzarella.',
    ingredients: ['Pizza base', 'Tomato sauce', 'Mozzarella', 'Sweet corn'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
  }),
  item('Paneer Tikka Pizza', ['pizza'], 349, true, m('pizza', { toppings: ['paneer', 'capsicum', 'onion'] }), {
    description: 'Tikka-marinated paneer, capsicum and onion with a smoky sauce.',
    ingredients: ['Pizza base', 'Tikka sauce', 'Mozzarella', 'Paneer tikka', 'Capsicum', 'Onion'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
    isFeatured: true,
  }),
  item('Pepperoni Pizza', ['pizza'], 379, false, m('pizza', { toppings: ['pepperoni'] }), {
    description: 'Chicken pepperoni over mozzarella and tomato sauce.',
    ingredients: ['Pizza base', 'Tomato sauce', 'Mozzarella', 'Chicken pepperoni'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
  }),
  item('Four Cheese Pizza', ['pizza'], 399, true, m('pizza', { toppings: [], cheese: 'four' }), {
    description: 'Mozzarella, cheddar, parmesan-style and a blue-veined cheese.',
    ingredients: ['Pizza base', 'White sauce', 'Mozzarella', 'Cheddar', 'Parmesan-style cheese', 'Blue cheese'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
  }),
  item('Signature Special Pizza', ['pizza'], 429, true, m('pizza', { toppings: ['paneer', 'olive', 'capsicum', 'corn', 'mushroom', 'basil'] }), {
    description: "The chef's loaded special: paneer, olives, peppers, corn and mushrooms.",
    ingredients: ['Pizza base', 'Tomato sauce', 'Mozzarella', 'Paneer', 'Olives', 'Capsicum', 'Corn', 'Mushroom', 'Basil'],
    sizes: SIZES.pizza,
    options: [OPTIONS.crust, OPTIONS.pizzaExtras],
    isSignature: true,
    isFeatured: true,
    tags: ['signature'],
  }),

  // ===== C. Italian =====
  item('Alfredo Pasta', ['italian'], 279, true, m('pasta', { sauce: 'alfredo', shape: 'penne' }), {
    description: 'Creamy parmesan-style white sauce with herbs.',
    ingredients: ['Pasta', 'Cream', 'Butter', 'Parmesan-style cheese', 'Garlic', 'Parsley'],
    options: [OPTIONS.pastaShape],
  }),
  item('Arrabbiata Pasta', ['italian'], 259, true, m('pasta', { sauce: 'arrabbiata', shape: 'penne' }), {
    description: 'Spicy tomato and garlic sauce with chilli flakes.',
    ingredients: ['Pasta', 'Tomato', 'Garlic', 'Chilli flakes', 'Olive oil', 'Basil'],
    options: [OPTIONS.pastaShape],
    tags: ['spicy'],
  }),
  item('Pesto Pasta', ['italian'], 299, true, m('pasta', { sauce: 'pesto', shape: 'spaghetti' }), {
    description: 'Basil pesto, cherry tomatoes and toasted seeds.',
    ingredients: ['Pasta', 'Basil pesto', 'Cherry tomato', 'Parmesan-style cheese', 'Seeds'],
    options: [OPTIONS.pastaShape],
  }),
  item('Mac and Cheese', ['italian'], 269, true, m('pasta', { sauce: 'cheese', shape: 'elbow' }), {
    description: 'Elbow macaroni baked in a three-cheese sauce.',
    ingredients: ['Macaroni', 'Cheddar', 'Mozzarella', 'Milk', 'Breadcrumbs'],
  }),
  item('Lasagna', ['italian'], 349, true, m('lasagna'), {
    description: 'Layered pasta sheets, vegetable ragù, béchamel and baked cheese.',
    ingredients: ['Pasta sheets', 'Vegetable ragù', 'Béchamel', 'Mozzarella'],
    isSignature: true,
  }),
  item('Risotto', ['italian'], 329, true, m('risotto'), {
    description: 'Slow-stirred creamy rice with mushrooms and herbs.',
    ingredients: ['Arborio-style rice', 'Mushroom', 'Butter', 'Parmesan-style cheese', 'Herbs'],
  }),
  item('Garlic Bread', ['italian', 'snacks-sides', 'bakery'], 129, true, m('garlicBread'), {
    description: 'Toasted baguette with garlic butter and herbs.',
    ingredients: ['Baguette', 'Garlic butter', 'Herbs'],
    options: [{ key: 'cheese', label: 'Cheese', type: 'single', required: true, choices: [choice('plain', 'Plain'), choice('cheese', 'With cheese', 40)] }],
  }),
  item('Bruschetta', ['italian'], 179, true, m('bruschetta'), {
    description: 'Crisp toasts topped with tomato, basil and olive oil.',
    ingredients: ['Toasted bread', 'Tomato', 'Basil', 'Olive oil', 'Garlic'],
  }),

  // ===== D. Chinese =====
  item('Hakka Noodles', ['chinese'], 199, true, m('noodles', { style: 'hakka' }), {
    description: 'Wok-tossed noodles with cabbage, carrot and spring onion.',
    ingredients: ['Noodles', 'Cabbage', 'Carrot', 'Capsicum', 'Spring onion', 'Soy sauce'],
    options: [OPTIONS.spice],
  }),
  item('Fried Rice', ['chinese'], 189, true, m('friedRice'), {
    description: 'Smoky wok-fried rice with vegetables.',
    ingredients: ['Rice', 'Carrot', 'Beans', 'Spring onion', 'Soy sauce'],
    options: [OPTIONS.spice],
  }),
  item('Manchurian', ['chinese'], 209, true, m('manchurian'), {
    description: 'Vegetable dumplings in a glossy soy-garlic gravy.',
    ingredients: ['Vegetable balls', 'Garlic', 'Soy sauce', 'Spring onion'],
    sizes: [size('dry', 'Dry'), size('gravy', 'Gravy', 20)],
    options: [OPTIONS.spice],
  }),
  item('Chilli Paneer', ['chinese'], 249, true, m('chilliPaneer'), {
    description: 'Crisp paneer tossed with peppers, onion and chilli sauce.',
    ingredients: ['Paneer', 'Capsicum', 'Onion', 'Chilli sauce', 'Soy sauce'],
    options: [OPTIONS.spice],
    isFeatured: true,
  }),
  item('Spring Rolls', ['chinese'], 169, true, m('springRolls'), {
    description: 'Crispy rolls filled with stir-fried vegetables.',
    ingredients: ['Spring roll sheets', 'Cabbage', 'Carrot', 'Noodles', 'Sweet chilli dip'],
  }),
  item('Crispy Vegetables', ['chinese'], 199, true, m('crispyVeg'), {
    description: 'Batter-fried vegetables tossed in honey-chilli glaze.',
    ingredients: ['Baby corn', 'Capsicum', 'Carrot', 'Sesame', 'Honey-chilli glaze'],
    options: [OPTIONS.spice],
  }),
  item('Stir-Fried Noodles', ['chinese'], 219, true, m('noodles', { style: 'stirfry' }), {
    description: 'Thick noodles stir-fried with mushrooms, bok choy and chilli oil.',
    ingredients: ['Thick noodles', 'Mushroom', 'Bok choy', 'Chilli oil', 'Sesame'],
    options: [OPTIONS.spice],
  }),

  // ===== E. Momos =====
  item('Steamed Momos', ['momos'], 129, true, m('momos', { style: 'steamed' }), {
    description: 'Soft dumplings with a mixed-vegetable filling, served with red chutney.',
    ingredients: ['Dumpling wrapper', 'Cabbage', 'Carrot', 'Onion', 'Momo chutney'],
    sizes: SIZES.momos,
  }),
  item('Fried Momos', ['momos'], 149, true, m('momos', { style: 'fried' }), {
    description: 'Our vegetable momos fried until golden and crunchy.',
    ingredients: ['Dumpling wrapper', 'Mixed vegetables', 'Momo chutney'],
    sizes: SIZES.momos,
  }),
  item('Tandoori Momos', ['momos'], 179, true, m('momos', { style: 'tandoori' }), {
    description: 'Momos marinated in tandoori masala and charred in the oven.',
    ingredients: ['Dumpling wrapper', 'Mixed vegetables', 'Tandoori marinade', 'Mint chutney'],
    sizes: SIZES.momos,
    isSignature: true,
  }),
  item('Paneer Momos', ['momos'], 159, true, m('momos', { style: 'steamed', filling: 'paneer' }), {
    description: 'Steamed momos filled with spiced paneer.',
    ingredients: ['Dumpling wrapper', 'Paneer', 'Onion', 'Coriander', 'Momo chutney'],
    sizes: SIZES.momos,
  }),
  item('Chicken Momos', ['momos'], 169, false, m('momos', { style: 'steamed', filling: 'chicken' }), {
    description: 'Juicy minced chicken momos with garlic and ginger.',
    ingredients: ['Dumpling wrapper', 'Chicken mince', 'Ginger', 'Garlic', 'Momo chutney'],
    sizes: SIZES.momos,
  }),
  item('Spicy Schezwan Momos', ['momos'], 169, true, m('momos', { style: 'schezwan' }), {
    description: 'Fried momos tossed in fiery schezwan sauce.',
    ingredients: ['Dumpling wrapper', 'Mixed vegetables', 'Schezwan sauce', 'Spring onion'],
    sizes: SIZES.momos,
    tags: ['spicy'],
  }),

  // ===== F. Indian =====
  item('Chole Kulche', ['indian'], 149, true, m('cholePlate', { bread: 'kulcha' }), {
    description: 'Spiced chickpea curry with soft buttered kulchas.',
    ingredients: ['Chickpeas', 'Onion', 'Tomato', 'Spices', 'Kulcha'],
    tags: ['street food'],
  }),
  item('Pav Bhaji', ['indian'], 159, true, m('pavBhaji'), {
    description: 'Buttery mashed-vegetable bhaji with toasted pav.',
    ingredients: ['Mixed vegetables', 'Butter', 'Pav bhaji masala', 'Pav', 'Onion', 'Lemon'],
    tags: ['street food'],
    isFeatured: true,
  }),
  item('Masala Dosa', ['indian'], 169, true, m('dosa'), {
    description: 'Crisp rice-lentil crêpe with potato masala, sambar and chutney.',
    ingredients: ['Dosa batter', 'Potato masala', 'Sambar', 'Coconut chutney'],
  }),
  item('Paneer Tikka', ['indian'], 279, true, m('tikka', { protein: 'paneer' }), {
    description: 'Chargrilled paneer, peppers and onion in tandoori marinade.',
    ingredients: ['Paneer', 'Capsicum', 'Onion', 'Yoghurt marinade', 'Mint chutney'],
    sizes: SIZES.plate,
  }),
  item('Chole Bhature', ['indian'], 179, true, m('cholePlate', { bread: 'bhatura' }), {
    description: 'Puffed fried bhaturas with chickpea curry, pickle and onion.',
    ingredients: ['Bhatura', 'Chickpeas', 'Onion', 'Pickle', 'Spices'],
    isSignature: true,
  }),
  item('Rajma Rice', ['indian'], 189, true, m('curryBowl', { gravy: 'rajma', withRice: true }), {
    description: 'Slow-cooked kidney beans with steamed rice.',
    ingredients: ['Kidney beans', 'Tomato', 'Onion', 'Spices', 'Steamed rice'],
  }),
  item('Dal Makhani', ['indian', 'main-course'], 229, true, m('curryBowl', { gravy: 'dal' }), {
    description: 'Black lentils simmered overnight with butter and cream.',
    ingredients: ['Black lentils', 'Kidney beans', 'Butter', 'Cream', 'Spices'],
  }),
  item('Paneer Butter Masala', ['indian'], 279, true, m('curryBowl', { gravy: 'paneer' }), {
    description: 'Paneer in a silky tomato, butter and cashew gravy.',
    ingredients: ['Paneer', 'Tomato', 'Butter', 'Cashew', 'Cream', 'Spices'],
    isFeatured: true,
  }),
  item('Vegetable Biryani', ['indian', 'main-course'], 249, true, m('biryani', { meat: false }), {
    description: 'Fragrant basmati layered with vegetables, saffron and fried onions.',
    ingredients: ['Basmati rice', 'Mixed vegetables', 'Saffron', 'Fried onion', 'Mint', 'Raita'],
  }),
  item('Chicken Biryani', ['indian', 'main-course'], 299, false, m('biryani', { meat: true }), {
    description: 'Dum-cooked basmati with marinated chicken and whole spices.',
    ingredients: ['Basmati rice', 'Chicken', 'Yoghurt', 'Saffron', 'Fried onion', 'Raita'],
    isSignature: true,
    isFeatured: true,
  }),
  item('Indian Thali', ['indian', 'main-course'], 349, true, m('thali'), {
    description: 'A complete meal: dal, paneer curry, seasonal vegetable, rice, roti, raita and a sweet.',
    ingredients: ['Dal', 'Paneer curry', 'Seasonal vegetable', 'Rice', 'Roti', 'Raita', 'Sweet'],
    isSignature: true,
  }),
  item('Roti and Curry Combo', ['indian'], 219, true, m('rotiCurry'), {
    description: 'Pick a bread and a curry for a quick, complete meal.',
    ingredients: ['Roti or naan', 'Curry of your choice', 'Salad'],
    options: [
      OPTIONS.bread2,
      {
        key: 'curry',
        label: 'Curry',
        type: 'single',
        required: true,
        choices: [choice('dal-tadka', 'Dal tadka'), choice('mix-veg', 'Mixed vegetable'), choice('paneer-masala', 'Paneer butter masala', 40)],
      },
    ],
  }),

  // ===== G. Sandwiches =====
  item('Grilled Cheese Sandwich', ['sandwiches'], 149, true, m('sandwich', { filling: 'cheese', grilled: true }), {
    description: 'Golden pressed sandwich with a molten cheese centre.',
    ingredients: ['Bread', 'Cheddar', 'Mozzarella', 'Butter'],
    options: [OPTIONS.bread],
  }),
  item('Club Sandwich', ['sandwiches'], 229, false, m('sandwich', { filling: 'club' }), {
    description: 'Triple-decker with chicken, cheese, lettuce, tomato and mayo.',
    ingredients: ['Bread', 'Chicken', 'Cheese', 'Lettuce', 'Tomato', 'Mayo'],
    options: [OPTIONS.bread],
  }),
  item('Paneer Tikka Sandwich', ['sandwiches'], 189, true, m('sandwich', { filling: 'paneer', grilled: true }), {
    description: 'Tikka paneer, onion and mint chutney, grilled.',
    ingredients: ['Bread', 'Paneer tikka', 'Onion', 'Mint chutney', 'Cheese'],
    options: [OPTIONS.bread],
  }),
  item('Vegetable Sandwich', ['sandwiches'], 129, true, m('sandwich', { filling: 'veg' }), {
    description: 'Cucumber, tomato, onion and potato with green chutney.',
    ingredients: ['Bread', 'Cucumber', 'Tomato', 'Onion', 'Potato', 'Green chutney'],
    options: [OPTIONS.bread],
  }),
  item('Chicken Sandwich', ['sandwiches'], 199, false, m('sandwich', { filling: 'chicken', grilled: true }), {
    description: 'Pulled chicken tossed in herb mayo, lettuce and onion.',
    ingredients: ['Bread', 'Chicken', 'Herb mayo', 'Lettuce', 'Onion'],
    options: [OPTIONS.bread],
  }),
  item('Corn and Cheese Sandwich', ['sandwiches'], 159, true, m('sandwich', { filling: 'corn', grilled: true }), {
    description: 'Sweet corn and cheese, toasted until crisp.',
    ingredients: ['Bread', 'Sweet corn', 'Cheese', 'Butter'],
    options: [OPTIONS.bread],
  }),

  // ===== H. Wraps & Rolls =====
  item('Paneer Wrap', ['wraps-rolls'], 189, true, m('wrap', { style: 'wrap', filling: 'paneer' }), {
    description: 'Tikka paneer, onion and mint mayo rolled in a soft tortilla.',
    ingredients: ['Tortilla', 'Paneer tikka', 'Onion', 'Lettuce', 'Mint mayo'],
  }),
  item('Vegetable Wrap', ['wraps-rolls'], 159, true, m('wrap', { style: 'wrap', filling: 'veg' }), {
    description: 'Grilled vegetables, hummus and greens.',
    ingredients: ['Tortilla', 'Grilled vegetables', 'Hummus', 'Lettuce'],
  }),
  item('Chicken Wrap', ['wraps-rolls'], 209, false, m('wrap', { style: 'wrap', filling: 'chicken' }), {
    description: 'Grilled chicken strips, slaw and smoky sauce.',
    ingredients: ['Tortilla', 'Grilled chicken', 'Coleslaw', 'Smoky sauce'],
  }),
  item('Mexican Burrito', ['wraps-rolls'], 249, true, m('wrap', { style: 'burrito', filling: 'beans' }), {
    description: 'Rice, beans, corn, salsa and cheese in a big folded tortilla.',
    ingredients: ['Tortilla', 'Mexican rice', 'Beans', 'Corn', 'Salsa', 'Cheese', 'Sour cream'],
  }),
  item('Kathi Roll', ['wraps-rolls'], 199, false, m('wrap', { style: 'kathi', filling: 'chicken' }), {
    description: 'Flaky paratha rolled around chicken tikka, onion and green chutney.',
    ingredients: ['Paratha', 'Chicken tikka', 'Onion', 'Green chutney', 'Lemon'],
  }),
  item('Loaded Wrap', ['wraps-rolls'], 239, true, m('wrap', { style: 'loaded', filling: 'paneer' }), {
    description: 'Overstuffed wrap: choose your filling, then we add cheese, fries and sauces.',
    ingredients: ['Tortilla', 'Filling of your choice', 'Cheese', 'Fries', 'Sauces'],
    options: [
      {
        key: 'filling',
        label: 'Filling',
        type: 'single',
        required: true,
        choices: [choice('paneer', 'Paneer tikka'), choice('falafel', 'Falafel'), choice('veg', 'Grilled vegetables')],
      },
    ],
  }),

  // ===== I. Snacks & Sides =====
  item('French Fries', ['snacks-sides'], 109, true, m('fries', { style: 'plain' }), {
    description: 'Crisp salted fries.',
    ingredients: ['Potato', 'Salt'],
    sizes: SIZES.side,
    options: [OPTIONS.dips],
  }),
  item('Peri-Peri Fries', ['snacks-sides'], 129, true, m('fries', { style: 'peri' }), {
    description: 'Fries dusted with tangy peri-peri seasoning.',
    ingredients: ['Potato', 'Peri-peri seasoning'],
    sizes: SIZES.side,
    options: [OPTIONS.dips],
    tags: ['spicy'],
  }),
  item('Loaded Fries', ['snacks-sides'], 179, true, m('fries', { style: 'loaded' }), {
    description: 'Fries smothered in cheese sauce, jalapeños and spring onion.',
    ingredients: ['Potato', 'Cheese sauce', 'Jalapeños', 'Spring onion'],
    sizes: SIZES.side,
  }),
  item('Nachos', ['snacks-sides'], 169, true, m('nachos'), {
    description: 'Corn chips with cheese sauce, salsa and jalapeños.',
    ingredients: ['Corn chips', 'Cheese sauce', 'Salsa', 'Jalapeños', 'Sour cream'],
  }),
  item('Onion Rings', ['snacks-sides'], 129, true, m('onionRings'), {
    description: 'Thick-cut battered onion rings.',
    ingredients: ['Onion', 'Batter', 'Breadcrumbs'],
    options: [OPTIONS.dips],
  }),
  item('Chicken Nuggets', ['snacks-sides'], 169, false, m('nuggets'), {
    description: 'Crumbed chicken bites with a dip.',
    ingredients: ['Chicken', 'Breadcrumbs', 'Spices'],
    sizes: [size('6pc', '6 pieces'), size('9pc', '9 pieces', 60)],
    options: [OPTIONS.dips],
  }),
  item('Cheese Balls', ['snacks-sides'], 149, true, m('cheeseBalls'), {
    description: 'Crisp outside, molten cheese inside.',
    ingredients: ['Cheese', 'Potato', 'Breadcrumbs', 'Herbs'],
  }),

  // ===== J. Main Course =====
  item('Vegetable Curry', ['main-course'], 219, true, m('curryBowl', { gravy: 'veg' }), {
    description: 'Seasonal vegetables in a home-style onion-tomato gravy.',
    ingredients: ['Seasonal vegetables', 'Onion', 'Tomato', 'Spices'],
    options: [OPTIONS.spice],
  }),
  item('Paneer Curry', ['main-course'], 259, true, m('curryBowl', { gravy: 'paneer' }), {
    description: 'Soft paneer cubes in a rich, mildly spiced curry.',
    ingredients: ['Paneer', 'Onion', 'Tomato', 'Cream', 'Spices'],
    options: [OPTIONS.spice],
  }),
  item('Rice Bowl', ['main-course'], 229, true, m('riceBowl'), {
    description: 'Steamed rice topped with a curry or stir-fry of your choice.',
    ingredients: ['Steamed rice', 'Topping of your choice', 'Salad'],
    options: [
      {
        key: 'topping',
        label: 'Topping',
        type: 'single',
        required: true,
        choices: [choice('rajma', 'Rajma'), choice('chole', 'Chole'), choice('chilli-paneer', 'Chilli paneer', 30), choice('paneer-makhani', 'Paneer makhani', 30)],
      },
    ],
  }),
  item('Grilled Chicken', ['main-course'], 349, false, m('grilledChicken'), {
    description: 'Herb-marinated grilled chicken with sautéed vegetables and mash.',
    ingredients: ['Chicken', 'Herb marinade', 'Sautéed vegetables', 'Mashed potato'],
  }),
  item('Pasta Bowl', ['main-course'], 279, true, m('pasta', { sauce: 'arrabbiata', shape: 'penne', bowl: true }), {
    description: 'A hearty bowl of pasta in your choice of sauce with garlic bread.',
    ingredients: ['Pasta', 'Sauce of your choice', 'Garlic bread'],
    options: [
      {
        key: 'sauce',
        label: 'Sauce',
        type: 'single',
        required: true,
        choices: [choice('arrabbiata', 'Arrabbiata'), choice('alfredo', 'Alfredo'), choice('pink', 'Pink sauce'), choice('pesto', 'Pesto', 20)],
      },
    ],
  }),
  item('Signature Meal Combo', ['main-course'], 349, true, m('combo'), {
    description: 'A main, a side and a drink. Pick your favourite pairing.',
    ingredients: ['Main', 'Side', 'Drink'],
    isSignature: true,
    options: [
      {
        key: 'main',
        label: 'Main',
        type: 'single',
        required: true,
        choices: [choice('veg-burger', 'Veg burger'), choice('paneer-burger', 'Paneer burger', 40), choice('paneer-wrap', 'Paneer wrap', 30)],
      },
      {
        key: 'side',
        label: 'Side',
        type: 'single',
        required: true,
        choices: [choice('fries', 'French fries'), choice('peri-fries', 'Peri-peri fries', 20), choice('onion-rings', 'Onion rings', 20)],
      },
      {
        key: 'drink',
        label: 'Drink',
        type: 'single',
        required: true,
        choices: [choice('iced-tea', 'Lemon iced tea'), choice('cold-coffee', 'Cold coffee', 30), choice('mojito', 'Virgin mojito', 30)],
      },
    ],
  }),

  // ===== K. Bakery =====
  item('Butter Croissant', ['bakery'], 119, true, m('croissant'), {
    description: 'Flaky, laminated and deeply buttery.',
    ingredients: ['Flour', 'Butter', 'Milk', 'Yeast'],
    isFeatured: true,
  }),
  item('Chocolate Muffin', ['bakery'], 109, true, m('muffin', { flavor: 'chocolate' }), {
    description: 'Moist cocoa muffin studded with chocolate chips.',
    ingredients: ['Flour', 'Cocoa', 'Chocolate chips', 'Butter', 'Sugar'],
  }),
  item('Blueberry Muffin', ['bakery'], 119, true, m('muffin', { flavor: 'blueberry' }), {
    description: 'Vanilla muffin bursting with blueberries.',
    ingredients: ['Flour', 'Blueberries', 'Butter', 'Sugar', 'Vanilla'],
  }),
  item('Cookies', ['bakery'], 79, true, m('cookies'), {
    description: 'Chewy chocolate-chip cookies.',
    ingredients: ['Flour', 'Butter', 'Brown sugar', 'Chocolate chips'],
    sizes: SIZES.pack,
  }),
  item('Cinnamon Roll', ['bakery'], 139, true, m('cinnamonRoll'), {
    description: 'Soft swirl of cinnamon sugar with cream cheese icing.',
    ingredients: ['Dough', 'Cinnamon', 'Brown sugar', 'Cream cheese icing'],
    isSignature: true,
  }),
  item('Donut', ['bakery'], 99, true, m('donut', { glaze: 'chocolate' }), {
    description: 'Pillowy ring donut with your choice of glaze.',
    ingredients: ['Dough', 'Glaze', 'Sprinkles'],
    options: [
      {
        key: 'glaze',
        label: 'Glaze',
        type: 'single',
        required: true,
        choices: [choice('chocolate', 'Chocolate'), choice('strawberry', 'Strawberry'), choice('sugar', 'Classic sugar')],
      },
    ],
  }),
  item('Freshly Baked Pastry', ['bakery'], 129, true, m('pastry', { flavor: 'chocolate' }), {
    description: "Today's cream pastry. Pick a flavour.",
    ingredients: ['Sponge', 'Cream', 'Flavour of your choice'],
    options: [
      {
        key: 'flavour',
        label: 'Flavour',
        type: 'single',
        required: true,
        choices: [choice('chocolate', 'Chocolate truffle'), choice('pineapple', 'Pineapple'), choice('red-velvet', 'Red velvet', 20)],
      },
    ],
  }),

  // ===== L. Desserts =====
  item('Chocolate Brownie', ['desserts'], 139, true, m('brownie'), {
    description: 'Fudgy dark-chocolate brownie.',
    ingredients: ['Dark chocolate', 'Butter', 'Sugar', 'Flour', 'Walnuts'],
    options: [{ key: 'serve', label: 'Serve with', type: 'single', required: true, choices: [choice('plain', 'As it is'), choice('ice-cream', 'Vanilla ice cream', 60)] }],
  }),
  item('Cheesecake', ['desserts'], 219, true, m('cheesecake'), {
    description: 'Baked vanilla cheesecake on a biscuit base with berry compote.',
    ingredients: ['Cream cheese', 'Biscuit base', 'Vanilla', 'Berry compote'],
    isFeatured: true,
  }),
  item('Tiramisu', ['desserts'], 239, true, m('tiramisu'), {
    description: 'Coffee-soaked sponge layered with mascarpone-style cream and cocoa.',
    ingredients: ['Sponge fingers', 'Espresso', 'Mascarpone-style cream', 'Cocoa'],
    isSignature: true,
  }),
  item('Chocolate Lava Cake', ['desserts'], 189, true, m('lavaCake'), {
    description: 'Warm chocolate cake with a molten centre.',
    ingredients: ['Dark chocolate', 'Butter', 'Sugar', 'Flour'],
    isFeatured: true,
  }),
  item('Waffles', ['desserts'], 199, true, m('waffle'), {
    description: 'Crisp Belgian-style waffle with your choice of topping.',
    ingredients: ['Waffle batter', 'Topping of your choice'],
    options: [
      {
        key: 'topping',
        label: 'Topping',
        type: 'single',
        required: true,
        choices: [choice('maple', 'Maple-style syrup'), choice('nutella', 'Chocolate hazelnut spread', 40), choice('berries', 'Berries & cream', 50)],
      },
    ],
  }),
  item('Pancakes', ['desserts'], 189, true, m('pancakes'), {
    description: 'Fluffy stack with butter and syrup.',
    ingredients: ['Pancake batter', 'Butter', 'Syrup', 'Berries'],
  }),
  item('Chocolate Pastry', ['desserts'], 129, true, m('pastry', { flavor: 'chocolate' }), {
    description: 'Layers of chocolate sponge and ganache.',
    ingredients: ['Chocolate sponge', 'Ganache', 'Cream'],
  }),
  item('Fruit Dessert', ['desserts'], 169, true, m('fruitBowl'), {
    description: 'Seasonal fresh fruit with cream or ice cream.',
    ingredients: ['Seasonal fruit', 'Cream or ice cream'],
    options: [{ key: 'serve', label: 'Serve with', type: 'single', required: true, choices: [choice('cream', 'Fresh cream'), choice('ice-cream', 'Vanilla ice cream', 30)] }],
  }),
  item('Ice Cream', ['desserts'], 99, true, m('iceCream'), {
    description: 'Classic scoops in a cup or cone.',
    ingredients: ['Ice cream'],
    sizes: SIZES.scoop,
    options: [OPTIONS.iceCream],
  }),
  item('Ice Cream Sundae', ['desserts'], 219, true, m('sundae'), {
    description: 'Three scoops, chocolate sauce, nuts, whipped cream and a cherry.',
    ingredients: ['Ice cream', 'Chocolate sauce', 'Nuts', 'Whipped cream', 'Cherry'],
    isSignature: true,
  }),

  // ===== M. Coffee & Hot Beverages =====
  item('Espresso', ['coffee-hot'], 99, true, m('coffeeCup', { drink: 'espresso' }), {
    description: 'A short, intense shot with golden crema.',
    ingredients: ['Espresso'],
    sizes: [size('single', 'Single shot'), size('double', 'Double shot', 40)],
  }),
  item('Americano', ['coffee-hot'], 129, true, m('coffeeCup', { drink: 'americano' }), {
    description: 'Espresso lengthened with hot water.',
    ingredients: ['Espresso', 'Hot water'],
    sizes: SIZES.hot,
    options: [OPTIONS.coffeeExtras],
  }),
  item('Cappuccino', ['coffee-hot'], 159, true, m('coffeeCup', { drink: 'cappuccino' }), {
    description: 'Espresso with steamed milk and a deep layer of foam.',
    ingredients: ['Espresso', 'Steamed milk', 'Milk foam', 'Cocoa dust'],
    sizes: SIZES.hot,
    options: [OPTIONS.milk, OPTIONS.coffeeExtras],
    isFeatured: true,
  }),
  item('Cafe Latte', ['coffee-hot'], 169, true, m('coffeeCup', { drink: 'latte' }), {
    description: 'Silky steamed milk over espresso, finished with latte art.',
    ingredients: ['Espresso', 'Steamed milk', 'Microfoam'],
    sizes: SIZES.hot,
    options: [OPTIONS.milk, OPTIONS.coffeeExtras],
    isSignature: true,
    isFeatured: true,
  }),
  item('Mocha', ['coffee-hot'], 189, true, m('coffeeCup', { drink: 'mocha' }), {
    description: 'Espresso, chocolate and steamed milk with whipped cream.',
    ingredients: ['Espresso', 'Chocolate sauce', 'Steamed milk', 'Whipped cream'],
    sizes: SIZES.hot,
    options: [OPTIONS.milk, OPTIONS.coffeeExtras],
  }),
  item('Flat White', ['coffee-hot'], 179, true, m('coffeeCup', { drink: 'flatwhite' }), {
    description: 'Double ristretto with a thin layer of velvety milk.',
    ingredients: ['Ristretto', 'Steamed milk'],
    sizes: [size('regular', 'Regular')],
    options: [OPTIONS.milk],
  }),
  item('Cold Coffee', ['coffee-hot', 'cold-beverages'], 169, true, m('coldDrink', { liquid: '#b07a4f', whipped: true, ice: true, garnish: 'none' }), {
    description: 'Blended chilled coffee with milk and ice.',
    ingredients: ['Coffee', 'Milk', 'Sugar', 'Ice', 'Whipped cream'],
    sizes: SIZES.drink,
    options: [OPTIONS.milk, OPTIONS.sugar],
  }),
  item('Hot Chocolate', ['coffee-hot'], 179, true, m('coffeeCup', { drink: 'hotchocolate' }), {
    description: 'Rich melted chocolate and steamed milk with marshmallows.',
    ingredients: ['Chocolate', 'Steamed milk', 'Marshmallows'],
    sizes: SIZES.hot,
    options: [OPTIONS.milk],
  }),
  item('Masala Chai', ['coffee-hot'], 79, true, m('chai'), {
    description: 'Tea brewed with milk, ginger, cardamom and spices, served in a kulhad.',
    ingredients: ['Tea leaves', 'Milk', 'Ginger', 'Cardamom', 'Spices'],
    sizes: [size('cutting', 'Cutting'), size('full', 'Full', 30)],
    options: [OPTIONS.sugar],
  }),
  item('Green Tea', ['coffee-hot'], 99, true, m('teaCup', { tea: 'green' }), {
    description: 'Light, grassy green tea.',
    ingredients: ['Green tea leaves', 'Hot water'],
    options: [{ key: 'add', label: 'Add', type: 'multi', choices: [choice('honey', 'Honey', 20), choice('lemon', 'Lemon', 10)] }],
  }),
  item('Herbal Tea', ['coffee-hot'], 119, true, m('teaCup', { tea: 'herbal' }), {
    description: 'Caffeine-free infusion. Choose a blend.',
    ingredients: ['Herbal blend', 'Hot water'],
    options: [
      {
        key: 'blend',
        label: 'Blend',
        type: 'single',
        required: true,
        choices: [choice('chamomile', 'Chamomile'), choice('peppermint', 'Peppermint'), choice('hibiscus', 'Hibiscus')],
      },
    ],
  }),

  // ===== N. Cold Beverages =====
  item('Iced Latte', ['cold-beverages'], 179, true, m('coldDrink', { liquid: '#c9a27e', ice: true, layered: true, garnish: 'none' }), {
    description: 'Espresso poured over cold milk and ice.',
    ingredients: ['Espresso', 'Cold milk', 'Ice'],
    sizes: SIZES.drink,
    options: [OPTIONS.milk, OPTIONS.coffeeExtras],
  }),
  item('Cold Brew', ['cold-beverages'], 189, true, m('coldDrink', { liquid: '#3b2214', ice: true, glass: 'tall', garnish: 'none' }), {
    description: 'Coffee steeped cold for hours: smooth and low in bitterness.',
    ingredients: ['Cold brew coffee', 'Ice'],
    sizes: SIZES.drink,
    isSignature: true,
  }),
  item('Iced Mocha', ['cold-beverages'], 199, true, m('coldDrink', { liquid: '#7a4a2e', ice: true, whipped: true, garnish: 'chocolate' }), {
    description: 'Chilled espresso, chocolate and milk with whipped cream.',
    ingredients: ['Espresso', 'Chocolate', 'Cold milk', 'Ice', 'Whipped cream'],
    sizes: SIZES.drink,
    options: [OPTIONS.milk],
  }),
  item('Chocolate Milkshake', ['cold-beverages'], 179, true, m('coldDrink', { liquid: '#6b3d24', whipped: true, glass: 'shake', garnish: 'chocolate' }), {
    description: 'Thick chocolate shake with whipped cream.',
    ingredients: ['Milk', 'Chocolate ice cream', 'Chocolate sauce', 'Whipped cream'],
    sizes: SIZES.drink,
  }),
  item('Vanilla Milkshake', ['cold-beverages'], 169, true, m('coldDrink', { liquid: '#f3e6c4', whipped: true, glass: 'shake', garnish: 'cherry' }), {
    description: 'Classic vanilla bean shake.',
    ingredients: ['Milk', 'Vanilla ice cream', 'Whipped cream'],
    sizes: SIZES.drink,
  }),
  item('Strawberry Milkshake', ['cold-beverages'], 179, true, m('coldDrink', { liquid: '#f2a1b3', whipped: true, glass: 'shake', garnish: 'berry' }), {
    description: 'Strawberry shake topped with cream.',
    ingredients: ['Milk', 'Strawberry', 'Ice cream', 'Whipped cream'],
    sizes: SIZES.drink,
  }),
  item('Oreo Shake', ['cold-beverages'], 199, true, m('coldDrink', { liquid: '#cfc6bd', whipped: true, glass: 'shake', garnish: 'cookie' }), {
    description: 'Cookies-and-cream shake blended with chocolate sandwich cookies.',
    ingredients: ['Milk', 'Vanilla ice cream', 'Chocolate sandwich cookies', 'Whipped cream'],
    sizes: SIZES.drink,
    isFeatured: true,
  }),
  item('Fresh Juice', ['cold-beverages'], 139, true, m('coldDrink', { liquid: '#f39c2b', glass: 'tall', garnish: 'orange' }), {
    description: 'Freshly pressed seasonal fruit juice.',
    ingredients: ['Fresh fruit'],
    sizes: SIZES.drink,
    options: [
      {
        key: 'fruit',
        label: 'Fruit',
        type: 'single',
        required: true,
        choices: [choice('orange', 'Orange'), choice('watermelon', 'Watermelon'), choice('pineapple', 'Pineapple'), choice('mixed', 'Mixed fruit', 20)],
      },
    ],
  }),
  item('Lemon Iced Tea', ['cold-beverages'], 129, true, m('coldDrink', { liquid: '#d98e2f', ice: true, glass: 'tall', garnish: 'lemon' }), {
    description: 'Brewed black tea, lemon and ice.',
    ingredients: ['Black tea', 'Lemon', 'Sugar', 'Ice'],
    sizes: SIZES.drink,
    options: [OPTIONS.sugar],
  }),
  item('Mocktail', ['cold-beverages'], 169, true, m('coldDrink', { liquid: '#7fd6c2', ice: true, glass: 'mason', garnish: 'mint' }), {
    description: 'Fizzy, fruity and alcohol-free. Pick a recipe.',
    ingredients: ['Soda', 'Fruit syrup', 'Mint', 'Lime', 'Ice'],
    options: [
      {
        key: 'recipe',
        label: 'Recipe',
        type: 'single',
        required: true,
        choices: [choice('mojito', 'Virgin mojito'), choice('blue-lagoon', 'Blue lagoon'), choice('watermelon', 'Watermelon cooler')],
      },
    ],
  }),
  item('Smoothie', ['cold-beverages'], 189, true, m('coldDrink', { liquid: '#c45a7c', glass: 'mason', garnish: 'berry' }), {
    description: 'Thick blended fruit smoothie.',
    ingredients: ['Fruit', 'Yoghurt', 'Honey'],
    sizes: SIZES.drink,
    options: [
      {
        key: 'flavour',
        label: 'Flavour',
        type: 'single',
        required: true,
        choices: [choice('berry', 'Mixed berry'), choice('mango', 'Mango'), choice('banana-oat', 'Banana oat')],
      },
    ],
  }),
];

// Related products by slug (two-way relations are not required).
export const related = {
  'classic-burger': ['french-fries', 'cold-coffee', 'cheese-burger'],
  'cheese-burger': ['peri-peri-fries', 'chocolate-milkshake', 'double-patty-burger'],
  'veg-burger': ['french-fries', 'lemon-iced-tea', 'paneer-burger'],
  'paneer-burger': ['peri-peri-fries', 'mocktail', 'veg-burger'],
  'crispy-chicken-burger': ['loaded-fries', 'iced-mocha', 'chicken-nuggets'],
  'double-patty-burger': ['onion-rings', 'oreo-shake', 'classic-burger'],
  'gourmet-burger': ['loaded-fries', 'cold-brew', 'signature-meal-combo'],
  'margherita-pizza': ['garlic-bread', 'bruschetta', 'four-cheese-pizza'],
  'farmhouse-pizza': ['garlic-bread', 'lemon-iced-tea', 'corn-and-cheese-pizza'],
  'paneer-tikka-pizza': ['garlic-bread', 'mocktail', 'signature-special-pizza'],
  'pepperoni-pizza': ['cheese-balls', 'cold-brew', 'four-cheese-pizza'],
  'signature-special-pizza': ['garlic-bread', 'tiramisu', 'paneer-tikka-pizza'],
  'alfredo-pasta': ['garlic-bread', 'bruschetta', 'pesto-pasta'],
  'lasagna': ['garlic-bread', 'tiramisu', 'risotto'],
  'hakka-noodles': ['manchurian', 'spring-rolls', 'fried-rice'],
  'fried-rice': ['manchurian', 'chilli-paneer'],
  'steamed-momos': ['fried-momos', 'tandoori-momos', 'masala-chai'],
  'chole-bhature': ['masala-chai', 'chole-kulche', 'lemon-iced-tea'],
  'pav-bhaji': ['masala-chai', 'chole-kulche'],
  'chicken-biryani': ['vegetable-biryani', 'paneer-tikka', 'mocktail'],
  'indian-thali': ['masala-chai', 'dal-makhani', 'paneer-butter-masala'],
  'butter-croissant': ['cafe-latte', 'cappuccino', 'cinnamon-roll'],
  'cinnamon-roll': ['cafe-latte', 'butter-croissant'],
  'cheesecake': ['espresso', 'tiramisu', 'chocolate-brownie'],
  'tiramisu': ['espresso', 'cheesecake'],
  'chocolate-lava-cake': ['ice-cream', 'cappuccino'],
  'cafe-latte': ['butter-croissant', 'blueberry-muffin', 'cappuccino'],
  'cappuccino': ['butter-croissant', 'chocolate-muffin', 'cafe-latte'],
  'espresso': ['tiramisu', 'cookies'],
  'masala-chai': ['pav-bhaji', 'cookies'],
  'cold-brew': ['iced-latte', 'chocolate-brownie'],
  'oreo-shake': ['chocolate-milkshake', 'loaded-fries'],
};
