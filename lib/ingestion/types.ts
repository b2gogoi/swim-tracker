export interface ParsedLine {
    meetId: string; // known upfront, set before any upload begins
    pageNumber: number;
    rawEventHeader: string;
    rawLineText: string;
    rawTokens: string[];
    rawExtractedClub: string;
    rawExtractedName: string;
    rawExtractedTime: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  }