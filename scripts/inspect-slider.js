const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://practicesoftwaretesting.com/');
  await page.waitForLoadState('networkidle');

  const elements = await page.$$eval('[data-test]', els =>
    els.map(el => ({
      tag: el.tagName,
      dataTest: el.getAttribute('data-test'),
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      type: el.getAttribute('type'),
    }))
  );
  console.log('=== DATA-TEST ELEMENTS ===');
  console.log(JSON.stringify(elements, null, 2));

  const sliders = await page.$$eval('input, [role=slider]', els =>
    els.map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaValuenow: el.getAttribute('aria-valuenow'),
      ariaValuemin: el.getAttribute('aria-valuemin'),
      ariaValuemax: el.getAttribute('aria-valuemax'),
      class: el.className,
    }))
  );
  console.log('\n=== SLIDER / INPUT ELEMENTS ===');
  console.log(JSON.stringify(sliders, null, 2));

  await browser.close();
})();
