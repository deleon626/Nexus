import { useState, useEffect } from 'react'
import { supabase, Report } from '../services/supabase'

export default function ApprovalQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  useEffect(() => {
    // Initial fetch
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('status', 'pending_approval')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching reports:', error)
        } else if (data) {
          setReports(data as Report[])
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()

    // Real-time subscription
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
  }, [])

  const handleApprove = async (reportId: string) => {
    try {
      const user = await supabase.auth.getUser()
      await supabase
        .from('approvals')
        .insert({
          report_id: reportId,
          action: 'approved',
          actioned_by: user.data.user?.id
        })

      await supabase
        .from('reports')
        .update({ status: 'approved' })
        .eq('id', reportId)
    } catch (err) {
      console.error('Error approving report:', err)
    }
  }

  const handleReject = async (reportId: string) => {
    try {
      const user = await supabase.auth.getUser()
      await supabase
        .from('approvals')
        .insert({
          report_id: reportId,
          action: 'rejected',
          actioned_by: user.data.user?.id
        })

      await supabase
        .from('reports')
        .update({ status: 'rejected' })
        .eq('id', reportId)
    } catch (err) {
      console.error('Error rejecting report:', err)
    }
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground mt-2">
            {reports.length} pending report{reports.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-8 text-center">
            <p className="text-muted-foreground">No pending reports</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-4 border-l-4 border-primary">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        Report {report.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Schema: {report.schema_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm font-medium">
                      Pending
                    </span>
                  </div>

                  {selectedReport?.id === report.id && (
                    <div className="mb-4 p-3 bg-muted rounded border border">
                      <h4 className="font-semibold text-sm mb-2">Report Data:</h4>
                      <pre className="text-xs bg-card p-2 rounded overflow-auto max-h-48">
                        {JSON.stringify(report.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      className="px-3 py-2 text-sm bg-muted hover:bg-accent text-foreground rounded transition-colors"
                    >
                      {selectedReport?.id === report.id ? 'Hide' : 'View'} Details
                    </button>
                    <button
                      onClick={() => handleApprove(report.id)}
                      className="px-4 py-2 bg-success hover:bg-success/90 text-success-foreground rounded transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(report.id)}
                      className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
