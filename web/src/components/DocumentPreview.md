# DocumentPreview Component

A comprehensive component for previewing uploaded PDF and image files with interactive controls.

## Features

### PDF Support
- ✅ Multi-page PDF rendering via react-pdf
- ✅ Page navigation (Previous/Next buttons)
- ✅ Page indicator ("Page X of Y")
- ✅ Loading skeleton
- ✅ Error handling for corrupted PDFs

### Image Support
- ✅ Image display with object-fit: contain
- ✅ Zoom controls (+/- buttons)
- ✅ Zoom levels: 50%, 75%, 100%, 125%, 150%
- ✅ Reset zoom button
- ✅ Smooth zoom transitions

### Error Handling
- ✅ Extraction error overlay
- ✅ File loading error messages
- ✅ Retry/reupload functionality

### File Metadata
- ✅ Filename display (truncated if long)
- ✅ File size formatting (B/KB/MB)
- ✅ Page count for PDFs

## Installation

```bash
cd web && npm install react-pdf
```

The following dependencies are required (already in package.json):
- `react-pdf@^10.2.0`
- `lucide-react@^0.561.0`

## Usage

### Basic Example

```tsx
import DocumentPreview from '@/components/DocumentPreview';

function MyComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setFileUrl(URL.createObjectURL(uploadedFile));
  };

  const handleReupload = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFile(null);
    setFileUrl('');
  };

  if (!file) return <FileUploader onUpload={handleFileUpload} />;

  return (
    <div className="w-full h-screen">
      <DocumentPreview
        fileUrl={fileUrl}
        fileType={file.type === 'application/pdf' ? 'pdf' : 'image'}
        fileName={file.name}
        fileSize={file.size}
        extractionError={null}
        onReupload={handleReupload}
      />
    </div>
  );
}
```

### With Extraction Error

```tsx
<DocumentPreview
  fileUrl={fileUrl}
  fileType="pdf"
  fileName="form.pdf"
  fileSize={2457600}
  extractionError="Failed to extract schema: Text is not machine-readable"
  onReupload={handleReupload}
/>
```

### Split View Layout (Recommended)

```tsx
<div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
  {/* Document Preview - 45% width */}
  <div className="col-span-5">
    <DocumentPreview {...previewProps} />
  </div>

  {/* Schema or other content - 55% width */}
  <div className="col-span-7">
    <SchemaPreview {...schemaProps} />
  </div>
</div>
```

## Props

### DocumentPreviewProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fileUrl` | `string` | ✅ | URL or object URL of the file to preview |
| `fileType` | `'pdf' \| 'image'` | ✅ | Type of file being previewed |
| `fileName` | `string` | ✅ | Original filename (displayed in header) |
| `fileSize` | `number` | ✅ | File size in bytes |
| `pageCount` | `number \| undefined` | ❌ | Number of pages (PDFs only) |
| `extractionError` | `string \| null \| undefined` | ❌ | Error message if extraction failed |
| `onReupload` | `() => void` | ✅ | Callback when user wants to upload different file |

## State Management

### Object URL Lifecycle

⚠️ **Important**: Always clean up object URLs to prevent memory leaks.

```tsx
function MyComponent() {
  const [fileUrl, setFileUrl] = useState('');

  // Create object URL on upload
  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
  };

  // Clean up on unmount or when URL changes
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  return <DocumentPreview fileUrl={fileUrl} {...otherProps} />;
}
```

### File Type Detection

```tsx
// Method 1: File extension
const getFileType = (filename: string): 'pdf' | 'image' => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'pdf' ? 'pdf' : 'image';
};

// Method 2: MIME type
const getFileType = (file: File): 'pdf' | 'image' => {
  return file.type === 'application/pdf' ? 'pdf' : 'image';
};
```

## Styling

### Container Requirements

The component is designed to fill its container. Recommended container styles:

```tsx
<div className="w-[45%] h-[calc(100vh-8rem)]">
  <DocumentPreview {...props} />
</div>
```

### Responsive Layout

```tsx
<div className="grid lg:grid-cols-2 gap-6 h-screen">
  {/* Preview: full width on mobile, 50% on desktop */}
  <div className="h-[60vh] lg:h-full">
    <DocumentPreview {...props} />
  </div>

  {/* Other content */}
  <div className="h-[40vh] lg:h-full">
    <OtherComponent />
  </div>
</div>
```

