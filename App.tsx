import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { getTopSeinenMangas, getMangasWithStats } from './api/mangadex';
import SearchBar from './components/SearchBar';
import ChaptersScreen from "./screens/chaptersScreen";
import ReaderScreen from './screens/ReaderScreen';

type RootStackParamList = {
  Home: undefined;
  Chapters: { mangaId: string };
  Reader: { chapterId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

interface Manga {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  author: string;
}

const Stack = createStackNavigator<RootStackParamList>();

function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    fetchPopularMangas();
  }, []);

  const fetchPopularMangas = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery('');

      const popularMangas = await getTopSeinenMangas();
      const processedMangas = popularMangas.map(manga => ({
        id: manga.id,
        title: manga.title,
        description: manga.description,
        coverUrl: manga.coverUrl,
        author: manga.author
      }));

      setMangas(processedMangas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mangas');
    } finally {
      setLoading(false);
    }
  };

  const fuzzySearchMangas = async (query: string) => {
    try {
      // Primero intenta búsqueda exacta
      const exactResults = await getMangasWithStats({
        title: query,
        limit: 36,
        demographic: 'seinen',
      });
  
      if (exactResults.length > 0) {
        return exactResults;
      }
  
      // Si no hay resultados exactos, haz búsqueda flexible
      const allSeinen = await getMangasWithStats({
        limit: 100, // Obtener más resultados para filtrar localmente
        demographic: 'seinen'
      });
  
      // Filtrado local con coincidencias aproximadas
      return allSeinen.filter(manga => {
        const mangaTitle = manga.title.toLowerCase();
        const searchTerms = query.toLowerCase().split(' ');
  
        return searchTerms.some(term => 
          term.length > 2 && mangaTitle.includes(term)
        );
      });
    } catch (error) {
      throw error;
    }
  };

  const handleSearch = async (query: string, matchLevel: number = 2) => {
    if (!query.trim()) {
      fetchPopularMangas();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      
      const searchResults = await getMangasWithStats({
        title: query,
        limit: 36,
        demographic: 'seinen',
        // titleMatchLevel: matchLevel // Usamos el nivel de coincidencia
      });
      
      setMangas(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };
  const handleClearSearch = () => {
    fetchPopularMangas();
  };

  const startButtonAnimation = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      fetchPopularMangas();
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const handleMangaPress = (mangaId: string) => {
    navigation.navigate('Chapters', { mangaId });
  };

  const renderMangaItem = ({ item }: { item: Manga }) => (
    <TouchableOpacity
      onPress={() => handleMangaPress(item.id)}
      activeOpacity={0.7}
      style={styles.mangaCard}
    >
      {item.coverUrl ? (
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.mangaCardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.mangaCardImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}

      <View style={styles.mangaCardContent}>
        <Text style={styles.mangaCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.mangaCardAuthor} numberOfLines={1}>{item.author}</Text>
        <Text style={styles.mangaCardDescription} numberOfLines={2}>
          {item.description || 'Descripción no disponible'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.searchingText}>Buscando mangas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPopularMangas}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (mangas.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 
              "No se encontraron mangas con ese nombre" : 
              "No hay mangas para mostrar"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
      data={mangas}
      renderItem={renderMangaItem}
      keyExtractor={item => item.id}
      numColumns={3}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        !searchQuery ? (
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          </Animated.View>
        ) : null
      }
    />
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, {
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ]
      }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Guts Explorer</Text>
          <Text style={styles.subtitle}>top seinen de todos los tiempos</Text>
        </View>

      <SearchBar
        onSearch={handleSearch}
        onClear={() => {
          setSearchQuery('');
          fetchPopularMangas();
        }}
        placeholder="Buscar mangas seinen..."
      />

        {renderContent()}

        <StatusBar style="auto" />
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.textFooter}>© 2025 Gabriel Hernandez. Todos los derechos reservados.</Text>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chapters" component={ChaptersScreen} />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 16,
    paddingTop: 25,
    paddingBottom:0
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mangaCard: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  mangaCardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F1F2F6',
  },
  mangaCardContent: {
    padding: 12,
  },
  mangaCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  mangaCardAuthor: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 6,
  },
  mangaCardDescription: {
    fontSize: 11,
    color: '#7F8C8D',
    lineHeight: 14,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DFE6E9',
  },
  placeholderText: {
    color: '#636E72',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#6C5CE7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    marginTop: 10,
    color: '#6C5CE7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#D63031',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#D63031',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#636E72',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom:5,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)", 
    shadowColor: "#000",     
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
},
  textFooter:{
    fontWeight:"bold",
    fontSize:15,
  }
});
