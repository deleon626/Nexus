/**
 * VisualSchemaEditor - Wrapper around jsonjoy-builder's SchemaVisualEditor
 * Handles conversion between Nexus ExtractedSchemaStructure and JSON Schema
 */

import { useState, useEffect, useCallback } from 'react';
import { SchemaVisualEditor as JsonJoyEditor, type JSONSchema } from 'jsonjoy-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Pencil, Code } from 'lucide-react';
import type { ExtractedSchemaStructure } from '@/types/schema';
import { 
  nexusToJsonSchema, 
  jsonSchemaToNexus, 
  validateRoundtrip,
  type JSONSchema7 
} from '@/lib/schemaConverter';

// Import theme styles
import '@/styles/jsonjoy-theme.css';

interface VisualSchemaEditorProps {
  /** The Nexus schema to edit */
  schema: ExtractedSchemaStructure;
  /** Called when schema changes */
  onChange: (schema: ExtractedSchemaStructure) => void;
  /** Called when user clicks Save */
  onSave?: () => void;
  /** Whether a save operation is in progress */
  isLoading?: boolean;
  /** Disable editing */
  readOnly?: boolean;
}

export function VisualSchemaEditor({
  schema,
  onChange,
  onSave,
  isLoading = false,
  readOnly = false,
}: VisualSchemaEditorProps) {
  // Convert Nexus schema to JSON Schema for the editor
  const [jsonSchema, setJsonSchema] = useState<JSONSchema7>(() => 
    nexusToJsonSchema(schema)
  );
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');

  // Re-initialize when external schema changes
  useEffect(() => {
    const newJsonSchema = nexusToJsonSchema(schema);
    setJsonSchema(newJsonSchema);
    setIsDirty(false);
    setError(null);
  }, [schema]);

  // Handle changes from the visual editor
  const handleEditorChange = useCallback((newJsonSchema: JSONSchema) => {
    try {
      setJsonSchema(newJsonSchema as JSONSchema7);
      setIsDirty(true);
      setError(null);

      // Convert back to Nexus format and notify parent
      const nexusSchema = jsonSchemaToNexus(newJsonSchema as JSONSchema7);
      onChange(nexusSchema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert schema');
    }
  }, [onChange]);

  // Validate roundtrip on save
  const handleSave = useCallback(() => {
    if (!validateRoundtrip(schema)) {
      setError('Warning: Some schema data may be lost during conversion');
    }
    onSave?.();
  }, [schema, onSave]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visual Schema Editor</CardTitle>
            <CardDescription>
              Design your QC schema visually - add fields, set types, and configure validation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && !error && (
              <span className="text-sm text-amber-600">Unsaved changes</span>
            )}
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={isLoading || readOnly}
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'json')}>
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          {/* Visual Editor Tab */}
          <TabsContent value="visual" className="mt-4">
            <div className="jsonjoy jsonjoy-editor-container min-h-[400px] p-4 bg-card rounded-lg border">
              <JsonJoyEditor
                schema={jsonSchema as JSONSchema}
                onChange={handleEditorChange}
                readOnly={readOnly}
              />
            </div>
          </TabsContent>

          {/* JSON Preview Tab */}
          <TabsContent value="json" className="mt-4">
            <div className="relative border rounded-lg overflow-hidden bg-muted/30">
              <pre className="p-4 font-mono text-sm overflow-auto max-h-[500px]">
                {JSON.stringify(jsonSchema, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is the JSON Schema representation. Edit in the Visual tab.
            </p>
          </TabsContent>
        </Tabs>

        {/* Quick Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <div className="font-medium">Tips:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Click <strong>+ Add Property</strong> to add new fields</li>
            <li>Use the type dropdown to change field types (text, number, date, etc.)</li>
            <li>Toggle <strong>Required</strong> to make fields mandatory</li>
            <li>For graded fields, use integer type with enum values</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div>
          Fields: {schema.per_sample_fields.length} per-sample, {schema.batch_metadata_fields.length} batch
        </div>
        <div>
          Sections: {schema.sections.length}
        </div>
      </CardFooter>
    </Card>
  );
}
