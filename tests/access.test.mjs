import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

let child, base;
before(async () => {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, NODE_ENV: 'development', PUBLIC_ORIGIN: base, PORT: String(port), ACCESS_ANSWER: 'Tijdelijke Teststraat' }, stdio: ['ignore','pipe','pipe'] });
  await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw new Error('Server start mislukt'); })]);
});
after(async () => { child.kill(); await once(child, 'exit'); });
const request = (path, options = {}) => fetch(base + path, { redirect: 'manual', ...options });
async function login(answer, origin = base) {
  const page = await (await request('/')).text();
  const token = page.match(/name="token" value="([a-f0-9]+)"/)[1];
  return request('/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token, answer }) });
}
test('anonymous visitors receive only the question, never the site or source images', async () => {
  const page = await request('/');
  const html = await page.text();
  assert.match(html, /In welke straat woonde opa Daniel\?/);
  assert.doesNotMatch(html, /Legernummer|171301443|bron_stamboek|const E=/);
  assert.match(page.headers.get('cache-control'), /no-store/);
  for (const path of ['/index.html', '/assets/01-IMG-20210321-WA0012-1-.jpg', '/assets/bron_stamboek_militaire_loopbaan.jpg', '/content-guard.js']) {
    assert.equal((await request(path)).status, 401, path);
  }
  assert.equal((await request('/assets/01-IMG-20210321-WA0012-1-.jpg', { method: 'HEAD' })).status, 401);
});
test('incorrect answer and cross-site submissions do not create sessions', async () => {
  const wrong = await login('verkeerd');
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get('set-cookie'), null);
  assert.equal((await login('Tijdelijke Teststraat', 'https://andere-site.invalid')).status, 403);
  assert.equal((await request('/login', { method:'POST', headers:{ Origin:base, 'Content-Type':'application/x-www-form-urlencoded' }, body:'answer=Tijdelijke+Teststraat&token=verzonnen' })).status, 403);
});
test('valid answer grants protected content; sessions are revoked on logout', async () => {
  const valid = await login('  TIJDELIJKE   TESTSTRAAT  ');
  assert.equal(valid.status, 303);
  const setCookie = valid.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  const Cookie = setCookie.split(';')[0];
  const page = await request('/', { headers: { Cookie } });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Legernummer/);
  assert.equal((await request('/assets/01-IMG-20210321-WA0012-1-.jpg', { headers:{ Cookie } })).status, 200);
  for (const path of ['/server.mjs', '/package.json', '/.git/config', '/qa/responsive.html', '/assets/%2e%2e%2fserver.mjs']) {
    assert.equal((await request(path, { headers:{ Cookie } })).status, 404, path);
  }
  assert.equal((await request('/', { headers:{ Cookie:'opa_session_dev=forged' } })).status, 200);
  assert.doesNotMatch(await (await request('/', { headers:{ Cookie:'opa_session_dev=forged' } })).text(), /Legernummer/);
  const logout = await request('/logout', { method:'POST', headers:{ Cookie, Origin:base, 'Content-Type':'application/x-www-form-urlencoded' }, body:'' });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await request('/assets/01-IMG-20210321-WA0012-1-.jpg', { headers:{ Cookie } })).status, 401);
});
test('repeated guesses are limited, even with a spoofed forwarding header', async () => {
  let response;
  for (let i = 0; i < 6; i++) response = await login('verkeerd');
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '900');
  const spoof = await request('/login', { method:'POST', headers:{ Origin:base, 'Content-Type':'application/x-www-form-urlencoded', 'X-Forwarded-For':'1.2.3.4' }, body:'answer=verkeerd' });
  assert.equal(spoof.status, 429);
});
test('production fails closed without HTTPS origin or a configured answer', () => {
  const env = { ...process.env, NODE_ENV:'production', PUBLIC_ORIGIN:'', ACCESS_ANSWER:'' };
  assert.notEqual(spawnSync(process.execPath, ['server.mjs'], { env }).status, 0);
  env.PUBLIC_ORIGIN = 'https://familie.example.invalid';
  assert.notEqual(spawnSync(process.execPath, ['server.mjs'], { env }).status, 0);
});
