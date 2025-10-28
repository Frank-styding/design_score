import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class SubpabaseDB {
  private constructor() {}
  private static client: SupabaseClient;
  public static getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_KEY || ""
      );
    }
    return this.client;
  }
}
