# Dan Lead Generator - Dual-Write Setup

## Overview

Dan's Lead Generator now writes to **TWO databases simultaneously**:

1. **F&F Database** (`kzazlevvatuqbslzdjjb.supabase.co`)
   - Table: `ff_boutique_buyers`
   - Purpose: F&F-specific wholesale pipeline management

2. **MFS Central Database** (`bixudsnkdeafczzqfvdq.supabase.co`)
   - Table: `leads`
   - Source tag: `FF_osm` (Frequency & Form - Open Source Materials)
   - Purpose: Cross-business CRM for all MFS ventures

## How It Works

### 1. Lead Discovery
Dan scans for potential wholesale buyers:
- Boutiques with sustainable focus
- Yoga studios selling retail
- Hotels/resorts/spas
- Natural fiber specialty stores

### 2. Duplicate Checking
**F&F Database:**
```sql
SELECT id FROM ff_boutique_buyers
WHERE tenant_id = 'F&F'
AND business_name = 'Green Threads Boutique'
```

**MFS Central:**
```sql
SELECT id FROM leads
WHERE source = 'FF_osm'
AND business_name = 'Green Threads Boutique'
```

### 3. Dual-Write Process

**Step 1: Write to F&F Database**
```typescript
await supabase.from('ff_boutique_buyers').insert({
  tenant_id: TENANT_ID,
  business_name: 'Green Threads Boutique',
  business_type: 'boutique',
  website: 'https://greenthreadsboutique.com',
  city: 'Portland',
  state_province: 'OR',
  country: 'USA',
  instagram_handle: '@greenthreadsboutique',
  sustainable_focus: true,
  lead_source: 'google_search',
  lead_quality_score: 85,
  average_order_size: '$1000-2500',
  preferred_price_tier: 'healing',
  status: 'prospect'
});
```

**Step 2: Also Write to MFS Central**
```typescript
await mfsSupabase.from('leads').insert({
  source: 'FF_osm',
  business_name: 'Green Threads Boutique',
  contact_info: 'https://greenthreadsboutique.com',
  location: 'Portland, OR, USA',
  lead_quality_score: 85,
  notes: 'boutique - Sustainable focus - Avg order: $1000-2500',
  status: 'new'
});
```

## Data Mapping

| F&F Field | MFS Central Field | Notes |
|-----------|-------------------|-------|
| `business_name` | `business_name` | Direct copy |
| `website` or `instagram_handle` | `contact_info` | First available |
| `city, state_province, country` | `location` | Concatenated |
| `lead_quality_score` | `lead_quality_score` | Direct copy |
| `business_type` + `sustainable_focus` + `average_order_size` | `notes` | Combined text |
| `status: 'prospect'` | `status: 'new'` | Different vocabulary |
| N/A | `source: 'FF_osm'` | Hardcoded identifier |

## Error Handling

**F&F Write Fails:**
- Lead is NOT added to MFS central
- Error logged
- Continues to next lead

**F&F Write Succeeds, MFS Write Fails:**
- Lead IS added to F&F (still counts as success)
- Error logged separately
- Continues to next lead
- Does NOT roll back F&F write

**Why this approach:**
- F&F database is primary source of truth for F&F operations
- MFS central is secondary copy for cross-business visibility
- F&F operations should never fail due to MFS issues

## Response Format

```json
{
  "success": true,
  "data": {
    "leads_added_ff": 5,
    "leads_added_mfs_central": 5,
    "leads_skipped": 0,
    "errors": []
  }
}
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# F&F Database (existing)
NEXT_PUBLIC_SUPABASE_URL=https://kzazlevvatuqbslzdjjb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_ff_service_role_key

# MFS Central Database (new)
MFS_SUPABASE_URL=https://bixudsnkdeafczzqfvdq.supabase.co
MFS_SUPABASE_SERVICE_ROLE_KEY=your_mfs_service_role_key
```

### Database Clients

```typescript
// F&F Database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// MFS Central Database
const mfsSupabase = createClient(
  process.env.MFS_SUPABASE_URL!,
  process.env.MFS_SUPABASE_SERVICE_ROLE_KEY!
);
```

## Testing

### Test Endpoint

```bash
curl -X POST "http://localhost:3000/api/bots/dan-lead-generator?secret=freq-form-cron-secret-2026"
```

### Expected Output

```
[Dan Lead Generator] ✅ Added to F&F: Green Threads Boutique
[Dan Lead Generator] ✅ Added to MFS central: Green Threads Boutique
[Dan Lead Generator] ✅ Added to F&F: Zen Yoga & Wellness
[Dan Lead Generator] ✅ Added to MFS central: Zen Yoga & Wellness
[Dan Lead Generator] Complete: 5 added to F&F, 5 added to MFS central, 0 skipped
```

### Verify F&F Database

```sql
SELECT business_name, business_type, lead_quality_score, status
FROM ff_boutique_buyers
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 10;
```

### Verify MFS Central Database

```sql
SELECT business_name, source, location, lead_quality_score, status
FROM leads
WHERE source = 'FF_osm'
ORDER BY created_at DESC
LIMIT 10;
```

## CRON Schedule

Currently set to run every 2 hours via Railway/Vercel CRON:

```
0 */2 * * * curl -X POST "https://frequencyandform.com/api/bots/dan-lead-generator?secret=freq-form-cron-secret-2026"
```

## Source Tag: FF_osm

**FF_osm** = Frequency & Form - Open Source Materials

This tag in MFS central database allows:
- Cross-business lead attribution
- Revenue tracking per venture
- Portfolio-wide analytics
- Lead sharing between MFS businesses

Other ventures might use:
- `MFS_consulting` - Maggie Forbes Strategies consulting leads
- `Podcast_listeners` - Podcast-generated leads
- `Workshop_attendees` - Workshop/speaking event leads

## Future Enhancements

1. **Bi-directional sync**: Update MFS central when F&F lead status changes
2. **Lead sharing**: Allow other MFS ventures to see F&F leads
3. **Cross-venture opportunities**: Notify other businesses of relevant leads
4. **Consolidated reporting**: Portfolio-wide lead analytics dashboard

## Troubleshooting

### "MFS_SUPABASE_SERVICE_ROLE_KEY is not defined"

**Solution**: Add the service role key to `.env.local`:
1. Go to MFS Central Supabase dashboard
2. Settings → API
3. Copy "service_role" key
4. Add to `.env.local`
5. Restart Next.js dev server

### "Leads added to F&F but not MFS central"

**Possible causes**:
- MFS service role key incorrect
- MFS database `leads` table doesn't exist
- Network issue connecting to MFS database

**Debug**:
```typescript
// Add temporary logging
console.log('MFS URL:', process.env.MFS_SUPABASE_URL);
console.log('MFS Key exists:', !!process.env.MFS_SUPABASE_SERVICE_ROLE_KEY);
```

### "Leads already exist in MFS central"

**Expected behavior**: If a lead exists in F&F but not MFS, it will be added to MFS. If it exists in both, it will be skipped for both.

## Summary

Dan now maintains TWO copies of every lead:
- **Local copy** (F&F database) for day-to-day operations
- **Central copy** (MFS database) for portfolio-wide visibility

This enables:
- F&F team to manage wholesale pipeline independently
- MFS portfolio tracking across all ventures
- Cross-venture lead sharing opportunities
- Consolidated business intelligence

**Cost**: $0 (two database writes per lead, still free tier)
**Latency**: +50ms per lead (sequential writes)
**Reliability**: F&F operations never fail due to MFS issues
