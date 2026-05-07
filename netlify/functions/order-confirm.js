const Stripe = require('stripe');
const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
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
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };
  }

  const session = stripeEvent.data.object;
  const customerEmail = session.customer_details && session.customer_details.email;
  const customerName = (session.customer_details && session.customer_details.name) || 'Valued Customer';

  if (!customerEmail) {
    console.error('No customer email in session', session.id);
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  let fullSession;
  try {
    fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });
  } catch (err) {
    console.error('Failed to retrieve session:', err.message);
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const lineItems = (fullSession.line_items && fullSession.line_items.data) || [];
  const total = ((fullSession.amount_total || 0) / 100).toFixed(2);

  const itemLines = lineItems
    .map(function (item) {
      var name = (item.price && item.price.product && item.price.product.name)
        || item.description
        || 'Item';
      var qty = item.quantity || 1;
      var amount = ((item.amount_total || 0) / 100).toFixed(2);
      return '  • ' + name + ' × ' + qty + ' — £' + amount;
    })
    .join('\n');

  var emailText = [
    'Dear ' + customerName + ',',
    '',
    'Thank you for your order with AL WASAT. We have received your payment and your order is confirmed.',
    '',
    'ORDER SUMMARY',
    '-------------',
    itemLines,
    '',
    'Total: £' + total,
    '',
    'DELIVERY',
    '--------',
    'Estimated delivery: 5–7 working days.',
    'We will send your tracking information once your order has been dispatched.',
    '',
    'If you have any questions about your order, please contact us at orders@al-wasat.co.uk.',
    '',
    'With thanks,',
    'The AL WASAT Team',
    '',
    'AL WASAT — Extra Virgin Olive Oil · Tunisia · Since 1960',
    'https://al-wasat.co.uk',
  ].join('\n');

  try {
    var resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AL WASAT <orders@al-wasat.co.uk>',
      to: customerEmail,
      subject: 'Your AL WASAT Order is Confirmed',
      text: emailText,
    });
    console.log('Confirmation email sent to', customerEmail);
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
