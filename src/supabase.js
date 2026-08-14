import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gobkbdgpwozexjyorol.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvYmtiZGdwd3pveGV4anlvcm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2Njc0NDgsImV4cCI6MjEwMjI0MzQ0OH0.HmdNf25WW8HsjSO1aK2O6s7kqn012PZC3nutRa098Eg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
