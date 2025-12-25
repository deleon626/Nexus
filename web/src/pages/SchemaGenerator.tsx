/**
 * SchemaGenerator page integrating uploader, preview, and editor.
 * T030: Main page for schema extraction workflow
 */

import { useState } from 'react';
import { SchemaUploader } from '@/components/SchemaUploader';
import { SchemaPreview } from '@/components/SchemaPreview';
import { SchemaEditor } from '@/components/SchemaEditor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractSchema, createSchema } from '@/services/schemaService';
import type { ExtractedSchemaStructure, ExtractionMetadata } from '@/types/schema';

type ViewMode = 'upload' | 'preview' | 'edit';

export function SchemaGenerator() {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [extractedSchema, setExtractedSchema] = useState<ExtractedSchemaStructure | null>(null);
  const [extractionMetadata, setExtractionMetadata] = useState<ExtractionMetadata | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [schemaName, setSchemaName] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpload = async (file: File, name: string) => {
    setIsExtracting(true);
    setError(null);
    setSchemaName(name);

    try {
      const response = await extractSchema(file, name);
      setExtractedSchema(response.extracted_schema);
      setExtractionMetadata(response.extraction_metadata);
      setConfidenceScore(response.confidence_score);
      setViewMode('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to extract schema');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSchemaChange = (schema: ExtractedSchemaStructure) => {
    setExtractedSchema(schema);
    setSaveSuccess(false);
  };

  const handleSaveSchema = async () => {
    if (!extractedSchema || !schemaName) return;

    setIsSaving(true);
    setError(null);

    try {
      await createSchema({
        form_code: schemaName.toLowerCase().replace(/\s+/g, '-'),
        form_name: schemaName,
        schema_definition: extractedSchema,
        extraction_metadata: extractionMetadata || undefined,
      });
      setSaveSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save schema');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartOver = () => {
    setViewMode('upload');
    setExtractedSchema(null);
    setExtractionMetadata(null);
    setConfidenceScore(0);
    setSchemaName('');
    setError(null);
    setSaveSuccess(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Schema Generator</h1>
              <p className="text-muted-foreground">
                Extract QC form structure from PDF or image files
              </p>
            </div>
            {viewMode !== 'upload' && (
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {viewMode === 'upload' ? (
          <div className="flex justify-center">
            <SchemaUploader
              onUpload={handleUpload}
              isLoading={isExtracting}
              error={error}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Schema Name Header */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">{schemaName}</h2>
              {saveSuccess && (
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✓ Saved successfully
                </span>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">
                {error}
              </div>
            )}

            {/* Tabs for Preview and Edit */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-6">
                {extractedSchema && extractionMetadata && (
                  <div className="space-y-4">
                    <SchemaPreview
                      schema={extractedSchema}
                      metadata={extractionMetadata}
                      confidenceScore={confidenceScore}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setViewMode('edit')}
                      >
                        Edit Schema
                      </Button>
                      <Button
                        onClick={handleSaveSchema}
                        disabled={isSaving || saveSuccess}
                      >
                        {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Schema'}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="edit" className="mt-6">
                {extractedSchema && (
                  <SchemaEditor
                    schema={extractedSchema}
                    onChange={handleSchemaChange}
                    onSave={handleSaveSchema}
                    isLoading={isSaving}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaGenerator;
