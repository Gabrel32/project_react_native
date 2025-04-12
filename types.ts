import { DimensionValue } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// ... tus otros tipos ...

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
  Home: undefined; // Añade esto si tienes pantalla Home
};

// Tipo para las props de ReaderScreen
export type ReaderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reader'>;
export type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

export interface ReaderScreenProps {
  route: ReaderScreenRouteProp;
  navigation: ReaderScreenNavigationProp;
}

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
// export type RootStackParamList = {
//   Reader: {
//     chapterId: string;
//     chapter?: string;
//     title?: string;
//     nextChapterId?: string;
//     prevChapterId?: string;
//     mangaId: string;
//     chapterIndex?: number;
//     allChapters?: Chapter[]; 
//   };
//   Chapters: { mangaId: string };
// };


// export type ReaderScreenProps = {
//   route: {
//     params: RootStackParamList['Reader'];
//   };
// };

export type PageImageProps = {
  uri: string;
  index: number;
  onLoad: (index: number) => void;
  isVisible: boolean;
  PAGE_HEIGHT:number;
  priority:string;
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