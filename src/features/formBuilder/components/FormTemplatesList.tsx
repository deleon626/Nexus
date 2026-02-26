/**
 * Form Templates List Component
 *
 * Displays saved form templates in a card-based layout.
 * Shows template name, version, published status, and last updated time.
 * Provides Load and Delete actions for each template.
 *
 * Used in admin builder for template management.
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Plus,
} from 'lucide-react';

interface Template {
  _id: { __type__: string; id: string };
  name: string;
  version: number;
  published: boolean;
  updatedAt: number;
  createdAt: number;
}

interface FormTemplatesListProps {
  templates: Template[] | undefined;
  loading: boolean;
  onLoadTemplate: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateNew: () => void;
  currentTemplateId: string | null;
}

export function FormTemplatesList({
  templates,
  loading,
  onLoadTemplate,
  onDeleteTemplate,
  onCreateNew,
  currentTemplateId,
}: FormTemplatesListProps) {
  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Saved Templates</h3>
        <div className="text-sm text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Saved Templates</h3>
        <button
          onClick={onCreateNew}
          className="text-sm flex items-center gap-1 text-primary hover:underline"
          title="Create new form"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {!templates || templates.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No templates yet.
          <br />
          Create your first form.
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => {
            const id = template._id.id;
            const isSelected = currentTemplateId === id;
            const updatedAt = new Date(template.updatedAt);

            return (
              <div
                key={id}
                className={`p-3 rounded border transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{template.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="font-mono">v{template.version}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      template.published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {template.published ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadTemplate(id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                    title="Load this template into the builder"
                  >
                    <Download className="h-3 w-3" />
                    Load
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${template.name}"? This cannot be undone.`)) {
                        onDeleteTemplate(id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    title="Delete this template"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
