import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { uploadRoRImage } from '../lib/storage';
import { useRoRCardStore } from '../store/rorCardStore';

interface CardUpload {
  name: string;
  category: string;
  frontFile: File | null;
  backFile: File | null;
  frontPreview: string;
  backPreview: string;
}

const initialCardState: CardUpload = {
  name: '',
  category: '',
  frontFile: null,
  backFile: null,
  frontPreview: '',
  backPreview: '',
};

export const RoRCardUploader: React.FC = () => {
  const [card, setCard] = useState<CardUpload>(initialCardState);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const addCard = useRoRCardStore((state) => state.addCard);

  const onDrop = useCallback((acceptedFiles: File[], type: 'front' | 'back') => {
    if (acceptedFiles.length !== 1) {
      setError('Please upload exactly one image.');
      return;
    }

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = () => {
      setCard((prev) => ({
        ...prev,
        [`${type}File`]: file,
        [`${type}Preview`]: reader.result as string,
      }));
      setError('');
    };

    reader.readAsDataURL(file);
  }, []);

  const frontDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'front'),
    accept: { 'image/png': ['.png'] },
    maxFiles: 1,
  });

  const backDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'back'),
    accept: { 'image/png': ['.png'] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!card.name.trim() || !card.category.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!card.frontFile || !card.backFile) {
      setError('Please upload both front and back images.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const frontResult = await uploadRoRImage(card.frontFile, 'fronts');
      if (!frontResult.success || !frontResult.url) {
        throw new Error(frontResult.error || 'Failed to upload front image');
      }

      const backResult = await uploadRoRImage(card.backFile, 'backs');
      if (!backResult.success || !backResult.url) {
        throw new Error(backResult.error || 'Failed to upload back image');
      }

      await addCard({
        name: card.name,
        category: card.category,
        front_image_url: frontResult.url,
        back_image_url: backResult.url,
      });

      setCard(initialCardState);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload card');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Card Name
          </label>
          <input
            type="text"
            id="name"
            value={card.name}
            onChange={(e) => setCard((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={card.category}
            onChange={(e) => setCard((prev) => ({ ...prev, category: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div
              {...frontDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${frontDropzone.isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <input {...frontDropzone.getInputProps()} />
              {card.frontPreview ? (
                <img
                  src={card.frontPreview}
                  alt="Front preview"
                  className="mx-auto h-48 object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Drop front image here</p>
                </>
              )}
            </div>
          </div>

          <div>
            <div
              {...backDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${backDropzone.isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <input {...backDropzone.getInputProps()} />
              {card.backPreview ? (
                <img
                  src={card.backPreview}
                  alt="Back preview"
                  className="mx-auto h-48 object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Drop back image here</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={20} />
            Upload Card
          </>
        )}
      </button>
    </form>
  );
};