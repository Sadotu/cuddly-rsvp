-- Cuddly Couch RSVP - Database Schema
-- Run this in Supabase SQL Editor

-- Create the RSVPs table
CREATE TABLE rsvps (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlist')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Anyone can view RSVPs"
  ON rsvps
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow public insert
CREATE POLICY "Anyone can insert RSVPs"
  ON rsvps
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow public delete
CREATE POLICY "Anyone can delete RSVPs"
  ON rsvps
  FOR DELETE
  TO anon
  USING (true);

-- Create policy to allow public update
CREATE POLICY "Anyone can update RSVPs"
  ON rsvps
  FOR UPDATE
  TO anon
  USING (true);

-- Create indexes for faster queries
CREATE INDEX idx_rsvps_status ON rsvps(status);
CREATE INDEX idx_rsvps_created_at ON rsvps(created_at);

-- Function to delete expired data (manual execution or scheduled)
CREATE OR REPLACE FUNCTION delete_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete RSVPs 3 hours after event (2026-02-13 22:00:00)
  IF NOW() >= '2026-02-13 22:00:00'::timestamp THEN
    DELETE FROM rsvps;
    RAISE NOTICE 'Expired RSVP data deleted';
  END IF;
END;
$$ LANGUAGE plpgsql;
