/**
 * useTemplateSync Hook
 *
 * Syncs published form templates from Convex to Dexie (IndexedDB) when online.
 * Enables offline workers to access previously synced templates.
 *
 * @see OFFL-01: Offline template access for workers
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOnline } from '@/hooks/useOnline';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/db/dexie';
import { useEffect } from 'react';

/**
 * Sync published templates from Convex to local Dexie database.
 *
 * When online and orgId is available, fetches published templates
 * from Convex and upserts them into the local Dexie templates table.
 * When offline, skips the Convex query (templates are served from Dexie).
 */
export function useTemplateSync() {
  const { isOnline } = useOnline();
  const { orgId } = useAuth();

  const published = useQuery(
    api.formTemplates.listPublishedTemplates,
    isOnline && orgId ? { orgId } : 'skip'
  );

  useEffect(() => {
    if (!published || published.length === 0) return;

    db.templates.bulkPut(
      published.map((t) => ({
        id: t._id,
        name: t.name,
        fields: t.fields as any,
        version: t.version,
        orgId: t.orgId,
        published: true,
        createdAt: new Date(t._creationTime),
        updatedAt: new Date(t._creationTime),
      }))
    );
  }, [published]);
}
