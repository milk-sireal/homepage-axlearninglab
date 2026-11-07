const {chromium}=require('playwright');
require('node:fs').mkdirSync('/tmp/ax-test-results', {recursive:true});
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 let checks=0;
 for(const port of [5173,4173]){
  for(const width of [1440,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   const errors=[],bad=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url()}`)});
   page.on('request',r=>{if(new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url())});
   const response=await page.goto(`http://127.0.0.1:${port}`,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);assert.match(await page.title(),/AX러닝랩/);
   assert.equal(await page.locator('h1').innerText(),'AI로 바꾸는\n일하는 방식.');
   assert.equal(await page.locator('.service-card').count(),4);assert.equal(await page.locator('.course').count(),3);
   for(const hash of ['#about','#services','#courses']){
    await page.locator(`nav a[href="${hash}"]`).click();
    await page.waitForFunction(h=>location.hash===h,hash);
    const top=await page.locator(hash).evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(top>=100&&top<160,`${width} ${hash} top ${top}`);
   }
   await page.locator('.nav-cta').click();assert.equal(new URL(page.url()).hash,'#contact');
   for(const link of await page.locator('a[href^="mailto:"]').all())assert.equal(await link.getAttribute('href'),'mailto:contact@example.com');
   const missing=await page.locator('a[href^="#"]').evaluateAll(els=>els.filter(e=>!document.querySelector(e.hash)).map(e=>e.hash));assert.deepEqual(missing,[]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
   await page.locator('a.back-top').click();await page.waitForFunction(()=>location.hash==='#home');
   assert.ok(await page.locator('.visual').isVisible());assert.ok(await page.locator('.core').evaluate(el=>getComputedStyle(el).backgroundImage.includes('gradient')));
   const icon=await page.request.get(`http://127.0.0.1:${port}/favicon.svg`);assert.equal(icon.status(),200);assert.match(await icon.text(),/<svg/);
   assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);assert.deepEqual(external,[]);
   await page.screenshot({path:`/tmp/ax-test-results/${port}-${width}.png`,fullPage:true});
   checks++;console.log(`PASS ${port}: ${width}px — navigation, email, visual, favicon, overflow, assets, JS, no external requests`);
   await page.close();
  }
 }
 await browser.close();console.log(`${checks} browser scenarios passed`);
})().catch(e=>{console.error(e);process.exit(1)});
