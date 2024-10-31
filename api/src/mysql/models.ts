import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Constituents {
  address: string;
  address_2: string | null;
  city: string;
  country: string;
  created_at: Generated<Date>;
  deleted_at: Date | null;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  state: string;
  updated_at: Date | null;
  user_id: string;
  zip: string;
}

export interface Sessions {
  created_at: Generated<Date>;
  expires_at: Generated<Date>;
  id: string;
  user_id: string;
}

export interface Users {
  created_at: Generated<Date>;
  deleted_at: Date | null;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  password: string;
  updated_at: Date | null;
}

export interface DB {
  constituents: Constituents;
  sessions: Sessions;
  users: Users;
}
