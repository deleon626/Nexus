/**
 * ManageSchemas page - browse existing schemas or create new ones.
 * T010: Refactored from SchemaGenerator to add tabs for list/create modes
 */

import { useState, useEffect } from 'react';
import { SchemaUploader } from '@/components/SchemaUploader';
import { SchemaPreview } from '@/components/SchemaPreview';
import { VisualSchemaEditor } from '@/components/VisualSchemaEditor';
import { SchemaList } from '@/components/SchemaList';
import { ExampleSchemaPanel } from '@/components/ExampleSchemaPanel';
import DocumentPreview from '@/components/DocumentPreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractSchema, createSchema, getSchema, updateSchema } from '@/services/schemaService';
import {
  EXAMPLE_SCHEMA,
  EXAMPLE_METADATA,
  EXAMPLE_SCHEMA_NAME,
} from '@/data/exampleSchemas';
import type { ExtractedSchemaStructure, ExtractionMetadata, FilePreviewInfo, SchemaListItem, SchemaResponse } from '@/types/schema';

// API base URL for constructing full URLs to backend-served files
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type TabMode = 'list' | 'create';
type ViewMode = 'upload' | 'preview' | 'edit';

export function ManageSchemas() {
  // Top-level tab state
  const [activeTab, setActiveTab] = useState<TabMode>('list');

  // Create flow state (existing from SchemaGenerator)
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
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Edit mode state
  const [editingSchema, setEditingSchema] = useState<SchemaResponse | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

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
      if (editingSchema) {
        // Update existing schema (creates new version)
        const updated = await updateSchema(editingSchema.id, {
          schema_definition: extractedSchema,
          update_reason: 'Manual edit from Manage Schemas',
        });

        setSaveSuccess(true);
        setSuccessMessage(`New version created: v${updated.version}`);

        // Reset edit state after save and return to list
        setTimeout(() => {
          setEditingSchema(null);
          setActiveTab('list');
          handleStartOver();
        }, 2000);
      } else {
        // Create new schema (existing logic)
        await createSchema({
          form_code: schemaName.toLowerCase().replace(/\s+/g, '-'),
          form_name: schemaName,
          schema_definition: extractedSchema,
          extraction_metadata: extractionMetadata || undefined,
        });
        setSaveSuccess(true);
        setSuccessMessage('Schema created successfully');
      }
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
    setSuccessMessage('');
    setFilePreview(null);
    setExtractionError(null);
    setEditingSchema(null);
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

  const handleEditSchema = async (schema: SchemaListItem) => {
    setIsLoadingSchema(true);

    try {
      // Fetch full schema with definition
      const fullSchema = await getSchema(schema.id);
      setEditingSchema(fullSchema);
      setExtractedSchema(fullSchema.schema_definition);
      setSchemaName(fullSchema.form_name);
      setActiveTab('create');
      setViewMode('edit');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setIsLoadingSchema(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manage Schemas</h1>
              <p className="text-muted-foreground">
                Browse existing schemas or create new ones from documents
              </p>
            </div>
            {activeTab === 'create' && viewMode !== 'upload' && (
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              All Schemas
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              Create New
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' ? (
          <div className="relative">
            {isLoadingSchema && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading schema...</p>
                </div>
              </div>
            )}
            <SchemaList onEdit={handleEditSchema} />
          </div>
        ) : (
          /* CREATE TAB: Existing upload/preview/edit flow */
          viewMode === 'upload' ? (
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
                    <h2 className="text-xl font-semibold">
                      {editingSchema ? `Editing: ${schemaName}` : schemaName}
                    </h2>
                    {editingSchema && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        v{editingSchema.version} → New Version
                      </span>
                    )}
                    {saveSuccess && (
                      <span className="text-sm text-success bg-success/10 px-2 py-1 rounded">
                        ✓ {successMessage || 'Saved successfully'}
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
                      <TabsTrigger value="edit">Visual Editor</TabsTrigger>
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
                        <VisualSchemaEditor
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
          )
        )}
      </div>
    </div>
  );
}

export default ManageSchemas;
