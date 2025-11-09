
import { Modality } from '@google/genai';

export interface Author {
  name: string;
  affiliation: string;
  email: string;
}

export type SectionContent = {
  raw: string;
  refined: string;
};

export type PaperSections = {
  abstract: SectionContent;
  keywords: SectionContent;
  introduction: SectionContent;
  relatedWork: SectionContent;
  methodology: SectionContent;
  results: SectionContent;
  discussion: SectionContent;
  conclusion: SectionContent;
  acknowledgment: SectionContent;
};

export type PaperData = {
  title: string;
  authors: Author[];
  venueType: 'journal' | 'conference';
  problemStatement: string;
  objectives: string;
  methodologySummary: string;
  dataset: string;
  keyResults: string;
  conclusions: string;
  references: string;
  sections: PaperSections;
};

export interface LatexImage {
  filename: string;
  description: string;
  caption: string;
}

export interface FoundPaper {
    title: string;
    authors: string[];
    year: string;
    summary: string;
    bibtex: string;
}

export const sectionKeys: (keyof PaperSections)[] = [
    'abstract',
    'keywords',
    'introduction',
    'relatedWork',
    'methodology',
    'results',
    'discussion',
    'conclusion',
    'acknowledgment'
];

export const sectionTitles: Record<keyof PaperSections, string> = {
    abstract: 'Abstract',
    keywords: 'Keywords',
    introduction: 'I. Introduction',
    relatedWork: 'II. Related Work',
    methodology: 'III. Methodology',
    results: 'IV. Results',
    discussion: 'V. Discussion',
    conclusion: 'VI. Conclusion',
    acknowledgment: 'Acknowledgment'
};