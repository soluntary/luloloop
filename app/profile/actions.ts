'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleOfferStatus(offerId: string, currentActive: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Nicht angemeldet' }
  }

  const { data, error } = await supabase.rpc('toggle_marketplace_offer_status', {
    offer_id: offerId,
    new_active_status: !currentActive
  })

  if (error) {
    console.error('[v0] Error toggling offer status:', error.message)
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Angebot nicht gefunden oder keine Berechtigung' }
  }

  return { success: true }
}

export async function toggleSearchAdStatus(adId: string, currentActive: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Nicht angemeldet' }
  }

  const { data, error } = await supabase.rpc('toggle_search_ad_status', {
    ad_id: adId,
    new_active_status: !currentActive
  })

  if (error) {
    console.error('[v0] Error toggling search ad status:', error.message)
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Suchanzeige nicht gefunden oder keine Berechtigung' }
  }

  return { success: true }
}
