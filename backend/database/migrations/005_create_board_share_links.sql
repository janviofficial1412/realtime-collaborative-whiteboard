CREATE TABLE board_share_links (
    id BIGSERIAL PRIMARY KEY,

    board_id INTEGER NOT NULL
        REFERENCES boards(id) ON DELETE CASCADE,

    token_hash CHAR(64) NOT NULL UNIQUE,

    permission VARCHAR(10) NOT NULL
        CHECK (permission IN ('VIEW', 'EDIT')),

    created_by BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_board_share_links_board_id
ON board_share_links(board_id);

CREATE INDEX idx_board_share_links_created_by
ON board_share_links(created_by);