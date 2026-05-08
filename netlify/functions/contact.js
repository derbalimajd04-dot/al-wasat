const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, organisation, email, enquiry, message, _honeypot } = body;

  if (_honeypot) return { statusCode: 200, body: 'OK' };
  if (!name || !email || !enquiry) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('contact: missing RESEND_API_KEY');
    return { statusCode: 500, body: 'Service not configured' };
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0A0906;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0906;padding:48px 20px">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#110F0C;border:1px solid rgba(201,169,110,0.12)">
    <tr><td style="padding:32px 48px;border-bottom:1px solid rgba(201,169,110,0.12);text-align:center">
      <p style="margin:0;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#C9A96E">AL WASAT</p>
      <p style="margin:4px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,169,110,0.35)">New Enquiry</p>
    </td></tr>
    <tr><td style="padding:32px 48px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A96E;width:120px">Name</td><td style="padding:8px 0;font-size:14px;color:#F5F0E8">${name}</td></tr>
        ${organisation ? `<tr><td style="padding:8px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A96E">Organisation</td><td style="padding:8px 0;font-size:14px;color:#F5F0E8">${organisation}</td></tr>` : ''}
        <tr><td style="padding:8px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A96E">Email</td><td style="padding:8px 0;font-size:14px;color:#F5F0E8"><a href="mailto:${email}" style="color:#C9A96E;text-decoration:none">${email}</a></td></tr>
        <tr><td style="padding:8px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A96E">Enquiry</td><td style="padding:8px 0;font-size:14px;color:#F5F0E8">${enquiry}</td></tr>
        ${message ? `<tr><td colspan="2" style="padding:24px 0 0"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A96E">Message</p><p style="margin:8px 0 0;font-size:14px;color:#BEB49A;line-height:1.8">${message.replace(/\n/g, '<br>')}</p></td></tr>` : ''}
      </table>
    </td></tr>
    <tr><td style="padding:24px 48px;text-align:center;border-top:1px solid rgba(201,169,110,0.08)">
      <p style="margin:0;font-size:11px;color:#3A3028">&copy; 2026 AL WASAT. All rights reserved.</p>
    </td></tr>
  </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AL WASAT <orders@al-wasat.co.uk>',
      to: 'jamel.derbali@gmail.com',
      replyTo: email,
      subject: `AL WASAT Enquiry — ${enquiry} from ${name}`,
      html,
    });
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('contact error:', err.message);
    return { statusCode: 500, body: 'Failed to send' };
  }
};
