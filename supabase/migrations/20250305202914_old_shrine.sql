/*
  # Create flashcards table and storage

  1. New Tables
    - `flashcards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text)
      - `description` (text)
      - `category` (text)
      - `times_reviewed` (integer)
      - `confidence_level` (integer)
      - `correct_answers` (integer)
      - `incorrect_answers` (integer)
      - `last_reviewed` (timestamptz)
      - `next_review_date` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `flashcards` table
    - Add policies for authenticated users to:
      - Read their own flashcards
      - Create new flashcards
      - Update their own flashcards
      - Delete their own flashcards
*/

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  image_url text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  times_reviewed integer DEFAULT 0,
  confidence_level integer DEFAULT 1,
  correct_answers integer DEFAULT 0,
  incorrect_answers integer DEFAULT 0,
  last_reviewed timestamptz,
  next_review_date timestamptz,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT confidence_level_range CHECK (confidence_level BETWEEN 1 AND 5)
);

-- Enable Row Level Security
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own flashcards"
  ON flashcards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create flashcards"
  ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS flashcards_category_idx ON flashcards(category);
CREATE INDEX IF NOT EXISTS flashcards_next_review_date_idx ON flashcards(next_review_date);