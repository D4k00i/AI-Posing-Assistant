import React from 'react';
import { DownloadIcon } from './icons';

interface ResultDisplayProps {
  title: string;
  content: string;
  image?: string | null;
  imageTitle?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ title, content, image, imageTitle }) => {
  const formattedContent = content.split('\n').map((line, index) => {
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return <li key={index} className="mb-2">{line.substring(2)}</li>;
    }
    // Bold text enclosed in **
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={index} className="mb-4">
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            part
          )
        )}
      </p>
    );
  });
  
  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-purple-400 mb-4">{title}</h2>
      <div className="text-gray-300 space-y-2 prose prose-invert max-w-none">
        {content.includes('* ') || content.includes('- ') ? <ul>{formattedContent}</ul> : formattedContent}
      </div>

      {image && imageTitle && (
        <div className="mt-6 border-t border-gray-700 pt-6">
           <div className="flex justify-between items-center mb-3">
             <h3 className="text-xl font-bold text-purple-300">{imageTitle}</h3>
             <button
              onClick={() => handleDownload(image, 'guided-pose.png')}
              title="Download Image"
              className="p-2 rounded-full text-gray-300 bg-gray-700 hover:bg-purple-600 hover:text-white transition-colors"
              aria-label="Download Image"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
           </div>
          <img src={image} alt={imageTitle} className="rounded-lg border border-gray-600 mx-auto max-w-full h-auto" />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;