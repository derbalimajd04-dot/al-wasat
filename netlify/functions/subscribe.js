const { Resend } = require('resend');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!email || !EMAIL_RE.test(email)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid email address' }) };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('subscribe: RESEND_API_KEY not set');
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Service not configured' }) };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'AL WASAT <orders@al-wasat.co.uk>';

  // Add to Resend audience if configured
  if (process.env.RESEND_AUDIENCE_ID) {
    try {
      await resend.contacts.create({
        audienceId: process.env.RESEND_AUDIENCE_ID,
        email,
        unsubscribed: false,
      });
    } catch (err) {
      console.error('subscribe: failed to add contact:', err.message);
    }
  }

  // Send welcome email
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: 'You\'re on the AL WASAT list',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0906;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0906;padding:48px 20px">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#110F0C;border:1px solid rgba(201,169,110,0.12)">
    <tr><td style="padding:40px 48px 32px;text-align:center;border-bottom:1px solid rgba(201,169,110,0.12)">
      <p style="margin:0;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#C9A96E">AL WASAT</p>
      <p style="margin:4px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,169,110,0.35)">Extra Virgin Olive Oil &middot; Tunisia</p>
    </td></tr>
    <tr><td style="padding:40px 48px 24px;text-align:center">
      <h1 style="margin:0;font-size:28px;font-weight:300;color:#F5F0E8;letter-spacing:1px">You're on the <em style="color:#C9A96E;font-style:italic">list.</em></h1>
      <p style="margin:20px 0 0;font-size:14px;color:#8B7355;line-height:1.9">No noise. No promotions. Only the harvest.<br>We'll be in touch when the 2025 batch is ready.</p>
    </td></tr>
    <tr><td style="padding:24px 48px 40px;text-align:center;border-top:1px solid rgba(201,169,110,0.08)">
      <a href="https://al-wasat.co.uk/shop/" style="display:inline-block;font-family:'Helvetica Neue',sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C9A96E;text-decoration:none;border:1px solid rgba(201,169,110,0.35);padding:14px 32px">View the Collection</a>
    </td></tr>
    <tr><td style="padding:24px 48px;text-align:center;border-top:1px solid rgba(201,169,110,0.08)">
      <p style="margin:0;font-size:11px;color:#3A3028">&copy; 2026 AL WASAT. All rights reserved.</p>
    </td></tr>
  </table>
  </td></tr>
</table>
</body>
</html>`,
    });
  } catch (err) {
    console.error('subscribe: failed to send welcome email:', err.message);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to send confirmation' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
