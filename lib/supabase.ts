import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://cojwebzmauslddrcreho.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvandlYnptYXVzbGRkcmNyZWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDYzOTIsImV4cCI6MjEwNjIyMjM5Mn0.sk_-Avg6RHnaqWTHiUgww_UFOtb3H8RDz4rF0_RnPS8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);