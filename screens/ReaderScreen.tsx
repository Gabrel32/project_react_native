import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import config from '../config';

interface ReaderScreenProps {
  route: {
    params: {
      chapterId: string;
    };
  };
}

export default function ReaderScreen({ route }: ReaderScreenProps) {
  const { chapterId } = route.params;
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchChapterPages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Obtener el servidor y datos del capítulo
        const serverResponse = await fetch(`${config.BASE_URL}/at-home/server/${chapterId}`);
        
        if (!serverResponse.ok) {
          throw new Error(`Error al obtener servidor: ${serverResponse.status}`);
        }
        
        const serverData = await serverResponse.json();
        
        // Verificar si tenemos los datos necesarios
        if (!serverData.baseUrl || !serverData.chapter?.hash || !serverData.chapter?.data) {
          throw new Error('Datos del servidor incompletos');
        }
        
        const { baseUrl, chapter } = serverData;
        
        // Construir URLs de las imágenes
        const pageUrls = chapter.data.map((fileName: string) => 
          `${baseUrl}/data/${chapter.hash}/${fileName}`
        );
        
        setPages(pageUrls);
        
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        pagingEnabled
        horizontal={false}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const pageHeight = Dimensions.get('window').height;
          const newPage = Math.floor(offsetY / pageHeight);
          setCurrentPage(newPage);
        }}
        scrollEventThrottle={16}
      >
        {pages.map((pageUrl, index) => (
          <View key={`page-${index}`} style={styles.pageContainer}>
            <Image
              source={{ uri: pageUrl }}
              style={styles.pageImage}
              resizeMode="contain"
              onError={() => console.error('Error loading image:', pageUrl)}
            />
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.pageIndicator}>
        <Text style={styles.pageIndicatorText}>
          Página {currentPage + 1} de {pages.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  pageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    bottom: 20,
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
});