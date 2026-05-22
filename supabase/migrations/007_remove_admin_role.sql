-- Remove 'admin' role from naff36252@gmail.com (set to no role)
-- After this, the user is treated as a regular platform merchant (no role)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'naff36252@gmail.com'
  AND raw_user_meta_data->>'role' = 'admin';
