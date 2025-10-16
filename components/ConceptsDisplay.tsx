import React from 'react';
import { Concept } from '../types';

interface ConceptsDisplayProps {
  title: string;
  concepts: Concept[];
}

const FormattedText: React.FC<{ content: string }> = ({ content }) => {
  return (
    <>
      {content.split('\n').map((line, index) => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return <li key={index} className="mb-2">{line.substring(2)}</li>;
        }
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
      })}
    </>
  );
};

const ConceptsDisplay: React.FC<ConceptsDisplayProps> = ({ title, concepts }) => {
  return (
    <div className="w-full mt-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concepts.map((concept, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden flex flex-col">
            <img src={concept.image} alt={concept.name} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-purple-300 mb-2">{concept.name}</h3>
              <div className="text-gray-300 text-sm space-y-2 prose prose-invert max-w-none">
                 <FormattedText content={concept.description} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConceptsDisplay;
