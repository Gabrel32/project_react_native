import React from 'react';
import { View, Pressable, Text, StyleSheet, DimensionValue } from 'react-native';
import { ControlsProps } from '../types';

const Controls: React.FC<ControlsProps> = ({
  showControls,
  toggleControls,
  currentPage,
  totalPages,
  prevChapterId,
  nextChapterId,
  handlePrevChapter,
  handleNextChapter,
}) => {
  const progressWidth = `${((currentPage + 1) / totalPages) * 100}%` as DimensionValue;

  if (!showControls) {
    return (
      <Pressable 
        style={styles.showControlsButton} 
        onPress={toggleControls}
      >
        <Text style={styles.showControlsButtonText}>☰</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.controlsContainer}>
      <Pressable 
        style={styles.hideControlsButton} 
        onPress={toggleControls}
      >
        <Text style={styles.hideControlsButtonText}>×</Text>
      </Pressable>
      
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: progressWidth }
          ]} 
        />
      </View>
      
      <View style={styles.navigationControls}>
        <Pressable 
          style={[
            styles.navButton, 
            !prevChapterId && styles.disabledButton
          ]} 
          onPress={handlePrevChapter}
          disabled={!prevChapterId}
        >
          <Text style={styles.navButtonText}>Anterior</Text>
        </Pressable>
        
        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            {currentPage + 1}/{totalPages}
          </Text>
        </View>
        
        <Pressable 
          style={[
            styles.navButton, 
            !nextChapterId && styles.disabledButton
          ]} 
          onPress={handleNextChapter}
          disabled={!nextChapterId}
        >
          <Text style={styles.navButtonText}>Siguiente</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: '#333',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0000ff',
    width: '0%',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  navButton: {
    backgroundColor: '#0000ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pageIndicatorText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  showControlsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showControlsButtonText: {
    color: 'white',
    fontSize: 20,
  },
  hideControlsButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  hideControlsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Controls;