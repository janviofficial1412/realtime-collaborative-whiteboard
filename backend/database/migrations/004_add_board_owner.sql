ALTER TABLE boards
ADD COLUMN owner_id BIGINT REFERENCES users(id);

UPDATE boards
SET owner_id = 1
WHERE owner_id IS NULL;

ALTER TABLE boards
ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX idx_boards_owner_id ON boards(owner_id);