# Generate Pinterest API Token for Frequency & Form

## Quick Start

Your Pinterest token has expired. Follow these steps to generate a new one:

### Option 1: Simple Token Generation (Recommended)

1. **Go to Pinterest Developers Console:**
   https://developers.pinterest.com/apps/

2. **Select or Create App:**
   - If you have an existing app for Frequency & Form, select it
   - Otherwise, click "Create app" and name it "Frequency & Form Marketing"

3. **Generate Access Token:**
   - Go to the app dashboard
   - Find the "Access token" section
   - Click "Generate token"
   - **IMPORTANT:** Select these scopes:
     - ✓ `boards:read`
     - ✓ `boards:write`
     - ✓ `pins:read`
     - ✓ `pins:write`
     - ✓ `user_accounts:read`

4. **Copy the Token:**
   - Copy the generated token (starts with `pina_`)

5. **Update .env.local:**
   ```bash
   # Open .env.local and replace the PINTEREST_ACCESS_TOKEN value
   PINTEREST_ACCESS_TOKEN=paste_your_new_token_here
   ```

6. **Get Your Board ID (if needed):**
   ```bash
   npm run pinterest:boards
   ```
   This will list all your Pinterest boards and their IDs.

7. **Test the Connection:**
   ```bash
   # This should show your boards without errors
   npm run pinterest:boards
   ```

8. **Run the Automation:**
   ```bash
   # Creates 36 pins (3 variations × 12 products)
   npm run pinterest:automate
   ```

---

## Option 2: OAuth Flow (More Complex)

If the simple token generation doesn't work, you need full OAuth:

### Prerequisites:
```bash
npm install open
```

### Steps:
1. Copy the `pinterest-auth.js` script from modern-business-mum:
   ```bash
   cp ~/modern-business-mum/scripts/pinterest-auth.js scripts/
   ```

2. Add Pinterest App credentials to .env.local:
   ```bash
   PINTEREST_APP_ID=your_app_id
   PINTEREST_APP_SECRET=your_app_secret
   ```

3. Run the OAuth flow:
   ```bash
   node scripts/pinterest-auth.js
   ```

4. Browser will open for authorization
5. Copy the generated token to .env.local

---

## Troubleshooting

### "Authentication failed" Error
- Token is expired → Generate new token (Option 1 above)
- Token missing scopes → Regenerate with all 5 scopes
- Wrong Pinterest account → Make sure you're logged into the correct Pinterest account

### "Board not found" Error
- Run `npm run pinterest:boards` to see available boards
- Update PINTEREST_BOARD_ID in .env.local with correct board ID

### App Not Approved
- Pinterest may require app review for production use
- For testing, use your personal account
- Apply for production access at: https://developers.pinterest.com/docs/getting-started/set-up-app/

---

## Current Token Status

❌ **Token Expired:** Previous token from modern-business-mum is no longer valid

📅 **Action Required:** Generate new token using Option 1 above

---

## Once Token is Updated

The automation will create 36 optimized pins:
- 12 products × 3 variations each
- SEO-optimized titles and descriptions
- Branded hashtags: #FrequencyAndForm #FabricFrequency
- Fabric-specific hashtags: #LinenLove #OrganicCotton
- Links directly to product pages on www.frequencyandform.com
- Rate-limited to stay within Pinterest API limits (30s between pins)

**Expected Results:**
- 20K+ monthly organic visitors within 3-6 months
- Pins live for months/years driving continuous traffic
- Zero cost marketing channel

---

## Next Steps After Token Generation

1. ✅ Generate new Pinterest token
2. ✅ Update .env.local
3. ✅ Test connection: `npm run pinterest:boards`
4. ✅ Run automation: `npm run pinterest:automate`
5. ✅ Monitor Pinterest analytics for traffic growth
6. ✅ Rerun automation weekly with new product images
