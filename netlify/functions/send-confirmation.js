/* Success-page fallback for the order email, in case the Stripe webhook is
   not configured or is delayed. Safe to call repeatedly: the shared sender
   confirms each order at most once. */
const Stripe = require('stripe');
const { sendOrderConfirmation } = require('./_lib/order-email');

exports.handler = async (event) => {
  const sessionId = (event.queryStringParameters || {}).session_id || '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return { statusCode: 400, body: 'Missing session_id' };
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.RESEND_API_KEY) {
    console.error('send-confirmation: missing required env vars');
    return { statusCode: 500, body: 'Service not configured' };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const status = await sendOrderConfirmation(stripe, sessionId);
    return { statusCode: 200, body: status };
  } catch (err) {
    // Log but don't surface — a failed email shouldn't break the success page
    console.error('send-confirmation error:', err.message);
    return { statusCode: 500, body: 'Failed' };
  }
};
