import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET single price record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const { id } = await params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('price_monitoring')
      .select(`
        *,
        competitors (
          id,
          name,
          industry,
          website
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Price record not found' }, { status: 404 });
    }

    return NextResponse.json({ price: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update price record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const { id } = await params;
    const supabase = getSupabase();
    const body = await request.json();
    const {
      product_name,
      product_sku,
      price,
      currency,
      url,
      metadata
    } = body;

    const updateData: any = {};
    if (product_name !== undefined) updateData.product_name = product_name;
    if (product_sku !== undefined) updateData.product_sku = product_sku;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (url !== undefined) updateData.url = url;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabase
      .from('price_monitoring')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        competitors (
          id,
          name,
          industry
        )
      `)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Price record not found' }, { status: 404 });
    }

    return NextResponse.json({ price: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove price record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const { id } = await params;
    const supabase = getSupabase();
    const { error } = await supabase
      .from('price_monitoring')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
