// Mirrors PROMO_CODES in create-checkout.js
const PROMO_CODES = {
  'WELCOME10': { pct: 10, label: '10% off your order' },
  'ALWASAT15': { pct: 15, label: '15% off your order' },
};

exports.handler = async (event) => {
  const code = ((event.queryStringParameters || {}).code || '').toUpperCase().trim();
  const match = PROMO_CODES[code];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(match ? { valid: true, code, pct: match.pct, label: match.label } : { valid: false }),
  };
};
