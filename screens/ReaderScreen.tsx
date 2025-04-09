import React, { useEffect, useState, useRef } from 'react';
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
  Pressable
} from 'react-native';
import config from '../config';

interface ReaderScreenProps {
  route: {
    params: {
      chapterId: string;
    };
  };
}

const PAGE_HEIGHT = 550; 

export default function ReaderScreen({ route }: ReaderScreenProps) {
  const { chapterId } = route.params;
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<boolean[]>([]);
  const [showSlowLoading, setShowSlowLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchChapterPages = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowSlowLoading(false);
        
        const serverResponse = await fetch(`${config.BASE_URL}/at-home/server/${chapterId}`);
        
        if (!serverResponse.ok) {
          throw new Error(`Error al obtener servidor: ${serverResponse.status}`);
        }
        
        const serverData = await serverResponse.json();
        
        if (!serverData.baseUrl || !serverData.chapter?.hash || !serverData.chapter?.data) {
          throw new Error('Datos del servidor incompletos');
        }
        
        const { baseUrl, chapter } = serverData;
        const pageUrls = chapter.data.map((fileName: string) => 
          `${baseUrl}/data/${chapter.hash}/${fileName}`
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
    };

    fetchChapterPages();
  }, [chapterId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowSlowLoading(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newPage = Math.floor(offsetY / PAGE_HEIGHT + 0.5);
    
    const clampedPage = Math.max(0, Math.min(newPage, pages.length - 1));
    
    if (currentPage !== clampedPage) {
      setCurrentPage(clampedPage);
    }
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
        {showSlowLoading && (
          <Text style={styles.slowLoadingText}>
            La carga está tardando más de lo esperado...
          </Text>
        )}
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
      </View>
    );
  }

  if (pages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No se encontraron páginas en este capítulo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${((currentPage + 1) / pages.length) * 100}%` }
          ]} 
        />
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={PAGE_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {pages.map((pageUrl, index) => (
          <View 
            key={`page-${index}`} 
            style={[styles.pageContainer, { height: PAGE_HEIGHT }]} 
          >
            <Image
              source={{ uri: pageUrl }}
              style={styles.pageImage}
              resizeMode="contain"
              onError={() => console.error('Error loading image:', pageUrl)}
              onLoad={() => {
                const newLoaded = [...loadedPages];
                newLoaded[index] = true;
                setLoadedPages(newLoaded);
              }}
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

      
      
      <View style={styles.pageIndicator}>
        <Text style={styles.pageIndicatorText}>
          {currentPage + 1}/{pages.length}
        </Text>
        <View>
        <Pressable style={styles.nextChapterButton} onPress={()=>{
          console.log("aqui siguente cap");
          
        }}><Text>Siguiente Capitulo</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 30,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  pageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3e3e3',
    paddingHorizontal: 2,
    position: 'relative',
  },
  pageImage: {
    width: "100%",
    height: '100%',
    marginHorizontal: 15,
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
  slowLoadingText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
  },
  emptyText: {
    color: '#333',
    fontSize: 16,
  },
  pageIndicator: {
    position: 'absolute',
    justifyContent:"center",
    alignItems:"center",
    gap:2,
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  pageIndicatorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
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
nextChapterButton: {
  backgroundColor: '#0000ff',
  width: 50,
  height: 50,
  paddingHorizontal:4,
  paddingVertical:6,
  borderRadius:10,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
},
});