import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { getTopSeinenMangas } from './api/mangadex';
import ChaptersScreen from "./screens/chaptersScreen";
import ReaderScreen from './screens/ReaderScreen';

type RootStackParamList = {
  Home: undefined;
  Chapters: { mangaId: string };
  Reader: { chapterId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
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
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching mangas:', err);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.subtitle}>top seines de todos los tiempos</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C5CE7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchPopularMangas}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={mangas}
            renderItem={renderMangaItem}
            keyExtractor={item => item.id}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={startButtonAnimation}
                >
                  <Text style={styles.refreshButtonText}>
                    {loading ? 'Cargando...' : 'Ver más'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            }
          />
        )}
        
        <StatusBar style="auto" />
      </Animated.View>
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
    paddingTop:25,
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
});