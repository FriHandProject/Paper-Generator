
import React from 'react';
import { sectionTitles, sectionKeys } from '../types.ts';

const sectionDescriptions: Record<keyof typeof sectionTitles, string> = {
  abstract: 'A concise summary of your paper\'s objectives, methods, results, and conclusions.',
  keywords: 'A few keywords for indexing purposes.',
  introduction: 'Provides background, states the problem, and outlines the paper\'s contributions.',
  relatedWork: 'Discusses existing research and literature relevant to your work.',
  methodology: 'Details the methods, algorithms, and procedures you used in your research.',
  results: 'Presents the findings of your experiments and analysis, often with figures and tables.',
  discussion: 'Interprets the results, discusses their implications, and addresses limitations.',
  conclusion: 'Summarizes the paper, restates contributions, and suggests future work.',
  acknowledgment: 'Optional section to thank individuals or funding agencies.',
};

const Step2_Structure: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Step 2: Proposed Paper Structure</h2>
      <p className="text-gray-400 mb-6">
        Based on standard IEEE guidelines, here is a recommended structure for your paper. In the next step, we will work on drafting each section based on your research notes.
      </p>
      
      <div className="space-y-4">
        {sectionKeys.map((key) => {
            if (key === 'keywords') return null; // Keywords are handled differently
            return (
                <div key={key} className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <h3 className="font-semibold text-blue-400">{sectionTitles[key]}</h3>
                    <p className="text-sm text-gray-400 mt-1">{sectionDescriptions[key]}</p>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default Step2_Structure;