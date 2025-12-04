const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const URL = 'https://www.npo3fm.nl/kominactie/acties/maasland-merry-miles';

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function fetch3FM() {
  return new Promise((resolve, reject) => {
    https.get(URL, res => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.+?)<\/script>/);
        if (!match) return reject('No data found');
        const { campaign } = JSON.parse(match[1]).props.pageProps;
        resolve({
          amount: campaign.collectedAmount,
          target: campaign.targetAmount,
          donations: campaign.donations.map(d => ({
            name: d.name || 'Anoniem',
            message: d.message,
            amount: d.amount
          }))
        });
      });
    }).on('error', reject);
  });
}

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // API endpoint
  if (req.url === '/api' || req.url === '/api/') {
    try {
      const data = await fetch3FM();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(data));
    } catch (e) {
      console.error('Error fetching 3FM data:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e) }));
    }
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const absolutePath = path.join(__dirname, filePath);

  // Security check: prevent directory traversal
  if (!absolutePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  serveStaticFile(absolutePath, res);

}).listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🎉 3FM Serious Request Display Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://[your-ip]:${PORT}`);
  console.log('');
  console.log('📋 Endpoints:');
  console.log(`   Display: http://localhost:${PORT}/`);
  console.log(`   API:     http://localhost:${PORT}/api`);
  console.log('='.repeat(60));
});
