import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Brain, Layers, FolderOpen, Sparkles, Rocket, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      key: 'welcome',
      icon: Brain,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      key: 'code',
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      key: 'para',
      icon: FolderOpen,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      key: 'jarvis',
      icon: Sparkles,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      key: 'chat',
      icon: MessageSquare,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      key: 'ready',
      icon: Rocket,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">
        
        {/* Left Side: Graphic */}
        <div className={`md:w-2/5 ${currentStepData.bg} p-10 flex flex-col items-center justify-center text-center transition-colors duration-500`}>
          <div className={`w-24 h-24 rounded-full bg-white/80 backdrop-blur flex items-center justify-center mb-6 shadow-lg transition-transform duration-500 transform hover:scale-110`}>
            <Icon className={`w-12 h-12 ${currentStepData.color}`} />
          </div>
          <div className="flex gap-2 mt-8">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-gray-800 w-4' : 'bg-gray-400/50'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex justify-end mb-4">
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium px-3 py-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                {t.onboarding.skip}
              </button>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4 transition-all duration-300">
              {(t.onboarding[currentStepData.key as keyof typeof t.onboarding] as { title: string; desc: string }).title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed transition-all duration-300">
              {(t.onboarding[currentStepData.key as keyof typeof t.onboarding] as { title: string; desc: string }).desc}
            </p>
          </div>

          <div className="flex items-center justify-between mt-12">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors ${
                currentStep === 0 ? 'opacity-0 cursor-default' : 'opacity-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {t.onboarding.back}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {currentStep === steps.length - 1 ? t.onboarding.finish : t.onboarding.next}
              {currentStep !== steps.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
