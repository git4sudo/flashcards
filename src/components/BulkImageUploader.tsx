import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, ImagePlus, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadRoRImage } from '../lib/storage';
import { useRoRCardStore } from '../store/rorCardStore';
import { normalizeFileName, groupImagesByName } from '../utils/fileUtils';

interface ImageFile extends File {
  preview: string;
  normalizedName: string;
}

interface ImageGroup {
  name: string;
  front?: ImageFile;
  back?: ImageFile;
}

export const BulkImageUploader: React.FC = () => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    processed: number;
    matched: number;
  }>({ total: 0, processed: 0, matched: 0 });
  
  const addCard = useRoRCardStore((state) => state.addCard);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      normalizedName: normalizeFileName(file.name)
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 5242880, // 5MB
  });

  const imageGroups = useMemo(() => {
    const groups = groupImagesByName(files);
    setUploadProgress(prev => ({
      ...prev,
      total: files.length,
      matched: Object.values(groups).filter(g => g.front && g.back).length * 2
    }));
    return groups;
  }, [files]);

  const handleUpload = async () => {
    setIsUploading(true);
    setError('');
    setUploadProgress(prev => ({ ...prev, processed: 0 }));

    try {
      for (const group of Object.values(imageGroups)) {
        if (group.front && group.back) {
          const frontResult = await uploadRoRImage(group.front, 'fronts');
          if (!frontResult.success) throw new Error(frontResult.error);
          
          const backResult = await uploadRoRImage(group.back, 'backs');
          if (!backResult.success) throw new Error(backResult.error);

          await addCard({
            name: group.name,
            category: 'Bulk Upload',
            front_image_url: frontResult.url!,
            back_image_url: backResult.url!,
          });

          setUploadProgress(prev => ({
            ...prev,
            processed: prev.processed + 2
          }));
        }
      }

      // Cleanup previews
      files.forEach(file => URL.revokeObjectURL(file.preview));
      setFiles([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (file: ImageFile) => {
    URL.revokeObjectURL(file.preview);
    setFiles(prev => prev.filter(f => f !== file));
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag & drop multiple images here, or click to select files
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports: JPG, PNG, GIF (max 5MB each)
        </p>
      </div>

      {files.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Total Images: {uploadProgress.total} | 
              Matched Pairs: {uploadProgress.matched / 2} |
              Unmatched: {uploadProgress.total - uploadProgress.matched}
            </div>
            {uploadProgress.processed > 0 && (
              <div className="text-sm text-gray-600">
                Processed: {uploadProgress.processed} / {uploadProgress.matched}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {Object.entries(imageGroups).map(([name, group]) => (
              <div key={name} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{name}</h3>
                  {group.front && group.back ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-500" size={20} />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    {group.front ? (
                      <>
                        <img
                          src={group.front.preview}
                          alt={`Front - ${name}`}
                          className="w-full h-40 object-cover rounded"
                        />
                        <button
                          onClick={() => removeFile(group.front!)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-sm text-gray-500">No front image</p>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    {group.back ? (
                      <>
                        <img
                          src={group.back.preview}
                          alt={`Back - ${name}`}
                          className="w-full h-40 object-cover rounded"
                        />
                        <button
                          onClick={() => removeFile(group.back!)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-sm text-gray-500">No back image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading || uploadProgress.matched === 0}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading... ({uploadProgress.processed} / {uploadProgress.matched})
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload {uploadProgress.matched / 2} Matched Pairs
            </>
          )}
        </button>
      )}
    </div>
  );
};