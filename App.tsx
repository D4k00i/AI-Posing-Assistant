import React, { useState, useCallback } from 'react';
import { Language, AppMode, ImageFile, AIResponse, Concept } from './types';
import { UI_TEXT } from './constants';
import { generatePosingAdvice, fileToBase64 } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import ConceptsDisplay from './components/ConceptsDisplay';
import Spinner from './components/Spinner';
import { CameraIcon, SparklesIcon } from './components/icons';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.VI);
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [targetImage, setTargetImage] = useState<ImageFile | null>(null);
  const [modelImage, setModelImage] = useState<ImageFile | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const text = UI_TEXT[language];

  const handleImageSelect = async (file: File, setImageState: React.Dispatch<React.SetStateAction<ImageFile | null>>) => {
    try {
      const base64 = await fileToBase64(file);
      setImageState({ base64, mimeType: file.type, name: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file');
    }
  };

  const isSubmissionDisabled = () => {
    if (isLoading) return true;
    if (appMode === AppMode.RECREATE) return !targetImage || !modelImage;
    if (appMode === AppMode.IMPROVE) return !targetImage;
    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmissionDisabled()) return;

    setIsLoading(true);
    setAiResponse(null);
    setConcepts(null);
    setError(null);

    const images: ImageFile[] = [];
    if (appMode === AppMode.RECREATE) {
      if (targetImage) images.push(targetImage);
      if (modelImage) images.push(modelImage);
    } else if (appMode === AppMode.IMPROVE) {
      if (targetImage) images.push(targetImage);
    }

    try {
      const response = await generatePosingAdvice({ 
        mode: appMode!, 
        language, 
        images,
      });
      if (Array.isArray(response)) {
        setConcepts(response);
      } else {
        setAiResponse(response);
      }
    } catch (e) {
      setError(text.errorInstruction);
    } finally {
      setIsLoading(false);
    }
  }, [appMode, language, targetImage, modelImage, text.errorInstruction]);

  const resetStateForModeChange = (newMode: AppMode) => {
    setAppMode(newMode);
    setTargetImage(null);
    setModelImage(null);
    setAiResponse(null);
    setConcepts(null);
    setError(null);
  }

  const ModeButton: React.FC<{
    mode: AppMode;
    Icon: React.FC<{className?: string}>;
    title: string;
    description: string;
  }> = ({ mode, Icon, title, description }) => (
    <button
      onClick={() => resetStateForModeChange(mode)}
      className={`p-6 w-full md:w-1/2 flex flex-col items-center text-center rounded-lg border-2 transition-all duration-300 ${appMode === mode ? 'bg-purple-600 border-purple-500 shadow-lg' : 'bg-gray-800 border-gray-700 hover:border-purple-500 hover:bg-gray-700'}`}
    >
      <Icon className="w-10 h-10 mb-3 text-purple-300" />
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-gray-400 text-sm">{description}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 relative">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
                {text.title}
            </h1>
            <div className="absolute top-0 right-0 bg-gray-800 rounded-full p-1 flex items-center border border-gray-700">
                <button onClick={() => setLanguage(Language.VI)} className={`px-3 py-1 text-sm rounded-full ${language === Language.VI ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>VI</button>
                <button onClick={() => setLanguage(Language.EN)} className={`px-3 py-1 text-sm rounded-full ${language === Language.EN ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>EN</button>
            </div>
        </header>

        <main>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <ModeButton mode={AppMode.RECREATE} Icon={CameraIcon} title={text.recreateMode} description={text.recreateDescription} />
            <ModeButton mode={AppMode.IMPROVE} Icon={SparklesIcon} title={text.improveMode} description={text.improveDescription} />
          </div>

          {!appMode && (
            <div className="text-center p-12 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400">{text.selectMode}</p>
            </div>
          )}

          {appMode && (
            <div className="space-y-6 bg-gray-800/50 p-6 rounded-lg border border-gray-700/50">
                <div className={`flex flex-col sm:flex-row gap-6 ${appMode === AppMode.IMPROVE ? 'justify-center' : ''}`}>
                    <ImageUploader 
                        title={appMode === AppMode.RECREATE ? text.targetImage : text.sceneImage} 
                        onImageSelect={(file) => handleImageSelect(file, setTargetImage)}
                        instructionText={text.uploadInstruction}
                        changeImageText={text.changeImage}
                        uploadText={text.upload}
                        cameraText={text.camera}
                        captureText={text.capture}
                        cameraErrorText={text.cameraError}
                    />
                    {appMode === AppMode.RECREATE && (
                        <ImageUploader 
                            title={text.yourImage} 
                            onImageSelect={(file) => handleImageSelect(file, setModelImage)}
                            instructionText={text.uploadInstruction}
                            changeImageText={text.changeImage}
                            uploadText={text.upload}
                            cameraText={text.camera}
                            captureText={text.capture}
                            cameraErrorText={text.cameraError}
                        />
                    )}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmissionDisabled()}
                        className="flex items-center justify-center px-8 py-3 bg-purple-600 rounded-lg font-semibold text-white transition-all duration-300 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        {isLoading ? <><Spinner /> {text.generating}</> : text.generate}
                    </button>
                </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto">
            {error && <ResultDisplay title={text.errorTitle} content={error} />}
            {aiResponse && <ResultDisplay title={text.aiResponseTitle} content={aiResponse.text} image={aiResponse.image} imageTitle={text.yourImage} />}
            {concepts && <ConceptsDisplay title={text.conceptsTitle} concepts={concepts} />}
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;
