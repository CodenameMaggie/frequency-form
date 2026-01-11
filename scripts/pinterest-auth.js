import 'dotenv/config';
import http from 'http';
import { URL } from 'url';
import open from 'open';

/**
 * Pinterest OAuth 2.0 Authorization Helper
 *
 * This script helps you obtain a Pinterest access token with the correct scopes:
 * - boards:read, boards:write
 * - pins:read, pins:write
 *
 * Usage:
 * 1. Run: node scripts/pinterest-auth.js
 * 2. Browser will open for authorization
 * 3. After authorization, copy the access token to your .env file
 */

const PINTEREST_APP_ID = process.env.PINTEREST_APP_ID;
const PINTEREST_APP_SECRET = process.env.PINTEREST_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3334/callback';
const PORT = 3334;

// Scopes needed for posting pins
const SCOPES = [
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
  'user_accounts:read'
].join(',');

if (!PINTEREST_APP_ID || !PINTEREST_APP_SECRET) {
  console.error('❌ Error: PINTEREST_APP_ID and PINTEREST_APP_SECRET must be set in .env file');
  process.exit(1);
}

console.log('🔐 Pinterest OAuth 2.0 Authorization\n');
console.log('This will authorize your app with the following scopes:');
console.log('  - boards:read, boards:write');
console.log('  - pins:read, pins:write');
console.log('  - user_accounts:read\n');

// Generate authorization URL
const authUrl = new URL('https://www.pinterest.com/oauth/');
authUrl.searchParams.set('client_id', PINTEREST_APP_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);

// Create temporary server to receive OAuth callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
      console.error(`❌ Authorization failed: ${error}`);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Error: No authorization code received');
      server.close();
      return;
    }

    console.log('✅ Authorization code received. Exchanging for access token...');

    // Exchange authorization code for access token
    try {
      const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      console.log('\n✅ Success! Your Pinterest access token:\n');
      console.log('━'.repeat(80));
      console.log(tokenData.access_token);
      console.log('━'.repeat(80));
      console.log('\n📋 Add this to your .env file as PINTEREST_ACCESS_TOKEN\n');

      if (tokenData.refresh_token) {
        console.log('📋 Refresh Token (save this too):');
        console.log(tokenData.refresh_token);
        console.log('\n');
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>✅ Authorization Successful!</h1>
            <p>Your access token has been generated and printed to the terminal.</p>
            <p>Copy it to your .env file as PINTEREST_ACCESS_TOKEN</p>
            <p style="margin-top: 30px; color: #666;">You can close this window now.</p>
          </body>
        </html>
      `);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);

    } catch (error) {
      console.error('❌ Error exchanging code for token:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>❌ Token Exchange Failed</h1>
            <p>${error.message}</p>
            <p>Check the terminal for details.</p>
          </body>
        </html>
      `);
      server.close();
    }
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Local server started on http://localhost:${PORT}`);
  console.log(`\n🔗 Opening authorization URL in your browser...\n`);
  console.log(`If the browser doesn't open automatically, visit:\n${authUrl.toString()}\n`);

  // Open browser
  open(authUrl.toString()).catch(() => {
    console.log('Could not open browser automatically. Please open the URL manually.');
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process and try again.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
