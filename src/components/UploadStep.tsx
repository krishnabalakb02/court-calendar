"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { CaseData } from "@/lib/ocr";

interface UploadStepProps {
  onComplete: (cases: CaseData[]) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const STATUS_TEXTS = ["Reading ledger\u2026", "Extracting cases\u2026"];

export default function UploadStep({ onComplete }: UploadStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotate status text during loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_TEXTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, and HEIC files are supported.";
    }
    if (file.size > MAX_SIZE) {
      return "File must be under 10MB.";
    }
    return null;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setPreviewUrl(null);
        return;
      }

      setError(null);

      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Call OCR API
      setIsLoading(true);
      setStatusIndex(0);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          setError("Failed to process image. Please try again.");
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setIsLoading(false);
        onComplete(data.cases);
      } catch {
        setError("Failed to process image. Please try again.");
        setIsLoading(false);
      }
    },
    [validateFile, onComplete],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processFile]);

  return (
    <div>
      {/* Drop zone */}
      <div
        data-testid="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 bg-white hover:border-indigo-300"
        }`}
      >
        <input
          ref={fileInputRef}
          data-testid="file-input"
          type="file"
          accept=".jpg,.jpeg,.png,.heic"
          className="hidden"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div
              data-testid="loading-spinner"
              className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"
            />
            <p className="text-sm font-medium text-indigo-600">
              {STATUS_TEXTS[statusIndex]}
            </p>
          </div>
        ) : previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              data-testid="image-preview"
              src={previewUrl}
              alt="Uploaded preview"
              className="max-h-48 rounded-lg object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              Drag & drop your court ledger image here
            </p>
            <p className="text-xs text-gray-500">
              or click to browse. JPG, PNG, HEIC up to 10MB.
            </p>
            <p className="text-xs text-gray-400">
              You can also paste from clipboard (Ctrl+V / Cmd+V)
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
