const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path'), fs=require('fs');
(async()=>{
  const [,,mode,...ts]=process.argv; // mode: stills <t...> | all <fps> <dur>
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  page.on('console',m=>console.log('console:',m.text())); page.on('pageerror',e=>console.log('pageerror:',e.message));
  await page.goto('file://'+path.resolve('site/index.html')); await page.evaluate(()=>window.ready);
  if(mode==='stills'){ fs.mkdirSync('stills',{recursive:true});
    for(const t of ts){ await page.evaluate(t=>render(t),+t); await page.screenshot({path:`stills/t${(+t).toFixed(2)}.png`}); } }
  else { const fps=+ts[0], dur=+ts[1]; fs.mkdirSync('frames',{recursive:true});
    for(let f=0; f<Math.round(fps*dur); f++){ await page.evaluate(t=>render(t),f/fps); await page.screenshot({path:`frames/f${String(f).padStart(4,'0')}.png`}); } }
  await browser.close();
})();
