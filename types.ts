import { ImageURISource, DimensionValue } from 'react-native';

// Definición de tipos para los capítulos
export interface Chapter {
  id: string;
  attributes: {
    chapter: string;
    title?: string;
    translatedLanguage: string;
    publishAt?: string;
  };
}

// Tipos para los parámetros de navegación
export type RootStackParamList = {
  Reader: {
    chapterId: string;
    chapter?: string;
    title?: string;
    nextChapterId?: string;
    prevChapterId?: string;
    mangaId: string;
    chapterIndex?: number;
    allChapters?: Chapter[]; 
  };
  Chapters: { mangaId: string };
};


export type ReaderScreenProps = {
  route: {
    params: RootStackParamList['Reader'];
  };
};

export type PageImageProps = {
  uri: string;
  index: number;
  onLoad: (index: number) => void;
  isVisible: boolean;
  PAGE_HEIGHT:number
};

export type ProgressBarStyle = {
  height: DimensionValue;
  backgroundColor: string;
  width?: DimensionValue;
};

export type ControlsProps = {
  showControls: boolean;
  toggleControls: () => void;
  currentPage: number;
  totalPages: number;
  prevChapterId?: string;
  nextChapterId?: string;
  handlePrevChapter: () => void;
  handleNextChapter: () => void;

};

export type LoadingStateProps = {
  message?: string;
};

export type ErrorStateProps = {
  error: string;
  onRetry: () => void;
};

export type EmptyStateProps = {
  message: string;
  onRetry: () => void;
};