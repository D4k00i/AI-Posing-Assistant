import React from 'react';

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

  return (
    <div className="w-full mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-purple-400 mb-4">{title}</h2>
      <div className="text-gray-300 space-y-2 prose prose-invert max-w-none">
        {content.includes('* ') || content.includes('- ') ? <ul>{formattedContent}</ul> : formattedContent}
      </div>

      {image && imageTitle && (
        <div className="mt-6 border-t border-gray-700 pt-6">
          <h3 className="text-xl font-bold text-purple-300 mb-3">{imageTitle}</h3>
          <img src={image} alt={imageTitle} className="rounded-lg border border-gray-600 mx-auto max-w-full h-auto" />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;