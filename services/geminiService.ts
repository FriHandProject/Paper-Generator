// FIX: Implement the Gemini API service to resolve module import errors.
import { GoogleGenAI, Modality, Type } from "@google/genai";
// FIX: Add sectionKeys and sectionTitles for use in the new generateLatex function.
import { PaperData, sectionKeys, sectionTitles, LatexImage, FoundPaper } from '../types.ts';

// FIX: Initialize the GoogleGenAI client as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generatePromptForRecommendation = (
    fieldName: string,
    paperData: PaperData,
    topic: string
): string => {
    // Create a string of existing data, excluding authors, sections, and the field being generated.
    const existingData = Object.entries(paperData)
      .filter(([key, value]) => {
        if (key === fieldName) return false; // Exclude the field we're generating
        if (key === 'authors' || key === 'sections' || key === 'references') return false; // Exclude complex objects
        if (typeof value === 'string' && value.trim()) return true; // Include non-empty strings
        return false;
      })
      .map(([key, value]) => {
        // Format key for readability, e.g., 'problemStatement' -> 'Problem Statement'
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        return `${formattedKey}: ${value}`;
      })
      .join('\n');

    const fieldNameFormatted = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    
    const titleInstruction = fieldName === 'title' 
        ? "Based on the topic and context, generate a single, concise, and compelling title for the research paper."
        : `Based on the topic and context, generate a high-quality suggestion for the "${fieldNameFormatted}".`;

    return `You are an expert research assistant. Your task is to provide a professional recommendation for the "${fieldNameFormatted}" section of an IEEE research paper.
Use web search to inform your response.

Primary Research Topic: "${topic || 'Not specified. Infer from other fields.'}"

Existing Paper Information (for context):
---
${existingData || 'No other information provided yet.'}
---

${titleInstruction}

**Output Instructions:**
- Provide ONLY the text for the requested section. Do not add any extra conversation or formatting like "Here is a suggestion:".
- For the "title", the title should be academic and professional, avoiding overly long or repetitive phrasing.
`;
}

export const recommendSectionContent = async (
    fieldName: string,
    paperData: PaperData,
    recommendationTopic: string
): Promise<string> => {
    const prompt = generatePromptForRecommendation(fieldName, paperData, recommendationTopic);
    
    try {
        // FIX: Use ai.models.generateContent with Google Search grounding for web-based recommendations.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        // FIX: Correctly extract the text from the GenerateContentResponse.
        return response.text.trim();
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        throw new Error("Failed to get recommendation from AI service.");
    }
};

