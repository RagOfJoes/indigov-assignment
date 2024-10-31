# IndiGov Take Home

## Tasks

### Required

- [x] - List all the constituents that are current in the system
- [x] - Submit new constituent contact data (without creating duplicates)
- [x] - Export a csv file of constituent contact data filtered by sign up time

### Optional

- [x] - Snazzy frontend
- [x] - Add search, sort, and/or filter functionality to the list of constituents in the system
- [x] - Add the ability to upload CSVs of contact data to the system
- [x] - Thorough validation of incoming data
- [x] - Authentication and other security features

## Folder Structure

|  Codebase  |    Description     |
| :--------: | :----------------: |
| [api](api) | Node.js API Server |
| [web](web) |   Remix frontend   |

## Getting Started

1. Clone the repository
2. Copy `.env.example` and rename it to `.env` on both [api](api) and [web](web)
3. Populate `.env` files with valid values
   - For [api](api) you'll need to update `DB_PASSWORD` and `EXPORT_SECRET_KEY`
   - For [web](web) you'll need to update `SESSION_COOKIE_SECRETS`
4. Spin up [api](api)
   1. Navigate to the [api](api) directory
   2. Run `pnpm i` to install packages
   3. Run `make dev-up` to build/run docker containers
   4. Once the containers are setup and running, run the following command to connect to create the tables
   ```sh
   docker exec -it mysql sh
   mysql -u root -p
   ```
   ```sql
   USE indigov;

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
   ```
5. Spin up [web](web)
   1. Navigate to the [web](web) directory
   2. Run `pnpm i` to install packages
   3. Run `pnpm run dev` to run dev server
6. Navigate to `localhost:5173` and create an account
7. Once logged in, click on the Plus icon in the header
8. In the Create Constituent page, drop the `seed.csv` file in the file input and navigate back to the home page
9. You should now have 162 constituents

## Notes

- You'll have to apply filters manually to the url bar by using the following format:
  - `?filter=state:in:CA,WA&filter=created_at:between:2024-10-30,2024-11-01`
  - If you export while filters are applied, the [api](api) will apply those filters to the CSV file