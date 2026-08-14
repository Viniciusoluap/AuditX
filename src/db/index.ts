import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Copie .env.example para .env.local e configure a conexão com o Postgres (Supabase ou local)."
  );
}

// `prepare: false` é recomendado para o modo "Transaction pooler" do Supabase (pgbouncer).
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
