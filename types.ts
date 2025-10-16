export enum Language {
  VI = 'vi',
  EN = 'en',
}

export enum AppMode {
  RECREATE = 'recreate',
  IMPROVE = 'improve',
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface AIResponse {
  text: string;
  image?: string | null;
}

export interface Concept {
  name: string;
  description: string;
  image: string;
}
