# T031: DocumentPreview Integration Guide

## Overview

This task integrates the DocumentPreview component into the SchemaGenerator page to display uploaded files alongside extracted schemas.

## Files Created

1. **`web/src/components/DocumentPreview.tsx`**
   - Main component implementation
   - PDF rendering via react-pdf
   - Image preview with zoom controls
   - Error overlay for extraction failures

2. **`web/src/components/DocumentPreview.example.tsx`**
   - Integration examples
   - Usage patterns for different scenarios

3. **`web/src/components/DocumentPreview.md`**
   - Comprehensive documentation
   - API reference
   - Troubleshooting guide

4. **`web/src/components/DocumentPreview.layout.txt`**
   - Visual layout reference
   - ASCII diagrams of component structure

## Installation

```bash
cd web && npm install react-pdf
```

Dependencies installed:
- `react-pdf@10.2.0`
- `lucide-react@0.561.0` (already present)

## Integration Steps

### Step 1: Update SchemaGenerator State

Add file URL state to track the uploaded file for preview:

```tsx
// web/src/pages/SchemaGenerator.tsx

const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [fileUrl, setFileUrl] = useState<string>('');

const handleUpload = async (file: File, name: string) => {
  setIsExtracting(true);
  setError(null);
  setSchemaName(name);
  setUploadedFile(file);

  // Create object URL for preview
  const objectUrl = URL.createObjectURL(file);
  setFileUrl(objectUrl);

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

const handleStartOver = () => {
  // Clean up object URL
  if (fileUrl) {
    URL.revokeObjectURL(fileUrl);
  }

  setViewMode('upload');
  setExtractedSchema(null);
  setExtractionMetadata(null);
  setConfidenceScore(0);
  setSchemaName('');
  setError(null);
  setSaveSuccess(false);
  setUploadedFile(null);
  setFileUrl('');
};

// Add cleanup on unmount
useEffect(() => {
  return () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
  };
}, [fileUrl]);
```

### Step 2: Import DocumentPreview

```tsx
// web/src/pages/SchemaGenerator.tsx

import DocumentPreview from '@/components/DocumentPreview';
```

### Step 3: Add File Type Helper

```tsx
// web/src/pages/SchemaGenerator.tsx

const getFileType = (file: File): 'pdf' | 'image' => {
  return file.type === 'application/pdf' ? 'pdf' : 'image';
};
```

### Step 4: Update Preview/Edit Layout

Replace the current preview/edit section with a split view:

```tsx
{/* PREVIEW/EDIT VIEW: Split layout */}
{viewMode !== 'upload' && (
  <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
    {/* Left: Document Preview (45% width) */}
    <div className="col-span-5">
      {uploadedFile && (
        <DocumentPreview
          fileUrl={fileUrl}
          fileType={getFileType(uploadedFile)}
          fileName={uploadedFile.name}
          fileSize={uploadedFile.size}
          pageCount={extractionMetadata?.source_file ? undefined : 0}
          extractionError={error}
          onReupload={handleStartOver}
        />
      )}
    </div>

    {/* Right: Schema Preview/Editor (55% width) */}
    <div className="col-span-7 space-y-6">
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
  </div>
)}
```

### Step 5: Mobile Responsive (Optional)

For mobile devices, stack the preview above the schema:

```tsx
<div className="lg:grid lg:grid-cols-12 gap-6 space-y-6 lg:space-y-0">
  {/* Document Preview - full width on mobile, 45% on desktop */}
  <div className="lg:col-span-5 h-[60vh] lg:h-[calc(100vh-12rem)]">
    {uploadedFile && (
      <DocumentPreview {...props} />
    )}
  </div>

  {/* Schema Preview - full width on mobile, 55% on desktop */}
  <div className="lg:col-span-7">
    {/* Schema content */}
  </div>
</div>
```

## Component Props Reference

```tsx
interface DocumentPreviewProps {
  fileUrl: string;                    // Object URL from URL.createObjectURL()
  fileType: 'pdf' | 'image';          // Determined from file.type or extension
  fileName: string;                   // file.name
  fileSize: number;                   // file.size (in bytes)
  pageCount?: number;                 // Optional, for PDFs
  extractionError?: string | null;    // Error from API response
  onReupload: () => void;             // Callback to reset and upload new file
}
```

