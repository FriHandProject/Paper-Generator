import React, { useState } from 'react';
import { PaperData, LatexImage } from '../types.ts';
import { generateLatex, generateImageFromDescription } from '../services/geminiService.ts';
import { ClipboardIcon } from './icons/ClipboardIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { SpinnerIcon } from './icons/SpinnerIcon.tsx';
import { ImageIcon } from './icons/ImageIcon.tsx';


declare var JSZip: any;

interface Props {
  paperData: PaperData;
}

const dataURLtoBlob = (dataurl: string): Blob | null => {
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch(e) {
    console.error("Error converting data URL to blob", e);
    return null;
  }
};

const Step4_GenerateLatex: React.FC<Props> = ({ paperData }) => {
  const [latexCode, setLatexCode] = useState('');
  const [imagesToGenerate, setImagesToGenerate] = useState<LatexImage[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  const handleGenerateLatex = async () => {
    setIsLoading(true);
    setError(null);
    setLatexCode('');
    setImagesToGenerate([]);
    setGeneratedImages({});
    try {
      const { latex, images } = await generateLatex(paperData);
      setLatexCode(latex);
      setImagesToGenerate(images);
    } catch (err) {
      setError('Failed to generate LaTeX code. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    setImageError(null);
    let allImagesGenerated = true;

    for (const image of imagesToGenerate) {
      // If image already exists, skip
      if (generatedImages[image.filename]) continue;

      try {
        setGeneratedImages(prev => ({ ...prev, [image.filename]: 'loading' }));
        const prompt = `Create an academic-style visual for a research paper. The visual should be clear, professional, and suitable for an IEEE publication. Description: "${image.description}". The style should be a clean diagram, chart, or graph.`;
        const base64String = await generateImageFromDescription(prompt);
        setGeneratedImages(prev => ({ ...prev, [image.filename]: `data:image/png;base64,${base64String}` }));
      } catch (err) {
        console.error(`Failed to generate ${image.filename}`, err);
        setGeneratedImages(prev => ({ ...prev, [image.filename]: 'error' }));
        allImagesGenerated = false;
      }
    }
    if (!allImagesGenerated) {
      setImageError('Some images could not be generated. You can try again or download the project with placeholders for the failed images.');
    }
    setIsGeneratingImages(false);
  };


  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(latexCode).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;
    const maxLines = 5;

    for (let n = 0; n < words.length; n++) {
      if (lineCount >= maxLines) {
        context.fillText(line.trim() + '...', x, y);
        return;
      }
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines) {
      context.fillText(line, x, y);
    }
  };
  
  const createPlaceholderImage = (image: LatexImage): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));
  
      ctx.fillStyle = '#2D3748';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#4A5568';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
      ctx.fillStyle = '#E2E8F0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
  
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('PLACEHOLDER IMAGE', canvas.width / 2, 100);
  
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#A0AEC0';
      wrapText(ctx, `Filename: ${image.filename}`, canvas.width / 2, 160, canvas.width - 50, 30);
      wrapText(ctx, `Caption: "${image.caption}"`, canvas.width / 2, 240, canvas.width - 100, 30);
      wrapText(ctx, `AI-Suggested Content: "${image.description}"`, canvas.width / 2, 380, canvas.width - 100, 30);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed to create a blob.'));
      }, 'image/png');
    });
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    zip.file('paper.tex', latexCode);
    const readmeContent = `
# Your IEEE Paper Project
This project was generated by the Ethical IEEE Paper Generator.
## Getting Started
1.  Unzip this file.
2.  Open \`paper.tex\` in your favorite LaTeX editor (like Overleaf).
3.  Compile the document. It should compile successfully!
## Your Task
*   **Images:** If you generated images, they are in the \`/images\` folder. If not, placeholder images have been provided. You can replace any image in the \`/images\` folder with your own, just keep the filename the same.
*   **Tables:** Find the \`TODO\` comments in \`paper.tex\` and add your tabular data.
Good luck!`;
    zip.file('README.md', readmeContent.trim());

    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
      for (const image of imagesToGenerate) {
        const generatedImgSrc = generatedImages[image.filename];
        let imageBlob: Blob | null = null;
        if (generatedImgSrc && generatedImgSrc.startsWith('data:image')) {
          imageBlob = dataURLtoBlob(generatedImgSrc);
        }
        
        if (imageBlob) {
          imagesFolder.file(image.filename, imageBlob);
        } else {
          const placeholderBlob = await createPlaceholderImage(image);
          imagesFolder.file(image.filename, placeholderBlob);
        }
      }
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'paper-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };


  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Step 4: Generate LaTeX Project</h2>
      <p className="text-gray-400 mb-6">
        Click to generate the LaTeX source. Then, you can optionally use AI to generate the required images before downloading the complete, ready-to-compile project.
      </p>

      <div className="text-center mb-6">
        <button
          onClick={handleGenerateLatex}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          {isLoading ? 'Generating LaTeX...' : 'Generate LaTeX Source'}
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 my-4 text-lg text-indigo-300">
          <SpinnerIcon className="w-6 h-6" />
          <span>Generating document...</span>
        </div>
      )}

      {error && <p className="text-red-400 text-center my-4">{error}</p>}

      {latexCode && (
        <div>
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200">Generated Project</h3>
            <div className="flex items-center gap-3">
              <button onClick={handleCopyToClipboard} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors" title="Copy .tex content to clipboard">
                <ClipboardIcon className="w-4 h-4" />
                {copySuccess || 'Copy .tex'}
              </button>
              <button onClick={handleDownloadProject} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-md transition-colors">
                <DownloadIcon className="w-4 h-4" />
                Download Project (.zip)
              </button>
            </div>
          </div>

          {/* Image Generation Section */}
          {imagesToGenerate.length > 0 && (
            <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h4 className="text-md font-semibold text-blue-400 mb-2">Required Figures</h4>
              <p className="text-sm text-gray-400 mb-4">The AI has suggested the following figures. You can generate them with AI before downloading.</p>
              <button onClick={handleGenerateImages} disabled={isGeneratingImages} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-wait transition-colors mb-4">
                  {isGeneratingImages ? <SpinnerIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  {isGeneratingImages ? 'Generating Images...' : 'Generate All Images with AI'}
              </button>
              {imageError && <p className="text-red-400 text-sm mt-2">{imageError}</p>}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imagesToGenerate.map(image => (
                  <div key={image.filename} className="bg-gray-800 rounded-lg p-3 border border-gray-600 text-xs">
                     <div className="w-full h-40 bg-gray-700 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                        {generatedImages[image.filename] === 'loading' && <SpinnerIcon className="w-8 h-8 text-blue-400" />}
                        {generatedImages[image.filename] === 'error' && <span className="text-red-400">Error</span>}
                        {generatedImages[image.filename]?.startsWith('data:image') ? (
                          <img src={generatedImages[image.filename]} alt={image.caption} className="w-full h-full object-cover" />
                        ) : (
                          generatedImages[image.filename] !== 'loading' && <ImageIcon className="w-12 h-12 text-gray-500" />
                        )}
                     </div>
                     <p className="font-bold text-gray-300">{image.filename}</p>
                     <p className="text-gray-400 mt-1"><span className="font-semibold text-gray-300">Caption:</span> {image.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LaTeX Code Preview */}
          <h4 className="text-md font-semibold text-gray-300 mb-2">LaTeX Source Preview</h4>
          <pre className="bg-gray-900 p-4 rounded-md border border-gray-700 max-h-80 overflow-auto">
            <code className="text-sm text-yellow-200 font-mono whitespace-pre">
              {latexCode}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default Step4_GenerateLatex;