import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onSearch: (query: string, matchLevel?: number) => void;
  onClear?: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onClear, 
  placeholder = 'Buscar mangas...' 
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    // Nivel 2 de búsqueda flexible por defecto
    onSearch(query, 2);
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) onClear();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: '#333',
  },
  icon: {
    marginRight: 5,
  },
  clearButton: {
    padding: 5,
  },
});

export default SearchBar;