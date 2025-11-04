
import React, { useState, useCallback, useRef } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, MagicWandIcon } from './components/icons';
import { Loader } from './components/Loader';

interface GenerativePart {
    mimeType: string;
    base64: string;
}

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalImagePart, setOriginalImagePart] = useState<GenerativePart | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            setEditedImage(null);
            setOriginalImage(URL.createObjectURL(file));
            try {
                const part = await fileToGenerativePart(file);
                setOriginalImagePart(part);
            } catch (err) {
                setError('Failed to process image file. Please try another one.');
                setOriginalImage(null);
                setOriginalImagePart(null);
            }
        }
    }, []);

    const handleGenerateClick = useCallback(async () => {
        if (!originalImagePart || !prompt) {
            setError('Please upload an image and enter a prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const newImageBase64 = await editImageWithGemini(originalImagePart.base64, originalImagePart.mimeType, prompt);
            setEditedImage(`data:${originalImagePart.mimeType};base64,${newImageBase64}`);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the image.');
        } finally {
            setIsLoading(false);
        }
    }, [originalImagePart, prompt]);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <header className="w-full max-w-6xl text-center mb-8">
                <div className="flex items-center justify-center gap-3">
                    <MagicWandIcon className="w-10 h-10 text-purple-400" />
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Gemini Image Editor
                    </h1>
                </div>
                <p className="mt-2 text-lg text-gray-400">
                    Use AI to edit your photos with simple text prompts.
                </p>
            </header>

            <main className="w-full max-w-6xl flex flex-col gap-8">
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-purple-900/10">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-4">
                            <label htmlFor="prompt-input" className="text-lg font-semibold text-gray-300">
                                1. Describe your edit
                            </label>
                            <textarea
                                id="prompt-input"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Make this person wear a classic suit and tie"
                                className="w-full h-24 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                                disabled={!originalImage}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleGenerateClick}
                                disabled={isLoading || !prompt || !originalImage}
                                className="w-full md:w-auto h-24 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-6 h-6" />
                                        <span>Generate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center">Original Image</h2>
                        <div className="relative w-full aspect-square bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center overflow-hidden">
                            {originalImage ? (
                                <img src={originalImage} alt="Original" className="object-contain w-full h-full" />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <UploadIcon className="w-12 h-12 mx-auto mb-2" />
                                    <p>Upload an image to get started</p>
                                </div>
                            )}
                            <button
                                onClick={triggerFileInput}
                                className="absolute bottom-4 right-4 bg-gray-900/70 text-white font-semibold py-2 px-4 rounded-lg backdrop-blur-sm border border-gray-600 hover:bg-gray-800 transition-colors"
                            >
                                {originalImage ? 'Change Image' : 'Upload Image'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center">Edited Image</h2>
                        <div className="w-full aspect-square bg-gray-800/50 border-2 border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                            {isLoading && (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Loader />
                                    <p className="mt-4">AI is working its magic...</p>
                                </div>
                            )}
                            {error && !isLoading && <p className="text-red-400 p-4 text-center">{error}</p>}
                            {!isLoading && editedImage && (
                                <img src={editedImage} alt="Edited" className="object-contain w-full h-full" />
                            )}
                            {!isLoading && !editedImage && !error && (
                                <div className="text-center text-gray-500">
                                    <MagicWandIcon className="w-12 h-12 mx-auto mb-2" />
                                    <p>Your edited image will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
