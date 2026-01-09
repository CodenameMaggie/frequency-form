#!/bin/bash
# Sync environment variables from .env.local to Vercel production

echo "🔄 Syncing environment variables to Vercel..."

# Read vars from .env.local
source .env.local

# Add to Vercel production (non-interactive)
echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes 2>&1 | grep -v "Overwrite"

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>&1 | grep -v "Overwrite"

echo "Adding SUPABASE_SERVICE_ROLE_KEY..."
echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes 2>&1 | grep -v "Overwrite"

echo "✅ Environment variables synced to Vercel production!"
