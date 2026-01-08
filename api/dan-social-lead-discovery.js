/**
 * Dan's Social Lead Discovery
 * Discovers B2B leads from LinkedIn and Twitter using AI
 * Runs every 30 minutes via cron
 * Targets retailers, boutiques, and wholesale buyers on social media
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { queryAtlas } = require('./bots/atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Dan Social Discovery] Starting social media lead discovery...');

  try {
    // Get existing companies to avoid duplicates
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('company, email')
      .eq('tenant_id', tenantId)
      .not('company', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    const existingCompanies = (existingContacts || []).map(c => c.company).filter(Boolean);
    console.log(`[Dan Social Discovery] Excluding ${existingCompanies.length} existing companies`);

    // Use AI to discover leads from social media
    const searchPrompt = `Search LinkedIn and Twitter for 10 retailers, boutique owners, or wholesale buyers who would be interested in natural fiber products (linen, organic cotton, hemp, wool).

EXCLUDE these companies we already have: ${existingCompanies.slice(0, 50).join(', ')}

TARGET PROFILES:
1. LinkedIn profiles with titles: "Buyer", "Purchasing Manager", "Owner", "Founder" at retail/wholesale companies
2. Twitter accounts of boutique stores, wellness shops, sustainable fashion brands
3. E-commerce store owners selling home goods, fashion, or wellness products
4. Yoga studio owners, wellness center managers

IMPORTANT: Return REAL people/companies with:
- Company name
- Full name of decision maker
- LinkedIn profile URL or Twitter handle
- Company website (if available)
- Brief description of their business
- Why they're a good fit for natural fiber products

Format as JSON array with objects containing: company, name, linkedin_url OR twitter_handle, website, description, fit_reason

Return exactly 10 NEW leads that we don't already have.`;

    const atlasResponse = await queryAtlas(searchPrompt, 'marketing', tenantId, {
      sources: ['perplexity', 'claude'], // Perplexity for web search, Claude for analysis
      save_to_memory: true
    });

    if (!atlasResponse.success) {
      throw new Error('AI search failed: ' + atlasResponse.error);
    }

    console.log('[Dan Social Discovery] AI search completed');

    // Parse the AI response
    let leads = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = atlasResponse.answer.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        leads = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[Dan Social Discovery] Failed to parse AI response as JSON');
      // Fallback: try to extract manually
      leads = [];
    }

    if (leads.length === 0) {
      console.log('[Dan Social Discovery] No leads found in AI response');
      return res.json({
        success: true,
        data: {
          leads_discovered: 0,
          leads_added: 0,
          message: 'No new social leads found'
        }
      });
    }

    console.log(`[Dan Social Discovery] Found ${leads.length} potential leads`);

    // Add leads to contacts table
    let addedCount = 0;
    for (const lead of leads) {
      try {
        // Guess email patterns
        const emailPatterns = [];
        if (lead.website) {
          const domain = lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          emailPatterns.push(`info@${domain}`);
          emailPatterns.push(`contact@${domain}`);
          emailPatterns.push(`sales@${domain}`);

          if (lead.name) {
            const firstName = lead.name.split(' ')[0].toLowerCase();
            emailPatterns.push(`${firstName}@${domain}`);
          }
        }

        // Check if company already exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('company', lead.company)
          .single();

        if (existing) {
          console.log(`[Dan Social Discovery] Skipping duplicate: ${lead.company}`);
          continue;
        }

        // Insert new contact
        const { error: insertError } = await supabase
          .from('contacts')
          .insert({
            tenant_id: tenantId,
            company: lead.company,
            full_name: lead.name,
            email: emailPatterns[0] || null, // Use first guessed email
            website: lead.website || null,
            source: lead.linkedin_url ? 'linkedin' : lead.twitter_handle ? 'twitter' : 'social_media',
            stage: 'lead',
            notes: `Social discovery: ${lead.description}\n\nFit: ${lead.fit_reason}\n\nLinkedIn: ${lead.linkedin_url || 'N/A'}\nTwitter: ${lead.twitter_handle || 'N/A'}\n\nEmail patterns to try: ${emailPatterns.join(', ')}`,
            metadata: {
              linkedin_url: lead.linkedin_url || null,
              twitter_handle: lead.twitter_handle || null,
              discovery_source: 'dan_social_discovery',
              email_guesses: emailPatterns
            }
          });

        if (insertError) {
          console.error(`[Dan Social Discovery] Error adding ${lead.company}:`, insertError.message);
        } else {
          addedCount++;
          console.log(`[Dan Social Discovery] ✅ Added: ${lead.company}`);
        }

      } catch (error) {
        console.error(`[Dan Social Discovery] Error processing lead:`, error.message);
      }
    }

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'Dan',
        action_type: 'social_lead_discovery',
        status: 'success',
        data: {
          leads_discovered: leads.length,
          leads_added: addedCount,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Dan Social Discovery] Complete: ${addedCount} leads added`);

    return res.json({
      success: true,
      data: {
        leads_discovered: leads.length,
        leads_added: addedCount
      }
    });

  } catch (error) {
    console.error('[Dan Social Discovery] Error:', error);

    // Log failed action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'Dan',
        action_type: 'social_lead_discovery',
        status: 'failed',
        data: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
