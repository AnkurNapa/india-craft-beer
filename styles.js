// Style profiles shown on every beer page.
// Vital statistics and overall impressions are quoted from the BJCP 2021 Beer Style Guidelines
// (bjcp.org, checked 2026-09-23). Each of our broad styles points at its closest BJCP style.
// Serving glass and temperature are standard serving practice; the food is ours.

const BJCP = 'https://www.bjcp.org/style/2021';

export const STYLE_INFO = {
  'Belgian Wit': {
    bjcp: { code: '24A', name: 'Witbier', url: `${BJCP}/24/24A/witbier/`, og: [1.044, 1.052], fg: [1.008, 1.012], abv: [4.5, 5.5], ibu: [8, 20], srm: [2, 4],
      impression: 'A pale, hazy Belgian wheat beer with spices accentuating the yeast character.' },
    serve: { glass: 'Tumbler', temp: [4, 7] },
    food: {
      north: 'Paneer tikka, malai broccoli, tandoori mushrooms',
      south: 'Goan prawn balchão, Mangalorean fish fry',
      street: 'Papdi chaat, dahi puri, bhel',
      sweet: 'Orange and cardamom shrikhand',
      why: 'Coriander and orange peel meet the spice box halfway, and the soft wheat calms the heat.',
    },
  },
  'Hefeweizen': {
    bjcp: { code: '10A', name: 'Weissbier', url: `${BJCP}/10/10A/weissbier/`, og: [1.044, 1.053], fg: [1.008, 1.014], abv: [4.3, 5.6], ibu: [8, 15], srm: [2, 6],
      impression: 'A pale, refreshing, lightly-hopped German wheat beer with high carbonation, dry finish, fluffy mouthfeel, and a distinctive banana-and-clove weizen yeast fermentation profile.' },
    serve: { glass: 'Weizen vase', temp: [4, 7] },
    food: {
      north: 'Tandoori chicken, chicken tikka, seekh kebab',
      south: 'Masala dosa, Chettinad egg roast',
      street: 'Vada pav, kathi roll',
      sweet: 'Banana fritters, kela halwa',
      why: 'Banana and clove echo the spice rub, and the high carbonation lifts smoke and char off the palate.',
    },
  },
  'Blonde Ale': {
    bjcp: { code: '18A', name: 'Blonde Ale', url: `${BJCP}/18/18A/blonde-ale/`, og: [1.038, 1.054], fg: [1.008, 1.013], abv: [3.8, 5.5], ibu: [15, 28], srm: [3, 6],
      impression: 'Easy-drinking, approachable, malt-oriented American craft beer, often with interesting fruit, hop, or character malt notes.' },
    serve: { glass: 'Nonic pint', temp: [4, 7] },
    food: {
      north: 'Amritsari fish fry, chicken 65',
      south: 'Kerala banana chips, medu vada',
      street: 'Onion pakoras, samosa, pav bhaji',
      sweet: 'Jalebi',
      why: 'Clean malt and steady bubbles scrub the oil from anything fried.',
    },
  },
  'Lager': {
    bjcp: { code: '4A', name: 'Munich Helles', url: `${BJCP}/4/4A/munich-helles/`, og: [1.044, 1.048], fg: [1.006, 1.012], abv: [4.7, 5.4], ibu: [16, 22], srm: [3, 5],
      impression: 'A gold-colored German lager with a smooth, malty flavor and a soft, dry finish.' },
    serve: { glass: 'Lager mug or pilsner glass', temp: [3, 6] },
    food: {
      north: 'Butter naan with dal makhani, chole bhature',
      south: 'Chilli chicken, Bombay duck fry, Andhra pepper fry',
      street: 'Momos, pani puri, Indo-Chinese noodles',
      sweet: 'Kulfi',
      why: 'The safe pick when the food is fiery: soft malt and cold, clean bubbles reset the palate between bites.',
    },
  },
  'Strong Lager': {
    bjcp: { code: '4C', name: 'Helles Bock', url: `${BJCP}/4/4C/helles-bock/`, og: [1.064, 1.072], fg: [1.011, 1.018], abv: [6.3, 7.4], ibu: [23, 35], srm: [6, 9],
      impression: 'A relatively pale, strong, malty German lager with a nicely attenuated finish that enhances drinkability.' },
    serve: { glass: 'Stein or tulip', temp: [6, 9] },
    food: {
      north: 'Mutton seekh kebab, galouti kebab, Lucknowi biryani',
      south: 'Kerala beef fry, pepper mutton',
      street: 'Keema pav, bun kebab',
      sweet: 'Gajar halwa',
      why: 'Enough malt and body to stand up to rich minced meat and slow-cooked spice.',
    },
  },
  'Kölsch': {
    bjcp: { code: '5B', name: 'Kölsch', url: `${BJCP}/5/5B/kolsch/`, og: [1.044, 1.050], fg: [1.007, 1.011], abv: [4.4, 5.2], ibu: [18, 30], srm: [3.5, 5],
      impression: 'A subtle, brilliantly clear, pale beer with a delicate balance of malt, fruit, and hop character, moderate bitterness, and a well-attenuated but soft finish.' },
    serve: { glass: 'Stange', temp: [4, 7] },
    food: {
      north: 'Dahi kebab, hara bhara kebab',
      south: 'Idli with podi, appam and vegetable stew',
      street: 'Steamed momos, dhokla',
      sweet: 'Rasmalai',
      why: 'A delicate beer for delicate food: it refreshes without drowning gentle flavours.',
    },
  },
  'Pale Ale': {
    bjcp: { code: '18B', name: 'American Pale Ale', url: `${BJCP}/18/18B/american-pale-ale/`, og: [1.045, 1.060], fg: [1.010, 1.015], abv: [4.5, 6.2], ibu: [30, 50], srm: [5, 10],
      impression: 'An average-strength, hop-forward, pale American craft beer with sufficient supporting malt to make the beer balanced and drinkable.' },
    serve: { glass: 'Nonic pint', temp: [6, 9] },
    food: {
      north: 'Butter chicken, murgh makhani, paneer lababdar',
      south: 'Hyderabadi haleem, Malabar parotta with chicken curry',
      street: 'Chicken kathi roll, egg bhurji pav',
      sweet: 'Carrot cake with jaggery',
      why: 'Citrusy hops cut through cream and butter without fighting the spice.',
    },
  },
  'IPA': {
    bjcp: { code: '21A', name: 'American IPA', url: `${BJCP}/21/21A/american-ipa/`, og: [1.056, 1.070], fg: [1.008, 1.014], abv: [5.5, 7.5], ibu: [40, 70], srm: [6, 14],
      impression: 'A decidedly hoppy and bitter, moderately strong, pale American ale.' },
    serve: { glass: 'IPA glass or tulip', temp: [7, 10] },
    food: {
      north: 'Laal maas, mutton rogan josh',
      south: 'Chettinad chicken, Andhra chilli chicken, Kerala fish curry',
      street: 'Mirchi bajji, spicy chicken lollipop',
      sweet: 'Carrot halwa, mango cheesecake',
      why: 'For heat lovers only: bitterness turns the chilli up, and the hops love fatty, spiced meat.',
    },
  },
  'Saison': {
    bjcp: { code: '25B', name: 'Saison (standard strength, pale)', url: `${BJCP}/25/25B/saison/`, og: [1.048, 1.065], fg: [1.002, 1.008], abv: [5.0, 7.0], ibu: [20, 35], srm: [5, 14],
      impression: 'A family of refreshing, highly attenuated, hoppy, and fairly bitter Belgian ales with a very dry finish and high carbonation.' },
    serve: { glass: 'Tulip', temp: [7, 10] },
    food: {
      north: 'Methi malai paneer, kadhi pakora',
      south: 'Kerala fish curry, appam with stew, prawn moilee',
      street: 'Bhel with raw mango, sundal',
      sweet: 'Coconut barfi',
      why: 'Peppery and very dry, it loves coconut and cuts through creamy curries.',
    },
  },
  'Porter': {
    bjcp: { code: '20A', name: 'American Porter', url: `${BJCP}/20/20A/american-porter/`, og: [1.050, 1.070], fg: [1.012, 1.018], abv: [4.8, 6.5], ibu: [25, 50], srm: [22, 40],
      impression: 'A malty, bitter, and often somewhat hoppy dark beer with a balanced, roasted, and frequently chocolatey character.' },
    serve: { glass: 'Nonic pint', temp: [8, 12] },
    food: {
      north: 'Tandoori raan, smoked seekh kebab, dal bukhara',
      south: 'Coorg pandi curry, pepper roast beef',
      street: 'Barbecue chicken tikka, shawarma',
      sweet: 'Chocolate brownie, chikki',
      why: 'Roast meets char: the chocolate and coffee notes echo anything off the tandoor.',
    },
  },
  'Stout': {
    bjcp: { code: '16B', name: 'Oatmeal Stout', url: `${BJCP}/16/16B/oatmeal-stout/`, og: [1.045, 1.065], fg: [1.010, 1.018], abv: [4.2, 5.9], ibu: [25, 40], srm: [22, 40],
      impression: 'A dark, roasty, full-bodied stout with enough sweetness to support the oat backbone.' },
    serve: { glass: 'Nonic pint or tulip', temp: [8, 12] },
    food: {
      north: 'Nihari, Old Delhi mutton korma',
      south: 'Kerala beef ularthiyathu, Coorg pork',
      street: 'Bun maska with chai, Irani keema',
      sweet: 'Gulab jamun, chocolate anything, filter-coffee tiramisu',
      why: 'Roast and sweetness work both ways: with slow-cooked meat, or with dessert.',
    },
  },
  'Sour': {
    bjcp: { code: '23A', name: 'Berliner Weisse', url: `${BJCP}/23/23A/berliner-weisse/`, og: [1.028, 1.032], fg: [1.003, 1.006], abv: [2.8, 3.8], ibu: [3, 8], srm: [2, 3],
      impression: 'A very pale, refreshing, low-alcohol German wheat beer with a clean lactic sourness and a very high carbonation level.' },
    serve: { glass: 'Tulip or flute', temp: [4, 7] },
    food: {
      north: 'Aloo tikki chaat, dahi bhalla',
      south: 'Rasam rice, tamarind prawns',
      street: 'Pani puri, sev puri, raw mango chaat',
      sweet: 'Aam panna sorbet',
      why: 'Tart beer, tangy food: the acidity matches tamarind and chaat masala note for note.',
    },
  },
  'Belgian Ale': {
    bjcp: { code: '26B', name: 'Belgian Dubbel', url: `${BJCP}/26/26B/belgian-dubbel/`, og: [1.062, 1.075], fg: [1.008, 1.018], abv: [6.0, 7.6], ibu: [15, 25], srm: [10, 17],
      impression: 'A deep reddish-copper, moderately strong, malty, complex Belgian ale with rich malty flavors, dark or dried fruit esters, and light alcohol blended together in a malty presentation that still finishes fairly dry.' },
    serve: { glass: 'Chalice or goblet', temp: [10, 13] },
    food: {
      north: 'Rogan josh, shahi paneer, Awadhi biryani',
      south: 'Kolhapuri mutton, Chettinad duck',
      street: 'Mutton sukka with pav',
      sweet: 'Date and walnut cake, shahi tukda',
      why: 'Dried-fruit esters and deep malt stand up to rich, slow-cooked spice.',
    },
  },
  'Non-alcoholic': {
    bjcp: null,
    serve: { glass: 'Pint glass', temp: [3, 5] },
    food: {
      north: 'Rajma chawal, a weekday thali',
      south: 'Masala dosa, lemon rice, curd rice',
      street: 'Pav bhaji, vada pav, sandwich',
      sweet: 'Kulfi falooda',
      why: 'Everything a crisp lager goes with, and you can still drive home.',
    },
  },
};

