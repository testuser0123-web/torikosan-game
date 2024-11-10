// lib/db.ts
import { createClient } from "@vercel/postgres";

export const getClient = () => {
  return createClient();
};
