/**
 * Example: Integrating DocumentPreview into SchemaGenerator
 *
 * This file demonstrates how to use the DocumentPreview component
 * in the SchemaGenerator page to show the uploaded document alongside
 * the extracted schema.
 */

import { useState } from 'react';
import DocumentPreview from './DocumentPreview';
import { SchemaUploader } from './SchemaUploader';
import { SchemaPreview } from './SchemaPreview';
import { extractSchema } from '@/services/schemaService';
import type { ExtractedSchemaStructure, ExtractionMetadata } from '@/types/schema';

// Example 1: Basic Usage - Standalone Preview
export function BasicDocumentPreviewExample() {
  return (
    <div className="w-[45%] h-screen">
      <DocumentPreview
        fileUrl="/uploads/temp/FR-QC-II.03.01.pdf"
        fileType="pdf"
        fileName="FR-QC-II.03.01 - Penerimaan Bahan Baku.pdf"
        fileSize={2457600} // 2.4 MB
        pageCount={3}
        extractionError={null}
        onReupload={() => console.log('Reupload requested')}
      />
    </div>
  );
}

// Example 2: Integration with SchemaGenerator
export function IntegratedSchemaGeneratorExample() {
  const [viewMode, setViewMode] = useState<'upload' | 'preview'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [extractedSchema, setExtractedSchema] = useState<ExtractedSchemaStructure | null>(null);
  const [extractionMetadata, setExtractionMetadata] = useState<ExtractionMetadata | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleUpload = async (file: File, name: string) => {
    setIsExtracting(true);
    setExtractionError(null);
    setUploadedFile(file);

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);

    try {
      const response = await extractSchema(file, name);
      setExtractedSchema(response.extracted_schema);
      setExtractionMetadata(response.extraction_metadata);
      setViewMode('preview');
    } catch (e) {
      setExtractionError(e instanceof Error ? e.message : 'Schema extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReupload = () => {
    // Clean up object URL
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setViewMode('upload');
    setUploadedFile(null);
    setFileUrl('');
    setExtractedSchema(null);
    setExtractionMetadata(null);
    setExtractionError(null);
  };

  // Determine file type from file extension
  const getFileType = (filename: string): 'pdf' | 'image' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'pdf' ? 'pdf' : 'image';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {viewMode === 'upload' ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Upload Your Form</h2>
            <SchemaUploader
              onUpload={handleUpload}
              isLoading={isExtracting}
              error={extractionError}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Document Preview (45% width) */}
            <div className="h-[calc(100vh-8rem)]">
              {uploadedFile && (
                <DocumentPreview
                  fileUrl={fileUrl}
                  fileType={getFileType(uploadedFile.name)}
                  fileName={uploadedFile.name}
                  fileSize={uploadedFile.size}
                  pageCount={extractionMetadata?.source_file ? undefined : 0}
                  extractionError={extractionError}
                  onReupload={handleReupload}
                />
              )}
            </div>

            {/* Right: Schema Preview (55% width) */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Extracted Schema</h2>
              {extractedSchema && extractionMetadata && (
                <SchemaPreview
                  schema={extractedSchema}
                  metadata={extractionMetadata}
                  confidenceScore={extractionMetadata.confidence_score}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Example 3: Error State - Extraction Failed
export function ExtractionErrorExample() {
  return (
    <div className="w-[45%] h-screen">
      <DocumentPreview
        fileUrl="/uploads/temp/corrupted.pdf"
        fileType="pdf"
        fileName="corrupted_form.pdf"
        fileSize={1024000}
        extractionError="Failed to extract schema: The document appears to be corrupted or the text is not machine-readable. Please ensure the PDF contains selectable text and try again."
        onReupload={() => console.log('Reupload triggered')}
      />
    </div>
  );
}

// Example 4: Image Preview with Zoom
export function ImagePreviewExample() {
  return (
    <div className="w-[45%] h-screen">
      <DocumentPreview
        fileUrl="/uploads/temp/scanned_form.jpg"
        fileType="image"
        fileName="Scanned QC Form - Photo 123.jpg"
        fileSize={3840000} // 3.8 MB
        extractionError={null}
        onReupload={() => console.log('Reupload requested')}
      />
    </div>
  );
}

// Example 5: Split View Layout (Recommended for SchemaGenerator)
export function SplitViewLayoutExample() {
  const [uploadedFile] = useState<File | null>(
    // Simulated file object
    new File([''], 'FR-QC-II.03.01.pdf', { type: 'application/pdf' })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Schema Generator</h1>

        {/* Split view: 45% preview | 55% schema */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Document Preview - 5 columns (41.67%) */}
          <div className="col-span-5">
            {uploadedFile && (
              <DocumentPreview
                fileUrl={URL.createObjectURL(uploadedFile)}
                fileType="pdf"
                fileName={uploadedFile.name}
                fileSize={uploadedFile.size}
                extractionError={null}
                onReupload={() => console.log('Start over')}
              />
            )}
          </div>

          {/* Schema Preview - 7 columns (58.33%) */}
          <div className="col-span-7 bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Extracted Schema</h2>
            {/* SchemaPreview component would go here */}
            <div className="text-gray-500 text-sm">
              Schema preview content...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Checklist:
 *
 * 1. State Management:
 *    - Store uploaded File object in state
 *    - Create object URL with URL.createObjectURL(file)
 *    - Clean up URL with URL.revokeObjectURL() on unmount or reupload
 *
 * 2. File Type Detection:
 *    - Check file extension: .pdf → 'pdf', .jpg/.png → 'image'
 *    - Alternative: use file.type MIME type
 *
 * 3. Layout:
 *    - Use grid layout: 45% preview | 55% schema
 *    - Set fixed height: h-[calc(100vh-8rem)] for full-screen feel
 *    - Make responsive: stack vertically on mobile
 *
 * 4. Error Handling:
 *    - Pass extractionError from API response
 *    - Show error overlay on DocumentPreview
 *    - Allow retry via onReupload callback
 *
 * 5. Memory Management:
 *    - useEffect cleanup: URL.revokeObjectURL(fileUrl)
 *    - Don't store object URLs in persistent state
 *
 * Example useEffect cleanup:
 *
 * useEffect(() => {
 *   return () => {
 *     if (fileUrl) {
 *       URL.revokeObjectURL(fileUrl);
 *     }
 *   };
 * }, [fileUrl]);
 */
