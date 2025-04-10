import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  BackHandler,
  Dimensions
} from 'react-native';
import config from '../config';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface ReaderScreenProps {
  route: {
    params: {
      chapterId: string;
      chapter: string;
      title: string;
      mangaId: string;
      nextChapterId?: string;
      prevChapterId?: string;
    };
  };
}

type RootStackParamList = {
  Reader: {
    chapterId: string;
    chapter: string;
    title: string;
    mangaId: string;
    nextChapterId?: string;
    prevChapterId?: string;
  };
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_HEIGHT = SCREEN_HEIGHT * 0.8; // Ajusta según necesidad

type NavigationProps = StackNavigationProp<RootStackParamList, 'Reader'>;

export default function ReaderScreen({ route }: ReaderScreenProps) {
  const { 
    chapterId, 
    chapter, 
    title, 
    mangaId, 
    nextChapterId,
    prevChapterId
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
      Alert.alert('Error', `No se pudo cargar el capítulo: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchChapterPages();
  }, [fetchChapterPages]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newPage = Math.floor(offsetY / PAGE_HEIGHT + 0.5);
    
    const clampedPage = Math.max(0, Math.min(newPage, pages.length - 1));
    
    if (currentPage !== clampedPage) {
      setCurrentPage(clampedPage);
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadedPages(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  const handleNextChapter = () => {
    if (nextChapterId) {
      navigation.replace('Reader', {
        chapterId: nextChapterId,
        chapter: `${parseInt(chapter) + 1}`,
        title,
        mangaId,
        prevChapterId: chapterId,
      });
    }
  };

  const handlePrevChapter = () => {
    if (prevChapterId) {
      navigation.replace('Reader', {
        chapterId: prevChapterId,
        chapter: `${parseInt(chapter) - 1}`,
        title,
        mangaId,
        nextChapterId: chapterId,
      });
    }
  };

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Cargando capítulo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorHelpText}>
          Por favor, verifica tu conexión a internet e intenta nuevamente.
        </Text>
        <Pressable style={styles.retryButton} onPress={fetchChapterPages}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (pages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No se encontraron páginas en este capítulo</Text>
        <Pressable style={styles.retryButton} onPress={fetchChapterPages}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {pages.map((pageUrl, index) => (
          <View 
            key={`page-${index}`} 
            style={styles.pageContainer} 
          >
            <Image
              source={{ uri: pageUrl }}
              style={styles.pageImage}
              resizeMode="contain"
              onError={() => console.error('Error loading image:', pageUrl)}
              onLoad={() => handleImageLoad(index)}
            />
            {!loadedPages[index] && (
              <View style={styles.pageLoadingOverlay}>
                <ActivityIndicator size="small" color="#0000ff" />
                <Text style={styles.pageLoadingText}>Cargando página {index + 1}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {!showControls && (
        <Pressable 
          style={styles.showControlsButton} 
          onPress={toggleControls}
        >
          <Text style={styles.showControlsButtonText}>☰</Text>
        </Pressable>
      )}

      {showControls && (
        <View style={styles.controlsContainer}>
          <Pressable 
            style={styles.hideControlsButton} 
            onPress={toggleControls}
          >
            <Text style={styles.hideControlsButtonText}>×</Text>
          </Pressable>
          
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${((currentPage + 1) / pages.length) * 100}%` }
              ]} 
            />
          </View>
          
          <View style={styles.navigationControls}>
            <Pressable 
              style={[
                styles.navButton, 
                !prevChapterId && styles.disabledButton
              ]} 
              onPress={handlePrevChapter}
              disabled={!prevChapterId}
            >
              <Text style={styles.navButtonText}>Anterior</Text>
            </Pressable>
            
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {currentPage + 1}/{pages.length}
              </Text>
            </View>
            
            <Pressable 
              style={[
                styles.navButton, 
                !nextChapterId && styles.disabledButton
              ]} 
              onPress={handleNextChapter}
              disabled={!nextChapterId}
            >
              <Text style={styles.navButtonText}>Siguiente</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3e3e3',
    paddingTop: 25,
    paddingHorizontal: 4,
    borderRadius: 20
  },
  scrollContainer: {
    paddingVertical: 5,
  },
  pageContainer: {
    width: '100%',
    height: PAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#e3e3e3',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    gap: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  errorHelpText: {
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    gap: 20,
  },
  emptyText: {
    color: '#333',
    fontSize: 16,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: '#333',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0000ff',
  },
  pageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  pageLoadingText: {
    marginTop: 10,
    color: '#333',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  navButton: {
    backgroundColor: '#0000ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pageIndicatorText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#0000ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  showControlsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showControlsButtonText: {
    color: 'white',
    fontSize: 20,
  },
  hideControlsButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  hideControlsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});