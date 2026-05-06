const Stripe = require('stripe');
const { Resend } = require('resend');

exports.handler = async (event) => {
  const sessionId = (event.queryStringParameters || {}).session_id || '';
  if (!sessionId.startsWith('cs_')) {
    return { statusCode: 400, body: 'Missing session_id' };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    // Only send if actually paid
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return { statusCode: 200, body: 'Not yet paid' };
    }

    const email = (session.customer_details || {}).email;
    if (!email) return { statusCode: 200, body: 'No email on session' };

    const name  = (session.customer_details || {}).name || 'Valued Customer';
    const total = '£' + (session.amount_total / 100).toFixed(2);

    const itemsHtml = ((session.line_items || {}).data || []).map(item =>
      `<tr>
        <td style="padding:10px 0;font-size:13px;color:#BEB49A;border-bottom:1px solid rgba(201,169,110,0.08)">${item.description}</td>
        <td style="padding:10px 0;font-size:13px;color:#F5F0E8;text-align:right;border-bottom:1px solid rgba(201,169,110,0.08)">&pound;${(item.amount_total / 100).toFixed(2)}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0906;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0906;padding:48px 20px">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#110F0C;border:1px solid rgba(201,169,110,0.12)">

    <!-- Header -->
    <tr><td style="padding:40px 48px 32px;text-align:center;border-bottom:1px solid rgba(201,169,110,0.12)">
      <p style="margin:0;font-family:Georgia,serif;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#C9A96E">AL WASAT</p>
      <p style="margin:4px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,169,110,0.35)">Extra Virgin Olive Oil &middot; Tunisia</p>
    </td></tr>

    <!-- Title -->
    <tr><td style="padding:40px 48px 24px;text-align:center">
      <h1 style="margin:0;font-size:30px;font-weight:300;color:#F5F0E8;letter-spacing:1px">Order <em style="color:#C9A96E;font-style:italic">Confirmed</em></h1>
      <p style="margin:16px 0 0;font-size:14px;color:#8B7355;line-height:1.8">Thank you, ${name}. Your order is confirmed<br>and will be dispatched within 1&ndash;2 working days.</p>
    </td></tr>

    <!-- Items -->
    <tr><td style="padding:0 48px">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
        <tr>
          <td style="padding:16px 0 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C9A96E">Total</td>
          <td style="padding:16px 0 0;font-size:18px;color:#F5F0E8;text-align:right">${total}</td>
        </tr>
      </table>
    </td></tr>

    <!-- Body copy -->
    <tr><td style="padding:32px 48px;font-size:13px;color:#6B5D50;line-height:1.9;border-top:1px solid rgba(201,169,110,0.08);margin-top:24px">
      <p style="margin:0">You'll receive a separate dispatch notification with your tracking details. If you have any questions, reply to this email or contact us at <a href="mailto:orders@al-wasat.co.uk" style="color:#C9A96E;text-decoration:none">orders@al-wasat.co.uk</a>.</p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 48px;text-align:center;border-top:1px solid rgba(201,169,110,0.08)">
      <p style="margin:0;font-size:11px;color:#3A3028">&copy; 2026 AL WASAT. All rights reserved.</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'AL WASAT <orders@al-wasat.co.uk>',
      to: email,
      subject: 'Your AL WASAT order is confirmed',
      html,
    });

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    // Log but don't surface — a failed email shouldn't break the success page
    console.error('send-confirmation error:', err.message);
    return { statusCode: 500, body: err.message };
  }
};
