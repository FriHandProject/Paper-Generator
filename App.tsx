
import React, { useState } from 'react';
import { PaperData, PaperSections } from './types.ts';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Stepper from './components/Stepper.tsx';
import Step1_CollectInfo from './components/Step1_CollectInfo.tsx';
import Step2_Structure from './components/Step2_Structure.tsx';
import Step3_DraftSections from './components/Step3_DraftSections.tsx';
import Step4_GenerateLatex from './components/Step4_GenerateLatex.tsx';
import Step5_FinalCheck from './components/Step5_FinalCheck.tsx';

const initialPaperData: PaperData = {
  title: '',
  authors: [{ name: '', affiliation: '', email: '' }],
  venueType: 'conference',
  problemStatement: '',
  objectives: '',
  methodologySummary: '',
  dataset: '',
  keyResults: '',
  conclusions: '',
  references: '',
  sections: {
    abstract: { raw: '', refined: '' },
    keywords: { raw: '', refined: '' },
    introduction: { raw: '', refined: '' },
    relatedWork: { raw: '', refined: '' },
    methodology: { raw: '', refined: '' },
    results: { raw: '', refined: '' },
    discussion: { raw: '', refined: '' },
    conclusion: { raw: '', refined: '' },
    acknowledgment: { raw: '', refined: '' },
  },
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [paperData, setPaperData] = useState<PaperData>(initialPaperData);

  const totalSteps = 5;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleUpdate = (data: Partial<PaperData>) => {
    setPaperData((prev) => ({ ...prev, ...data }));
  };

  const handleUpdateSection = (section: keyof PaperSections, content: { raw?: string; refined?: string }) => {
    setPaperData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          ...content
        }
      }
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1_CollectInfo paperData={paperData} onUpdate={handleUpdate} />;
      case 2:
        return <Step2_Structure />;
      case 3:
        return <Step3_DraftSections paperData={paperData} onUpdateSection={handleUpdateSection} />;
      case 4:
        return <Step4_GenerateLatex paperData={paperData} />;
      case 5:
        return <Step5_FinalCheck />;
      default:
        return <Step1_CollectInfo paperData={paperData} onUpdate={handleUpdate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Stepper currentStep={currentStep} totalSteps={totalSteps} />
          <div className="mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg shadow-xl">
            {renderStepContent()}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Start Over
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;