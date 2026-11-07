const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
fs.mkdirSync('/tmp/ax-test-results', { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  let checks = 0;
  try {
    for (const port of [5173, 4173]) {
      for (const width of [1440, 768, 390, 320]) {
        const origin = `http://127.0.0.1:${port}`;
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [], bad = [], external = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
        page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') external.push(r.url()); });
        assert.equal((await page.goto(origin, { waitUntil: 'networkidle' })).status(), 200);
        assert.match(await page.title(), /AX러닝랩/);
        assert.equal(await page.locator('h1').innerText(), 'AI로 바꾸는\n일하는 방식.');
        assert.equal(await page.locator('.service-card').count(), 4);
        assert.equal(await page.locator('.course').count(), 3);
        assert.deepEqual(await page.locator('main > section').evaluateAll(els => els.map(el => el.id)), ['home', 'courses', 'services', 'about', 'contact']);
        for (const course of await page.locator('.course').all()) {
          assert.deepEqual(await course.locator('dt').allTextContents(), ['이런 분께', '배울 내용', '업무 적용 예시']);
          assert.equal(await course.locator('li').count(), 3);
          const href = new URL(await course.locator('a').getAttribute('href'));
          const name = await course.locator('h3').innerText();
          assert.equal(href.pathname, 'contact@example.com');
          assert.ok(href.searchParams.get('subject').includes(name));
          assert.ok(href.searchParams.get('body').includes(`관심 과정: ${name}`));
        }
        const general = new URL(await page.locator('.inquiry-link').getAttribute('href'));
        for (const field of ['회사명 / 담당자:', '관심 과정: 미정', '교육 대상 / 인원:', '교육 목표 / 업무 과제:', '희망 일정:', '희망 진행 방식:']) {
          assert.ok(general.searchParams.get('body').includes(field), field);
        }
        for (const hash of ['#courses', '#services', '#about']) {
          await page.locator(`nav a[href="${hash}"]`).click();
          await page.waitForFunction(h => location.hash === h, hash);
          const top = await page.locator(hash).evaluate(el => el.getBoundingClientRect().top);
          const headerBottom = await page.locator('.header').evaluate(el => el.getBoundingClientRect().bottom);
          assert.ok(top >= headerBottom - 1 && top <= headerBottom + 30, `${width} ${hash}: ${top} / ${headerBottom}`);
        }
        if (width <= 700) {
          assert.ok(await page.locator('.mobile-contact').isVisible());
          await page.locator('.mobile-contact a').click();
          assert.equal(new URL(page.url()).hash, '#contact');
          assert.equal(await page.locator('.course-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1);
        } else {
          assert.equal(await page.locator('.mobile-contact').isVisible(), false);
        }
        await page.locator('.nav-cta').click();
        assert.equal(new URL(page.url()).hash, '#contact');
        for (const link of await page.locator('a[href^="mailto:"]').all()) {
          assert.equal(new URL(await link.getAttribute('href')).pathname, 'contact@example.com');
        }
        // Exercise the real browser clipboard; simulate only the permission-denied branch.
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.locator('.copy-email').click();
        await page.waitForFunction(() => document.querySelector('#copy-status').textContent.includes('복사했습니다'));
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'contact@example.com');
        await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('permission denied'); } } }));
        await page.locator('.copy-email').click();
        await page.waitForFunction(() => document.querySelector('#copy-status').textContent.includes('복사하지 못했습니다'));
        await page.evaluate(() => { document.querySelector('#copy-status').textContent = ''; });
        assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(els => els.filter(el => !document.querySelector(el.hash)).map(el => el.hash)), []);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`);
        await page.locator('.back-top').click();
        await page.waitForFunction(() => location.hash === '#home');
        assert.ok(await page.locator('.visual').isVisible());
        assert.ok(await page.locator('.core').evaluate(el => getComputedStyle(el).backgroundImage.includes('gradient')));
        assert.equal(await page.locator('.core').evaluate(el => getComputedStyle(el).animationName), 'none');
        const icon = await page.request.get(`${origin}/favicon.svg`);
        assert.equal(icon.status(), 200);
        assert.match(await icon.text(), /<svg/);
        // Confirm both normal animation and reduced-motion behavior.
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        assert.equal(await page.locator('.core').evaluate(el => getComputedStyle(el).animationName), 'float');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.screenshot({ path: `/tmp/ax-test-results/${port}-${width}.png`, fullPage: true });
        assert.deepEqual(errors, []);
        assert.deepEqual(bad, []);
        assert.deepEqual(external, []);
        checks++;
        console.log(`PASS ${port}: ${width}px — course comparison, navigation, mail template, copy success/failure, mobile CTA, visual, motion, assets, overflow, no external requests`);
        await context.close();
      }
    }
    // Essential content and fallback email links must remain usable without JavaScript.
    const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    await page.goto('http://127.0.0.1:4173');
    assert.equal(await page.locator('.course').count(), 3);
    for (const a of await page.locator('[data-course]').all()) {
      assert.ok(new URL(await a.getAttribute('href')).searchParams.get('subject').includes('과정'));
    }
    await page.close();
    console.log(`${checks} browser scenarios + no-JavaScript fallback passed`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
