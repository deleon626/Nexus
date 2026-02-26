/**
 * usePhotoCapture Hook
 *
 * Camera capture hook with photo compression for offline storage.
 * Uses browser's getUserMedia API for camera access and Compressor.js
 * for file size optimization (~500KB target).
 *
 * Key features:
 * - Direct camera capture (no native app switch)
 * - Rear camera default on mobile (facingMode: 'environment')
 * - Compression to ~500KB to prevent IndexedDB quota issues
 * - Full offline support (no network calls)
 * - Base64 output for form state storage
 *
 * @see 03-RESEARCH.md Pattern 3 "Photo Capture with Compression"
 * @see 03-CONTEXT.md "Photo Capture" section
 */

import { useState, useCallback, useRef } from 'react';
import Compressor from 'compressorjs';

// ============================================================================
// Types
// ============================================================================

/**
 * Photo capture state returned by usePhotoCapture hook
 */
export interface PhotoCaptureState {
  /** Whether camera is currently active/capturing */
  isCapturing: boolean;
  /** Error message if capture failed */
  error: string | null;
  /** Preview stream (for future preview functionality) */
  previewStream: MediaStream | null;
}

/**
 * Options for photo capture
 */
export interface CapturePhotoOptions {
  /** JPEG quality for initial capture (0-1, default 0.8) */
  quality?: number;
  /** Maximum width for compressed output (default 1920) */
  maxWidth?: number;
  /** Maximum height for compressed output (default 1920) */
  maxHeight?: number;
  /** Compression quality for Compressor.js (0-1, default 0.6) */
  compressionQuality?: number;
}

/**
 * Result from capturePhoto function
 */
export interface CapturePhotoResult {
  /** Base64 encoded JPEG image */
  base64: string;
  /** Original file size in bytes (before compression) */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Compression ratio (0-1) */
  compressionRatio: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Photo capture hook with camera access and compression
 *
 * @param options - Optional capture configuration
 * @returns Photo capture state and capture function
 *
 * @example
 * ```tsx
 * const { isCapturing, error, capturePhoto } = usePhotoCapture();
 *
 * const handleCapture = async () => {
 *   try {
 *     const result = await capturePhoto();
 *     console.log('Photo captured:', result.base64);
 *   } catch (err) {
 *     console.error('Capture failed:', err);
 *   }
 * };
 * ```
 */
export function usePhotoCapture(options: CapturePhotoOptions = {}) {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    compressionQuality = 0.6,
  } = options;

  const [state, setState] = useState<PhotoCaptureState>({
    isCapturing: false,
    error: null,
    previewStream: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Capture photo from device camera with compression
   *
   * Process:
   * 1. Request camera access with rear camera preference
   * 2. Capture frame to hidden video element
   * 3. Draw frame to canvas
   * 4. Convert to blob
   * 5. Compress with Compressor.js
   * 6. Return base64 string
   */
  const capturePhoto = useCallback(
    (): Promise<CapturePhotoResult> =>
      new Promise((resolve, reject) => {
        setState((prev) => ({ ...prev, isCapturing: true, error: null }));

        // Step 1: Get camera stream
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: 'environment', // Rear camera on mobile
              width: { ideal: 1920 },
              height: { ideal: 1920 },
            },
          })
          .then((stream) => {
            streamRef.current = stream;

            // Step 2: Create video element and play stream
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.playsInline = true; // Required for iOS

            return new Promise<void>((resolveVideo, rejectVideo) => {
              video.onloadedmetadata = () => {
                video.play().then(resolveVideo).catch(rejectVideo);
              };
              video.onerror = () => {
                rejectVideo(new Error('Failed to load video stream'));
              };
            }).then(() => video);
          })
          .then((video) => {
            // Step 3: Create canvas and capture frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }

            ctx.drawImage(video, 0, 0);

            // Step 4: Convert to blob
            return new Promise<Blob>((resolveBlob, rejectBlob) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolveBlob(blob);
                  } else {
                    rejectBlob(new Error('Failed to capture image blob'));
                  }
                },
                'image/jpeg',
                quality
              );
            });
          })
          .then((blob) => {
            const originalSize = blob.size;

            // Step 5: Compress with Compressor.js
            return new Promise<Blob>((resolveCompress, rejectCompress) => {
              new Compressor(blob, {
                quality: compressionQuality,
                maxWidth,
                maxHeight,
                success(result) {
                  resolveCompress(result);
                },
                error(err) {
                  rejectCompress(
                    new Error(`Compression failed: ${err.message}`)
                  );
                },
              });
            }).then((compressed) => ({
              compressed,
              originalSize,
            }));
          })
          .then(({ compressed, originalSize }) => {
            // Step 6: Convert to base64
            return new Promise<CapturePhotoResult>(
              (resolveBase64, rejectBase64) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressed);
                reader.onloadend = () => {
                  const base64 = reader.result as string;
                  const compressedSize = compressed.size;
                  const compressionRatio = compressedSize / originalSize;

                  resolveBase64({
                    base64,
                    originalSize,
                    compressedSize,
                    compressionRatio,
                  });
                };
                reader.onerror = () => {
                  rejectBase64(new Error('Failed to convert to base64'));
                };
              }
            );
          })
          .then((result) => {
            // Cleanup: Stop all tracks
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }

            setState((prev) => ({ ...prev, isCapturing: false }));
            resolve(result);
          })
          .catch((error) => {
            // Cleanup on error
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }

            let errorMessage = 'Failed to capture photo';

            if (error.name === 'NotAllowedError') {
              errorMessage = 'Camera permission denied. Please allow camera access.';
            } else if (error.name === 'NotFoundError') {
              errorMessage = 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
              errorMessage = 'Camera is already in use by another application.';
            } else if (error.message) {
              errorMessage = error.message;
            }

            setState((prev) => ({
              ...prev,
              isCapturing: false,
              error: errorMessage,
            }));

            reject(new Error(errorMessage));
          });
      }),
    [quality, maxWidth, maxHeight, compressionQuality]
  );

  /**
   * Clear any active preview stream
   * Call this when unmounting component to release camera
   */
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setState((prev) => ({ ...prev, previewStream: null }));
  }, []);

  return {
    isCapturing: state.isCapturing,
    error: state.error,
    previewStream: state.previewStream,
    capturePhoto,
    cleanup,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extract base64 data URI prefix to get pure base64 string
 */
export function base64ToPure(base64: string): string {
  return base64.split(',')[1] || base64;
}

/**
 * Get MIME type from base64 data URI
 */
export function getMimeTypeFromBase64(base64: string): string {
  const match = base64.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}
