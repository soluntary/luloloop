-- Create PostgreSQL functions for location-based calculations

-- Function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC, 
    lon1 NUMERIC, 
    lat2 NUMERIC, 
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 6371; -- Earth's radius in kilometers
    dLat NUMERIC;
    dLon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Convert degrees to radians
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    -- Return distance in kilometers
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find items within a certain radius
CREATE OR REPLACE FUNCTION items_within_radius(
    center_lat NUMERIC,
    center_lon NUMERIC,
    radius_km NUMERIC,
    table_name TEXT
) RETURNS TABLE(id UUID, distance_km NUMERIC) AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT t.id, calculate_distance(%L, %L, t.latitude, t.longitude) as distance_km
        FROM %I t
        WHERE t.latitude IS NOT NULL 
        AND t.longitude IS NOT NULL
        AND calculate_distance(%L, %L, t.latitude, t.longitude) <= %L
        ORDER BY distance_km ASC
    ', center_lat, center_lon, table_name, center_lat, center_lon, radius_km);
END;
$$ LANGUAGE plpgsql;

-- Create a view for games with distance calculation (example usage)
CREATE OR REPLACE VIEW games_with_distance AS
SELECT 
    g.*,
    CASE 
        WHEN g.latitude IS NOT NULL AND g.longitude IS NOT NULL 
        THEN g.latitude 
        ELSE NULL 
    END as has_location
FROM games g;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance between two geographic points using Haversine formula';
COMMENT ON FUNCTION items_within_radius IS 'Find items within specified radius from a center point';
