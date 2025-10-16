import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, CameraIcon, CaptureIcon } from './icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  title: string;
  instructionText: string;
  changeImageText: string;
  uploadText: string;
  cameraText: string;
  captureText: string;
  cameraErrorText: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, title, instructionText, changeImageText, uploadText, cameraText, captureText, cameraErrorText 
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'camera'>('upload');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
      setInputMode('upload');
      stopCamera();
    }
  };
  
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError(cameraErrorText);
    }
  }, [cameraErrorText, stopCamera]);

  useEffect(() => {
    if (inputMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, startCamera, stopCamera]);


  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            handleFileChange(new File([blob], "capture.jpg", { type: "image/jpeg" }));
          }
        }, 'image/jpeg');
      }
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-200 mb-2 text-center">{title}</h3>
      <div className="bg-gray-800 rounded-lg border-2 border-gray-600 p-1">
        <div className="flex mb-1">
          <button onClick={() => setInputMode('upload')} className={`w-1/2 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${inputMode === 'upload' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            <UploadIcon className="w-5 h-5" /> {uploadText}
          </button>
          <button onClick={() => setInputMode('camera')} className={`w-1/2 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${inputMode === 'camera' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            <CameraIcon className="w-5 h-5" /> {cameraText}
          </button>
        </div>

        {inputMode === 'upload' && (
           <label
             onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
             className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-b-md cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-500 bg-gray-800/50 hover:bg-gray-700'}`}
           >
             {imagePreview ? (
               <>
                 <img src={imagePreview} alt="Preview" className="object-contain w-full h-full rounded-b-md" />
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-b-md">
                   <span className="text-white font-semibold">{changeImageText}</span>
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                 <UploadIcon className="w-8 h-8 mb-4" />
                 <p className="mb-2 text-sm text-center">{instructionText}</p>
               </div>
             )}
             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
           </label>
        )}
        
        {inputMode === 'camera' && (
          <div className="relative w-full h-64 bg-black flex items-center justify-center rounded-b-md overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
            {cameraError && <p className="absolute text-center text-white bg-black/50 p-2 rounded">{cameraError}</p>}
            {!cameraError && (
              <button onClick={handleCapture} className="absolute bottom-4 flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm hover:bg-white/30 transition">
                <CaptureIcon className="w-6 h-6" />
                {captureText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;