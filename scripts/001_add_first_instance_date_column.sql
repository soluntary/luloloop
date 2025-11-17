-- Add first_instance_date column to ludo_events table
-- This column will store the next upcoming date for each event

-- Step 1: Add the column (nullable initially)
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS first_instance_date DATE;

-- Step 2: Create a function to update first_instance_date
CREATE OR REPLACE FUNCTION update_event_first_instance_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the first_instance_date for the affected event
  UPDATE ludo_events
  SET first_instance_date = (
    SELECT instance_date
    FROM ludo_event_instances
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND instance_date >= CURRENT_DATE
    ORDER BY instance_date ASC
    LIMIT 1
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_update_first_instance_on_insert ON ludo_event_instances;
CREATE TRIGGER trigger_update_first_instance_on_insert
AFTER INSERT ON ludo_event_instances
FOR EACH ROW
EXECUTE FUNCTION update_event_first_instance_date();

-- Step 4: Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS trigger_update_first_instance_on_update ON ludo_event_instances;
CREATE TRIGGER trigger_update_first_instance_on_update
AFTER UPDATE ON ludo_event_instances
FOR EACH ROW
EXECUTE FUNCTION update_event_first_instance_date();

-- Step 5: Create trigger for DELETE operations
DROP TRIGGER IF EXISTS trigger_update_first_instance_on_delete ON ludo_event_instances;
CREATE TRIGGER trigger_update_first_instance_on_delete
AFTER DELETE ON ludo_event_instances
FOR EACH ROW
EXECUTE FUNCTION update_event_first_instance_date();

-- Step 6: Populate first_instance_date for all existing events
UPDATE ludo_events
SET first_instance_date = (
  SELECT instance_date
  FROM ludo_event_instances
  WHERE event_id = ludo_events.id
    AND instance_date >= CURRENT_DATE
  ORDER BY instance_date ASC
  LIMIT 1
);

-- Step 7: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_event_instances_event_date 
ON ludo_event_instances(event_id, instance_date);

-- Verification query (optional - comment out in production)
-- SELECT 
--   e.id,
--   e.title,
--   e.first_instance_date,
--   (SELECT instance_date FROM ludo_event_instances WHERE event_id = e.id AND instance_date >= CURRENT_DATE ORDER BY instance_date ASC LIMIT 1) as calculated_date
-- FROM ludo_events e
-- WHERE e.first_instance_date IS NOT NULL
-- LIMIT 10;
