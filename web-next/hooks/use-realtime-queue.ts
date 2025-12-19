'use client'

/**
 * Hook for real-time approval queue with Supabase subscriptions
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/api/types'

export function useRealtimeQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial reports
  const fetchReports = useCallback(async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports((data as Report[]) ?? [])
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }, [])

  // Set up realtime subscription
  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    fetchReports()

    // Realtime subscription
    const channel = supabase
      .channel('approval-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: 'status=eq.pending_approval'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports((prev) => [payload.new as Report, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setReports((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as Report) : r))
            )
          } else if (payload.eventType === 'DELETE') {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  // Approve a report
  const approveReport = useCallback(async (reportId: string) => {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('approvals')
        .insert({
          report_id: reportId,
          action: 'approved',
          actioned_by: user?.id
        })

      await supabase
        .from('reports')
        .update({ status: 'approved' })
        .eq('id', reportId)

      // Remove from local state (subscription will handle it too)
      setReports((prev) => prev.filter((r) => r.id !== reportId))

      return true
    } catch (err) {
      console.error('Error approving report:', err)
      throw err
    }
  }, [])

  // Reject a report
  const rejectReport = useCallback(async (reportId: string) => {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('approvals')
        .insert({
          report_id: reportId,
          action: 'rejected',
          actioned_by: user?.id
        })

      await supabase
        .from('reports')
        .update({ status: 'rejected' })
        .eq('id', reportId)

      // Remove from local state
      setReports((prev) => prev.filter((r) => r.id !== reportId))

      return true
    } catch (err) {
      console.error('Error rejecting report:', err)
      throw err
    }
  }, [])

  return {
    reports,
    loading,
    error,
    approveReport,
    rejectReport,
    refetch: fetchReports
  }
}
