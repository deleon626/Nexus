/**
 * SchemaGenerator page integrating uploader, preview, and editor.
 * T030: Main page for schema extraction workflow
 */

import { useState, useEffect } from 'react';
import { SchemaUploader } from '@/components/SchemaUploader';
import { SchemaPreview } from '@/components/SchemaPreview';
import { SchemaEditor } from '@/components/SchemaEditor';
import { ExampleSchemaPanel } from '@/components/ExampleSchemaPanel';
import DocumentPreview from '@/components/DocumentPreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractSchema, createSchema } from '@/services/schemaService';
import {
  EXAMPLE_SCHEMA,
  EXAMPLE_METADATA,
  EXAMPLE_SCHEMA_NAME,
} from '@/data/exampleSchemas';
import type { ExtractedSchemaStructure, ExtractionMetadata, FilePreviewInfo } from '@/types/schema';

// API base URL for constructing full URLs to backend-served files
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const [filePreview, setFilePreview] = useState<FilePreviewInfo | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Client-side preview state (before extraction)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientPreviewUrl, setClientPreviewUrl] = useState<string | null>(null);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (clientPreviewUrl) {
        URL.revokeObjectURL(clientPreviewUrl);
      }
    };
  }, [clientPreviewUrl]);

  // Handle file selection (before extraction)
  const handleFileSelect = (file: File | null) => {
    // Clean up previous object URL
    if (clientPreviewUrl) {
      URL.revokeObjectURL(clientPreviewUrl);
      setClientPreviewUrl(null);
    }

    setSelectedFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setClientPreviewUrl(url);
    }
  };

  const handleUpload = async (file: File, name: string) => {
    setIsExtracting(true);
    setError(null);
    setExtractionError(null);
    setSchemaName(name);

    try {
      const response = await extractSchema(file, name);

      // Store file preview info from backend
      if (response.file_preview) {
        setFilePreview(response.file_preview);
      }

      setExtractedSchema(response.extracted_schema);
      setExtractionMetadata(response.extraction_metadata);
      setConfidenceScore(response.confidence_score);
      setViewMode('preview');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to extract schema';
      setError(errorMessage);
      setExtractionError(errorMessage);
      // Still show preview even on error if we have file_preview
      if (filePreview) {
        setViewMode('preview');
      }
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
    setFilePreview(null);
    setExtractionError(null);
    // Clean up client-side preview
    if (clientPreviewUrl) {
      URL.revokeObjectURL(clientPreviewUrl);
    }
    setSelectedFile(null);
    setClientPreviewUrl(null);
  };

  const handleUseExample = () => {
    setExtractedSchema(EXAMPLE_SCHEMA);
    setExtractionMetadata(EXAMPLE_METADATA);
    setConfidenceScore(EXAMPLE_METADATA.confidence_score);
    setSchemaName(EXAMPLE_SCHEMA_NAME);
    setViewMode('preview');
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
          /* UPLOAD VIEW: Split screen - Uploader left, Preview/Example right */
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Upload Form */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload Your Form</h2>
              <SchemaUploader
                onUpload={handleUpload}
                onFileSelect={handleFileSelect}
                isLoading={isExtracting}
                error={error}
              />
            </div>

            {/* Right: Document Preview (when file selected) OR Example Schema */}
            <div className="space-y-4">
              {selectedFile && clientPreviewUrl ? (
                <>
                  <h2 className="text-xl font-semibold">Document Preview</h2>
                  <DocumentPreview
                    fileUrl={clientPreviewUrl}
                    fileType={selectedFile.type === 'application/pdf' ? 'pdf' : 'image'}
                    fileName={selectedFile.name}
                    fileSize={selectedFile.size}
                    onReupload={() => handleFileSelect(null)}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">Example Schema</h2>
                  <ExampleSchemaPanel onUseExample={handleUseExample} />
                </>
              )}
            </div>
          </div>
        ) : (
          /* PREVIEW/EDIT VIEW: Document preview + Schema panel side by side */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            {/* Document Preview - Left Panel (45%) */}
            {/* Use backend filePreview if available, otherwise fallback to client preview */}
            {(filePreview || (selectedFile && clientPreviewUrl)) && (
              <div className="lg:col-span-5">
                <DocumentPreview
                  fileUrl={filePreview?.url
                    ? `${API_BASE_URL}${filePreview.url}`
                    : clientPreviewUrl || ''}
                  fileType={
                    filePreview
                      ? (filePreview.mime_type === 'application/pdf' ? 'pdf' : 'image')
                      : (selectedFile?.type === 'application/pdf' ? 'pdf' : 'image')
                  }
                  fileName={filePreview?.filename || selectedFile?.name || ''}
                  fileSize={filePreview?.size || selectedFile?.size || 0}
                  pageCount={filePreview?.page_count}
                  extractionError={extractionError}
                  onReupload={handleStartOver}
                />
              </div>
            )}

            {/* Schema Panel - Right Panel (55%) */}
            <div className={(filePreview || (selectedFile && clientPreviewUrl)) ? "lg:col-span-7" : "lg:col-span-12"}>
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

                {/* Error Display (only if no extractionError shown in preview) */}
                {error && !extractionError && (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaGenerator;
