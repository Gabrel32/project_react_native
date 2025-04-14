import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../config';
import PageImage from '../components/PageImage';
import Controls from '../components/Controls';
import LoadingState from '../components/LoadingStade';
import ErrorState from '../components/ErrorStade';
import EmptyState from '../components/EmptyStade';
import { RootStackParamList, ReaderScreenProps } from '../types';
import { fetchChapterPages as fetchChapterPagesApi  } from '../api/mangadex';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_HEIGHT = (SCREEN_HEIGHT * 0.8);

const VISIBLE_PAGES_AROUND = 1;
const BUFFER_SIZE = 5;

type NavigationProps = StackNavigationProp<RootStackParamList, 'Reader'>;

const ReaderScreen: React.FC<ReaderScreenProps> = ({ route }) => {
  const { 
    chapterId, 
    chapter, 
    title, 
    mangaId, 
    nextChapterId,
    prevChapterId,
    allChapters,
    chapterIndex
  } = route.params;
  
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<NavigationProps>();
  

  const memoizedPages = useMemo(() => pages, [pages]);

// Dentro de tu componente, reemplaza la función existente con:
const fetchChapterPages = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    setLoadedPages(new Set());
    
    const pageUrls = await fetchChapterPagesApi(chapterId);
    setPages(pageUrls);
    
  } catch (err) {
    console.error('Error fetching chapter:', err);
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, [chapterId]);

  useEffect(() => {
    fetchChapterPages();
  }, [fetchChapterPages]);

  useEffect(() => {
    if (pages.length === 0) return;
  
    setLoadedPages(prev => {
      const newLoaded = new Set(prev);
      
      // Siempre cargar la página actual
      newLoaded.add(currentPage);
      
      // Cargar páginas alrededor con un buffer más generoso
      const BUFFER_AROUND = 3; // Aumentamos el buffer
      const start = Math.max(0, currentPage - BUFFER_AROUND);
      const end = Math.min(pages.length - 1, currentPage + BUFFER_AROUND);
      
      for (let i = start; i <= end; i++) {
        newLoaded.add(i);
      }
      
      // Mantener algunas páginas adicionales para scroll rápido
      if (newLoaded.size > BUFFER_AROUND * 2 + 1) {
        // Eliminar las más lejanas manteniendo un buffer mínimo
        const sorted = Array.from(newLoaded).sort((a, b) => 
          Math.abs(a - currentPage) - Math.abs(b - currentPage)
        );
        
        // Mantener más páginas en memoria
        const toKeep = Math.min(sorted.length, BUFFER_AROUND * 2 + 3);
        sorted.slice(toKeep).forEach(page => newLoaded.delete(page));
      }
      
      return newLoaded;
    });
  }, [currentPage, pages.length]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newPage = Math.floor(offsetY / PAGE_HEIGHT + 0.5);
    
    if (currentPage !== newPage && newPage >= 0 && newPage < pages.length) {
      setCurrentPage(newPage);
    }
  }, [currentPage, pages.length]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedPages(prev => {
      const newLoaded = new Set(prev);
      newLoaded.add(index);
      return newLoaded;
    });
  }, []);

  const handleNextChapter = useCallback(() => {
    if (!allChapters || allChapters.length === 0) {
      if (nextChapterId) {
        navigation.replace('Reader', {
          chapterId: nextChapterId,
          chapter: `${parseInt(chapter || '0') + 1}`,
          title,
          mangaId,
          prevChapterId: chapterId,
        });
      }
      return;
    }

    const currentIdx = chapterIndex ?? allChapters.findIndex(c => c.id === chapterId);
    if (currentIdx < allChapters.length - 1) {
      const nextChapter = allChapters[currentIdx + 1];
      navigation.replace('Reader', {
        chapterId: nextChapter.id,
        chapter: nextChapter.attributes.chapter,
        title: nextChapter.attributes.title,
        mangaId,
        prevChapterId: chapterId,
        nextChapterId: currentIdx < allChapters.length - 2 ? allChapters[currentIdx + 2].id : undefined,
        chapterIndex: currentIdx + 1,
        allChapters,
      });
    }
  }, [allChapters, chapterId, chapter, chapterIndex, mangaId, navigation, nextChapterId, title]);

  const handlePrevChapter = useCallback(() => {
    if (!allChapters || allChapters.length === 0) {
      if (prevChapterId) {
        navigation.replace('Reader', {
          chapterId: prevChapterId,
          chapter: `${parseInt(chapter || '0') - 1}`,
          title,
          mangaId,
          nextChapterId: chapterId,
        });
      }
      return;
    }

    const currentIdx = chapterIndex ?? allChapters.findIndex(c => c.id === chapterId);
    if (currentIdx > 0) {
      const prevChapter = allChapters[currentIdx - 1];
      navigation.replace('Reader', {
        chapterId: prevChapter.id,
        chapter: prevChapter.attributes.chapter,
        title: prevChapter.attributes.title,
        mangaId,
        nextChapterId: chapterId,
        prevChapterId: currentIdx > 1 ? allChapters[currentIdx - 2].id : undefined,
        chapterIndex: currentIdx - 1,
        allChapters,
      });
    }
  }, [allChapters, chapterId, chapter, chapterIndex, mangaId, navigation, prevChapterId, title]);

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
    const isNearby = Math.abs(index - currentPage) <= 2;
    const shouldRender = loadedPages.has(index) || isNearby;
    
    return (
      <View style={{ height: PAGE_HEIGHT-90 }}>
        <PageImage 
          uri={item} 
          index={index}
          onLoad={() => handleImageLoad(index)}
          isVisible={isNearby}
          PAGE_HEIGHT={PAGE_HEIGHT}
          priority={index === currentPage ? 'high' : isNearby ? 'high' : 'low'}
        />
      </View>
    );
  }, [loadedPages, currentPage, handleImageLoad]);

  const keyExtractor = useCallback((item: string, index: number) => `${index}-${item}`, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: PAGE_HEIGHT,
    offset: (PAGE_HEIGHT) * index,
    index,
  }), []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      }
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchChapterPages} />;
  }

  if (pages.length === 0) {
    return <EmptyState message="No se encontraron páginas en este capítulo" onRetry={fetchChapterPages} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={memoizedPages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialScrollIndex={currentPage}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        decelerationRate="fast"
        snapToAlignment="start"
        windowSize={5}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
      />

      <Controls
        showControls={showControls}
        toggleControls={toggleControls}
        currentPage={currentPage}
        totalPages={pages.length}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        handlePrevChapter={handlePrevChapter}
        handleNextChapter={handleNextChapter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3e3e3',
    paddingTop:25,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default ReaderScreen;