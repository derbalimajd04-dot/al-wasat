/* Order confirmation email — shared by the Stripe webhook (order-confirm) and
   the success-page fallback (send-confirmation).

   Both paths can fire for the same order, and send-confirmation is reachable
   by anyone holding a session id. The PaymentIntent's metadata records that
   the email went out, so each order is confirmed exactly once no matter how
   many times either path runs. Not in a folder Netlify scans as a function:
   directories only become functions when they contain index.js or <dir>.js. */
const { Resend } = require('resend');

const SENT_FLAG = 'aw_confirmation_sent';
const CONTACT_EMAIL = 'jamel.derbali@gmail.com';

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function money(minor) {
  return '£' + ((minor || 0) / 100).toFixed(2);
}

function buildEmail(name, items, total) {
  const rows = items.map(i => `<tr>
        <td style="padding:12px 0;font-size:14px;color:#20251e;border-bottom:1px solid #e1e3da">${esc(i.description)} &times; ${i.quantity || 1}</td>
        <td style="padding:12px 0;font-size:14px;color:#20251e;text-align:right;border-bottom:1px solid #e1e3da">${money(i.amount_total)}</td>
      </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf9f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f5;padding:40px 16px">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e1e3da">
    <tr><td style="padding:32px 40px;border-bottom:1px solid #20251e">
      <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#20251e">Al Wasat</p>
    </td></tr>
    <tr><td style="padding:36px 40px 20px">
      <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;line-height:1.2;color:#20251e">Order confirmed</h1>
      <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#52594d">Thank you, ${esc(name)}. We have received your payment. Estimated delivery is 5&ndash;7 working days, and we will send tracking details once your order is dispatched.</p>
    </td></tr>
    <tr><td style="padding:0 40px">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${rows}
        <tr>
          <td style="padding:16px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#425139">Total</td>
          <td style="padding:16px 0 0;font-size:18px;color:#20251e;text-align:right">${total}</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:32px 40px;font-size:14px;line-height:1.7;color:#52594d">
      Questions about your order? Reply to this email or write to <a href="mailto:${CONTACT_EMAIL}" style="color:#425139">${CONTACT_EMAIL}</a>.
    </td></tr>
    <tr><td style="padding:20px 40px;border-top:1px solid #e1e3da;font-size:12px;color:#61665b">
      AL WASAT &middot; Extra Virgin Olive Oil &middot; Sfax, Tunisia &middot; <a href="https://al-wasat.co.uk" style="color:#61665b">al-wasat.co.uk</a>
    </td></tr>
  </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Dear ${name},`,
    '',
    'Thank you for your order with AL WASAT. We have received your payment and your order is confirmed.',
    '',
    ...items.map(i => `  • ${i.description} × ${i.quantity || 1} — ${money(i.amount_total)}`),
    '',
    `Total: ${total}`,
    '',
    'Estimated delivery: 5–7 working days. We will send tracking details once your order is dispatched.',
    `Questions? Reply to this email or write to ${CONTACT_EMAIL}.`,
    '',
    'AL WASAT — https://al-wasat.co.uk',
  ].join('\n');

  return { html, text };
}

/* Returns a short status string; never throws for an already-sent order. */
async function sendOrderConfirmation(stripe, sessionId, { trusted = false } = {}) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });

  if (session.payment_status !== 'paid') return 'not-paid';

  const email = session.customer_details && session.customer_details.email;
  if (!email) return 'no-email';

  /* Without a PaymentIntent (e.g. a fully discounted order) there is nowhere
     to record the send, so only the signed webhook may send it. */
  const pi = session.payment_intent;
  if (!pi || typeof pi !== 'object') {
    if (!trusted) return 'skipped';
  } else if (pi.metadata && pi.metadata[SENT_FLAG]) {
    return 'already-sent';
  }

  /* Claim the order before sending so a second caller sees the flag. */
  if (pi && typeof pi === 'object') {
    await stripe.paymentIntents.update(pi.id, { metadata: { [SENT_FLAG]: new Date().toISOString() } });
  }

  const name = (session.customer_details && session.customer_details.name) || 'valued customer';
  const items = (session.line_items && session.line_items.data) || [];
  const { html, text } = buildEmail(name, items, money(session.amount_total));

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AL WASAT <orders@al-wasat.co.uk>',
      to: email,
      replyTo: CONTACT_EMAIL,
      subject: 'Your AL WASAT order is confirmed',
      html,
      text,
    });
  } catch (err) {
    /* Release the claim so the other path can retry. */
    if (pi && typeof pi === 'object') {
      await stripe.paymentIntents.update(pi.id, { metadata: { [SENT_FLAG]: '' } }).catch(() => {});
    }
    throw err;
  }
  return 'sent';
}

module.exports = { sendOrderConfirmation };
