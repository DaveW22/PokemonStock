insert into public.products (name, retailer, url, price, priority)
values
  (
    'Ascended Heroes Booster Bundle',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-booster-bundle/p/257185',
    '£24.99',
    'High'
  ),
  (
    'Ascended Heroes Poster Collection',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-poster-collection-assortment/p/256300',
    '£49.99',
    'High'
  ),
  (
    'First Partners Pin Collection',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-first-partners-pin-collection/p/256561',
    '£24.99',
    'Medium'
  ),
  (
    'Mega Emboar ex Box',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-mega-emboar-ex-box/p/257987',
    '£21.99',
    'Medium'
  ),
  (
    'Mega Meganium ex Box',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-mega-meganium-ex-box/p/258032',
    '£21.99',
    'Low'
  ),
  (
    'Mega Feraligatr ex Box',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-mega-feraligatr-ex-box/p/258033',
    '£21.99',
    'Low'
  ),
  (
    'Tech Sticker Collection',
    'Smyths Toys',
    'https://www.smythstoys.com/uk/en-gb/brand/pokemon/pokemon-trading-card-game/pokemon-trading-card-game-tcg-mega-evolution-ascended-heroes-tech-sticker-collection/p/260614',
    '£12.99',
    'Low'
  )
on conflict (url) do update
set
  name = excluded.name,
  retailer = excluded.retailer,
  price = excluded.price,
  priority = excluded.priority,
  is_active = true;
