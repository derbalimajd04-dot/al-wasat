const Stripe = require('stripe');

// In-memory rate limit: 10 requests per IP per 60 seconds.
const _rl = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const window = 60_000;
  const max = 10;
  const hits = (_rl.get(ip) || []).filter(t => now - t < window);
  if (hits.length >= max) return false;
  hits.push(now);
  _rl.set(ip, hits);
  return true;
}

const PRODUCTS = {
  'classic-500': { name: 'AL WASAT Classic — 500ml',                   amount: 1399 },
  'classic-1l':  { name: 'AL WASAT Classic — 1 Litre',                 amount: 2299 },
  'organic-500': { name: 'AL WASAT Organic — 500ml',                   amount: 1699 },
  'organic-1l':  { name: 'AL WASAT Organic — 1 Litre',                 amount: 2899 },
  'gift-set':    { name: 'AL WASAT Gift Set — Classic & Organic 500ml', amount: 2799 },
};

// Promo codes: code -> percent off (mirrored in validate-promo.js)
const PROMO_CODES = {
  'WELCOME10': 10,
  'ALWASAT15': 15,
};

const SUB_DISCOUNT_PCT = 10;

const ALLOWED_ORIGINS = [
  'https://al-wasat.co.uk',
  'https://www.al-wasat.co.uk',
  'http://localhost:8888',
];

exports.handler = async (event) => {
  const origin = event.headers.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!ALLOWED_ORIGINS.includes(origin)) return { statusCode: 403, body: 'Forbidden' };

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!rateLimit(ip)) {
    return { statusCode: 429, headers: { 'Access-Control-Allow-Origin': corsOrigin }, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  try {
    const { items, subscription = false, promoCode = '' } = JSON.parse(event.body);

    if (!Array.isArray(items) || !items.length || items.length > 20) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': corsOrigin }, body: JSON.stringify({ error: 'Invalid cart' }) };
    }

    // Resolve discounts server-side
    const promoDiscount = PROMO_CODES[(promoCode || '').toUpperCase().trim()] || 0;
    const subDiscount   = subscription ? SUB_DISCOUNT_PCT : 0;
    const multiplier    = (1 - subDiscount / 100) * (1 - promoDiscount / 100);

    const lineItems = items.map(item => {
      const product = PRODUCTS[item.pid];
      if (!product) throw new Error(`Unknown product: ${item.pid}`);
      const qty = parseInt(item.qty, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error(`Invalid quantity for: ${item.pid}`);

      const unit_amount = Math.round(product.amount * multiplier);

      if (subscription) {
        return {
          price_data: {
            currency: 'gbp',
            product_data: { name: `${product.name} (Subscribe & Save ${subDiscount}%)` },
            unit_amount,
            recurring: { interval: 'month' },
          },
          quantity: qty,
        };
      }

      return {
        price_data: {
          currency: 'gbp',
          product_data: { name: product.name },
          unit_amount,
        },
        quantity: qty,
      };
    });

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: subscription ? 'subscription' : 'payment',
      success_url: `${corsOrigin}/checkout/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${corsOrigin}/checkout/`,
    };

    if (!subscription) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ['GB', 'FR', 'DE', 'NL', 'BE', 'ES', 'IT'],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': corsOrigin },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
