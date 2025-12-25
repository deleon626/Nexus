/**
 * ExampleSchemaPanel displays a sample schema on the Schema Generator page.
 * Shows what extracted schemas look like without requiring file upload.
 */

import { Button } from '@/components/ui/button';
import { SchemaPreview } from '@/components/SchemaPreview';
import {
  EXAMPLE_SCHEMA,
  EXAMPLE_METADATA,
} from '@/data/exampleSchemas';

interface ExampleSchemaPanelProps {
  /** Callback when user clicks "Use This Example" */
  onUseExample?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ExampleSchemaPanel({
  onUseExample,
  className,
}: ExampleSchemaPanelProps) {
  return (
    <div className={className}>
      {/* Full SchemaPreview component (already includes Card wrapper) */}
      <SchemaPreview
        schema={EXAMPLE_SCHEMA}
        metadata={EXAMPLE_METADATA}
        confidenceScore={EXAMPLE_METADATA.confidence_score}
      />

      {/* Action area below the preview */}
      <div className="mt-4 space-y-3">
        {/* Info callout */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
          <span className="mr-1">💡</span>
          This is an example showing what extracted schemas look like.
          {onUseExample && ' Click the button below to explore the preview and edit features.'}
        </div>

        {/* Use Example button */}
        {onUseExample && (
          <Button onClick={onUseExample} className="w-full">
            Use This Example
          </Button>
        )}
      </div>
    </div>
  );
}
