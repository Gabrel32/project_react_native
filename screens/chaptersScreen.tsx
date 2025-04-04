// screens/ChaptersScreen.tsx
import { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
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
  };
}

// Tipos para los parámetros de navegación
type RootStackParamList = {
  Reader: { chapterId: string };
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<ChaptersScreenNavigationProp>();
  const { mangaId } = route.params;

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${config.BASE_URL}/manga/${mangaId}/feed?translatedLanguage[]=es&order[chapter]=asc`
        );
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setChapters(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching chapters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [mangaId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando capítulos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chapterItem}
            onPress={() => navigation.navigate('Reader', { chapterId: item.id })}
          >
            <Text style={styles.chapterText}>
              Capítulo {item.attributes.chapter}
              {item.attributes.title && `: ${item.attributes.title}`}
            </Text>
            <Text style={styles.languageText}>
              ({item.attributes.translatedLanguage.toUpperCase()})
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No se encontraron capítulos</Text>
          </View>
        }
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
});