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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

  // Document storage option (default true when uploading new schema)
  const [storeDocument, setStoreDocument] = useState<boolean>(true);
  const [extractionSessionId, setExtractionSessionId] = useState<string | null>(null);

  // Edit mode state
  const [editingSchema, setEditingSchema] = useState<SchemaResponse | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Client-side preview state (before extraction)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientPreviewUrl, setClientPreviewUrl] = useState<string | null>(null);

  // Track unsaved changes
  const [originalSchema, setOriginalSchema] = useState<ExtractedSchemaStructure | null>(null);
  const hasUnsavedChanges = extractedSchema !== null && 
    originalSchema !== null && 
    JSON.stringify(extractedSchema) !== JSON.stringify(originalSchema);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (clientPreviewUrl) {
        URL.revokeObjectURL(clientPreviewUrl);
      }
    };
  }, [clientPreviewUrl]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
    setStoreDocument(true); // Default to storing document for new uploads

    try {
      const response = await extractSchema(file, name);

      // Store file preview info from backend
      if (response.file_preview) {
        setFilePreview(response.file_preview);
        // Extract sessionId from file_preview URL (format: /uploads/temp/{sessionId}_{uuid}.ext)
        const urlMatch = response.file_preview.url.match(/\/uploads\/temp\/([^_]+)_/);
        if (urlMatch) {
          setExtractionSessionId(urlMatch[1]);
        }
      }

      setExtractedSchema(response.extracted_schema);
      setOriginalSchema(response.extracted_schema); // Track baseline for unsaved changes
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
        setOriginalSchema(extractedSchema); // Reset baseline after save
        // User can manually navigate back to Library or continue editing
      } else {
        // Create new schema (existing logic)
        // Pass storeDocument and sessionId for document storage
        await createSchema(
          {
            form_code: schemaName.toLowerCase().replace(/\s+/g, '-'),
            form_name: schemaName,
            schema_definition: extractedSchema,
            extraction_metadata: extractionMetadata || undefined,
          },
          storeDocument && !!extractionSessionId,
          extractionSessionId || undefined
        );
        setSaveSuccess(true);
        setSuccessMessage(storeDocument && extractionSessionId
          ? 'Schema created with source document'
          : 'Schema created successfully');
        setOriginalSchema(extractedSchema); // Reset baseline after save
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
    setOriginalSchema(null); // Reset baseline
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
    setOriginalSchema(EXAMPLE_SCHEMA); // Track baseline for unsaved changes
    setExtractionMetadata(EXAMPLE_METADATA);
    setConfidenceScore(EXAMPLE_METADATA.confidence_score);
    setSchemaName(EXAMPLE_SCHEMA_NAME);
    setViewMode('preview');
  };

  const handleCreateManually = () => {
    const name = window.prompt('Enter a name for your new schema:');
    if (!name || !name.trim()) return;

    // Create empty schema structure
    const emptySchema: ExtractedSchemaStructure = {
      per_sample_fields: [],
      sections: [],
      batch_metadata_fields: [],
      validation_rules: {},
    };

    setExtractedSchema(emptySchema);
    setOriginalSchema(emptySchema);
    setExtractionMetadata(null);
    setConfidenceScore(0);
    setSchemaName(name.trim());
    setViewMode('edit'); // Go directly to editor
  };

  const handleEditSchema = async (schema: SchemaListItem) => {
    setIsLoadingSchema(true);

    try {
      // Fetch full schema with definition
      const fullSchema = await getSchema(schema.id);
      setEditingSchema(fullSchema);
      setExtractedSchema(fullSchema.schema_definition);
      setOriginalSchema(fullSchema.schema_definition); // Track baseline for unsaved changes
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
              <Button 
                variant="outline" 
                onClick={() => {
                  if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to start over?')) {
                    return;
                  }
                  handleStartOver();
                }}
              >
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
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                  return;
                }
                setActiveTab('list');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              All Schemas
            </button>
            <button
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                  return;
                }
                setActiveTab('create');
              }}
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
                    <h2 className="text-xl font-semibold">Or Start Fresh</h2>
                    <div className="space-y-4">
                      {/* Create Manually Option */}
                      <div className="border rounded-lg p-6 bg-card">
                        <h3 className="font-medium mb-2">Create from Scratch</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Build your schema manually without uploading a document.
                        </p>
                        <Button onClick={handleCreateManually} variant="outline" className="w-full">
                          Create Manually
                        </Button>
                      </div>

                      {/* Example Schema Option */}
                      <div className="border rounded-lg p-6 bg-card">
                        <h3 className="font-medium mb-2">Use Example Template</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start with a pre-configured QC form template.
                        </p>
                        <ExampleSchemaPanel onUseExample={handleUseExample} />
                      </div>
                    </div>
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

                          {/* Document Storage Option (only for new schemas) */}
                          {!editingSchema && extractionSessionId && (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                              <Checkbox
                                id="store-document"
                                checked={storeDocument}
                                onCheckedChange={(checked) => setStoreDocument(checked === true)}
                              />
                              <Label
                                htmlFor="store-document"
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                Store source document (allows viewing original file later)
                              </Label>
                            </div>
                          )}

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
                        <div className="space-y-4">
                          {/* Document Storage Option (only for new schemas) */}
                          {!editingSchema && extractionSessionId && (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                              <Checkbox
                                id="store-document-edit"
                                checked={storeDocument}
                                onCheckedChange={(checked) => setStoreDocument(checked === true)}
                              />
                              <Label
                                htmlFor="store-document-edit"
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                Store source document (allows viewing original file later)
                              </Label>
                            </div>
                          )}

                          <VisualSchemaEditor
                            schema={extractedSchema}
                            onChange={handleSchemaChange}
                            onSave={handleSaveSchema}
                            isLoading={isSaving}
                          />
                        </div>
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
