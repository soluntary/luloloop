-- Add first_instance_date column to ludo_events table
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS first_instance_date DATE;

-- Create function to update first_instance_date for an event
CREATE OR REPLACE FUNCTION update_event_first_instance_date(event_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the event's first_instance_date to the next upcoming date
  UPDATE ludo_events
  SET first_instance_date = (
    SELECT instance_date
    FROM ludo_event_instances
    WHERE event_id = event_id_param
      AND instance_date >= CURRENT_DATE
    ORDER BY instance_date ASC
    LIMIT 1
  )
  WHERE id = event_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function that updates first_instance_date when instances change
CREATE OR REPLACE FUNCTION trigger_update_first_instance_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    PERFORM update_event_first_instance_date(NEW.event_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    PERFORM update_event_first_instance_date(OLD.event_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on ludo_event_instances table
DROP TRIGGER IF EXISTS update_first_instance_date_trigger ON ludo_event_instances;
CREATE TRIGGER update_first_instance_date_trigger
AFTER INSERT OR UPDATE OR DELETE ON ludo_event_instances
FOR EACH ROW
EXECUTE FUNCTION trigger_update_first_instance_date();

-- Populate first_instance_date for all existing events
DO $$
DECLARE
  event_record RECORD;
BEGIN
  FOR event_record IN SELECT id FROM ludo_events LOOP
    PERFORM update_event_first_instance_date(event_record.id);
  END LOOP;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ludo_event_instances_date_lookup 
ON ludo_event_instances(event_id, instance_date) 
WHERE instance_date >= CURRENT_DATE;

-- Add comment to explain the column
COMMENT ON COLUMN ludo_events.first_instance_date IS 'Automatically updated to the next upcoming instance date. Managed by trigger.';
