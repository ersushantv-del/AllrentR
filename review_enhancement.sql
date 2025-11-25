-- Add detailed rating columns
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS rating_condition integer CHECK (rating_condition >= 1 AND rating_condition <= 5),
ADD COLUMN IF NOT EXISTS rating_communication integer CHECK (rating_communication >= 1 AND rating_communication <= 5),
ADD COLUMN IF NOT EXISTS rating_value integer CHECK (rating_value >= 1 AND rating_value <= 5),
ADD COLUMN IF NOT EXISTS rating_accuracy integer CHECK (rating_accuracy >= 1 AND rating_accuracy <= 5),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
ADD COLUMN IF NOT EXISTS flag_reason text;

-- Update existing ratings to have default values for new columns (copy main rating)
UPDATE ratings 
SET 
  rating_condition = rating,
  rating_communication = rating,
  rating_value = rating,
  rating_accuracy = rating
WHERE rating_condition IS NULL;
