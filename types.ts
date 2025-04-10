import { ImageURISource, DimensionValue } from 'react-native';

export type RootStackParamList = {
  Reader: {
    chapterId: string;
    chapter: string;
    title: string;
    mangaId: string;
    nextChapterId?: string;
    prevChapterId?: string;
  };
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