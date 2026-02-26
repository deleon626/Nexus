/**
 * DataModel type definitions based on schema.ts
 * Auto-generated representation of the Convex schema.
 */

export type DataModel = {
  formTemplates: {
    field: 'name' | 'version' | 'orgId' | 'published' | 'fields' | 'createdBy' | 'publishedAt' | 'createdAt' | 'updatedAt';
    fieldPaths: 'name' | 'version' | 'orgId' | 'published' | 'fields' | 'createdBy' | 'publishedAt' | 'createdAt' | 'updatedAt';
    indexes: {
      by_org: {
        field: 'orgId';
      };
      by_org_published: {
        field: 'orgId' | 'published';
      };
    };
  };
};
