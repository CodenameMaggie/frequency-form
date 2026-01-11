/**
 * Pinterest Automation for Frequency & Form
 * Automatically creates and schedules pins for products
 * Uses Pinterest API v5
 */

import axios from 'axios';
import { PRODUCTS } from '../lib/products';

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN || '';
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID || '';
const BASE_URL = 'https://api.pinterest.com/v5';

interface PinData {
  title: string;
  description: string;
  link: string;
  media_source: {
    source_type: string;
    url: string;
  };
  board_id: string;
}

// Pin templates for different fabric frequencies
const PIN_TEMPLATES = {
  healing: {
    titles: [
      '5,000 Hz Healing Frequency: {productName}',
      'Elevate Your Energy with {productName}',
      '{productName} - 50× Your Natural Frequency',
      'Healing Tier Natural Fiber: {productName}',
    ],
    descriptions: [
      '✨ {productName} by {brand} resonates at 5,000 Hz - 50× your body\'s natural frequency. Experience clothing that doesn\'t just cover you, it elevates you. {fabric} · Natural Fibers Only · No Synthetics Ever\n\n🌿 Shop Frequency & Form',
      'What if your clothing could heal you? {productName} by {brand} vibrates at 5,000 Hz, the same frequency as healing energy. Feel the difference when you dress in alignment.\n\n{fabric} · {price} · Link in bio',
      '{productName} isn\'t just beautiful - it\'s scientifically proven to elevate your energy. Made from {fabric}, this {brand} piece resonates at 5,000 Hz. Ancient wisdom meets modern science.\n\n✨ Frequency & Form · Natural Fibers · Healing Tier',
    ],
  },
  foundation: {
    titles: [
      '100 Hz Foundation: {productName}',
      'Perfect Harmony: {productName}',
      '{productName} - In Tune with Your Body',
      'Foundation Tier Organic Cotton: {productName}',
    ],
    descriptions: [
      '🌾 {productName} by {brand} resonates at 100 Hz - perfectly in tune with your body\'s natural frequency. Foundation-tier organic cotton that harmonizes, never depletes.\n\n{price} · Shop Frequency & Form',
      'Your body resonates at 100 Hz. So does {productName}. This {brand} piece in organic cotton creates perfect harmony with your natural energy. Never elevating, never depleting - just pure alignment.\n\n🌿 Natural Fibers Only',
      'Foundation matters. {productName} by {brand} is crafted from organic cotton that matches your body\'s 100 Hz frequency. Comfortable, breathable, and energetically neutral.\n\n✨ {price} · Frequency & Form',
    ],
  },
};

// Pinterest-optimized keywords for each fabric type
const FABRIC_KEYWORDS = {
  linen: ['#LinenLove', '#NaturalFiberFashion', '#SustainableStyle', '#LinenClothing', '#SlowFashion', '#EcoFashion', '#NaturalFabrics', '#LinenLife'],
  wool: ['#MerinoWool', '#WoolClothing', '#NaturalFibers', '#SustainableFashion', '#WoolLove', '#EthicalFashion'],
  cashmere: ['#CashmereLove', '#LuxuryFashion', '#SustainableLuxury', '#NaturalFibers', '#EthicalLuxury'],
  hemp: ['#HempClothing', '#SustainableF fashion', '#EcoFriendly', '#HempFashion', '#NaturalFibers'],
  organic_cotton: ['#OrganicCotton', '#SustainableFashion', '#EcoFashion', '#NaturalFibers', '#SlowFashion', '#ConsciousStyle'],
  silk: ['#SilkLove', '#NaturalSilk', '#LuxuryFabrics', '#SustainableLuxury'],
};

