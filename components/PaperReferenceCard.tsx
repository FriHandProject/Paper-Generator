import React from 'react';
import { FoundPaper } from '../types.ts';
import { CheckIcon } from './icons/CheckIcon.tsx';

interface Props {
  paper: FoundPaper;
  isSelected: boolean;
  onToggle: () => void;
}

export const PaperReferenceCard: React.FC<Props> = ({ paper, isSelected, onToggle }) => {
  return (
    <div 
      className={`p-4 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-blue-900/50 border-blue-700' : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'}`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-500'}`}>
                {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
            </div>
        </div>
        <div>
          <h4 className="font-semibold text-blue-300">{paper.title}</h4>
          <p className="text-xs text-gray-400 mt-1">{paper.authors.join(', ')} ({paper.year})</p>
          <p className="text-sm text-gray-300 mt-2">{paper.summary}</p>
        </div>
      </div>
    </div>
  );
};
