import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NewsCard from '../../components/NewsCard';
import AddNewsModal from '../../components/AddNewsModal';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editNews, setEditNews] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [userRole, setUserRole] = useState('User');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
    checkUserRole();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/News'
      );
      if (!response.ok) {
        throw new Error('Error loading news.');
      }
      const data = await response.json();
      setNews(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    const sortedNews = [...news].sort((a, b) => {
      const dateA = new Date(a.publishedDate).getTime();
      const dateB = new Date(b.publishedDate).getTime();
      return newSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setNews(sortedNews);
  };

  const checkUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(
          Buffer.from(payload, 'base64').toString()
        );
        const roles =
          decodedPayload[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
          ] || 'User';
        setUserRole(roles);
      }
    } catch (error) {
      setError('Error decoding token.');
    }
  };

  const handleAddNews = async (title, content) => {
    if (title.length < 2 || content.length < 10) {
      setErrorMessage(
        'Title must have at least 2 characters and content at least 10 characters.'
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/News',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            content,
            publishedDate: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error adding news.');
      }

      const addedNews = await response.json();
      setNews([addedNews, ...news]);
      setIsModalOpen(false);
      setErrorMessage('');
      Alert.alert('Uspeh', 'Vest je uspešno dodana!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEditNews = (id) => {
    const newsToEdit = news.find((item) => item.id === id);
    setEditNews(newsToEdit);
    setIsModalOpen(true);
  };

  const handleEditNewsSubmit = async (title, content) => {
    if (title.length < 2 || content.length < 10) {
      setErrorMessage(
        'Title must have at least 2 characters and content at least 10 characters.'
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/News/${editNews.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editNews.id,
            title,
            content,
            publishedDate: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error updating news.');
      }

      const updatedNewsData = await response.json();
      setNews(
        news.map((item) =>
          item.id === updatedNewsData.id ? updatedNewsData : item
        )
      );
      setEditNews(null);
      setIsModalOpen(false);
      setErrorMessage('');
      Alert.alert('Uspeh', 'Vest je uspešno ažurirana!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteNews = (id) => {
    Alert.alert(
      'Potvrda',
      'Da li ste sigurni da želite da obrišete ovu vest?',
      [
        { text: 'Ne', style: 'cancel' },
        { text: 'Da', onPress: () => confirmDelete(id) },
      ]
    );
  };

  const confirmDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/News/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error deleting news.');
      }

      setNews(news.filter((item) => item.id !== id));
      Alert.alert('Uspeh', 'Vest je uspešno izbrisana!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditNews(null);
    setErrorMessage('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Učitavanje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Greška: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = userRole === 'Admin';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vesti</Text>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.sortButton} onPress={toggleSortOrder}>
              <ArrowUpDown size={20} color="#007AFF" />
              <Text style={styles.sortButtonText}>
                {sortOrder === 'desc' ? 'Najnovije prvo' : 'Najstarije prvo'}
              </Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalOpen(true)}
              >
                <Text style={styles.addButtonText}>Dodaj novu vest</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.newsContainer}>
          {news.length === 0 ? (
            <Text style={styles.noNewsText}>Nema još objavljenih vesti.</Text>
          ) : (
            news.map((newsItem) => (
              <NewsCard
                key={newsItem.id}
                {...newsItem}
                isAdmin={isAdmin}
                onEdit={handleEditNews}
                onDelete={() => handleDeleteNews(newsItem.id)}
              />
            ))
          )}
        </View>

        <AddNewsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAdd={handleAddNews}
          onEdit={handleEditNewsSubmit}
          errorMessage={errorMessage}
          editNews={editNews}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  sortButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  newsContainer: {
    gap: 20,
  },
  noNewsText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 40,
    fontWeight: '500',
  },
});

export default News;