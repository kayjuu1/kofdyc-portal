UPDATE user SET role = 'youth_chaplain' WHERE role = 'diocesan_youth_chaplain';
UPDATE user SET role = 'diocesan_executive' WHERE role = 'dyc_executive';

DELETE FROM chaplain_messages
WHERE conversation_id IN (
  SELECT id FROM chaplain_conversations
  WHERE user_id IN (SELECT id FROM user WHERE role = 'member')
);

DELETE FROM chaplain_conversations
WHERE user_id IN (SELECT id FROM user WHERE role = 'member');

UPDATE registrations
SET user_id = NULL
WHERE user_id IN (SELECT id FROM user WHERE role = 'member');

DELETE FROM user WHERE role = 'member';
