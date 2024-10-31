-- Users --
CREATE TABLE `users` (
  `id` varchar(26) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

ALTER TABLE `users`
ADD UNIQUE INDEX `users_unique_idx` (`email`);
ALTER TABLE `users`
ADD INDEX `users_idx` (`created_at`, `deleted_at`, `updated_at`);
