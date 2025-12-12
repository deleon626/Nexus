import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjAsImV4cCI6MTAwMDAwMDAwMH0.PZPQT_cQl8L1BuuSVfLqBFOYXL7XvskYGS6M-8eG6YE'

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Report = {
  id: string
  schema_id: string
  schema_version: string
  data: Record<string, unknown>
  attachments: string[]
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  created_at: string
  created_by: string
}

export type Approval = {
  id: string
  report_id: string
  action: 'approved' | 'rejected' | 'revision_requested'
  actioned_by: string
  actioned_at: string
  comments?: string
}

export type Session = {
  id: string
  schema_id: string
  user_id: string
  status: 'active' | 'completed' | 'cancelled'
  context?: Record<string, unknown>
  created_at: string
}
