-- Session --
CREATE TABLE `sessions` (
  `id` VARCHAR(26) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` VARCHAR(26) NOT NULL REFERENCES `users` (`id`),
  PRIMARY KEY(`id`)
);
ALTER TABLE `sessions`
ADD INDEX `sessions_idx` (`user_id`);
