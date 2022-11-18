import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Customer = {
  id?: string;
  external_id: string;
  user_id: string;
  credits: number;
};

export class SelasClient {
  supabase: SupabaseClient;
  token: string | undefined;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Add customer to the database. After creation, the customer will have 0 credits ;
   *  credits can be added with the addCredits method. The customer will be able to
   * use the API with the token created with the createToken method.
   *
   * @param id - the id of the customer you want to retrieve
   * @returns the customer object {id: string, credits: number} or an error message
   *
   * @example
   * Start by creating a customer called "Leopold" then add 10 credits to him and create a token that you can send to him.
   * ```ts
   * const {data: customer} = await selas.createCustomer("leopold");
   * const {data: credits} = await selas.changeCredits("leopold", 10);
   * const {data: token} = await selas.createToken("leopold");
   * ```
   */
  createCustomer = async (id: string) => {
    const { error } = await this.supabase.from("customers").insert({ id });

    if (error) {
      return { error: `Customer ${id} already exists` };
    } else {
      return {
        data: { id, credits: 0 },
      };
    }
  };

  /**
   * Get information about a customer. The customer must have been created with the createCustomer method.
   *
   * @param id - the id of the customer you want to check
   * @returns the current number of credits of the customer or an error message
   *
   * @example
   * You can check the number of credits of a customer by calling the getCustomer method.
   * ```ts
   * const {data: credits} = await selas.getCustomerCredits("leopold");
   * console.log(`Leopold has ${credits} credits left.`); // Leopold had 25 credits left.
   * ```
   *
   */
  getCustomerCredits = async (id: string) => {
    const { data } = await this.supabase.from("customers").select("*").eq("external_id", id);

    if (data) {
      return { data: data[0].credits as number };
    } else {
      return { error: `Customer ${id} unknown` };
    }
  };

  /**
   * Delete a customer from Selas API. The remaining credits will be recredited back to your account.
   *
   * @param id - the id of the customer you want to delete
   * @returns the remaining number of credits if successful or an error message
   *
   * @example
   * You can check the number of credits of a customer by calling the getCustomer method.
   * ```ts
   * const {data: credits} = await selas.deleteCustomer("leopold");
   * console.log(`Leopold had ${credits} credits left before being deleted.`);  // Leopold had 25 credits left before being deleted.
   * ```
   *
   */
  async deleteCustomer(id: string) {
    const { data } = await this.supabase.from("customers").delete().eq("external_id", id).select();

    if (data) {
      return { data: data[0].credits as Customer };
    } else {
      return { error: `Customer ${id} unknown` };
    }
  }

  /**
   * Change the current credits of a customer. The customer must have been created with the createCustomer method. The credits can be negative,
   * in which case the custome will lose credits and the remaining credits will be
   *  recredited back to your account. A customer can't have negative credits.
   *
   * @param args.delta - the number of credits to add or remove from the customer
   * @param args.id - the id of the customer you want to delete
   * @returns the remaining number of credits if successful or an error message
   *
   * @example
   * You can modify the number of credits of a customer.
   * ```ts
   * const {data: credits} = await selas.getCustomerCredits("leopold");
   * console.log(`Leopold has ${credits} credits left.`); // Leopold has 25 credits left.
   * const {data: credits} = await selas.changeCredits("leopold", 10);
   * console.log(`Leopold has ${credits} credits now.`); // Leopold has 35 credits now.
   * ```
   *
   */
  async changeCredits(args: { delta: number, id: string }) {
    const { data, error } = await this.supabase.rpc("provide_credits_to_customer", {
      p_external_id: args.id,
      p_nb_credits: args.id,
    });

    if (error) {
      return { error: `Customer ${args.id} unknown` };
    } else {
      return {
        data: data[0].credits as number,
      };
    }
  }

  async createToken(external_id: string, quota: number = 1, ttl: number = 60, description: string = "") {
    const { data, error } = await this.supabase.rpc("create_token", {
      target_external_id: external_id,
      target_quota: quota,
      target_ttl: ttl,
      target_description: description,
    });

    if (error) {
      return { error: error.message };
    } else {
      // @ts-ignore
      const token = data as Token;

      return {
        data: token,
        message: `Token created for customer ${external_id} with quota ${quota} and scope customer.`,
      };
    }
  }
}

// type generateImageParams = {
//   prompt: string;
//   format: "landscape" | "portrait" | "square";
//   n_images: 1 | 4;
//   quality: "minimal" | "normal" | "high";
//   export_format: "png" | "jpg" | "webp" | "avif";
//   censor_nsfw: boolean;
// }

export const createSelasClient = async (credentials: { email: string; password: string }) => {
  const SUPABASE_URL = "https://rmsiaqinsugszccqhnpj.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtc2lhcWluc3Vnc3pjY3FobnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMxNDk1OTksImV4cCI6MTk3ODcyNTU5OX0.wp5GBiK4k4xQUJk_kdkW9a_mOt8C8x08pPgeTQErb9E";

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  supabase.auth.signInWithPassword(credentials);

  return new SelasClient(supabase);
};
