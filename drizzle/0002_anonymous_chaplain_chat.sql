PRAGMA foreign_keys=OFF;

ALTER TABLE chaplain_conversations RENAME TO chaplain_conversations_old;

CREATE TABLE chaplain_conversations (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text,
  alias text(20) NOT NULL,
  is_anonymous integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
  updated_at text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

INSERT INTO chaplain_conversations (id, user_id, alias, is_anonymous, status, created_at, updated_at)
SELECT id, user_id, COALESCE(alias, 'Youth #0000'), is_anonymous, status, created_at, updated_at
FROM chaplain_conversations_old;

DROP TABLE chaplain_conversations_old;

CREATE TABLE chaplain_conversation_access_tokens (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  conversation_id integer NOT NULL,
  email text NOT NULL,
  selector text NOT NULL,
  token_hash text NOT NULL,
  expires_at text NOT NULL,
  last_used_at text,
  revoked_at text,
  created_at text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES chaplain_conversations(id)
);

CREATE UNIQUE INDEX chaplain_conversation_access_tokens_selector_unique
  ON chaplain_conversation_access_tokens(selector);

PRAGMA foreign_keys=ON;
