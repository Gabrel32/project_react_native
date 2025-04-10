import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ErrorStateProps } from '../types';

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Error: {error}</Text>
      <Text style={styles.errorHelpText}>
        Por favor, verifica tu conexión a internet e intenta nuevamente.
      </Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default ErrorState;