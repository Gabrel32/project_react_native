import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_HEIGHT = (SCREEN_HEIGHT * 0.8);

const VISIBLE_PAGES_AROUND = 3;

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
  const [loadedPages, setLoadedPages] = useState<boolean[]>([]);
  const [showControls, setShowControls] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation<NavigationProps>();

  const fetchChapterPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const serverResponse = await fetch(`${config.BASE_URL}/at-home/server/${chapterId}`);
      
      if (!serverResponse.ok) {
        throw new Error(`Error al obtener servidor: ${serverResponse.status}`);
      }
      
      const serverData = await serverResponse.json();
      
      if (!serverData.baseUrl || !serverData.chapter?.hash || !serverData.chapter?.data) {
        throw new Error('Datos del servidor incompletos');
      }
      
      const { baseUrl, chapter: chapterData } = serverData;
      const pageUrls = chapterData.data.map((fileName: string) => 
        `${baseUrl}/data/${chapterData.hash}/${fileName}`
      );
      
      setPages(pageUrls);
      setLoadedPages(new Array(pageUrls.length).fill(false));
      
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

  const loadPages = useCallback(() => {
    setLoadedPages(prev => {
      const newLoaded = [...prev];
      const start = Math.max(0, currentPage - VISIBLE_PAGES_AROUND);
      const end = Math.min(pages.length - 1, currentPage + VISIBLE_PAGES_AROUND);
      
      for (let i = start; i <= end; i++) {
        newLoaded[i] = true;
      }
      return newLoaded;
    });
  }, [currentPage, pages.length]);

  useEffect(() => {
    loadPages();
  }, [currentPage, loadPages]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newPage = Math.floor(offsetY / PAGE_HEIGHT + 0.5);
    
    if (currentPage !== newPage && newPage >= 0 && newPage < pages.length) {
      setCurrentPage(newPage);
    }
  }, [currentPage, pages.length]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedPages(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  }, []);

  const handleNextChapter = useCallback(() => {
    if (!allChapters || allChapters.length === 0) {
      // Fallback al método antiguo si no tenemos todos los capítulos
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

    // Método nuevo con toda la información
    const currentIdx = chapterIndex ?? allChapters.findIndex(c => c.id === chapterId);
    if (currentIdx < allChapters.length - 1) { // Si hay capítulo siguiente
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
      // Fallback al método antiguo si no tenemos todos los capítulos
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

    // Método nuevo con toda la información
    const currentIdx = chapterIndex ?? allChapters.findIndex(c => c.id === chapterId);
    if (currentIdx > 0) { // Si hay capítulo anterior
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

  useEffect(() => {
    if (pages.length > 0 && currentPage >= pages.length) {
      const correctedPage = pages.length - 1;
      setCurrentPage(correctedPage);
      scrollViewRef.current?.scrollTo({
        y: correctedPage * PAGE_HEIGHT,
        animated: true
      });
    }
  }, [currentPage, pages.length]);

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
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {pages.map((pageUrl, index) => (
          <View key={`page-container-${index}`} style={{ height: PAGE_HEIGHT-90 }}>
            <PageImage 
              uri={pageUrl} 
              index={index}
              onLoad={handleImageLoad}
              isVisible={loadedPages[index] || false}
              PAGE_HEIGHT={PAGE_HEIGHT}
            />
          </View>
        ))}
      </ScrollView>

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
  },
  scrollContainer: {
    paddingVertical: 0,
  },
});

export default ReaderScreen;