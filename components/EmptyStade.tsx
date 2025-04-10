import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { EmptyStateProps } from '../types';

const EmptyState: React.FC<EmptyStateProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
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
  text: {
    color: '#333',
    fontSize: 16,
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

export default EmptyState;