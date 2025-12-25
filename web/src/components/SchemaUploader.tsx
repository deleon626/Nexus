/**
 * SchemaUploader component for uploading PDF/image files for schema extraction.
 * T027: File upload UI with drag-and-drop support
 */

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SchemaUploaderProps {
  onUpload: (file: File, schemaName: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function SchemaUploader({ onUpload, isLoading = false, error }: SchemaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [schemaName, setSchemaName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, PNG, or JPG files only.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      return;
    }
    setValidationError(null);
    setSelectedFile(file);

    // Auto-generate schema name from filename if not set
    if (!schemaName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setSchemaName(nameWithoutExt);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !schemaName.trim()) {
      return;
    }
    onUpload(selectedFile, schemaName.trim());
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSchemaName('');
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload QC Form</CardTitle>
        <CardDescription>
          Upload a PDF or image of your QC form to extract the schema structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
            ${isLoading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleInputChange}
            className="hidden"
            disabled={isLoading}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="text-4xl">📄</div>
              <div className="font-medium text-green-700">{selectedFile.name}</div>
              <div className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📤</div>
              <div className="font-medium">
                {dragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
              </div>
              <div className="text-sm text-muted-foreground">
                PDF, PNG, or JPG (max 10MB)
              </div>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {validationError}
          </div>
        )}

        {/* Schema Name Input */}
        <div className="space-y-2">
          <Label htmlFor="schema-name">Schema Name</Label>
          <Input
            id="schema-name"
            placeholder="e.g., Penerimaan Bahan Baku"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Give your schema a descriptive name for easy identification
          </p>
        </div>

        {/* API Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !schemaName.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Extracting Schema...
            </>
          ) : (
            'Extract Schema'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
