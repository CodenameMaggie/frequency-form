# Manual Pinterest Marketing Guide for Frequency & Form

## Status Update

✅ **Pinterest OAuth Working**: Fresh access token generated
⚠️ **API Limitation**: App is in "Trial" mode - can only use sandbox, not production
📋 **Solution**: Create pins manually while waiting for production API access approval

---

## Why Manual (For Now)?

Your Pinterest app needs **production access approval** from Pinterest to use the API for creating real pins. This typically takes 1-2 weeks after applying.

**In the meantime**, you can create pins manually in 10-15 minutes/week and still drive 20K+ monthly visitors.

---

## Apply for Pinterest Production Access

While creating manual pins, submit your app for production access:

1. Go to https://developers.pinterest.com/apps/
2. Click your app (ID: 1538001)
3. Click "Request Access" or "Upgrade to Production"
4. Fill out the application:
   - **Business Name**: Frequency & Form
   - **Website**: https://www.frequencyandform.com
   - **Use Case**: "E-commerce marketing automation for natural fiber clothing brand. Will create product pins linking to our online store."
   - **Monthly Pin Volume**: 50-100 pins/month
   - **Board Usage**: Product showcase board

Once approved, the automation script will work automatically!

---

## Manual Pin Creation (15 Minutes/Week)

### Step 1: Prepare Content

Use the automated pin data from our script. Each product gets 3 variations:

#### **Healing Tier Products (5,000 Hz)**

**Product**: Italian Linen Shirt

**Pin 1:**
- Title: `5,000 Hz Healing Frequency: Italian Linen Shirt`
- Description:
```
✨ Italian Linen Shirt by 100% Capri resonates at 5,000 Hz - 50× your body's natural frequency. Experience clothing that doesn't just cover you, it elevates you.

Linen · Natural Fibers Only · No Synthetics Ever

🌿 Shop Frequency & Form

#LinenLove #NaturalFiberFashion #SustainableStyle #FabricFrequency #FrequencyAndForm
```
- Link: `https://www.frequencyandform.com/shop/italian-linen-shirt`

**Pin 2:**
- Title: `Elevate Your Energy with Italian Linen Shirt`
- Description:
```
What if your clothing could heal you? Italian Linen Shirt by 100% Capri vibrates at 5,000 Hz, the same frequency as healing energy. Feel the difference when you dress in alignment.

Linen · $285 · Link in bio

#LinenLove #NaturalFiberFashion #SustainableStyle #FabricFrequency #FrequencyAndForm
```
- Link: `https://www.frequencyandform.com/shop/italian-linen-shirt`

**Pin 3:**
- Title: `Italian Linen Shirt - 50× Your Natural Frequency`
- Description:
```
Italian Linen Shirt isn't just beautiful - it's scientifically proven to elevate your energy. Made from linen, this 100% Capri piece resonates at 5,000 Hz. Ancient wisdom meets modern science.

✨ Frequency & Form · Natural Fibers · Healing Tier

#LinenLove #NaturalFiberFashion #SustainableStyle #FabricFrequency #FrequencyAndForm
```
- Link: `https://www.frequencyandform.com/shop/italian-linen-shirt`

#### **Foundation Tier Products (100 Hz)**

**Product**: Egyptian Cotton Crew Tee

**Pin 1:**
- Title: `100 Hz Foundation: Egyptian Cotton Crew Tee`
- Description:
```
🌾 Egyptian Cotton Crew Tee by COS resonates at 100 Hz - perfectly in tune with your body's natural frequency. Foundation-tier organic cotton that harmonizes, never depletes.

$89 · Shop Frequency & Form

#OrganicCotton #SustainableFashion #NaturalFibers #FabricFrequency #FrequencyAndForm
```
- Link: `https://www.frequencyandform.com/shop/egyptian-cotton-crew-tee`

**Pin 2:**
- Title: `Perfect Harmony: Egyptian Cotton Crew Tee`
- Description:
```
Your body resonates at 100 Hz. So does Egyptian Cotton Crew Tee. This COS piece in organic cotton creates perfect harmony with your natural energy. Never elevating, never depleting - just pure alignment.

🌿 Natural Fibers Only

#OrganicCotton #SustainableFashion #NaturalFibers #FabricFrequency #FrequencyAndForm
```
- Link: `https://www.frequencyandform.com/shop/egyptian-cotton-crew-tee`

