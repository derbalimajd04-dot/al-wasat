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

// Values starting with 'price_' are used directly as Stripe Price IDs.
// All other values are treated as environment variable names.
const PRICE_MAP = {
  'classic-500': { one: 'price_1TU2tyDOCtKpIrONwvWQs9Ju', sub: 'price_1TU2tzDOCtKpIrON7eQ8mgWa' },
  'classic-1l':  { one: 'price_1TU2u0DOCtKpIrONtq93xsgq', sub: 'price_1TU2u0DOCtKpIrON3Pwh0kIA' },
  'organic-500': { one: 'price_1TU2u1DOCtKpIrONkYvxWwcG', sub: 'price_1TU2u2DOCtKpIrON3Zk7BNr7' },
  'organic-1l':  { one: 'price_1TU2u3DOCtKpIrONiwbbkn5C', sub: 'price_1TU2u4DOCtKpIrONdZLurXGN' },
  'harvest-2025':     { one: 'STRIPE_PRICE_HARVEST_2025',         sub: null },
  'merch-set':        { one: 'STRIPE_PRICE_MERCH_SET',            sub: null },
  'tasting-250ml':    { one: 'price_1TUupgDOCtKpIrONFNHczbmM',   sub: null },
  'bulk-3l':          { one: 'price_1TUuq3DOCtKpIrONBGkzqNog',   sub: null },
  'gift-box':         { one: 'price_1TUuqLDOCtKpIrONNh3Aszjo',   sub: null },
  'subscription-box': { one: 'price_1TUvHNDOCtKpIrONgjYV9Uyf',   sub: null },
  'gift-card':        { one: 'price_1TUvICDOCtKpIrONoomiQFPE',   sub: null },
};

function resolvePrice(key) {
  if (!key) return null;
  if (key.startsWith('price_')) return key;
  return process.env[key] || null;
}

const ALLOWED_ORIGINS = [
  'https://al-wasat.co.uk',
  'https://www.al-wasat.co.uk',
];

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any localhost port for local development
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

// Instantiated once per warm function instance; null when env var is absent.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

class ValidationError extends Error {}

exports.handler = async (event) => {
  const origin = event.headers.origin || '';
  const corsOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

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
  if (!isAllowedOrigin(origin)) return { statusCode: 403, body: 'Forbidden' };

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!rateLimit(ip)) {
    return { statusCode: 429, headers: { 'Access-Control-Allow-Origin': corsOrigin }, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  if (!stripe) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin },
      body: JSON.stringify({ error: 'Payment service is not configured. Please contact support.' }),
    };
  }

  let parsed;
  try { parsed = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  try {
    // Accept either mode:'subscription'|'payment' or legacy subscription:true|false
    const { items, mode, subscription } = parsed;
    const isSubscription = mode === 'subscription' || subscription === true;

    if (!Array.isArray(items) || !items.length || items.length > 20) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': corsOrigin }, body: JSON.stringify({ error: 'Invalid cart' }) };
    }

    const lineItems = items.map(item => {
      const priceKeys = PRICE_MAP[item.pid];
      if (!priceKeys) throw new ValidationError(`Unknown product: ${item.pid}`);
      const qty = parseInt(item.qty, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new ValidationError(`Invalid quantity for: ${item.pid}`);

      const priceKey = isSubscription ? priceKeys.sub : priceKeys.one;
      if (!priceKey) throw new ValidationError(`Subscription not available for: ${item.pid}`);
      const priceId = resolvePrice(priceKey);
      if (!priceId) throw new Error(`Price not configured for: ${item.pid}`);

      return { price: priceId, quantity: qty };
    });

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: isSubscription ? 'subscription' : 'payment',
      allow_promotion_codes: true,
      success_url: `${corsOrigin}/checkout/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${corsOrigin}/checkout/`,
    };

    if (!isSubscription) {
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
    if (err instanceof ValidationError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin },
        body: JSON.stringify({ error: err.message }),
      };
    }
    console.error('create-checkout error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin },
      body: JSON.stringify({ error: 'Payment unavailable. Please try again or contact us.' }),
    };
  }
};
