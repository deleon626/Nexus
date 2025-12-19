'use client'

/**
 * ApprovalQueue page - Supervisor interface for reviewing pending QC reports.
 *
 * Features:
 * - Real-time updates via Supabase subscriptions
 * - View report details (expandable JSON)
 * - Approve/Reject actions
 * - Responsive card-based layout
 */

import { useState } from 'react'
import { useRealtimeQueue } from '@/hooks/use-realtime-queue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Inbox
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ApprovalQueuePage() {
  const { reports, loading, error, approveReport, rejectReport, refetch } = useRealtimeQueue()
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (reportId: string) => {
    setProcessingId(reportId)
    try {
      await approveReport(reportId)
      toast.success('Report approved', {
        description: 'The QC report has been approved successfully.'
      })
    } catch {
      toast.error('Failed to approve report', {
        description: 'Please try again.'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (reportId: string) => {
    setProcessingId(reportId)
    try {
      await rejectReport(reportId)
      toast.success('Report rejected', {
        description: 'The QC report has been rejected.'
      })
    } catch {
      toast.error('Failed to reject report', {
        description: 'Please try again.'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const toggleExpand = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Approval Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? (
                'Loading...'
              ) : (
                <>
                  {reports.length} pending report{reports.length !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty State */}
          {!loading && reports.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No pending reports</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All QC reports have been processed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Report Cards */}
          {!loading && reports.map((report) => {
            const isExpanded = expandedReport === report.id
            const isProcessing = processingId === report.id

            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="border-l-4 border-l-primary pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        Report {report.id.slice(0, 8)}...
                      </CardTitle>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>Schema: {report.schema_id}</p>
                        <p>Created: {new Date(report.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Expandable Data Section */}
                  {isExpanded && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
                      <p className="text-sm font-medium mb-2">Report Data:</p>
                      <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                        {JSON.stringify(report.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpand(report.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          View Details
                        </>
                      )}
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(report.id)}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(report.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
