/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileText, FileVideo, File } from 'lucide-react';

export interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '*',
  multiple = false,
  maxSizeMB = 10,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [filesList, setFilesList] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (selectedFiles: FileList) => {
    setError(null);
    const validFiles: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > maxSizeMB) {
        setError(`File ${file.name} exceeds the maximum size limit of ${maxSizeMB}MB.`);
        return;
      }
      validFiles.push(file);
    }

    setFilesList((prev) => (multiple ? [...prev, ...validFiles] : validFiles));
    onFileSelect(selectedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (idx: number) => {
    setFilesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt') {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv') {
      return <FileVideo className="w-5 h-5 text-teal-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-all ${
          isDragActive
            ? 'border-primary bg-primary-container/10 dark:border-blue-500 dark:bg-blue-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 mb-3">
          <UploadCloud className="w-6 h-6 text-primary dark:text-blue-400" />
        </div>
        <p className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">
          Drag and drop files here, or <span className="text-primary dark:text-blue-400">browse</span>
        </p>
        <p className="font-sans text-xs text-slate-400 dark:text-slate-500 mt-1">
          Supports PDFs, PPTs, or MP4s up to {maxSizeMB}MB
        </p>
      </div>

      {/* Error Output */}
      {error && (
        <span className="text-xs text-error dark:text-red-400 font-bold">{error}</span>
      )}

      {/* Files List Display */}
      {filesList.length > 0 && (
        <div className="flex flex-col gap-2">
          {filesList.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.name)}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
