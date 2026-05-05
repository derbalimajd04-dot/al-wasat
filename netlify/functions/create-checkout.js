const Stripe = require('stripe');

const PRODUCTS = {
  'classic-500': { name: 'AL WASAT Classic — 500ml',    amount: 1399 },
  'classic-1l':  { name: 'AL WASAT Classic — 1 Litre',  amount: 2299 },
  'organic-500': { name: 'AL WASAT Organic — 500ml',    amount: 1699 },
  'organic-1l':  { name: 'AL WASAT Organic — 1 Litre',  amount: 2899 },
};

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  try {
    const { items } = JSON.parse(event.body);
    if (!Array.isArray(items) || !items.length || items.length > 20) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': corsOrigin }, body: JSON.stringify({ error: 'Invalid cart' }) };
    }

    const lineItems = items.map(item => {
      const product = PRODUCTS[item.pid];
      if (!product) throw new Error(`Unknown product: ${item.pid}`);
      const qty = parseInt(item.qty, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error(`Invalid quantity for: ${item.pid}`);
      return {
        price_data: {
          currency: 'gbp',
          product_data: { name: product.name },
          unit_amount: product.amount,
        },
        quantity: qty,
      };
    });

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB', 'FR', 'DE', 'NL', 'BE', 'ES', 'IT'],
      },
      success_url: `${corsOrigin}/checkout/?success=true`,
      cancel_url: `${corsOrigin}/checkout/`,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      },
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
