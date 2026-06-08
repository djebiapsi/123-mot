// weight 3 = populaire (sort souvent)
// weight 2 = moyen
// weight 1 = niche (sort rarement)

const CATEGORIES = [
  // ── GÉOGRAPHIE ───────────────────────────────────────────────────────────
  { name: 'Capitales africaines',   emoji: '🌍', grad: ['#FF6B35','#FF8C5A'], weight: 3 },
  { name: 'Capitales européennes',  emoji: '🏰', grad: ['#4ECDC4','#2BB5AC'], weight: 3 },
  { name: "Capitales d'Asie",       emoji: '🏯', grad: ['#45B7D1','#2A9EC0'], weight: 2 },
  { name: "Capitales d'Amérique",   emoji: '🗽', grad: ['#96CEB4','#6EBD95'], weight: 2 },
  { name: 'Pays du monde',          emoji: '🗺️', grad: ['#F7DC6F','#F0C419'], weight: 3 },
  { name: 'Villes de France',       emoji: '🗼', grad: ['#BB8FCE','#9B59B6'], weight: 2 },
  { name: 'Villes du monde',        emoji: '🌆', grad: ['#58D68D','#27AE60'], weight: 3 },
  { name: 'Fleuves et rivières',    emoji: '🌊', grad: ['#5DADE2','#2E86C1'], weight: 2 },
  { name: 'Montagnes',              emoji: '⛰️', grad: ['#A9A9A9','#7F8C8D'], weight: 2 },
  { name: 'Îles du monde',          emoji: '🏝️', grad: ['#1ABC9C','#148F77'], weight: 2 },
  { name: 'Déserts',                emoji: '🏜️', grad: ['#E59866','#CA6F1E'], weight: 1 },
  { name: 'Océans et mers',         emoji: '🌊', grad: ['#1E90FF','#0070DD'], weight: 2 },
  { name: 'Lacs',                   emoji: '💧', grad: ['#5B9BD5','#2471A3'], weight: 1 },
  { name: 'Volcans',                emoji: '🌋', grad: ['#E74C3C','#C0392B'], weight: 1 },
  { name: "Pays d'Afrique",         emoji: '🌍', grad: ['#E67E22','#CA6F1E'], weight: 3 },
  { name: "Pays d'Amérique du Sud", emoji: '🌎', grad: ['#2ECC71','#1A9E53'], weight: 2 },
  { name: "Pays d'Asie",            emoji: '🌏', grad: ['#E74C3C','#A93226'], weight: 2 },
  { name: 'Pays francophones',      emoji: '🇫🇷', grad: ['#3498DB','#1A5E99'], weight: 2 },
  { name: 'Caps et péninsules',     emoji: '🗾', grad: ['#16A085','#0E6655'], weight: 1 },
  { name: 'Détroits et canaux',     emoji: '🌐', grad: ['#2980B9','#1B6FA0'], weight: 1 },

  // ── SPORT ────────────────────────────────────────────────────────────────
  { name: 'Footballeurs célèbres',    emoji: '⚽', grad: ['#2ECC71','#1A9E53'], weight: 3 },
  { name: 'Clubs de football',        emoji: '🏆', grad: ['#3498DB','#1A6FA0'], weight: 3 },
  { name: 'Sports olympiques',        emoji: '🏅', grad: ['#F39C12','#D68910'], weight: 3 },
  { name: 'Sports de combat',         emoji: '🥊', grad: ['#E74C3C','#A93226'], weight: 2 },
  { name: 'Tennismen et Tenniswomen', emoji: '🎾', grad: ['#27AE60','#1A7A43'], weight: 2 },
  { name: 'Nageurs',                  emoji: '🏊', grad: ['#2980B9','#1B6FA0'], weight: 2 },
  { name: 'Athlètes',                 emoji: '🏃', grad: ['#8E44AD','#6C3483'], weight: 2 },
  { name: 'Pilotes de F1',            emoji: '🏎️', grad: ['#C0392B','#922B21'], weight: 2 },
  { name: 'Basketteurs NBA',          emoji: '🏀', grad: ['#E67E22','#CA6F1E'], weight: 2 },
  { name: 'Stades de football',       emoji: '🏟️', grad: ['#16A085','#0E6655'], weight: 1 },
  { name: "Sports d'hiver",           emoji: '⛷️', grad: ['#85C1E9','#5BA8D5'], weight: 2 },
  { name: 'Sports extrêmes',          emoji: '🪂', grad: ['#E91E63','#C2185B'], weight: 1 },
  { name: 'Boxeurs',                  emoji: '🥊', grad: ['#FF5722','#E64A19'], weight: 1 },
  { name: 'Cyclistes',                emoji: '🚴', grad: ['#009688','#00796B'], weight: 1 },
  { name: 'Rugbymen',                 emoji: '🏉', grad: ['#795548','#5D4037'], weight: 1 },

  // ── CULTURE ──────────────────────────────────────────────────────────────
  { name: 'Films',                     emoji: '🎬', grad: ['#9B59B6','#7D3C98'], weight: 3 },
  { name: 'Séries télévisées',         emoji: '📺', grad: ['#3498DB','#1A6FA0'], weight: 3 },
  { name: 'Dessins animés',            emoji: '🎨', grad: ['#F39C12','#D68910'], weight: 3 },
  { name: 'Jeux vidéo',                emoji: '🎮', grad: ['#2ECC71','#1A9E53'], weight: 3 },
  { name: 'Livres célèbres',           emoji: '📚', grad: ['#E74C3C','#A93226'], weight: 2 },
  { name: 'Mangas',                    emoji: '📖', grad: ['#FF6B9D','#E91E63'], weight: 2 },
  { name: 'Acteurs hollywoodiens',     emoji: '🎭', grad: ['#1ABC9C','#148F77'], weight: 3 },
  { name: 'Chanteurs et Chanteuses',   emoji: '🎤', grad: ['#E67E22','#CA6F1E'], weight: 3 },
  { name: 'Groupes de musique',        emoji: '🎸', grad: ['#8E44AD','#6C3483'], weight: 2 },
  { name: 'Peintres célèbres',         emoji: '🖌️', grad: ['#16A085','#0E6655'], weight: 2 },
  { name: 'Superhéros Marvel',         emoji: '🦸', grad: ['#E74C3C','#A93226'], weight: 3 },
  { name: 'Personnages Disney',        emoji: '✨', grad: ['#F39C12','#D68910'], weight: 3 },
  { name: 'Jeux de société',           emoji: '🎲', grad: ['#2980B9','#1B6FA0'], weight: 2 },
  { name: 'Instruments de musique',    emoji: '🎵', grad: ['#27AE60','#1A7A43'], weight: 2 },
  { name: 'Réalisateurs de films',     emoji: '🎥', grad: ['#8E44AD','#6C3483'], weight: 1 },
  { name: 'Comédies musicales',        emoji: '🎶', grad: ['#E91E63','#C2185B'], weight: 1 },
  { name: 'Danses du monde',           emoji: '💃', grad: ['#FF4081','#E91E63'], weight: 1 },
  { name: 'Festivals de musique',      emoji: '🎪', grad: ['#FF6B35','#E65100'], weight: 1 },
  { name: 'Personnages de jeux vidéo', emoji: '👾', grad: ['#7B1FA2','#6A1B9A'], weight: 2 },
  { name: 'Artistes africains',        emoji: '🎵', grad: ['#FF9800','#F57C00'], weight: 2 },
  { name: 'Superhéros DC',             emoji: '🦇', grad: ['#1565C0','#0D47A1'], weight: 2 },
  { name: 'Personnages de manga',      emoji: '⚡', grad: ['#FF6B35','#E65100'], weight: 2 },
  { name: 'Célébrités africaines',     emoji: '⭐', grad: ['#FF8F00','#E65100'], weight: 2 },
  { name: 'Personnages historiques',   emoji: '📜', grad: ['#546E7A','#37474F'], weight: 1 },

  // ── ALIMENTATION ─────────────────────────────────────────────────────────
  { name: 'Fruits',                 emoji: '🍎', grad: ['#FF5252','#E53935'], weight: 3 },
  { name: 'Légumes',                emoji: '🥦', grad: ['#4CAF50','#388E3C'], weight: 3 },
  { name: 'Desserts du monde',      emoji: '🍰', grad: ['#F06292','#E91E63'], weight: 3 },
  { name: 'Boissons',               emoji: '🥤', grad: ['#29B6F6','#0288D1'], weight: 3 },
  { name: 'Plats africains',        emoji: '🍲', grad: ['#FF7043','#E64A19'], weight: 3 },
  { name: 'Plats asiatiques',       emoji: '🍜', grad: ['#EF5350','#C62828'], weight: 3 },
  { name: 'Fromages',               emoji: '🧀', grad: ['#FDD835','#F9A825'], weight: 2 },
  { name: 'Cocktails',              emoji: '🍹', grad: ['#AB47BC','#7B1FA2'], weight: 2 },
  { name: 'Épices',                 emoji: '🌶️', grad: ['#EF5350','#B71C1C'], weight: 2 },
  { name: 'Plats italiens',         emoji: '🍕', grad: ['#FF5722','#BF360C'], weight: 3 },
  { name: 'Fruits de mer',          emoji: '🦞', grad: ['#0288D1','#01579B'], weight: 1 },
  { name: 'Pâtisseries françaises', emoji: '🥐', grad: ['#F9A825','#F57F17'], weight: 1 },
  { name: 'Snacks et grignotages',  emoji: '🍿', grad: ['#FFA000','#FF8F00'], weight: 2 },
  { name: 'Thés et infusions',      emoji: '🍵', grad: ['#558B2F','#33691E'], weight: 1 },
  { name: 'Plats végétariens',      emoji: '🥗', grad: ['#43A047','#2E7D32'], weight: 1 },

  // ── SCIENCES & NATURE ────────────────────────────────────────────────────
  { name: "Animaux d'Afrique",       emoji: '🦁', grad: ['#FF8F00','#E65100'], weight: 3 },
  { name: 'Oiseaux',                 emoji: '🦅', grad: ['#1565C0','#0D47A1'], weight: 3 },
  { name: 'Insectes',                emoji: '🦋', grad: ['#558B2F','#33691E'], weight: 2 },
  { name: 'Planètes et astres',      emoji: '🪐', grad: ['#283593','#1A237E'], weight: 2 },
  { name: 'Éléments chimiques',      emoji: '⚗️', grad: ['#00838F','#006064'], weight: 2 },
  { name: 'Dinosaures',              emoji: '🦕', grad: ['#6D4C41','#4E342E'], weight: 2 },
  { name: 'Inventeurs',              emoji: '💡', grad: ['#F57F17','#E65100'], weight: 2 },
  { name: 'Arbres',                  emoji: '🌳', grad: ['#2E7D32','#1B5E20'], weight: 2 },
  { name: 'Fleurs',                  emoji: '🌸', grad: ['#AD1457','#880E4F'], weight: 2 },
  { name: 'Mammifères marins',       emoji: '🐬', grad: ['#0277BD','#01579B'], weight: 1 },
  { name: 'Reptiles',                emoji: '🦎', grad: ['#558B2F','#33691E'], weight: 1 },
  { name: 'Roches et minéraux',      emoji: '💎', grad: ['#37474F','#263238'], weight: 1 },
  { name: 'Phénomènes météo',        emoji: '⛈️', grad: ['#37474F','#263238'], weight: 2 },
  { name: 'Constellations',          emoji: '⭐', grad: ['#1A237E','#0D1440'], weight: 1 },
  { name: 'Mathématiciens célèbres', emoji: '🔢', grad: ['#4527A0','#311B92'], weight: 1 },
  { name: 'Animaux de la jungle',    emoji: '🌿', grad: ['#1B5E20','#0A3D0A'], weight: 2 },

  // ── VIE QUOTIDIENNE ──────────────────────────────────────────────────────
  { name: 'Métiers',                 emoji: '👷', grad: ['#E65100','#BF360C'], weight: 3 },
  { name: 'Marques de luxe',         emoji: '💎', grad: ['#4A148C','#38006B'], weight: 1 },
  { name: 'Marques de voitures',     emoji: '🚗', grad: ['#B71C1C','#7F0000'], weight: 3 },
  { name: 'Objets de bureau',        emoji: '💼', grad: ['#37474F','#263238'], weight: 1 },
  { name: 'Applications mobiles',    emoji: '📱', grad: ['#1565C0','#0D47A1'], weight: 3 },
  { name: 'Réseaux sociaux',         emoji: '📲', grad: ['#0D47A1','#01579B'], weight: 2 },
  { name: 'Vêtements et accessoires',emoji: '👗', grad: ['#880E4F','#560027'], weight: 2 },
  { name: 'Matières scolaires',      emoji: '📝', grad: ['#1B5E20','#003300'], weight: 1 },
  { name: 'Langues du monde',        emoji: '🗣️', grad: ['#E65100','#BF360C'], weight: 2 },
  { name: 'Monnaies du monde',       emoji: '💰', grad: ['#F57F17','#E65100'], weight: 1 },
  { name: 'Moyens de transport',     emoji: '✈️', grad: ['#01579B','#003D70'], weight: 2 },
  { name: 'Appareils électroniques', emoji: '💻', grad: ['#263238','#1A1A2E'], weight: 2 },
  { name: 'Meubles',                 emoji: '🛋️', grad: ['#4E342E','#3E2723'], weight: 1 },
  { name: 'Marques de téléphones',   emoji: '📱', grad: ['#37474F','#263238'], weight: 2 },

  // ── DIVERS ───────────────────────────────────────────────────────────────
  { name: 'Prénoms masculins',   emoji: '👦', grad: ['#1565C0','#0D47A1'], weight: 3 },
  { name: 'Prénoms féminins',    emoji: '👧', grad: ['#AD1457','#880E4F'], weight: 3 },
  { name: 'Animaux de compagnie',emoji: '🐱', grad: ['#6D4C41','#4E342E'], weight: 2 },
  { name: "Villes d'Afrique",    emoji: '🌆', grad: ['#E65100','#BF360C'], weight: 2 },
  { name: 'Couleurs',            emoji: '🌈', grad: ['#4527A0','#311B92'], weight: 2 },
  { name: 'Super-vilains',       emoji: '🦹', grad: ['#4A148C','#38006B'], weight: 1 },
];