## Components Structure

```
DocumentPreview
├── Header
│   ├── FileIcon (PDF/Image icon)
│   ├── Filename (truncated)
│   └── Metadata (size, page count)
│
├── Preview Area
│   ├── PDF Viewer (react-pdf)
│   │   ├── Document component
│   │   ├── Page component
│   │   └── Loading skeleton
│   │
│   ├── Image Viewer
│   │   ├── <img> with zoom transform
│   │   └── Loading skeleton
│   │
│   └── Error Overlay (conditional)
│       ├── Warning icon
│       ├── Error message
│       └── Retry button
│
├── Controls (conditional)
│   ├── PDF Navigation
│   │   ├── Previous button
│   │   ├── Page indicator
│   │   └── Next button
│   │
│   └── Image Zoom
│       ├── Zoom out button
│       ├── Zoom percentage
│       ├── Zoom in button
│       └── Reset button
│
└── Footer
    └── "Upload Different File" button
```

## PDF.js Configuration

The component uses a CDN-hosted PDF.js worker:

```tsx
pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

### Alternative: Self-Hosted Worker

To bundle the worker with your app (recommended for production):

1. Install worker dependency:
```bash
npm install pdfjs-dist
```

2. Copy worker to public directory:
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
```

3. Update worker path:
```tsx
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

## Error Handling

### Three Types of Errors

1. **Extraction Error** (from backend API)
   - Shows modal overlay
   - User can retry with different file
   - Passed via `extractionError` prop

2. **PDF Load Error** (react-pdf)
   - Shows error in preview area
   - Handled by `onDocumentLoadError`
   - Common causes: corrupted file, unsupported format

3. **Image Load Error** (browser)
   - Shows error in preview area
   - Handled by `onError` on `<img>`
   - Common causes: broken URL, unsupported format

### Error State Example

```tsx
const [extractionError, setExtractionError] = useState<string | null>(null);

const handleExtraction = async (file: File) => {
  try {
    await extractSchema(file);
  } catch (error) {
    setExtractionError(
      error instanceof Error
        ? error.message
        : 'Unknown extraction error'
    );
  }
};

return (
  <DocumentPreview
    {...props}
    extractionError={extractionError}
    onReupload={() => setExtractionError(null)}
  />
);
```

## Accessibility

### Keyboard Navigation

- ✅ All buttons are keyboard accessible (Tab navigation)
- ✅ Arrow keys work for page navigation (when focused)
- ✅ Enter/Space activates buttons

### ARIA Labels

```tsx
<button aria-label="Previous page" onClick={goToPrevPage}>
  <ChevronLeft />
</button>

<button aria-label="Zoom in" onClick={zoomIn}>
  <ZoomIn />
</button>
```

### Screen Reader Support

- File metadata announced via structured headings
- Error messages have proper semantic markup
- Loading states announced

## Performance

### Optimization Tips

1. **Lazy Load Pages**: react-pdf only renders visible pages
2. **Object URL Cleanup**: Always revoke URLs to free memory
3. **Image Optimization**: Consider using `loading="lazy"` for large images
4. **PDF Rendering**: Limit page width to avoid oversized canvases

### Memory Usage

```tsx
// ❌ Bad: Memory leak
const fileUrl = URL.createObjectURL(file);
// Never cleaned up

// ✅ Good: Proper cleanup
useEffect(() => {
  const url = URL.createObjectURL(file);
  setFileUrl(url);

  return () => URL.revokeObjectURL(url);
}, [file]);
```

## Troubleshooting

### PDF Not Rendering

1. Check browser console for worker errors
2. Verify PDF.js worker URL is accessible
3. Ensure file URL is valid
4. Check CORS settings if loading from external URL

### Image Not Displaying

1. Verify object URL is not revoked prematurely
2. Check file type is correct (`'image'` not `'pdf'`)
3. Ensure image format is supported (JPEG, PNG, GIF, WebP)

### Styling Issues

1. Ensure container has explicit height
2. Check Tailwind classes are compiled
3. Verify react-pdf CSS is imported

## Examples

See `DocumentPreview.example.tsx` for comprehensive integration examples:

- Basic standalone usage
- Integration with SchemaGenerator
- Error state handling
- Image preview with zoom
- Split view layout (recommended)

## License

Part of Nexus project. See project root for license information.
