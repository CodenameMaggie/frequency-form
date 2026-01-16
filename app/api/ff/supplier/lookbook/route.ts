import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, return sample data
    // In production, this would authenticate the supplier and fetch their data

    if (!supabaseUrl || !supabaseKey) {
      // Return demo data if no database
      return NextResponse.json({
        supplierName: 'Demo Supplier',
        season: 'Spring',
        year: 2026,
        totalViews: 12847,
        totalSales: 342,
        totalRevenue: 4532100,
        conversionRate: 2.7,
        topProducts: [
          { id: '1', name: 'Italian Linen Shirt', sales: 89, revenue: 2536500, views: 3421 },
          { id: '2', name: 'Cashmere Crewneck Sweater', sales: 67, revenue: 8676500, views: 2890 },
          { id: '3', name: 'Linen Wide Leg Trousers', sales: 54, revenue: 1755000, views: 2156 }
        ]
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get supplier from session/cookie
    const cookieStore = await cookies();
    const supplierEmail = cookieStore.get('ff_supplier_email')?.value;

    if (!supplierEmail) {
      // Return demo data for unauthenticated access
      return NextResponse.json({
        supplierName: 'Partner Brand',
        season: 'Spring',
        year: 2026,
        totalViews: 12847,
        totalSales: 342,
        totalRevenue: 4532100,
        conversionRate: 2.7,
        topProducts: [
          { id: '1', name: 'Italian Linen Shirt', sales: 89, revenue: 2536500, views: 3421 },
          { id: '2', name: 'Cashmere Crewneck Sweater', sales: 67, revenue: 8676500, views: 2890 },
          { id: '3', name: 'Linen Wide Leg Trousers', sales: 54, revenue: 1755000, views: 2156 }
        ]
      });
    }

    // Fetch supplier lookbook data
    const { data: supplierLookbook } = await supabase
      .from('ff_supplier_lookbooks')
      .select('*')
      .eq('supplier_email', supplierEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!supplierLookbook) {
      return NextResponse.json({ error: 'No lookbook found' }, { status: 404 });
    }

    return NextResponse.json({
      supplierName: supplierLookbook.supplier_name,
      season: supplierLookbook.season,
      year: supplierLookbook.year,
      totalViews: supplierLookbook.total_views,
      totalSales: supplierLookbook.total_sales,
      totalRevenue: supplierLookbook.total_revenue,
      conversionRate: supplierLookbook.total_views > 0
        ? ((supplierLookbook.total_sales / supplierLookbook.total_views) * 100).toFixed(1)
        : 0,
      topProducts: supplierLookbook.top_performers || []
    });

  } catch (error) {
    console.error('[Supplier Lookbook] Error:', error);
    return NextResponse.json({ error: 'Failed to load supplier data' }, { status: 500 });
  }
}
