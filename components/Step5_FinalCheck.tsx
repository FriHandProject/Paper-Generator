
import React from 'react';
import { CheckIcon } from './icons/CheckIcon.tsx';

const checklistItems = [
  'Verify all scientific claims, data, and numerical results. You are responsible for the accuracy of your research.',
  'Check all formulas and mathematical notations for correctness.',
  'Ensure all references and citations are accurate and properly formatted according to your target venue\'s guidelines.',
  'Run your own plagiarism check. This tool helps with phrasing, but ensuring originality is your responsibility.',
  'Carefully read and adapt the paper to the specific author guidelines of the IEEE journal or conference you are submitting to.',
  'Proofread the entire manuscript for any remaining grammatical errors or typos.',
  'Confirm that the contributions and conclusions accurately reflect the work you have performed.'
];

const Step5_FinalCheck: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Step 5: Quality & Integrity Check</h2>
      <p className="text-gray-400 mb-6">
        Congratulations on drafting your manuscript! Before you consider it ready for submission, please perform these critical final checks.
        <strong className="block mt-2 text-yellow-300">Your paper is NOT ready to submit without a thorough human review.</strong>
      </p>

      <div className="space-y-3">
        {checklistItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
            <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300">{item}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-lg font-semibold text-blue-400">Good luck with your submission!</p>
    </div>
  );
};

export default Step5_FinalCheck;