-- Add image_url column to ludo_events table to support custom event images
ALTER TABLE ludo_events 
ADD COLUMN image_url character varying;

-- Add comment to document the column purpose
COMMENT ON COLUMN ludo_events.image_url IS 'URL of uploaded event image from Vercel Blob storage';