## Testing Checklist

- [ ] Upload PDF file - verify preview renders correctly
- [ ] Upload image file - verify image displays with zoom controls
- [ ] Navigate PDF pages - verify Previous/Next buttons work
- [ ] Zoom image - verify zoom in/out/reset functionality
- [ ] Trigger extraction error - verify overlay appears
- [ ] Click "Upload Different File" - verify cleanup and reset
- [ ] Test mobile responsive layout
- [ ] Verify no memory leaks (object URL cleanup)

## Error Handling

### Extraction Error Display

When the backend extraction fails, the error is displayed as an overlay:

```tsx
// Backend error response
try {
  const response = await extractSchema(file, name);
  // ... success
} catch (e) {
  setError(e instanceof Error ? e.message : 'Failed to extract schema');
  // Error is passed to DocumentPreview via extractionError prop
}
```

The DocumentPreview component will show:
- Semi-transparent overlay
- Error message from backend
- "Try Different File" button (calls onReupload)

### PDF/Image Loading Errors

The component handles file loading errors internally:
- PDF worker errors
- Corrupted file errors
- Network errors (if loading from URL)

These are displayed in the preview area without blocking the entire component.

## Performance Considerations

### Object URL Memory Management

Always clean up object URLs to prevent memory leaks:

```tsx
// On unmount
useEffect(() => {
  return () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
  };
}, [fileUrl]);

// On reset
const handleStartOver = () => {
  if (fileUrl) {
    URL.revokeObjectURL(fileUrl);
  }
  // ... reset state
};
```

### Large PDF Performance

For PDFs with many pages (>20):
- react-pdf only renders visible pages
- Each page is lazy-loaded
- No performance impact on navigation

### Image Size Optimization

For very large images:
- Consider adding `loading="lazy"` attribute
- Browser will handle memory efficiently
- Zoom transform is CSS-based (no re-rendering)

## Troubleshooting

### PDF Not Rendering

**Symptom**: Blank preview area, no error

**Solutions**:
1. Check browser console for PDF.js worker errors
2. Verify CDN is accessible: `//unpkg.com/pdfjs-dist@...`
3. Try self-hosting worker (see documentation)
4. Check CORS if loading from external URL

### Memory Leak Warning

**Symptom**: DevTools warns about unreleased object URLs

**Solutions**:
1. Verify cleanup in useEffect
2. Check handleStartOver revokes URL
3. Ensure URL is revoked before creating new one

### Styling Issues

**Symptom**: Component doesn't fit container correctly

**Solutions**:
1. Ensure parent has explicit height: `h-[calc(100vh-12rem)]`
2. Verify grid layout classes are correct
3. Check Tailwind CSS is compiled
4. Inspect with DevTools to find conflicting styles

## Future Enhancements

1. **Annotations**: Allow users to highlight/annotate PDF
2. **Page Thumbnails**: Show thumbnail navigation for PDFs
3. **Text Search**: Search within PDF text
4. **Download**: Allow downloading the previewed file
5. **Print**: Print the document from preview
6. **Full Screen**: Expand preview to full screen
7. **Comparison**: Side-by-side comparison of source and schema

## References

- Component Documentation: `web/src/components/DocumentPreview.md`
- Integration Examples: `web/src/components/DocumentPreview.example.tsx`
- Layout Reference: `web/src/components/DocumentPreview.layout.txt`
- react-pdf Documentation: https://github.com/wojtekmaj/react-pdf

## Completion Checklist

- [x] Install react-pdf dependency
- [x] Create DocumentPreview component
- [x] Add comprehensive documentation
- [x] Create integration examples
- [x] Verify build passes
- [ ] Integrate into SchemaGenerator page (pending)
- [ ] Test with real PDF uploads (pending)
- [ ] Test with real image uploads (pending)
- [ ] Add mobile responsive layout (pending)

## Next Steps

1. Follow Step 1-4 above to integrate into SchemaGenerator
2. Test with sample PDF from `docs/qc-forms/`
3. Verify extraction error handling
4. Add mobile responsive layout
5. Update SchemaGenerator documentation
