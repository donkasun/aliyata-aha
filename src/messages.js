// src/messages.js
// Directional tiers use { any, down, up, left, right } buckets.
// Region messages (ear/trunk/ass) are added to the pool when the guess lands in that anatomy.
// All coordinates are in SVG/image space (same as EYE_SVG).
// Canvas coords for directionals: dx > 0 = right of eye, dy > 0 = below eye.

const REGIONS = {
  ear:   { cx: 443, cy: 188, r: 225 },
  trunk: { cx: 197, cy: 400, r: 170 },
  ass:   { cx: 912, cy: 299, r: 250 },
};

const REGION_MESSAGES = {
  ear:   ['හොඳටම කරකැවිලා වගේ... අලියට දැන් කන් දෙකෙන්ද පේන්නේ? 😵‍💫'],
  trunk: ['ඇහැ තිබ්බේ නහයට නේද? කමක් නෑ ඉතින්.'],
  ass:   ['දෙයියනේ... අලියගේ පස්ස පැත්තෙද ඇහැ තියෙන්නේ? 🍑'],
};

const MESSAGES = {
  hit: [
    'හරියටම හරි! වෙද මහත්තයා වගේ තිබ්බා! 🎯',
    'ගැම්මක් තමයි! අලියට පෙනීම ලැබුණා!',
  ],
  near: {
    any:  [
      'අපරාදෙ... නූලෙන් ගියේ! 🤏',
      'ෂහ්! තව චුට්ටයි! අලියට දැන් කණ්ණාඩියක් ඕනෙ.',
      'හොඳ උත්සාහය! ඒත් ඇහැ තියෙන්නේ නළලේ.',
    ],
    down: ['ළඟටම ආවා! කවුද "පල්ලෙහාට" යන්න කිව්වේ? 😅'],
  },
  medium: {
    any:  [
      'ළඟ ළඟ... ඒත් ගොඩක් දුරයි! 😬',
    ],
    left: ['අම්මෝ... කවුද වමට යන්න කිව්වේ? 😂'],
  },
  far: [
    'කවුද අප්පේ බෝඩ් එක එහාට කරේ? 🤣',
    'අලියා කැලේ, ඇහැ ගමේ! 🌴',
    'ඔයාට ඇස් පේනවා නේද? 😂',
    'අලියා නෙවෙයි, ඔයා තමයි අනාථ වුනේ! 💀',
  ],
};

function buildPool(tier, dx, dy) {
  const pool = [...tier.any];
  if (dy > 0 && tier.down)  pool.push(...tier.down);
  if (dy < 0 && tier.up)    pool.push(...tier.up);
  if (dx < 0 && tier.left)  pool.push(...tier.left);
  if (dx > 0 && tier.right) pool.push(...tier.right);
  return pool;
}

// gx, gy: guess position in SVG/image space (for region checks)
export function getMessage(distance, hit, dx = 0, dy = 0, gx = null, gy = null) {
  if (hit) return MESSAGES.hit[Math.floor(Math.random() * MESSAGES.hit.length)];

  const tier = distance <= 60  ? MESSAGES.near
             : distance <= 150 ? MESSAGES.medium
             : MESSAGES.far;

  const pool = Array.isArray(tier) ? [...tier] : buildPool(tier, dx, dy);

  // Append region-specific messages when the guess lands in that anatomy.
  if (gx !== null) {
    for (const [name, reg] of Object.entries(REGIONS)) {
      if (Math.hypot(gx - reg.cx, gy - reg.cy) <= reg.r) {
        pool.push(...REGION_MESSAGES[name]);
      }
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
