import { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Button,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../config';

// Definición de tipos para los capítulos
interface Chapter {
  id: string;
  attributes: {
    chapter: string;
    title?: string;
    translatedLanguage: string;
    publishAt?: string;
  };
}

// Tipos para los parámetros de navegación
type RootStackParamList = {
  Reader: {
    chapterId: string;
    chapter?: string;
    title?: string;
    nextChapterId?: string;
    prevChapterId?:string
    mangaId: string;
    chapterIndex?: number;
  };
  Chapters: { mangaId: string };
};

type ChaptersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chapters'>;

interface ChaptersScreenProps {
  route: {
    params: {
      mangaId: string;
    };
  };
}

export default function ChaptersScreen({ route }: ChaptersScreenProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean | 'refreshing'>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<ChaptersScreenNavigationProp>();
  const { mangaId } = route.params;

  const fetchChapters = useCallback(async (isRefreshing = false) => {
    try {
      setLoading(isRefreshing ? 'refreshing' : true);
      setError(null);

      const response = await fetch(
        `${config.BASE_URL}/manga/${mangaId}/feed?` +
        `translatedLanguage[]=es&order[chapter]=asc&limit=20&offset=${(page - 1) * 20}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const newChapters = data.data;

      if (isRefreshing) {
        setChapters(newChapters);
      } else {
        setChapters(prev => [...prev, ...newChapters]);
      }

      setHasMore(newChapters.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching chapters:', err);
    } finally {
      setLoading(false);
    }
  }, [mangaId, page]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const handleRefresh = () => {
    if (page === 1) {
      fetchChapters(true);
    } else {
      setPage(1);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading === true && chapters.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando capítulos...</Text>
      </View>
    );
  }

  if (error && chapters.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Reintentar"
          onPress={() => {
            setPage(1);
            fetchChapters();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const nextChapter = index < chapters.length - 1 ? chapters[index + 1] : null;

          return (
            <TouchableOpacity
              style={styles.chapterItem}
              onPress={() => {

                const nextChapter = index > 0 ? chapters[index - 1] : null;
                const prevChapter = index < chapters.length - 1 ? chapters[index + 1] : null;
  
                navigation.navigate('Reader', {
                  chapterId: item.id,
                  chapter: item.attributes.chapter,
                  title: item.attributes.title,
                  nextChapterId: nextChapter?.id,
                  prevChapterId: prevChapter?.id,
                  mangaId: mangaId,
                  chapterIndex: index
                })}
              }  
            >
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterText}>
                  Capítulo {item.attributes.chapter}
                  {item.attributes.title && `: ${item.attributes.title}`}
                </Text>
                <Text style={styles.languageText}>
                  ({item.attributes.translatedLanguage.toUpperCase()})
                </Text>
              </View>
              <Text style={styles.dateText}>
                {formatDate(item.attributes.publishAt)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No se encontraron capítulos</Text>
            <Button
              title="Reintentar"
              onPress={handleRefresh}
            />
          </View>
        }
        ListFooterComponent={
          loading === 'refreshing' || (loading && chapters.length > 0) ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : error ? (
            <View style={styles.footerError}>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Reintentar"
                onPress={handleLoadMore}
              />
            </View>
          ) : null
        }
        onRefresh={handleRefresh}
        refreshing={loading === 'refreshing'}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  chapterItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  footerError: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});