
import React from 'react';
import { WarningIcon } from './icons/WarningIcon.tsx';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 mt-12 py-6">
      <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
        <div className="max-w-3xl mx-auto flex items-start justify-center gap-3 p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50 text-yellow-300">
          <WarningIcon className="w-6 h-6 flex-shrink-0 mt-1"/>
          <div>
            <h3 className="font-bold text-yellow-200">Ethical Use Reminder</h3>
            <p className="text-left mt-1">
              This tool helps with language, structure, and formatting. You, the researcher, are the author and are responsible for the intellectual content, accuracy, and integrity of your work. Always review, edit, and verify all generated text before submission.
            </p>
          </div>
        </div>
        <p className="mt-6">&copy; {new Date().getFullYear()} Ethical IEEE Paper Generator. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;