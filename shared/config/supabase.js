import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient("https://wdhagpzuacngexzimalk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaGFncHp1YWNuZ2V4emltYWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTM1MDksImV4cCI6MjA4MTk4OTUwOX0.4yx6Jpxd0Hk5ojRTcMg_bs_YXpWEzhi6wRjt9DPTasU", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
