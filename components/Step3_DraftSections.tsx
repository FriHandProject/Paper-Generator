import React, { useState, useRef } from 'react';
import { PaperData, PaperSections, sectionKeys, sectionTitles } from '../types.ts';
import { draftSectionContent, refineSectionContent } from '../services/geminiService.ts';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';

interface Props {
  paperData: PaperData;
  onUpdateSection: (section: keyof PaperSections, content: { raw?: string; refined?: string }) => void;
}

const Step3_DraftSections: React.FC<Props> = ({ paperData, onUpdateSection }) => {
  const [loadingSection, setLoadingSection] = useState<{ key: string, type: 'draft' | 'refine' } | null>(null);
  const [errorSection, setErrorSection] = useState<string | null>(null);
  const [isFillingAll, setIsFillingAll] = useState(false);
  const [isRefiningAll, setIsRefiningAll] = useState(false);
  const [fillAllMessage, setFillAllMessage] = useState('');
  const [refineAllMessage, setRefineAllMessage] = useState('');
  const [fillAllError, setFillAllError] = useState<string | null>(null);
  const [refineAllError, setRefineAllError] = useState<string | null>(null);
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);


  const handleDraft = async (key: keyof PaperSections) => {
    setLoadingSection({ key, type: 'draft' });
    setErrorSection(null);
    try {
      const draft = await draftSectionContent(sectionTitles[key], paperData);
      onUpdateSection(key, { raw: draft, refined: '' }); // Clear refined when re-drafting
    } catch (error) {
      console.error(`Failed to draft ${key}`, error);
      setErrorSection(key);
    } finally {
      setLoadingSection(null);
    }
  };

  const handleRefine = async (key: keyof PaperSections) => {
    const rawContent = paperData.sections[key].raw;
    if (!rawContent) return;

    setLoadingSection({ key, type: 'refine' });
    setErrorSection(null);
    try {
      const refined = await refineSectionContent(sectionTitles[key], rawContent, paperData);
      onUpdateSection(key, { refined });
    } catch (error) {
      console.error(`Failed to refine ${key}`, error);
      setErrorSection(key);
    } finally {
      setLoadingSection(null);
    }
  };

  const handleFillAll = async () => {
    setIsFillingAll(true);
    setFillAllMessage('');
    setFillAllError(null);

    try {
      for (const key of sectionKeys) {
        if (!paperData.sections[key].raw.trim()) {
          setFillAllMessage(`Drafting ${sectionTitles[key]}...`);
          const draft = await draftSectionContent(sectionTitles[key], paperData);
          onUpdateSection(key, { raw: draft, refined: '' });
        }
      }
      setFillAllMessage('All sections filled successfully!');
      setTimeout(() => setFillAllMessage(''), 3000); 
    } catch (error) {
      console.error('Failed to fill all sections', error);
      setFillAllError('An error occurred while filling sections. Please try again.');
      setFillAllMessage('');
    } finally {
      setIsFillingAll(false);
    }
  };

  const handleRefineAll = async () => {
    setIsRefiningAll(true);
    setRefineAllMessage('');
    setRefineAllError(null);

    try {
      for (const key of sectionKeys) {
        const section = paperData.sections[key];
        if (section.raw.trim()) {
          setRefineAllMessage(`Refining ${sectionTitles[key]}...`);
          const refined = await refineSectionContent(sectionTitles[key], section.raw, paperData);
          onUpdateSection(key, { refined });
        }
      }
      setRefineAllMessage('All sections refined successfully!');
      setTimeout(() => setRefineAllMessage(''), 3000);
    } catch (error) {
      console.error('Failed to refine all sections', error);
      setRefineAllError('An error occurred while refining sections. Please try again.');
      setRefineAllMessage('');
    } finally {
      setIsRefiningAll(false);
    }
  };


  const handleRawChange = (key: keyof PaperSections, value: string) => {
    onUpdateSection(key, { raw: value });
  };
  
  const handleInsertPlaceholder = (key: keyof PaperSections, type: 'FIGURE' | 'TABLE') => {
    const placeholderText = `\n\n[${type}: A description of the ${type.toLowerCase()}. Caption: A descriptive caption.]\n\n`;
    const currentRawValue = paperData.sections[key].raw;
    onUpdateSection(key, { raw: currentRawValue + placeholderText });
    
    // Focus logic can be tricky without direct refs, but this is a good-enough UX for now
    setTimeout(() => {
        const textarea = document.getElementById(`${key}-raw`) as HTMLTextAreaElement;
        if (textarea) {
            textarea.focus();
            textarea.scrollTop = textarea.scrollHeight;
        }
    }, 0);
  };


  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Step 3: Draft and Refine Sections</h2>
      <p className="text-gray-400 mb-6">
        When drafting or refining, the AI will now automatically suggest where figures and tables are needed by inserting placeholders like `[FIGURE: ...]` directly into the text. You can also add them manually.
      </p>

      <div className="mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="text-md font-semibold text-white mb-2">Bulk Actions</h3>
        <p className="text-sm text-gray-400 mb-3">
          Use these buttons to quickly draft or refine all sections based on the information from Step 1.
        </p>
        <div className="flex flex-wrap items-start gap-3">
            <button
              onClick={handleFillAll}
              disabled={isFillingAll || isRefiningAll || !!loadingSection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors"
            >
              <SparklesIcon className="w-5 h-5" />
              {isFillingAll ? 'Generating...' : 'Fill All Sections'}
            </button>
            <button
              onClick={handleRefineAll}
              disabled={isFillingAll || isRefiningAll || !!loadingSection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors"
            >
              <SparklesIcon className="w-5 h-5" />
              {isRefiningAll ? 'Refining...' : 'Refine All Sections'}
            </button>
            <div className="w-full">
                {isFillingAll && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-purple-300">
                    <SpinnerIcon className="w-4 h-4" />
                    <span>{fillAllMessage}</span>
                  </div>
                )}
                {fillAllError && <p className="text-red-400 mt-2 text-sm">{fillAllError}</p>}
                {isRefiningAll && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-300">
                    <SpinnerIcon className="w-4 h-4" />
                    <span>{refineAllMessage}</span>
                  </div>
                )}
                {refineAllError && <p className="text-red-400 mt-2 text-sm">{refineAllError}</p>}
            </div>
        </div>
      </div>

      <fieldset disabled={isFillingAll || isRefiningAll} className="space-y-8">
        {sectionKeys.map((key) => (
          <div key={key} className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">{sectionTitles[key]}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Raw Draft Column */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor={`${key}-raw`} className="text-sm font-medium text-gray-300">Initial Draft</label>
                  <button
                    onClick={() => handleDraft(key)}
                    disabled={!!loadingSection || isFillingAll || isRefiningAll}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md disabled:opacity-50 disabled:cursor-wait transition-colors"
                  >
                    {loadingSection?.key === key && loadingSection.type === 'draft' ? (
                      <SpinnerIcon className="w-4 h-4" />
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                    {loadingSection?.key === key && loadingSection.type === 'draft' ? 'Drafting...' : 'Draft with AI'}
                  </button>
                </div>
                <textarea
                  id={`${key}-raw`}
                  rows={8}
                  value={paperData.sections[key].raw}
                  onChange={(e) => handleRawChange(key, e.target.value)}
                  placeholder={`Click "Draft with AI" or write your own draft for the ${sectionTitles[key].toLowerCase()} here...`}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                />
                <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => handleInsertPlaceholder(key, 'FIGURE')} className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors">+ Add Figure</button>
                    <button type="button" onClick={() => handleInsertPlaceholder(key, 'TABLE')} className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors">+ Add Table</button>
                </div>
              </div>

              {/* Refined Column */}
              <div>
                <div className="flex justify-between items-center mb-2">
                   <label htmlFor={`${key}-refined`} className="text-sm font-medium text-gray-300">Refined Version</label>
                   <button
                    onClick={() => handleRefine(key)}
                    disabled={!paperData.sections[key].raw || !!loadingSection || isFillingAll || isRefiningAll}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-md disabled:opacity-50 disabled:cursor-wait transition-colors"
                  >
                    {loadingSection?.key === key && loadingSection.type === 'refine' ? (
                      <SpinnerIcon className="w-4 h-4" />
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                    {loadingSection?.key === key && loadingSection.type === 'refine' ? 'Refining...' : 'Refine with AI'}
                  </button>
                </div>
                <div
                  id={`${key}-refined`}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm px-3 py-2 min-h-[180px] text-gray-300 whitespace-pre-wrap"
                >
                  {paperData.sections[key].refined || <span className="text-gray-500">The refined version will appear here...</span>}
                </div>
              </div>
            </div>
            {errorSection === key && (
                <p className="text-red-400 mt-2 text-sm">
                    An error occurred while processing this section. Please try again.
                </p>
            )}
          </div>
        ))}
      </fieldset>
    </div>
  );
};

export default Step3_DraftSections;