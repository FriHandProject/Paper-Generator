import React, { useState } from 'react';
import { PaperData, Author, FoundPaper } from '../types.ts';
import { recommendSectionContent, findReferencesForTopic } from '../services/geminiService.ts';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';
import { SearchIcon } from './icons/SearchIcon.tsx';
import { PaperReferenceCard } from './PaperReferenceCard.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';


interface Props {
  paperData: PaperData;
  onUpdate: (data: Partial<PaperData>) => void;
}

type RecommendableField = 'title' | 'problemStatement' | 'objectives' | 'methodologySummary' | 'dataset' | 'keyResults' | 'conclusions';

const Step1_CollectInfo: React.FC<Props> = ({ paperData, onUpdate }) => {
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [isFillingAll, setIsFillingAll] = useState(false);
  const [isFindingPapers, setIsFindingPapers] = useState(false);
  const [errorState, setErrorState] = useState<{field: string, message: string} | null>(null);
  const [recommendationTopic, setRecommendationTopic] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const [foundPapers, setFoundPapers] = useState<FoundPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onUpdate({ [e.target.name]: e.target.value });
  };

  const handleAuthorChange = (index: number, field: keyof Author, value: string) => {
    const newAuthors = [...paperData.authors];
    newAuthors[index] = { ...newAuthors[index], [field]: value };
    onUpdate({ authors: newAuthors });
  };

  const addAuthor = () => {
    onUpdate({ authors: [...paperData.authors, { name: '', affiliation: '', email: '' }] });
  };

  const removeAuthor = (index: number) => {
    if (paperData.authors.length > 1) {
      const newAuthors = paperData.authors.filter((_, i) => i !== index);
      onUpdate({ authors: newAuthors });
    }
  };

  const handleRecommend = async (fieldName: RecommendableField) => {
    setLoadingField(fieldName);
    setErrorState(null);
    setLoadingMessage('Searching web for inspiration...');

    const timer = setTimeout(() => {
        setLoadingMessage(`Generating ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}...`);
    }, 2500);

    try {
      const recommendedContent = await recommendSectionContent(fieldName, paperData, recommendationTopic);
      onUpdate({ [fieldName]: recommendedContent });
    } catch (err) {
      setErrorState({ field: fieldName, message: `Could not generate a recommendation. Please provide a topic or fill other fields.` });
      console.error(err);
    } finally {
      clearTimeout(timer);
      setLoadingField(null);
      setLoadingMessage('');
    }
  };

  const handleFillAllInfo = async () => {
      setIsFillingAll(true);
      setErrorState(null);

      const fieldsToFill: RecommendableField[] = [
        'problemStatement',
        'objectives',
        'methodologySummary',
        'dataset',
        'keyResults',
        'conclusions',
        'title',
      ];
      
      let currentPaperData = { ...paperData };

      try {
        for (const field of fieldsToFill) {
          setLoadingMessage(`Generating ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`);
          const recommendedContent = await recommendSectionContent(field, currentPaperData, recommendationTopic);
          currentPaperData = { ...currentPaperData, [field]: recommendedContent };
          onUpdate({ [field]: recommendedContent });
        }
      } catch (err) {
        setErrorState({ field: 'fillAll', message: 'An error occurred during the "Fill All" process. Please ensure you have provided a topic.' });
        console.error(err);
      } finally {
        setIsFillingAll(false);
        setLoadingMessage('');
      }
  };

  const handleFindPapers = async () => {
    setIsFindingPapers(true);
    setErrorState(null);
    setFoundPapers([]);
    try {
      const papers = await findReferencesForTopic(recommendationTopic);
      setFoundPapers(papers);
      // Pre-select all found papers by default
      const allBibtex = new Set(papers.map(p => p.bibtex));
      setSelectedPapers(allBibtex);
    } catch (err) {
      setErrorState({ field: 'references_find', message: 'Could not find papers. Please check the topic and try again.' });
      console.error(err);
    } finally {
      setIsFindingPapers(false);
    }
  };
  
  const handleTogglePaperSelection = (bibtex: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bibtex)) {
        newSet.delete(bibtex);
      } else {
        newSet.add(bibtex);
      }
      return newSet;
    });
  };

  const handleAddSelectedToReferences = () => {
    const bibtexToAdd = Array.from(selectedPapers).join('\n\n');
    const existingReferences = paperData.references.trim();
    
    const updatedReferences = existingReferences 
      ? `${existingReferences}\n\n${bibtexToAdd}`
      : bibtexToAdd;
      
    onUpdate({ references: updatedReferences });
    setFoundPapers([]);
    setSelectedPapers(new Set());
  };


  const renderRecommendableField = (name: RecommendableField, label: string, type: 'text' | 'textarea' = 'text') => {
    const isLoading = loadingField === name;
    const error = errorState?.field === name ? errorState.message : null;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor={name} className="block text-sm font-medium text-gray-300">{label}</label>
                <button
                    type="button"
                    onClick={() => handleRecommend(name)}
                    disabled={!!loadingField || isFillingAll || isFindingPapers}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600/50 hover:bg-blue-600 border border-blue-500/50 text-blue-200 text-xs font-semibold rounded-md disabled:opacity-50 disabled:cursor-wait transition-all"
                    title={`Recommend ${label}`}
                >
                    <SparklesIcon className="w-3 h-3" />
                    Recommend
                </button>
            </div>
            {type === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    rows={3}
                    value={paperData[name] as string}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                />
            ) : (
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={paperData[name] as string}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                />
            )}
            {isLoading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-300 animate-pulse">
                <SpinnerIcon className="w-4 h-4" />
                <span>{loadingMessage}</span>
              </div>
            )}
            {error && <p className="text-red-400 mt-1 text-xs">{error}</p>}
        </div>
    );
  };


  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Step 1: Collect Research Information</h2>
      <p className="text-gray-400 mb-6">Provide the core details of your research. A good topic is the best starting point for the AI.</p>
      
       <div className="space-y-6">
          {/* Section 1: Topic */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <label htmlFor="recommendation-topic" className="block text-lg font-semibold text-gray-200 mb-2">1. Start with a Core Topic</label>
              <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    id="recommendation-topic"
                    placeholder="e.g., Artificial Intelligence for Healthcare, Augmented Reality in Education"
                    value={recommendationTopic}
                    onChange={(e) => setRecommendationTopic(e.target.value)}
                    className="flex-grow bg-gray-800 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                  />
                  <button
                      type="button"
                      onClick={handleFindPapers}
                      disabled={!recommendationTopic || !!loadingField || isFillingAll || isFindingPapers}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors flex-shrink-0 w-full sm:w-auto"
                  >
                      {isFindingPapers ? <SpinnerIcon className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                      {isFindingPapers ? 'Finding Papers...' : 'Find Papers'}
                  </button>
              </div>
          </div>

          {/* Paper Search Results */}
          {(isFindingPapers || foundPapers.length > 0) && (
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                {isFindingPapers && (
                    <div className="flex items-center justify-center gap-2 my-4 text-lg text-indigo-300">
                        <SpinnerIcon className="w-6 h-6" />
                        <span>Searching the web for relevant papers...</span>
                    </div>
                )}
                {errorState?.field === 'references_find' && <p className="text-red-400 text-center my-4">{errorState.message}</p>}

                {foundPapers.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Found Papers</h3>
                        <p className="text-gray-400 mb-4 text-sm">Select the papers most relevant to your work. These will be used as context by the AI.</p>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                          {foundPapers.map((paper, index) => (
                              <PaperReferenceCard 
                                key={index}
                                paper={paper}
                                isSelected={selectedPapers.has(paper.bibtex)}
                                onToggle={() => handleTogglePaperSelection(paper.bibtex)}
                              />
                          ))}
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleAddSelectedToReferences}
                                disabled={selectedPapers.size === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                            >
                                <CheckIcon className="w-5 h-5" />
                                Add Selected to References
                            </button>
                        </div>
                    </div>
                )}
            </div>
          )}
          
           {/* Section 2: References Textarea */}
           <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <label htmlFor="references" className="block text-lg font-semibold text-gray-200 mb-2">2. Curate Your References</label>
              <p className="text-gray-400 mb-3 text-sm">Add your own key references or use the "Find Papers" feature above. The AI will use these to understand your research context.</p>
              <textarea
                  id="references"
                  name="references"
                  rows={6}
                  value={paperData.references}
                  onChange={handleChange}
                  placeholder="Paste BibTeX entries here, or add them using the tool above."
                  className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
              />
          </div>

           {/* Section 3: Core Info */}
           <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h3 className="text-lg font-semibold text-gray-200">3. Define Your Core Information</h3>
                      <p className="text-gray-400 text-sm mt-1">Fill in the key details of your research. You can use the "Fill All Info" button for an AI-generated starting point.</p>
                  </div>
                  <button
                      type="button"
                      onClick={handleFillAllInfo}
                      disabled={!recommendationTopic || !!loadingField || isFillingAll || isFindingPapers}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors flex-shrink-0"
                  >
                      <SparklesIcon className="w-5 h-5" />
                      {isFillingAll ? 'Generating...' : 'Fill All Info'}
                  </button>
              </div>
              {isFillingAll && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-blue-300">
                    <SpinnerIcon className="w-4 h-4" />
                    <span>{loadingMessage}</span>
                  </div>
                )}
              {errorState?.field === 'fillAll' && <p className="text-red-400 mt-2 text-sm">{errorState.message}</p>}
               <fieldset disabled={isFillingAll || isFindingPapers} className="space-y-6 mt-4">
                  {renderRecommendableField('title', 'Working Title of the Paper')}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Authors and Affiliations</label>
                    {paperData.authors.map((author, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Author Name"
                          value={author.name}
                          onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                          className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200 min-w-[150px]"
                        />
                        <input
                          type="text"
                          placeholder="Affiliation"
                          value={author.affiliation}
                          onChange={(e) => handleAuthorChange(index, 'affiliation', e.target.value)}
                          className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200 min-w-[150px]"
                        />
                         <input
                          type="email"
                          placeholder="Email (Optional)"
                          value={author.email}
                          onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                          className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200 min-w-[150px]"
                        />
                        <button onClick={() => removeAuthor(index)} disabled={paperData.authors.length <= 1} className="p-2 bg-red-800 hover:bg-red-700 rounded-md disabled:opacity-50 flex-shrink-0">
                          &times;
                        </button>
                      </div>
                    ))}
                    <button onClick={addAuthor} className="text-sm text-blue-400 hover:text-blue-300">+ Add Author</button>
                  </div>
                  <div>
                    <label htmlFor="venueType" className="block text-sm font-medium text-gray-300 mb-1">Target Venue Type</label>
                    <select
                      id="venueType"
                      name="venueType"
                      value={paperData.venueType}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    >
                      <option value="conference">IEEE Conference</option>
                      <option value="journal">IEEE Journal</option>
                    </select>
                  </div>
                  {renderRecommendableField('problemStatement', 'Problem Statement and Motivation', 'textarea')}
                  {renderRecommendableField('objectives', 'Research Objectives', 'textarea')}
                  {renderRecommendableField('methodologySummary', 'Methodology Summary', 'textarea')}
                  {renderRecommendableField('dataset', 'Data / Dataset Description', 'textarea')}
                  {renderRecommendableField('keyResults', 'Key Results and Findings', 'textarea')}
                  {renderRecommendableField('conclusions', 'Main Conclusions and Contributions', 'textarea')}
              </fieldset>
           </div>
       </div>

    </div>
  );
};

export default Step1_CollectInfo;