// Scales for the range bars on the beer page.
export const VITAL_SCALES = {
  og: { label: 'OG', min: 1.020, max: 1.080, fmt: v => v.toFixed(3) },
  fg: { label: 'FG', min: 0.998, max: 1.025, fmt: v => v.toFixed(3) },
  abv: { label: 'ABV', min: 0, max: 10, fmt: v => `${v}%` },
  ibu: { label: 'IBU', min: 0, max: 80, fmt: v => `${v}` },
  srm: { label: 'SRM', min: 0, max: 40, fmt: v => `${v}` },
};

// The standard SRM-to-RGB table, SRM 1 to 40, for colouring the SRM bar.
const SRM_HEX = ['#FFE699', '#FFD878', '#FFCA5A', '#FFBF42', '#FBB123', '#F8A600', '#F39C00', '#EA8F00', '#E58500', '#DE7C00',
  '#D77200', '#CF6900', '#CB6200', '#C35900', '#BB5100', '#B54C00', '#B04500', '#A63E00', '#A13700', '#9B3200',
  '#952D00', '#8E2900', '#882300', '#821E00', '#7B1A00', '#771900', '#701400', '#6A0E00', '#660D00', '#5E0B00',
  '#5A0A02', '#600903', '#520907', '#4C0505', '#470606', '#440607', '#3F0708', '#3B0607', '#3A070B', '#36080A'];
export const srmHex = srm => SRM_HEX[Math.min(40, Math.max(1, Math.round(srm))) - 1];