export const findReferencesForTopic = async (topic: string): Promise<FoundPaper[]> => {
    const prompt = `
You are a research assistant. Your task is to find relevant academic papers for a given topic and return the data in a specific JSON format.
Use web search to find 3-5 highly relevant and recent academic papers (from IEEE, ACM, arXiv, etc.) on the topic: "${topic}".

**CRITICAL INSTRUCTION:** Your entire response MUST be a single, valid JSON object. Do not include any text, conversation, or markdown formatting like \`\`\`json before or after the JSON object.

The JSON object must have a single key "papers", which is an array of objects. Each object in the array must have the following keys: "title", "authors" (an array of strings), "year", "summary" (a concise one-sentence summary), and "bibtex" (the complete BibTeX entry).
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        let jsonText = response.text.trim();
        // The model might wrap the JSON in markdown code fences, so we need to clean it.
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.slice(7, -3).trim();
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.slice(3, -3).trim();
        }
        
        const parsedJson = JSON.parse(jsonText);
        return parsedJson.papers || [];

    } catch (error) {
        console.error("Error finding references:", error);
        throw new Error("Failed to find references from AI service.");
    }
};

export const draftSectionContent = async (
    sectionName: string,
    paperData: PaperData
): Promise<string> => {
    const prompt = `
You are an expert academic writer specializing in IEEE papers.
Your task is to draft the "${sectionName}" section for a research paper based on the user's provided notes.
The draft should be well-structured, written in a formal academic tone, and adhere to the conventions of IEEE publications.
Expand on the user's notes to create a coherent and comprehensive section.

CRITICAL INSTRUCTION: Proactively analyze the content and insert placeholders for figures, diagrams, or tables wherever they would enhance the reader's understanding. It is crucial that you suggest visuals.
For example, the 'Methodology' section should almost always have a diagram of the proposed architecture, and the 'Results' section should have charts or tables showing the key findings.
The placeholder format MUST be either:
- [FIGURE: A clear description of what the visual should contain. Caption: A descriptive caption for the figure. The caption text ITSELF should NOT start with "Figure X:".]
- [TABLE: A clear description of the table's content and columns. Caption: A descriptive caption for the table. The caption text ITSELF should NOT start with "Table Y:".]

**Special rule for "I. Introduction"**: If you are drafting the introduction, DO NOT place a [FIGURE: ...] or [TABLE: ...] placeholder at the very beginning of the section. The first paragraph of the introduction must be text. Placeholders can be added after the introductory paragraphs.

User's research notes:
Title: ${paperData.title}
Problem Statement: ${paperData.problemStatement}
Objectives: ${paperData.objectives}
Methodology Summary: ${paperData.methodologySummary}
Dataset: ${paperData.dataset}
Key Results: ${paperData.keyResults}
Conclusions: ${paperData.conclusions}
Key References:
${paperData.references}

Now, please write a draft for the "${sectionName}" section, incorporating visual placeholders where appropriate.
For the "Abstract", provide a concise summary covering the problem, methods, results, and conclusion.
For "Keywords", suggest 5-7 relevant keywords as a single comma-separated list. Do not include "Index Terms".
For other sections, write a few paragraphs as appropriate.
Output ONLY the text for the section. Do not include the section title or any introductory phrases.
`;

    try {
        // FIX: Use gemini-2.5-pro for higher quality content generation for drafting.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error drafting ${sectionName}:`, error);
        throw new Error(`Failed to draft ${sectionName}.`);
    }
};

export const refineSectionContent = async (
    sectionName: string,
    rawContent: string,
    paperData: PaperData
): Promise<string> => {
    const prompt = `
You are an expert academic editor specializing in IEEE papers.
Your task is to refine the following draft of the "${sectionName}" section.
Improve clarity, conciseness, grammar, and flow. Ensure the tone is formal and academic.
Do not add new information, but you may rephrase and restructure sentences for better impact.

IMPORTANT INSTRUCTION: The draft may contain special placeholders like [FIGURE: ...] or [TABLE: ...].
1. You MUST preserve any existing placeholders and their content exactly as they are in the refined output. Do not alter them.
2. Additionally, as you refine, if you identify a new opportunity where a figure or table would enhance the text, you SHOULD insert a new placeholder in the correct format: [FIGURE: A clear description. Caption: A descriptive caption. The caption text ITSELF should NOT start with "Figure X:".]

**Special rule for "I. Introduction"**: If you are refining the introduction, ensure there is introductory text before any [FIGURE: ...] or [TABLE: ...] placeholder. A figure or table should not be the very first element of the introduction.

Here is the user's draft for the "${sectionName}" section:
---
${rawContent}
---

For context, here are the core details of the paper:
Title: ${paperData.title}
Objectives: ${paperData.objectives}

Please provide the refined version of the section, preserving and adding visual placeholders where appropriate.
Output ONLY the refined text. Do not include the section title or any introductory phrases like "Here is the refined version:".
`;

    try {
        // FIX: Use the efficient gemini-2.5-flash model for refinement tasks.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error refining ${sectionName}:`, error);
        throw new Error(`Failed to refine ${sectionName}.`);
    }
};

