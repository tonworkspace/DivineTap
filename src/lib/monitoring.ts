import { supabase } from "./supabaseClient";

export const monitor = {
  async logError(system: string, error: any) {
    await supabase.from('error_logs').insert({
      system,
      error: JSON.stringify(error),
      timestamp: new Date().toISOString()
    });
  },

  async logTransaction(type: string, data: any) {
    await supabase.from('transaction_logs').insert({
      type,
      data,
      timestamp: new Date().toISOString()
    });
  }
}; 