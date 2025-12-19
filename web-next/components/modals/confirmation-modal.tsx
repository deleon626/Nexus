'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export interface ConfirmationData {
  session_id: string
  schema_id: string
  extracted_data: Record<string, unknown>
  created_at: string
}

interface ConfirmationModalProps {
  data: ConfirmationData
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (modifications?: Record<string, unknown>) => void
  onReject: () => void
  isSubmitting?: boolean
}

export function ConfirmationModal({
  data,
  open,
  onOpenChange,
  onConfirm,
  onReject,
  isSubmitting = false
}: ConfirmationModalProps) {
  // Initialize editable values from extracted data
  const [editedData, setEditedData] = useState<Record<string, unknown>>(
    { ...data.extracted_data }
  )
  const [hasChanges, setHasChanges] = useState(false)

  const handleValueChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleConfirm = () => {
    if (hasChanges) {
      onConfirm(editedData)
    } else {
      onConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Confirm QC Data</DialogTitle>
          <DialogDescription>
            Review and edit the extracted data before submitting
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Schema Info */}
          <div>
            <div className="text-sm font-medium mb-1">Schema</div>
            <div className="text-sm text-muted-foreground">{data.schema_id}</div>
          </div>

          {/* Extracted Data - Editable */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              Extracted Data
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Modified
                </Badge>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(editedData).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`field-${key}`} className="text-xs uppercase">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={`field-${key}`}
                    type="text"
                    value={
                      typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)
                    }
                    onChange={(e) => handleValueChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            Created: {new Date(data.created_at).toLocaleString()}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isSubmitting}
          >
            Reject
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