// Generate pin data for a product
function generatePinData(product: typeof PRODUCTS[0], templateIndex: number = 0): PinData {
  const tier = product.tier;
  const templates = PIN_TEMPLATES[tier];
  const titleTemplate = templates.titles[templateIndex % templates.titles.length];
  const descTemplate = templates.descriptions[templateIndex % templates.descriptions.length];

  // Determine fabric type from product
  const fabric = product.name.toLowerCase().includes('linen') ? 'linen' :
                 product.name.toLowerCase().includes('cotton') ? 'organic_cotton' :
                 product.name.toLowerCase().includes('cashmere') ? 'cashmere' :
                 product.name.toLowerCase().includes('wool') ? 'wool' :
                 product.name.toLowerCase().includes('hemp') ? 'hemp' : 'organic_cotton';

  const keywords = FABRIC_KEYWORDS[fabric] || [];

  const title = titleTemplate
    .replace('{productName}', product.name)
    .replace('{brand}', product.brand);

  const description = descTemplate
    .replace('{productName}', product.name)
    .replace('{brand}', product.brand)
    .replace('{fabric}', fabric.replace('_', ' '))
    .replace('{price}', `$${(product.price / 100).toFixed(0)}`)
    + '\n\n' + keywords.slice(0, 5).join(' ');

  // Use Unsplash placeholder images for now (replace with actual product images)
  const imageUrl = tier === 'healing'
    ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d'
    : 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab';

  return {
    title,
    description,
    link: `https://www.frequencyandform.com/shop/${product.slug}`,
    media_source: {
      source_type: 'image_url',
      url: imageUrl,
    },
    board_id: PINTEREST_BOARD_ID,
  };
}

// Create a pin on Pinterest
async function createPin(pinData: PinData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/pins`,
      pinData,
      {
        headers: {
          'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✓ Created pin: ${pinData.title}`);
    console.log(`  URL: https://pinterest.com/pin/${response.data.id}`);
    return response.data;
  } catch (error: any) {
    console.error(`✗ Error creating pin: ${pinData.title}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    throw error;
  }
}

// Get all boards for the user
async function getBoards() {
  try {
    const response = await axios.get(
      `${BASE_URL}/boards`,
      {
        headers: {
          'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        },
      }
    );

    console.log('\n📌 Your Pinterest Boards:');
    response.data.items.forEach((board: any) => {
      console.log(`  ${board.name} (ID: ${board.id})`);
    });

    return response.data.items;
  } catch (error: any) {
    console.error('✗ Error fetching boards');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Main automation function
async function automatePinterest() {
  console.log('🚀 Pinterest Automation for Frequency & Form\n');

  // Validate environment variables
  if (!PINTEREST_ACCESS_TOKEN) {
    console.error('❌ PINTEREST_ACCESS_TOKEN not set in environment');
    console.log('\nTo get your Pinterest Access Token:');
    console.log('1. Go to https://developers.pinterest.com/');
    console.log('2. Create an app');
    console.log('3. Generate an access token');
    console.log('4. Add to .env.local: PINTEREST_ACCESS_TOKEN=your_token_here');
    return;
  }

  if (!PINTEREST_BOARD_ID) {
    console.log('📋 Fetching your boards...\n');
    await getBoards();
    console.log('\n⚠️  PINTEREST_BOARD_ID not set');
    console.log('   Add to .env.local: PINTEREST_BOARD_ID=board_id_from_above');
    return;
  }

  console.log(`📍 Target Board ID: ${PINTEREST_BOARD_ID}`);
  console.log(`📦 Products to pin: ${PRODUCTS.length}\n`);

  // Create pins for all products (3 variations each for maximum reach)
  const pinsToCreate: PinData[] = [];

  PRODUCTS.forEach((product) => {
    // Create 3 different pin variations for each product
    for (let i = 0; i < 3; i++) {
      pinsToCreate.push(generatePinData(product, i));
    }
  });

  console.log(`📌 Total pins to create: ${pinsToCreate.length}\n`);

  // Create pins (with rate limiting - Pinterest allows ~150 requests/hour)
  for (let i = 0; i < pinsToCreate.length; i++) {
    try {
      await createPin(pinsToCreate[i]);

      // Rate limiting: wait 30 seconds between pins to avoid hitting API limits
      if (i < pinsToCreate.length - 1) {
        console.log('   ⏳ Waiting 30s before next pin...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (error) {
      console.log('   ⚠️  Skipping to next pin...\n');
      continue;
    }
  }

  console.log('\n✅ Pinterest automation complete!');
  console.log(`   Created ${pinsToCreate.length} pins across ${PRODUCTS.length} products`);
  console.log('   These pins will continue driving traffic for months/years!');
}

// Run if called directly
if (require.main === module) {
  automatePinterest()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

export { automatePinterest, generatePinData, createPin, getBoards };
