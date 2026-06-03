import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import { log } from './logger.js';
import { LeadStore } from './db.js';
import { suppression, verifyUnsubToken } from './suppression.js';

const SAFE_ID = /^[A-Za-z0-9_-]+$/;
// 1x1 transparent GIF.
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:80px auto;padding:0 20px;color:#1c1c1c;line-height:1.6;text-align:center}h1{color:#1f3a5f}</style>
</head><body>${body}</body></html>`;
}

function handleUnsubscribe(url: URL, res: ServerResponse) {
  const e = url.searchParams.get('e') ?? '';
  const t = url.searchParams.get('t') ?? '';
  let email = '';
  try {
    email = Buffer.from(e, 'base64url').toString('utf8');
  } catch {
    /* ignore */
  }

  if (!email || !verifyUnsubToken(email, t)) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(page('Invalid link', '<h1>Invalid unsubscribe link</h1><p>Please contact us directly.</p>'));
    return;
  }

  suppression.add(email, 'unsubscribe-link');
  // Best-effort: also flag the matching lead so reporting/follow-ups reflect it.
  const store = new LeadStore();
  const lead = store.query((l) => l.email?.toLowerCase() === email.toLowerCase())[0];
  if (lead) store.upsert({ id: lead.id, unsubscribedAt: new Date().toISOString() });

  log.info(`Unsubscribe: ${email}`);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(
    page(
      'Unsubscribed',
      `<h1>You're unsubscribed ✓</h1><p><b>${email}</b> won't receive any more emails from us. Sorry for the intrusion!</p>`,
    ),
  );
}

function handleDemo(id: string, res: ServerResponse) {
  if (!SAFE_ID.test(id)) {
    res.writeHead(400).end('Bad request');
    return;
  }
  const file = join('data', 'demos', id, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(page('Not found', '<h1>404</h1><p>No demo here.</p>'));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(readFileSync(file));
}

function handleOpen(id: string, res: ServerResponse) {
  const cleanId = id.replace(/\.gif$/, '');
  if (SAFE_ID.test(cleanId)) {
    const store = new LeadStore();
    const lead = store.get(cleanId);
    if (lead && !lead.openedAt) store.upsert({ id: cleanId, openedAt: new Date().toISOString() });
  }
  res.writeHead(200, { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' });
  res.end(PIXEL);
}

function router(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', config.server.baseUrl);
  const path = url.pathname;

  // One-click unsubscribe (RFC 8058) POSTs to the same URL.
  if (path === '/u') return handleUnsubscribe(url, res);

  if (path.startsWith('/d/')) {
    const id = path.slice(3).replace(/\/(index\.html)?$/, '');
    return handleDemo(id, res);
  }
  if (path.startsWith('/t/o/')) return handleOpen(path.slice(5), res);

  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return void res.end(page('leadgen-fetch', '<h1>leadgen-fetch</h1><p>Server is running.</p>'));
  }

  res.writeHead(404).end('Not found');
}

export function startServer() {
  const server = createServer(router);
  server.listen(config.server.port, () => {
    log.ok(`Server listening on ${config.server.baseUrl} (port ${config.server.port})`);
    log.info(`  demos → ${config.server.baseUrl}/d/<id>/   unsubscribe → ${config.server.baseUrl}/u`);
  });
  return server;
}
