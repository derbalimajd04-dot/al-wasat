const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function element() {
  const attributes = new Map();
  const classes = new Set();
  const handlers = new Map();
  return {
    style: {},
    attributes,
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
      toggle(value, force) {
        const on = force === undefined ? !classes.has(value) : force;
        if (on) classes.add(value); else classes.delete(value);
        return on;
      },
    },
    setAttribute(name, value) {
      attributes.set(name, value);
      if (name === 'dir' || name === 'lang' || name === 'id') this[name] = value;
    },
    getAttribute: name => attributes.get(name) ?? null,
    children: [],
    appendChild(child) { this.children.push(child); child.parentNode = this; },
    insertBefore(child) { this.appendChild(child); },
    focus() { this.focused = true; },
    addEventListener(type, handler) {
      if (!handlers.has(type)) handlers.set(type, []);
      handlers.get(type).push(handler);
    },
    dispatchEvent(event) {
      for (const handler of handlers.get(event.type) || []) handler(event);
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

function browser(navigator = { userAgent: 'Version/18.0 Safari/605.1.15' }, options = {}) {
  const storage = new Map();
  const dispatched = [];
  const listeners = new Map();
  const timers = new Map();
  let nextTimer = 0;
  const text = element();
  text.setAttribute('data-i18n', 'nav-home');
  const html = element();
  const nodes = new Map();
  const cards = [];
  if (options.checkout) {
    for (const id of ['coItems', 'coTotal', 'stripeBtn', 'coError', 'checkoutWrap', 'orderSuccess']) nodes.set(id, element());
  }
  if (options.shop) {
    const modal = element();
    modal.querySelector = () => element();
    nodes.set('pdModal', modal);
    for (const id of ['pdmClose', 'pdmInner', 'pdmAdd']) nodes.set(id, element());
    nodes.set('grid', element());
    const card = element();
    card.dataset = { pid: 'classic-500', cat: 'classic 500ml' };
    cards.push(card);
  }
  const document = {
    readyState: 'loading',
    documentElement: html,
    body: element(),
    head: element(),
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener() {},
    dispatchEvent(event) {
      dispatched.push(event);
      for (const handler of listeners.get(event.type) || []) handler(event);
    },
    activeElement: element(),
    contains: () => true,
    getElementById: id => nodes.get(id) || null,
    querySelector: () => null,
    querySelectorAll: selector => selector === '[data-i18n]' ? [text] : selector === '.p-card' ? cards : [],
    createElement: element,
  };
  if (options.setup) options.setup({ document, nodes, cards, element });
  const context = vm.createContext({
    document, navigator, console,
    location: { search: options.search || '', href: '/shop/', replace(url) { this.href = url; } },
    URLSearchParams,
    getComputedStyle: () => ({ gridTemplateColumns: '1fr 1fr' }),
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
    matchMedia: query => ({ matches: Boolean(options.reducedMotion && query.includes('prefers-reduced-motion')), addEventListener() {} }),
    addEventListener() {},
    setTimeout(handler) { timers.set(++nextTimer, handler); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame: () => 1,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  context.window = context;
  function runScript(source, filename = 'inline-page-script.js') {
    return vm.runInContext(source, context, { filename, timeout: 2000 });
  }
  for (const file of ['assets/translations.js', 'script.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'dist', file), 'utf8');
    runScript(source, file);
  }
  function ready() {
    document.readyState = 'interactive';
    for (const handler of listeners.get('DOMContentLoaded') || []) handler();
    document.readyState = 'complete';
  }
  function flushTimers() {
    const pending = [...timers.values()];
    timers.clear();
    for (const handler of pending) handler();
  }
  return { window: context, storage, document, text, dispatched, ready, runScript, nodes, cards, flushTimers };
}

module.exports = { browser };
