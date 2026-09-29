const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path'), fs=require('fs');
(async()=>{
  const [,,fps,a,b]=process.argv.map(Number);
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  await page.goto('file://'+path.resolve('site/index.html')); await page.evaluate(()=>window.ready);
  await page.evaluate(()=>render(1.3));
  for(let f=a; f<b; f++){ const p=`frames/f${String(f).padStart(4,'0')}.png`; 
    await page.evaluate(t=>render(t),f/fps); await page.screenshot({path:p}); }
  await browser.close();
})();
