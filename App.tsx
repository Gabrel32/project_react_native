import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { getMangas, getTopSeinenMangas } from './api/mangadex';
// import MangaReader from './components/MangaReader';
import ChaptersScreen from "./screens/chaptersScreen";
import ReaderScreen from './screens/ReaderScreen';


// Definición de tipos para la navegación
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

// Tipos para los mangas
interface Manga {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  author: string;
}

const Stack = createStackNavigator<RootStackParamList>();

function HomeScreen() {
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Estado para los mangas
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Animación de entrada
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

    // Cargar mangas
    fetchPopularMangas();
  }, []);

  const fetchPopularMangas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usamos la función getTopSeinenMangas que creamos
      const popularMangas = await getTopSeinenMangas();
      
      // Mapeamos a nuestro formato local
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
      alert("¡Recargando mangas!");
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
    <TouchableOpacity onPress={() => handleMangaPress(item.id)}>
      <View style={styles.mangaItem}>
        {item.coverUrl ? (
          <Image 
            source={{ uri: item.coverUrl }} 
            style={styles.mangaImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mangaImage, styles.placeholderImage]}>
            <Text>No image</Text>
          </View>
        )}
        <View style={styles.mangaInfo}>
          <Text style={styles.mangaTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.mangaAuthor} numberOfLines={1}>{item.author}</Text>
          <Text style={styles.mangaDescription} numberOfLines={3}>
            {item.description || 'Descripción no disponible'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <Text style={styles.title}>MangaDex Explorer</Text>
        <Text style={styles.subtitle}>Top 10 Seinen más populares</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4d6bfe" />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>Error: {error}</Text>
        ) : (
          <FlatList
            data={mangas}
            renderItem={renderMangaItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <TouchableOpacity  
            style={styles.button}
            activeOpacity={0.7}
            onPress={startButtonAnimation}
          >
            <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Recargar'}</Text>
          </TouchableOpacity>
        </Animated.View>
        
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
        options={{
          headerShown: false, // Ocultar barra superior para mejor visualización
        }}
        />
        {/* <Stack.Screen name="Reader" component={MangaReader} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a3f58f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    gap: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#4d6bfe',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    borderColor: "#4d6bfe",
    borderLeftWidth: 2,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    maxHeight: '80%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(77, 107, 254, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#4d6bfe',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4d6bfe',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4d6bfe',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingBottom: 16,
  },
  mangaItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
  },
  mangaImage: {
    width: 80,
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mangaInfo: {
    flex: 1,
    padding: 12,
  },
  mangaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  mangaAuthor: {
    fontSize: 12,
    color: '#4d6bfe',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  mangaDescription: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
});