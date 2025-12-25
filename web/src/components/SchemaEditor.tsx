/**
 * SchemaEditor component for editing extracted schema as JSON.
 * T029: JSON editor with validation and formatting
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExtractedSchemaStructure } from '@/types/schema';

interface SchemaEditorProps {
  schema: ExtractedSchemaStructure;
  onChange: (schema: ExtractedSchemaStructure) => void;
  onSave?: () => void;
  isLoading?: boolean;
}

export function SchemaEditor({
  schema,
  onChange,
  onSave,
  isLoading = false,
}: SchemaEditorProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize JSON text from schema
  useEffect(() => {
    setJsonText(JSON.stringify(schema, null, 2));
    setIsDirty(false);
    setError(null);
  }, [schema]);

  // Validate JSON on change
  const handleTextChange = (value: string) => {
    setJsonText(value);
    setIsDirty(true);

    try {
      const parsed = JSON.parse(value);

      // Basic structure validation
      if (!Array.isArray(parsed.per_sample_fields)) {
        throw new Error('per_sample_fields must be an array');
      }
      if (!Array.isArray(parsed.sections)) {
        throw new Error('sections must be an array');
      }
      if (!Array.isArray(parsed.batch_metadata_fields)) {
        throw new Error('batch_metadata_fields must be an array');
      }

      setError(null);
      onChange(parsed as ExtractedSchemaStructure);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  // Format JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError('Cannot format invalid JSON');
    }
  };

  // Reset to original
  const handleReset = () => {
    setJsonText(JSON.stringify(schema, null, 2));
    setIsDirty(false);
    setError(null);
  };

  // Line count for line numbers
  const lineCount = useMemo(() => jsonText.split('\n').length, [jsonText]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Schema</CardTitle>
            <CardDescription>
              Modify the extracted schema JSON directly
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormat}
              disabled={isLoading}
            >
              Format
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || isLoading}
            >
              Reset
            </Button>
            {onSave && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={!!error || !isDirty || isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Schema'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* JSON Editor */}
        <div className="relative border rounded-md overflow-hidden bg-muted/30">
          <div className="flex">
            {/* Line numbers */}
            <div className="select-none text-right text-muted-foreground text-sm font-mono p-4 pr-2 border-r bg-muted/50 min-w-[3rem]">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`
                flex-1 p-4 font-mono text-sm leading-6 resize-none
                bg-transparent focus:outline-none
                ${error ? 'text-destructive' : ''}
              `}
              style={{ minHeight: '400px' }}
              disabled={isLoading}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <div>
            {lineCount} lines | {jsonText.length} characters
          </div>
          <div className="flex gap-4">
            {isDirty && !error && (
              <span className="text-amber-600">Unsaved changes</span>
            )}
            {!isDirty && <span className="text-green-600">Saved</span>}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div className="font-medium">Tips:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Each field needs an <code className="bg-muted px-1 rounded">id</code>, <code className="bg-muted px-1 rounded">label</code>, and <code className="bg-muted px-1 rounded">field_type</code></li>
            <li>Valid field types: text, number, date, choice, graded_choice, boolean</li>
            <li>Add <code className="bg-muted px-1 rounded">label_id</code> for Indonesian translations</li>
            <li>Use <code className="bg-muted px-1 rounded">grades</code> array for graded criteria with value/label pairs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
