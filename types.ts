import { DimensionValue } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TextStyle, TextInputProps, ViewStyle } from 'react-native';

// types de searchBar
export interface SearchBarStyles {
  container?: ViewStyle;
  searchContainer?: ViewStyle;
  input?: TextStyle;
  icon?: ViewStyle;
  clearButton?: ViewStyle;
  searchButton?: ViewStyle;
  searchButtonText?: TextStyle;
}

export interface SearchBarProps {
  onSearch: (text: string) => void;
  placeholder?: string;
  inputProps?: TextInputProps;
  styles?: Partial<SearchBarStyles>;
}

// types para las listas de app.tsx

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

// types para las props de ReaderScreen
export type ReaderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reader'>;
export type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

export interface ReaderScreenProps {
  route: ReaderScreenRouteProp;
  navigation: ReaderScreenNavigationProp;
}

// Definición de tipos para los capítulos de chaptersScreen
export interface Chapter {
  id: string;
  attributes: {
    chapter: string;
    title?: string;
    translatedLanguage: string;
    publishAt?: string;
  };
}

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