const processPlaceholders = (
  text: string,
  counter: { fig: number; tab: number }
): { processedText: string; images: LatexImage[] } => {
  const images: LatexImage[] = [];
  const figureRegex = /\[FIGURE:\s*(.*?)\s*Caption:\s*(.*?)\]/gis;
  const tableRegex = /\[TABLE:\s*(.*?)\s*Caption:\s*(.*?)\]/gis;

  // Regex to find plain text tables, e.g., "TABLE V\nSUMMARY OF..."
  const plainTableRegex = /^(TABLE\s+[IVXLC\d]+\.?\s*\n([\s\S]+?))(?=\n\n|\n\\section|^\s*$)/gim;

  let processedText = text;

  // First, process plain text tables to convert them into placeholders
  processedText = processedText.replace(plainTableRegex, (_, fullMatch, caption) => {
      const cleanCaption = caption.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
      return `[TABLE: A table with the caption "${cleanCaption}". Caption: ${cleanCaption}]`;
  });

  // Basic Markdown to LaTeX conversion
  processedText = processedText
      // Bold: **text** -> \textbf{text}
      .replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}')
      // Italic: *text* -> \textit{text}
      .replace(/(?<!\*)\*(?!\*)([^\s*].*?[^\s*])(?<!\*)\*(?!\*)/g, '\\textit{$1}');


  processedText = processedText.replace(figureRegex, (_, description, caption) => {
    counter.fig++;
    const cleanDescription = description.trim();
    const cleanCaption = caption.trim();
    const filename = `figure_${counter.fig}.png`;
    const label = `fig:${cleanCaption.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${counter.fig}`;
    
    images.push({ filename, description: cleanDescription, caption: cleanCaption });

    return `
\\begin{figure}[htbp]
\\centering
\\includegraphics[width=\\columnwidth]{images/${filename}}
\\caption{${cleanCaption}}
\\label{${label}}
\\end{figure}
% AI NOTE: This figure is described as: "${cleanDescription}"
    `.trim();
  });

  processedText = processedText.replace(tableRegex, (_, description, caption) => {
    counter.tab++;
    const cleanCaption = caption.trim();
    const label = `tab:${cleanCaption.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${counter.tab}`;
    return `
\\begin{table}[htbp]
\\centering
\\caption{${cleanCaption}}
\\label{${label}}
% TODO: User must insert table content here, e.g., using a \\begin{tabular} environment.
\\end{table}
% AI NOTE: This is a placeholder for a table described as: "${description.trim()}"
    `.trim();
  });

  return { processedText, images };
};


