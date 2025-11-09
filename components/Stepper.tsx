
import React from 'react';
import { CheckIcon } from './icons/CheckIcon.tsx';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  'Collect Info',
  'Propose Structure',
  'Draft Sections',
  'Generate LaTeX',
  'Final Check',
];

const Stepper: React.FC<StepperProps> = ({ currentStep, totalSteps }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <li key={step} className={`relative ${index !== totalSteps - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {isCompleted ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-blue-600" />
                  </div>
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600"
                  >
                    <CheckIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute top-10 -left-2 w-20 text-center text-xs text-gray-300">{step}</span>
                </>
              ) : isCurrent ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-700" />
                  </div>
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-gray-800"
                    aria-current="step"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  </div>
                   <span className="absolute top-10 -left-2 w-20 text-center text-xs font-semibold text-blue-400">{step}</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-700" />
                  </div>
                  <div
                    className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                  </div>
                  <span className="absolute top-10 -left-2 w-20 text-center text-xs text-gray-500">{step}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;