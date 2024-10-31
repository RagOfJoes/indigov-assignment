-- Constituents --
CREATE TABLE `constituents` (
  `id` varchar(26) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `address_2` varchar(255),
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `zip` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
	`user_id` VARCHAR(26) NOT NULL REFERENCES `users` (`id`),
  PRIMARY KEY (`id`)
);
ALTER TABLE `constituents`
ADD FULLTEXT `constituents_fulltext_idx` (`email`, `first_name`, `last_name`);
ALTER TABLE `constituents`
ADD UNIQUE INDEX `constituents_unique_idx` (`email`, `user_id`);
ALTER TABLE `constituents`
ADD INDEX `constituents_idx` (`first_name`, `last_name`, `address`, `address_2`, `city`, `state`, `zip`, `country`, `created_at`, `deleted_at`, `user_id`);