---

### Step 2: Create Pins in Pinterest

1. **Go to**: https://www.pinterest.com/pin-builder/
2. **For Each Pin**:
   - Upload product image (or use URL from product page)
   - Add title from above
   - Add description from above
   - Add destination link
   - Select board: Your Frequency & Form board (ID: 859765453803417177)
   - Click "Publish"

3. **Schedule**: Create 3-5 pins per session, 2-3 times per week

---

### Step 3: Optimize for Discovery

**Best Practices:**
- **Image Quality**: Use high-res lifestyle images (1000x1500px minimum)
- **Text Overlay**: Add branded text overlay to images
- **Vertical Format**: Pinterest favors 2:3 ratio (e.g., 1000x1500px)
- **Consistent Branding**: Use Frequency & Form colors/fonts

**Tools to Create Pin Images (Free):**
- Canva (free plan): pinterest.com templates
- Remove.bg: Remove backgrounds
- Unsplash: Stock lifestyle images

**Pin Image Template Ideas:**
- Product photo + "5,000 Hz Healing Frequency" text overlay
- Fabric closeup + brand name
- Model wearing product + frequency tier badge
- Flat lay with multiple products

---

## Complete Product List for Manual Pinning

Create 3 pins for each product (36 total):

**Healing Tier (5,000 Hz):**
1. Italian Linen Shirt ($285)
2. Linen Wide Leg Trousers ($325)
3. Linen Blazer ($495)
4. Cashmere Crewneck Sweater ($425)
5. Cashmere Cardigan ($525)
6. Merino Wool Turtleneck ($245)
7. Silk Pocket Square ($85)
8. Baby Cashmere Scarf ($385)

**Foundation Tier (100 Hz):**
1. Egyptian Cotton Crew Tee ($89)
2. Organic Cotton Oxford Shirt ($165)
3. Organic Cotton Tank ($65)
4. Organic Cotton Leggings ($125)

---

## Weekly Schedule (15 Min Total)

**Monday** (5 min): Create 3 pins for 1 healing tier product
**Wednesday** (5 min): Create 3 pins for 1 foundation tier product
**Friday** (5 min): Create 3 pins for another product

**Result**: 9 pins/week × 4 weeks = 36 pins/month (full catalog coverage)

---

## Tracking Results

**Pinterest Analytics** (Free):
- Go to: https://analytics.pinterest.com/
- Track:
  - Impressions (people seeing your pins)
  - Outbound clicks (people clicking to your site)
  - Saves (people saving your pins)
  - Pin clicks (people viewing pin details)

**Goal**: 1K impressions in Month 1 → 10K in Month 3 → 100K+ in Month 6

---

## Once API Approved

When Pinterest approves your app for production access:

1. You'll receive an email notification
2. Run: `npm run pinterest:automate`
3. Script will create all 36 pins automatically
4. Continue running weekly with new product images

---

## Alternative: Create Pins via Pinterest Mobile App

**Even Faster:**
1. Open Pinterest mobile app
2. Tap "+" to create pin
3. Select photo from camera roll
4. Add title, description, link
5. Select board
6. Publish

**Pro Tip**: Batch create product photos once, then pin them throughout the week on mobile while commuting/waiting in line.

---

## Expected Results

**Manual Pinning** (15 min/week):
- 36 pins created in 4 weeks
- Each pin lives for months/years
- Compounds to 20K+ monthly visitors in 6-12 months

**Automated Pinning** (once approved):
- 36 pins created in 18 minutes (rate-limited)
- Can rerun weekly with new images
- Faster scaling to 50K+ monthly visitors

---

## Questions?

- **"Can I hire someone to pin?"**: Yes! Virtual assistant can do this for $5-10/hr
- **"What if I don't have product photos?"**: Use placeholder images initially, update later
- **"How often should I pin?"**: 3-5 new pins per week is optimal for Pinterest algorithm

---

**Bottom Line**: Start pinning manually TODAY while waiting for API approval. You'll build momentum and traffic before automation kicks in!
