// TMDB /search/keyword üzerinden doğrulanmış, gerçek anahtar kelime id'leri.
// Her grup, en az bir anchor (referans) film üzerinde /movie/{id}/keywords
// ile çapraz kontrol edildi (bkz. lib/cineaCollections.ts koleksiyon
// tanımları ve görev raporları). Belirsiz/aşırı genel karşılıklar (ör.
// "adventure", "coming of age") kasıtlı olarak dışarıda bırakıldı.
//
// Bu dosya, koleksiyon motoru (lib/cineaCollections.ts) ve Movie DNA
// katmanı (lib/movieDna.ts) için TEK doğrulanmış keyword id kaynağıdır —
// aynı id iki dosyada ayrı ayrı hardcode edilmemelidir.
export const TMDB_KEYWORD_IDS = {
  // space-wars — Star Wars (id 11) ve Dune (id 438631) üzerinde doğrulandı.
  space: 9882,
  spaceOpera: 161176,
  spaceWar: 3386,
  spacecraft: 1612,
  intergalacticWar: 279614,
  alienInvasion: 14909,
  alienCivilization: 227719,
  spaceBattle: 2902,
  galaxy: 4270,

  // mind-bending-sci-fi — Inception (id 27205) ve The Matrix (id 603)
  // üzerinde doğrulandı.
  timeTravel: 4379,
  timeLoop: 10854,
  memory: 10937,
  simulatedReality: 3972,
  artificialIntelligence: 310,
  parallelWorld: 33465,
  mindControl: 9678,
  dreamWorld: 186789,
  subconscious: 234868,

  // dark-crime — The Godfather (id 238) ve Se7en (id 807) üzerinde doğrulandı.
  organizedCrime: 10291,
  gangster: 3149,
  mafia: 10391,
  serialKiller: 10714,
  detective: 703,
  neoNoir: 207268,
  corruption: 417,
  policeCorruption: 11734,
  murderInvestigation: 161982,
  heist: 10051,
  drugCartel: 10175,
  criminalUnderworld: 15011,

  // survival-isolation — Cast Away (id 8358) ve The Revenant (id 281957)
  // üzerinde doğrulandı.
  survival: 10349,
  desertedIsland: 155746,
  castaway: 11085,
  wilderness: 3593,
  stranded: 9743,
  trapped: 18029,
  postApocalyptic: 359337,
  shipwreck: 2580,
  lostAtSea: 179578,
  isolation: 1533,

  // historical-politics — All the President's Men (id 891), JFK (id 820)
  // ve Darkest Hour (id 399404) üzerinde doğrulandı. The Intouchables
  // (id 77338) bu grupla eşleşmediği ayrıca doğrulandı.
  politics: 6078,
  government: 6086,
  politicalThriller: 209817,
  politicalCorruption: 181659,
  election: 15134,
  dictatorship: 7606,
  militaryDictatorship: 156887,
  revolution: 2020,
  espionage: 5265,
  coldWar: 2106,
  politicalAssassination: 14548,
  assassination: 441,
  coup: 361213,
  militaryCoup: 194320,
  warAndPolitics: 378915,
  watergateScandal: 4240,
  britishPolitics: 33847,

  // family-adventure — skor artırıcı, opsiyonel sinyaller.
  familyAdventures: 359848,
  talkingAnimal: 267848,
  magicalCreature: 195269,
  basedOnChildrensBook: 15101,
  familyRelationships: 10235,
  friendship: 6054,
} as const;

export type TmdbKeywordName = keyof typeof TMDB_KEYWORD_IDS;
