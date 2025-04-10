import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LoadingStateProps } from '../types';

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Cargando capítulo...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    marginTop: 10,
    color: '#333',
  },
});

export default LoadingState;