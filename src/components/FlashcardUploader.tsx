import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useFlashcardStore } from '../store/flashcardStore';
import { BulkUploader } from './BulkUploader';
import { uploadImage } from '../lib/storage';

interface UploadPreview {
  file: File;
  imageUrl: string;
  description: string;
  category: string;
}

export const FlashcardUploader: React.FC = () => {
  const [previews, setPreviews] = useState<UploadPreview[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const addFlashcards = useFlashcardStore((state) => state.addFlashcards);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews((prev) => [
          ...prev,
          {
            file,
            imageUrl: reader.result as string,
            description: descriptions[prev.length] || '',
            category: '',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, [descriptions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxSize: 5242880, // 5MB
  });

  const handleSubmit = async () => {
    const validPreviews = previews.filter(
      (p) => p.description.trim() && p.category.trim()
    );

    if (!validPreviews.length) {
      setError('Please ensure all flashcards have descriptions and categories.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadedCards = await Promise.all(
        validPreviews.map(async (preview) => {
          const result = await uploadImage(preview.file, 'flashcards');
          
          if (!result.success || !result.url) {
            throw new Error(`Failed to upload image: ${result.error}`);
          }

          return {
            imageUrl: result.url,
            description: preview.description,
            category: preview.category,
          };
        })
      );

      addFlashcards(uploadedCards);
      setPreviews([]);
      setDescriptions([]);
      setShowBulkUpload(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload flashcards');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDescriptionsLoaded = (loadedDescriptions: string[]) => {
    setDescriptions(loadedDescriptions);
    setShowBulkUpload(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowBulkUpload(!showBulkUpload)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <FileText size={20} />
          Bulk Text Upload
        </button>
      </div>

      {showBulkUpload && (
        <BulkUploader onDescriptionsLoaded={handleDescriptionsLoaded} />
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag & drop images here, or click to select files
          {descriptions.length > 0 && ` (${descriptions.length} descriptions loaded)`}
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <X size={20} />
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-6 space-y-4">
          {previews.map((preview, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
              <img
                src={preview.imageUrl}
                alt="Preview"
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Description"
                  className="w-full p-2 border rounded"
                  value={preview.description}
                  onChange={(e) =>
                    setPreviews((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, description: e.target.value } : p
                      )
                    )
                  }
                />
                <input
                  type="text"
                  placeholder="Category"
                  className="w-full p-2 border rounded"
                  value={preview.category}
                  onChange={(e) =>
                    setPreviews((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, category: e.target.value } : p
                      )
                    )
                  }
                />
              </div>
              <button
                onClick={() =>
                  setPreviews((prev) => prev.filter((_, i) => i !== index))
                }
                className="text-red-500 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </div>
          ))}
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Flashcards'
            )}
          </button>
        </div>
      )}
    </div>
  );
};