// ── Tirage pondéré ────────────────────────────────────────────────────────────
function weightedRandom(items, getWeight) {
  const total = items.reduce((s, x) => s + getWeight(x), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= getWeight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ── Poids des lettres (inspirés du Scrabble français) ────────────────────────
// Lettre fréquente = poids élevé = sort souvent
const LETTER_WEIGHTS = {
  E: 15, A: 9, I: 8, S: 7, T: 7, R: 6, N: 6, U: 6, O: 6, L: 5,
  D: 4,  M: 3, C: 3, P: 3, G: 2, B: 2, F: 2, H: 2, V: 2,
  J: 1,  K: 1, Y: 1, X: 1, W: 1, Z: 1, Q: 1,
};

const LETTER_ENTRIES = Object.entries(LETTER_WEIGHTS);

function pickWeightedLetter(exclude = '') {
  const pool = LETTER_ENTRIES.filter(([l]) => l !== exclude);
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [letter, w] of pool) {
    r -= w;
    if (r <= 0) return letter;
  }
  return pool[pool.length - 1][0];
}

function randomLettersWeighted() {
  const l1 = pickWeightedLetter();
  const l2 = pickWeightedLetter(l1);
  return [l1, l2];
}

if (typeof module !== 'undefined') {
  module.exports = { CATEGORIES, LETTER_WEIGHTS, LETTER_ENTRIES, weightedRandom, randomLettersWeighted };
}
