import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  FileText,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentPreviewProps {
  fileUrl: string;
  fileType: 'pdf' | 'image';
  fileName: string;
  fileSize: number;
  pageCount?: number;
  extractionError?: string | null;
  onReupload: () => void;
}

export default function DocumentPreview({
  fileUrl,
  fileType,
  fileName,
  fileSize,
  pageCount,
  extractionError,
  onReupload
}: DocumentPreviewProps) {
  // PDF state
  const [numPages, setNumPages] = useState<number | null>(pageCount || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Image state
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Truncate filename
  const truncateFilename = (name: string, maxLength: number = 30): string => {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.slice(0, maxLength - 3 - (ext?.length || 0));
    return `${truncated}...${ext}`;
  };

  // PDF handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('Attempted URL:', fileUrl);
    setPdfError('Failed to load PDF. The file may be corrupted.');
    setPdfLoading(false);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages || 1, prev + 1));
  };

  // Image handlers
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageError('Failed to load image. The file may be corrupted.');
    setImageLoading(false);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(150, prev + 25));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 25));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {fileType === 'pdf' ? (
            <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
          ) : (
            <ImageIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-medium text-gray-900 truncate"
              title={fileName}
            >
              {truncateFilename(fileName)}
            </h3>
            <p className="text-xs text-gray-500">
              {formatFileSize(fileSize)}
              {numPages && fileType === 'pdf' && ` • ${numPages} pages`}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-auto bg-gray-100">
        {fileType === 'pdf' ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            {pdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}

            {pdfError ? (
              <div className="flex flex-col items-center space-y-3 text-center px-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
                <p className="text-sm text-gray-900 font-medium">PDF Load Error</p>
                <p className="text-xs text-gray-600 max-w-xs">{pdfError}</p>
              </div>
            ) : (
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                className="flex items-center justify-center"
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                  width={Math.min(600, window.innerWidth * 0.4)}
                />
              </Document>
            )}

            {/* PDF Page Navigation */}
            {numPages && numPages > 1 && !pdfError && (
              <div className="mt-4 flex items-center space-x-4">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-700" />
                </button>

                <span className="text-sm text-gray-700 font-medium min-w-[100px] text-center">
                  Page {currentPage} of {numPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === numPages}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Loading image...</p>
                </div>
              </div>
            )}

            {imageError ? (
              <div className="flex flex-col items-center space-y-3 text-center px-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
                <p className="text-sm text-gray-900 font-medium">Image Load Error</p>
                <p className="text-xs text-gray-600 max-w-xs">{imageError}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    className="max-w-full max-h-full object-contain shadow-lg"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  />
                </div>

                {/* Image Zoom Controls */}
                {!imageLoading && (
                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      onClick={zoomOut}
                      disabled={zoomLevel === 50}
                      className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4 text-gray-700" />
                    </button>

                    <span className="text-sm text-gray-700 font-medium min-w-[60px] text-center">
                      {zoomLevel}%
                    </span>

                    <button
                      onClick={zoomIn}
                      disabled={zoomLevel === 150}
                      className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4 text-gray-700" />
                    </button>

                    {zoomLevel !== 100 && (
                      <button
                        onClick={resetZoom}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                        aria-label="Reset zoom"
                      >
                        <RotateCcw className="h-4 w-4 text-gray-700" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Error Overlay */}
        {extractionError && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Extraction Failed
                  </h4>
                  <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap break-words">
                    {extractionError}
                  </p>
                  <button
                    onClick={onReupload}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Try Different File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onReupload}
          disabled={!!extractionError}
          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Different File</span>
        </button>
      </div>
    </div>
  );
}
