import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewsletterWelcome } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // If Supabase is configured, store the subscription
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check if already subscribed
      const { data: existing } = await supabase
        .from('ff_newsletter_subscribers')
        .select('id, status')
        .eq('email', normalizedEmail)
        .single();

      if (existing) {
        if (existing.status === 'active') {
          return NextResponse.json({
            success: true,
            message: 'Already subscribed',
            alreadySubscribed: true
          });
        } else {
          // Reactivate subscription
          await supabase
            .from('ff_newsletter_subscribers')
            .update({
              status: 'active',
              resubscribed_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        }
      } else {
        // Insert new subscriber
        const { error: insertError } = await supabase
          .from('ff_newsletter_subscribers')
          .insert({
            email: normalizedEmail,
            status: 'active',
            source: 'website',
            subscribed_at: new Date().toISOString()
          });

        if (insertError) {
          // Table might not exist, try email_subscribers table
          await supabase
            .from('email_subscribers')
            .upsert({
              email: normalizedEmail,
              subscribed: true,
              subscribed_at: new Date().toISOString()
            }, {
              onConflict: 'email'
            });
        }
      }

      // Also add to user memberships as 'aligned' tier (free)
      const { data: alignedTier } = await supabase
        .from('ff_membership_tiers')
        .select('id')
        .eq('slug', 'aligned')
        .single();

      if (alignedTier) {
        await supabase
          .from('ff_user_memberships')
          .upsert({
            email: normalizedEmail,
            tier_id: alignedTier.id,
            status: 'active',
            started_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
      }
    }

    // Send welcome email
    try {
      await sendNewsletterWelcome(normalizedEmail);
    } catch (emailError) {
      console.error('[Newsletter] Welcome email failed:', emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed'
    });

  } catch (error) {
    console.error('[Newsletter Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    );
  }
}
