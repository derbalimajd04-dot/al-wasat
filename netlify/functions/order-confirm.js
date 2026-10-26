const Stripe = require('stripe');
const { sendOrderConfirmation } = require('./_lib/order-email');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.RESEND_API_KEY) {
    console.error('order-confirm: missing required env vars');
    return { statusCode: 500, body: 'Service not configured' };
  }

  const sig = event.headers['stripe-signature'];
  if (!sig) {
    return { statusCode: 400, body: 'Missing stripe-signature header' };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  let stripeEvent;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: 'Webhook signature verification failed' };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
  }

  try {
    const status = await sendOrderConfirmation(stripe, stripeEvent.data.object.id, { trusted: true });
    console.log('order-confirm:', stripeEvent.data.object.id, status);
  } catch (err) {
    /* Non-2xx makes Stripe retry the webhook later. */
    console.error('order-confirm: failed to send confirmation:', err.message);
    return { statusCode: 500, body: 'Failed to send confirmation' };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
