-- Migration: Add foreign key constraint to service_esg_metrics
-- Description: Adds FK constraint from service_esg_metrics.service_request_id to service_requests.id
-- This ensures data integrity and prevents orphaned ESG metrics

-- Add foreign key constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'service_esg_metrics_service_request_id_fkey'
  ) THEN
    ALTER TABLE service_esg_metrics
    ADD CONSTRAINT service_esg_metrics_service_request_id_fkey
    FOREIGN KEY (service_request_id)
    REFERENCES service_requests(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Foreign key constraint added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Create index on the foreign key column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_service_esg_metrics_service_request_id
ON service_esg_metrics(service_request_id);
