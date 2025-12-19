/**
 * API type definitions for Nexus QC system
 */

export interface Session {
  id: string
  status: 'active' | 'completed'
  created_at: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ConfirmationModal {
  confirmation_id: string
  session_id: string
  schema_id: string
  extracted_data: Record<string, unknown>
  status: 'pending' | 'confirmed' | 'rejected'
  created_at: string
  expires_at: string
}

export interface AgentMessageResponse {
  session_id: string
  content: string
  role: 'user' | 'assistant'
  tool_calls: unknown[]
  has_pending_confirmation: boolean
}

export interface Report {
  id: string
  session_id: string | null
  schema_id: string
  data: Record<string, unknown>
  status: 'pending_approval' | 'approved' | 'rejected'
  created_at: string
}
