/* Chrome gets native scrolling; Safari keeps its existing scroll behavior.
   Prefer browser brands so other Chromium browsers aren't opted in. Chrome
   on iOS uses WebKit and deliberately stays on the existing path. */
export const chromePerformance = (() => {
  const brands = navigator.userAgentData && navigator.userAgentData.brands;
  if (brands && brands.length) return brands.some(b => b.brand === 'Google Chrome');
  return /\bChrome\/\d+/.test(navigator.userAgent || '') &&
    !/\b(?:Edg|OPR|SamsungBrowser|Vivaldi|Chromium)\//.test(navigator.userAgent || '') &&
    !navigator.brave;
})();
if (chromePerformance) document.documentElement.classList.add('chrome-performance');