export const generateLatex = async (paperData: PaperData): Promise<{ latex: string; images: LatexImage[] }> => {
    const docClass = paperData.venueType === 'journal' ? 'journal' : 'conference';

    const latexTemplate = `
\\documentclass[${docClass}]{IEEEtran}

% *** GRAPHICS RELATED PACKAGES ***
\\usepackage{graphicx}
\\graphicspath{ {./images/} }

% *** CITATION PACKAGES ***
\\usepackage{cite}

% *** MATH PACKAGES ***
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}

% *** SPECIALIZED LIST PACKAGES ***
\\usepackage{algorithmic}

% *** ALIGNMENT PACKAGES ***
\\usepackage{array}

% *** SUBFIGURE PACKAGES ***
%\\usepackage{subfig}

% *** PDF, URL AND HYPERLINK PACKAGES ***
\\usepackage{url}

% correct bad hyphenation here
\\hyphenation{op-tical net-works semi-conduc-tor}


\\begin{document}
%
% paper title
\\title{%%TITLE%%}


% author names and affiliations
\\author{
%%AUTHORS%%
}

% make the title area
\\maketitle

% As a general rule, do not put math, special symbols or citations
% in the abstract or keywords.
\\begin{abstract}
%%ABSTRACT%%
\\end{abstract}

% Note that keywords are not normally used for peerreview papers.
\\begin{IEEEkeywords}
%%KEYWORDS%%
\\end{IEEEkeywords}

% For peer review papers, you can put extra information on the cover
% page as needed:
% \\ifCLASSOPTIONpeerreview
% \\begin{center} \\bfseries EDICS Category: 3-BBND \\end{center}
% \\fi
%
% For peerreview papers, this IEEEtran command inserts a page break and
% creates the second title. It will be ignored for other modes.
\\IEEEpeerreviewmaketitle

%%SECTIONS%%


% Can use something like this to put references on a page
% by themselves when using endfloat and the captionsoff option.
\\ifCLASSOPTIONcaptionsoff
  \\newpage
\\fi


% trigger a \newpage just before the given reference
% number - used to balance the columns on the last page
% adjust value as needed - may need to be readjusted if
% the document is modified later
%\\IEEEtriggeratref{8}
% The "triggered" command can be changed if desired:
%\\IEEEtriggercmd{\\enlargethispage{-5in}}

% references section
\\begin{thebibliography}{1}

%%REFERENCES%%

\\end{thebibliography}


% that's all folks
\\end{document}
    `.trim();
    
    const placeholderCounter = { fig: 0, tab: 0 };
    const allImages: LatexImage[] = [];

    const authorsString = paperData.authors.map(author => {
      const affiliationAndEmail = [
        `\\textit{${author.affiliation}}`,
        author.email ? `Email: ${author.email}` : ''
      ].filter(Boolean).join(' \\\\ ');

      return `\\IEEEauthorblockN{${author.name}} \\\\ \\IEEEauthorblockA{${affiliationAndEmail}}`;
    }).join('\n\\and\n');


    let finalLatex = latexTemplate;

    const cleanContent = (content: string, patterns: (RegExp)[]) => {
        let cleaned = content;
        for (const pattern of patterns) {
            cleaned = cleaned.replace(pattern, '').trim();
        }
        return cleaned;
    };

    const abstractContentRaw = paperData.sections.abstract.refined.trim() || paperData.sections.abstract.raw.trim();
    const abstractContent = cleanContent(abstractContentRaw, [/^Abstract-?\s*/i]);

    const keywordsContentRaw = paperData.sections.keywords.refined.trim() || paperData.sections.keywords.raw.trim();
    const keywordsContent = cleanContent(keywordsContentRaw, [/^(\*Keywords\*|Keywords|Index Terms)-?\s*:?\s*/i]);
    
    const sectionsContent = sectionKeys.map(key => {
        if (key === 'abstract' || key === 'keywords') return '';

        const title = sectionTitles[key];
        let content = paperData.sections[key].refined.trim() || paperData.sections[key].raw.trim();
        if (!content) return '';

        // Robustly remove duplicated titles like "I. Introduction" or "V. V. DISCUSSION"
        const titleText = title.replace(/^[IVX]+\.\s*/, '');
        const titleRegex = new RegExp(`^\\s*([IVX]+\\.\\s*)+${titleText}\\s*`, 'i');
        content = cleanContent(content, [titleRegex]);

        const { processedText, images } = processPlaceholders(content, placeholderCounter);
        content = processedText;
        allImages.push(...images);
        
        if (key === 'acknowledgment') {
          return `\\section*{${title}}\n${content}`;
        }

        return `\\section{${title}}\n${content}`;

    }).filter(Boolean).join('\n\n');
    
    // Naive BibTeX to thebibliography conversion for placeholder
    const referencesContent = paperData.references
      .split('@')
      .map(entry => entry.trim())
      .filter(entry => entry)
      .map((entry, index) => {
          const keyMatch = entry.match(/^(\w+)\{(.*?),/);
          const titleMatch = entry.match(/title\s*=\s*[\{{](.*?)[\}}]/);
          const authorMatch = entry.match(/author\s*=\s*[\{{](.*?)[\}}]/);
          
          if (!keyMatch || !titleMatch || !authorMatch) return `\\bibitem{ref${index+1}} Unknown reference.`;
          
          const key = keyMatch[2];
          const author = authorMatch[1].split(' and ')[0] + (authorMatch[1].includes(' and ') ? ' et al.' : '');
          const title = titleMatch[1];
          
          return `\\bibitem{${key}}\n${author}, "${title}"`;
      }).join('\n\n');


    finalLatex = finalLatex
        .replace('%%TITLE%%', paperData.title)
        .replace('%%AUTHORS%%', authorsString)
        .replace('%%ABSTRACT%%', abstractContent)
        .replace('%%KEYWORDS%%', keywordsContent)
        .replace('%%SECTIONS%%', sectionsContent)
        .replace('%%REFERENCES%%', referencesContent);
        
    return { latex: finalLatex, images: allImages };
};

export const generateImageFromDescription = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error('No image data found in the response.');
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image from description.');
  }
};