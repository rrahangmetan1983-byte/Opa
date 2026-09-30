import http from 'node:http';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCallback);
const root = dirname(fileURLToPath(import.meta.url));
const production = process.env.NODE_ENV !== 'development';
const port = Number(process.env.PORT || 3000);
const origin = new URL(process.env.PUBLIC_ORIGIN || 'http://localhost:' + port).origin;
if (production && (!process.env.PUBLIC_ORIGIN || !origin.startsWith('https://'))) {
  throw new Error('Stel PUBLIC_ORIGIN in op het HTTPS-adres van de besloten site.');
}
const normalize = value => value.trim().normalize('NFKC').toLocaleLowerCase('nl').replace(/\s+/g, ' ');
const answer = normalize(process.env.ACCESS_ANSWER || '');
if (!answer || answer.length > 200) throw new Error('Stel ACCESS_ANSWER in via een servergeheim (1–200 tekens).');
const salt = randomBytes(32);
const expected = await scrypt(answer, salt, 64);
delete process.env.ACCESS_ANSWER;
const cookieName = production ? '__Host-opa_session' : 'opa_session_dev';
const lifetime = 4 * 60 * 60 * 1000;
const sessions = new Map();
const attempts = new Map();
const tokens = new Map();
const attemptWindow = 15 * 60 * 1000;
let activeChecks = 0;
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of sessions) if (expiry <= now) sessions.delete(key);
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  for (const [key, expiry] of tokens) if (expiry <= now) tokens.delete(key);
}, 60_000);
cleanup.unref();
const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  ...(production ? { 'Strict-Transport-Security': 'max-age=31536000' } : {})
};
const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${production ? '; Secure' : ''}`;
function send(res, status, body = '', extra = {}) {
  res.writeHead(status, { ...headers, 'Content-Type': 'text/html; charset=utf-8', ...extra });
  res.end(body);
}
function session(req) {
  const match = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='));
  const id = match?.slice(cookieName.length + 1);
  return id && (sessions.get(id) || 0) > Date.now() ? id : null;
}
function loginPage(message = '') {
  // A one-use token stops cross-site form submission, including the first login.
  if (tokens.size >= 5000) return null;
  const token = randomBytes(32).toString('hex');
  tokens.set(token, Date.now() + attemptWindow);
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Toegang · Opa Daniel</title><style>body{margin:0;background:#eef3f8;color:#17324d;font:18px system-ui;display:grid;min-height:100dvh;place-items:center}main{box-sizing:border-box;width:min(92%,440px);padding:30px;background:white;border-radius:20px;box-shadow:0 12px 45px #17324d18}h1{font-size:26px}label{display:block;font-weight:600;margin:24px 0 12px}input,button{box-sizing:border-box;width:100%;padding:14px;font:inherit;border-radius:8px}input{border:1px solid #8096aa}button{margin-top:16px;background:#235a83;color:white;border:0;cursor:pointer}.message{color:#a12b2b}small{display:block;margin-top:18px;line-height:1.5}</style></head><body><main><h1>Opa Daniel</h1><p>Deze familiegeschiedenis is besloten.</p><form method="post" action="/login"><input type="hidden" name="token" value="${token}"><label for="answer">In welke straat woonde opa Daniel?</label><input id="answer" name="answer" type="password" autocomplete="off" maxlength="200" required autofocus><button type="submit">Open de website</button></form>${message ? `<p class="message" role="alert">${message}</p>` : ''}<small>Toegang duurt maximaal vier uur. Vraag de familie om het antwoord.</small></main></body></html>`;
}
async function body(req) {
  let value = '';
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 2048) throw new Error('BODY_TOO_LARGE');
    value += chunk.toString('utf8');
  }
  return new URLSearchParams(value);
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, origin).pathname);
    const id = session(req);
    if (req.method === 'POST') {
      if (req.headers.origin !== origin || !String(req.headers['content-type'] || '').startsWith('application/x-www-form-urlencoded')) {
        return send(res, 403, 'Verzoek geweigerd.');
      }
      if (pathname === '/logout') {
        if (id) sessions.delete(id);
        return send(res, 303, '', { Location: '/', 'Set-Cookie': cookie('', 0) });
      }
      if (pathname !== '/login') return send(res, 404, 'Niet gevonden.');
      // Do not trust client-supplied forwarding headers. A reverse proxy requires its own rate limit.
      const client = req.socket.remoteAddress;
      let rate = attempts.get(client);
      if (!rate || rate.until <= Date.now()) {
        if (attempts.size >= 5000) return send(res, 503, 'Probeer het later opnieuw.');
        rate = { count: 0, until: Date.now() + attemptWindow };
        attempts.set(client, rate);
      }
      if (rate.count >= 5 || activeChecks >= 4) {
        return send(res, 429, 'Te veel pogingen. Probeer het over 15 minuten opnieuw.', { 'Retry-After': '900' });
      }
      const form = await body(req);
      const token = form.get('token');
      const validToken = (tokens.get(token) || 0) > Date.now();
      tokens.delete(token);
      if (!validToken) return send(res, 403, 'Open de toegangspagina opnieuw.');
      rate.count++;
      const supplied = normalize(form.get('answer') || '');
      if (!supplied || supplied.length > 200) return send(res, 400, loginPage('Vul een geldig antwoord in.') || 'Probeer het later opnieuw.');
      activeChecks++;
      let digest;
      try { digest = await scrypt(supplied, salt, 64); } finally { activeChecks--; }
      if (!timingSafeEqual(digest, expected)) return send(res, 401, loginPage('Het antwoord klopt niet.') || 'Probeer het later opnieuw.');
      if (sessions.size >= 5000) return send(res, 503, 'Probeer het later opnieuw.');
      if (id) sessions.delete(id);
      const newId = randomBytes(32).toString('hex');
      sessions.set(newId, Date.now() + lifetime);
      return send(res, 303, '', { Location: '/', 'Set-Cookie': cookie(newId, lifetime / 1000) });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, '', { Allow: 'GET, HEAD, POST' });
    if (!id) {
      if (pathname !== '/' && pathname !== '/login') return send(res, 401, 'Inloggen vereist.');
      const page = loginPage();
      return send(res, page ? 200 : 503, req.method === 'HEAD' ? '' : page || 'Probeer het later opnieuw.');
    }
    const relative = pathname === '/' || pathname === '/index.html' ? 'index.html' : pathname.slice(1);
    if (!(relative === 'index.html' || relative === 'content-guard.js' || relative === 'content-guard.css' || relative.startsWith('assets/'))) {
      return send(res, 404, 'Niet gevonden.');
    }
    const filename = resolve(root, relative);
    if (!filename.startsWith(root + sep)) return send(res, 404, 'Niet gevonden.');
    const actual = await realpath(filename);
    if (relative.startsWith('assets/') && !actual.startsWith(resolve(root, 'assets') + sep)) return send(res, 404, 'Niet gevonden.');
    if (!(await stat(actual)).isFile()) return send(res, 404, 'Niet gevonden.');
    const data = await readFile(actual);
    send(res, 200, req.method === 'HEAD' ? '' : data, { 'Content-Type': mime[extname(actual)] || 'application/octet-stream', 'Content-Length': data.length });
  } catch (error) {
    if (!res.headersSent) send(res, error.message === 'BODY_TOO_LARGE' ? 413 : error.code === 'ENOENT' ? 404 : 400, 'Verzoek niet verwerkt.');
    else res.end();
  }
});
server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log('Besloten familiesite gestart.'));
