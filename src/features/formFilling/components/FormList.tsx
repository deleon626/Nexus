/**
 * FormList Component
 *
 * Form selection list with search, recent forms, draft indicators, and offline support.
 * Workers use this to find and select forms for filling.
 */

import { useEffect, useState, useMemo } from 'react';
import { Search, FileText, Clock, WifiOff } from 'lucide-react';
import { db } from '@/db/dexie';
import type { Template } from '@/db/types';
import { useOnline } from '@/hooks/useOnline';
import type { Draft } from '@/db/types';

const RECENT_FORMS_KEY = 'nexus:recentForms';
const MAX_RECENT_FORMS = 3;

interface FormListProps {
  /** Callback when a form is selected */
  onFormSelect: (formId: string, formName: string) => void;
}

interface FormWithDrafts extends Template {
  draftCount: number;
}

interface RecentFormEntry {
  formId: string;
  lastFilledAt: number;
}

export function FormList({ onFormSelect }: FormListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recentFormIds, setRecentFormIds] = useState<string[]>([]);
  const [draftsByForm, setDraftsByForm] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useOnline();

  // Load published templates from Dexie
  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      try {
        setIsLoading(true);
        const publishedTemplates = await db.templates
          .where('published')
          .equals(true)
          .toArray();

        if (isMounted) {
          setTemplates(publishedTemplates);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load drafts grouped by form ID
  useEffect(() => {
    let isMounted = true;

    async function loadDrafts() {
      try {
        const allDrafts = await db.drafts.toArray();

        if (isMounted) {
          const draftsByFormId: Record<string, number> = {};
          for (const draft of allDrafts) {
            draftsByFormId[draft.formId] = (draftsByFormId[draft.formId] || 0) + 1;
          }
          setDraftsByForm(draftsByFormId);
        }
      } catch (error) {
        console.error('Failed to load drafts:', error);
      }
    }

    loadDrafts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load recent forms from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_FORMS_KEY);
      if (stored) {
        const recent: RecentFormEntry[] = JSON.parse(stored);
        // Sort by last filled (most recent first) and take top 3
        const sorted = recent
          .sort((a, b) => b.lastFilledAt - a.lastFilledAt)
          .slice(0, MAX_RECENT_FORMS)
          .map((entry) => entry.formId);
        setRecentFormIds(sorted);
      }
    } catch (error) {
      console.error('Failed to load recent forms:', error);
    }
  }, []);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return templates;
    }
    const query = searchQuery.toLowerCase();
    return templates.filter((template) =>
      template.name.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Separate recent forms from other forms
  const recentForms = useMemo(() => {
    return filteredTemplates.filter((t) => recentFormIds.includes(t.id))
      .sort((a, b) => {
        // Sort by recent forms order
        const aIndex = recentFormIds.indexOf(a.id);
        const bIndex = recentFormIds.indexOf(b.id);
        return aIndex - bIndex;
      });
  }, [filteredTemplates, recentFormIds]);

  const otherForms = useMemo(() => {
    return filteredTemplates.filter((t) => !recentFormIds.includes(t.id))
      .sort((a, b) => {
        // Sort by updated date (most recent first)
        const bTime = new Date(b.updatedAt).getTime();
        const aTime = new Date(a.updatedAt).getTime();
        return bTime - aTime;
      });
  }, [filteredTemplates, recentFormIds]);

  const handleFormSelect = (formId: string, formName: string) => {
    // Update recent forms in localStorage
    try {
      const stored = localStorage.getItem(RECENT_FORMS_KEY);
      const recent: RecentFormEntry[] = stored ? JSON.parse(stored) : [];

      // Remove existing entry for this form if present
      const filtered = recent.filter((r) => r.formId !== formId);

      // Add new entry at the beginning
      filtered.unshift({
        formId,
        lastFilledAt: Date.now(),
      });

      // Keep only last 10 entries (storage is cheap)
      const trimmed = filtered.slice(0, 10);

      localStorage.setItem(RECENT_FORMS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save recent form:', error);
    }

    onFormSelect(formId, formName);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  const hasForms = filteredTemplates.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar - always visible */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Offline indicator */}
      {!isOnline && hasForms && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>Offline - showing cached forms only</span>
        </div>
      )}

      {/* Empty state */}
      {!hasForms && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No forms published yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Contact your admin to publish forms for filling.
          </p>
        </div>
      )}

      {/* Forms list */}
      {hasForms && (
        <div className="flex-1 overflow-y-auto">
          {/* Recent forms section */}
          {recentForms.length > 0 && (
            <div className="px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Recent forms
              </h2>
              <div className="space-y-2">
                {recentForms.map((form) => (
                  <FormListItem
                    key={form.id}
                    form={form}
                    draftCount={draftsByForm[form.id] || 0}
                    onSelect={() => handleFormSelect(form.id, form.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All forms section */}
          {otherForms.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                All forms
              </h2>
              <div className="space-y-2">
                {otherForms.map((form) => (
                  <FormListItem
                    key={form.id}
                    form={form}
                    draftCount={draftsByForm[form.id] || 0}
                    onSelect={() => handleFormSelect(form.id, form.name)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FormListItemProps {
  form: Template;
  draftCount: number;
  onSelect: () => void;
}

function FormListItem({ form, draftCount, onSelect }: FormListItemProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
    >
      <div className="flex-shrink-0">
        <FileText className="h-6 w-6 text-blue-500 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {form.name}
          </h3>
          {draftCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
              {draftCount} draft{draftCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>v{form.version}</span>
          <span>•</span>
          <span>Updated {formatDate(form.updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}
