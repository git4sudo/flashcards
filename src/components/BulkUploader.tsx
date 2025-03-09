import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, X } from 'lucide-react';

interface BulkUploaderProps {
  onDescriptionsLoaded: (descriptions: string[]) => void;
}

export const BulkUploader: React.FC<BulkUploaderProps> = ({ onDescriptionsLoaded }) => {
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length !== 1) {
      setError('Please upload exactly one text file.');
      return;
    }

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      const descriptions = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (descriptions.length === 0) {
        setError('No valid descriptions found in the file.');
        return;
      }

      onDescriptionsLoaded(descriptions);
      setError('');
    };

    reader.onerror = () => {
      setError('Error reading the file.');
    };

    reader.readAsText(file);
  }, [onDescriptionsLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  return (
    <div className="mt-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <FileText className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-1 text-sm text-gray-600">
          Drop a text file with descriptions (one per line)
        </p>
      </div>
      {error && (
        <div className="mt-2 text-red-500 text-sm flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}
    </div>
  );
};