-- Create function to toggle marketplace offer status
CREATE OR REPLACE FUNCTION toggle_marketplace_offer_status(
  offer_id UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status BOOLEAN;
BEGIN
  -- Get current status and verify ownership
  SELECT active INTO current_status
  FROM marketplace_offers
  WHERE id = offer_id AND user_id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found or you do not have permission';
  END IF;
  
  -- Toggle the status
  UPDATE marketplace_offers
  SET active = NOT current_status
  WHERE id = offer_id AND user_id = user_id_param;
  
  RETURN NOT current_status;
END;
$$;

-- Create function to toggle search ad status
CREATE OR REPLACE FUNCTION toggle_search_ad_status(
  ad_id UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status BOOLEAN;
BEGIN
  -- Get current status and verify ownership
  SELECT active INTO current_status
  FROM search_ads
  WHERE id = ad_id AND user_id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Search ad not found or you do not have permission';
  END IF;
  
  -- Toggle the status
  UPDATE search_ads
  SET active = NOT current_status
  WHERE id = ad_id AND user_id = user_id_param;
  
  RETURN NOT current_status;
END;
$$;
