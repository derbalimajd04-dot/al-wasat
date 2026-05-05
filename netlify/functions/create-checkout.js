const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { items } = JSON.parse(event.body);
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = event.headers.origin || 'https://al-wasat.co.uk';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'gbp',
          product_data: { name: `${item.name} — ${item.unit.replace('/ ', '')}` },
          unit_amount: Math.round(item.priceNum * 100),
        },
        quantity: item.qty,
      })),
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB', 'FR', 'DE', 'NL', 'BE', 'ES', 'IT'],
      },
      success_url: `${origin}/checkout/?success=true`,
      cancel_url: `${origin}/checkout/`,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
