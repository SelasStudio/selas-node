import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Customer = {
  id?: string;
  external_id: string;
  user_id: string;
  credits: number;
};

export type Token = {
  id?: string;
  key: string;
  created_at?: string;
  user_id: string;
  ttl: number;
  quota: number;
  customer_id: string;
  description?: string;
};

export class SelasClient {
  supabase: SupabaseClient;
  app_id: string;
  key: string;
  secret: string;

  constructor(supabase: SupabaseClient, app_id: string, key: string, secret: string) {
    this.supabase = supabase;
    this.app_id = app_id;
    this.key = key;
    this.secret = secret;
  }


  /**
   * Call a rpc function on the selas server with app_id, key and secret.
   * 
   * @param fn 
   * @param params 
   * @returns data from the rpc function or an error.
   */
  rpc = async (fn: string, params: any) => {
    const paramsWithSecret = { ...params, p_secret: this.secret, p_app_id: this.app_id, p_key: this.key };
    const { data, error } = await this.supabase.rpc(fn, paramsWithSecret);

  return { data, error };
  };


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
    const { data, error } = await this.supabase.from("customers").select("*").eq("external_id", id);

    if (error) {
      return { error: `An error occured.` };
    } else if (data!.length == 0) {
      return { error: `Customer ${id} unknown.` };
    } else {
      return { data: data![0].credits as number };
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
  async changeCredits(args: { delta: number; id: string }) {
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

  /**
   * Create a token for a customer. The customer must have been created with the createCustomer method, and have at least 1 credit.
   * The token can be used to access the API from the Client of @selas/selas-js package.
   *
   * @param args.id - the id of the customer who will use the token
   * @param args.quota - the maximum number of credits the customer can spend using the token. It will not be
   * possible to use the token if the customer has less credits than the quota.
   * @param args.ttl - the time to live of the token in seconds. After this time, the token will be invalid.
   * @param args.description - a description of the token. It will be used to identify the token in the dashboard.
   * @returns the token containing a key attribute if successful or an error message
   *
   * @example
   * Create a token for a customer.
   * ```ts
   * const {data: credits} = await selas.getCustomerCredits("leopold");
   * console.log(`The token key is ${token.key}.`); // The token key is $a6IvYd6h12@.
   * ```
   *
   */
  async createToken(args: { id: string; quota: number; ttl: number; description?: string }) {
    const { data, error } = await this.supabase.rpc("create_token", {
      target_external_id: args.id,
      target_quota: args.quota,
      target_ttl: args.ttl,
      target_description: args.description,
    });

    if (error) {
      return { error: `Customer ${args.id} unknown` };
    } else {
      // @ts-ignore
      const token = data as Token;

      return {
        data: token,
      };
    }
  }
}

/**
 * Create a selas client. The client can be used to access the API using the credentials created
 * on https://selas.ai. The client can be used to manage users, tokens and credits. Be careful, the client
 * is not secure and should not be used in a browser.
 *
 * @param credentials - the credentials of the client (email and password). You can create them on https://selas.ai
 *
 * @returns a SelasClient object.
 *
 * @example
 * Create a token for a customer.
 * ```ts
 * const selas = await createCLient({email: "leopold@selas.studio", password: "password"});
 * ```
 *
 */
export const createSelasClient = async (credentials: { app_id: string, key: string, secret: string }) => {
  const SUPABASE_URL = "https://rmsiaqinsugszccqhnpj.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtc2lhcWluc3Vnc3pjY3FobnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMxNDk1OTksImV4cCI6MTk3ODcyNTU5OX0.wp5GBiK4k4xQUJk_kdkW9a_mOt8C8x08pPgeTQErb9E";

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  return new SelasClient(supabase, credentials.app_id, credentials.key, credentials.secret);
};
