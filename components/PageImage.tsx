import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { PageImageProps } from '../types';

const PageImage: React.FC<PageImageProps> = React.memo(({ 
  uri, 
  index,
  onLoad,
  isVisible,
  PAGE_HEIGHT,
  priority = 'normal'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    return () => {
      if (!isVisible) {
        setIsLoading(true);
        setHasError(false);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const imageSource = { uri, priority };

  return (
    <View style={styles.pageContainer}>
      {isLoading && (
        <View style={styles.pageLoadingOverlay}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.pageLoadingText}>Cargando página {index + 1}</Text>
        </View>
      )}
      <Image
        source={imageSource}
        style={styles.pageImage}
        resizeMode="contain"
        fadeDuration={priority === 'high' ? 100 : 300}
        onLoad={() => {
          setIsLoading(false);
          onLoad(index);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
          console.error('Error loading image:', uri);
        }}
      />
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Error al cargar</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  pageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
    zIndex: 1,
  },
  pageLoadingText: {
    marginTop: 10,
    color: '#333',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    zIndex: 1,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PageImage;