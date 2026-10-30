import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 5173;
const host = process.env.HOST || '0.0.0.0';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function lanAddresses() {
  const out = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const info of list || []) {
      if (info.family === 'IPv4' && !info.internal) out.push(info.address);
    }
  }
  return out;
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = normalize(join(root, urlPath === '/' ? 'index.html' : urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': types[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${port} đang bận. Chạy cổng khác: PORT=5174 npm start`);
    process.exit(1);
  }
  throw err;
});

server.listen(port, host, () => {
  console.log('TTS.Co 3D office đang chạy:');
  console.log(`  Máy tính:              http://localhost:${port}`);
  for (const ip of lanAddresses()) {
    console.log(`  iPhone (cùng Wi-Fi):   http://${ip}:${port}`);
  }
  console.log('Nếu điện thoại không mở được: cho phép Node.js trong Windows Firewall (mạng Private).');
});
