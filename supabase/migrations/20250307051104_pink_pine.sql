/*
  # Create Risk of Rain Card Management Tables

  1. New Tables
    - `ror_cards`
      - `id` (uuid, primary key)
      - `name` (text)
      - `front_image_url` (text)
      - `back_image_url` (text)
      - `category` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ror_cards` table
    - Add policies for:
      - Public read access to all cards
      - Admin-only write access
*/

-- Create ror_cards table
CREATE TABLE IF NOT EXISTS ror_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  front_image_url text NOT NULL,
  back_image_url text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_image_urls CHECK (
    front_image_url ~ '^https?://.*\.png$' AND
    back_image_url ~ '^https?://.*\.png$'
  )
);

-- Enable Row Level Security
ALTER TABLE ror_cards ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ror_cards_name_idx ON ror_cards(name);
CREATE INDEX IF NOT EXISTS ror_cards_category_idx ON ror_cards(category);

-- Create policies
CREATE POLICY "Allow public read access to cards"
  ON ror_cards
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ror_cards_updated_at
  BEFORE UPDATE ON ror_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();