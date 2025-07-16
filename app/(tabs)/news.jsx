import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import NewsCard from '../../components/News/NewsCard';
import AddNewsModal from '../../components/News/AddNewsModal';
import { getUserRoleFromToken } from '../../utils/tokenUtils';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editNews, setEditNews] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsToDeleteId, setNewsToDeleteId] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [userRole, setUserRole] = useState('User');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  // Check auth status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkUserRole();
    }, [])
  );

  // Also check periodically for auth changes
  useEffect(() => {
    const interval = setInterval(checkUserRole, 1000);
    return () => clearInterval(interval);
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
      setRefreshing(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
    checkUserRole();
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

  const checkUserRole = React.useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Checking user role, token exists:', !!token);
      
      if (token && token.trim() !== '') {
        const role = getUserRoleFromToken(token);
        console.log('User role from token:', role);
        setUserRole(role || 'User');
        setIsLoggedIn(true);
      } else {
        console.log('No token found, setting as User');
        setUserRole('User');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('User');
      setIsLoggedIn(false);
    }
  }, []);

  const handleAddNews = async (title, content) => {
    if (title.length < 2 || content.length < 10) {
      setErrorMessage(
        'Title must have at least 2 characters and content at least 10 characters.'
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }
      
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
        if (response.status === 401) {
          Alert.alert('Greška', 'Nemate dozvolu. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          return;
        }
        throw new Error('Error adding news.');
      }

      const addedNews = await response.json();
      setNews([addedNews, ...news]);
      setIsModalOpen(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEditNews = (id) => {
    // Double check if user is still admin
    if (userRole !== 'Admin') {
      Alert.alert('Greška', 'Nemate dozvolu za ovu akciju.');
      return;
    }
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
      if (!token) {
        Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }
      
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
        if (response.status === 401) {
          Alert.alert('Greška', 'Nemate dozvolu. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          return;
        }
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
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteNewsIconClick = (id) => {
    // Double check if user is still admin
    if (userRole !== 'Admin') {
      Alert.alert('Greška', 'Nemate dozvolu za ovu akciju.');
      return;
    }
    setNewsToDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
        setShowDeleteModal(false);
        return;
      }
      
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/News/${newsToDeleteId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Greška', 'Nemate dozvolu. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          setShowDeleteModal(false);
          return;
        }
        throw new Error('Error deleting news.');
      }

      setNews(news.filter((item) => item.id !== newsToDeleteId));
      Alert.alert('Uspeh', 'Vest uspešno izbrisana!');
      setShowDeleteModal(false);
      setNewsToDeleteId(null);
    } catch (error) {
      setError(error.message);
      setShowDeleteModal(false);
      setNewsToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNewsToDeleteId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditNews(null);
    setErrorMessage('');
  };

  const handleAddButtonPress = () => {
    // Double check if user is still admin
    if (userRole !== 'Admin') {
      Alert.alert('Greška', 'Nemate dozvolu za ovu akciju.');
      return;
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Učitavanje vesti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Greška: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
            <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = isLoggedIn && userRole === 'Admin';
  console.log('Render - isLoggedIn:', isLoggedIn, 'userRole:', userRole, 'isAdmin:', isAdmin);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.newsContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Vesti</Text>
          <View style={styles.newsControls}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={toggleSortOrder}
            >
              <ArrowUpDown size={20} color="#007AFF" />
              <Text style={styles.sortButtonText}>
                {sortOrder === 'desc' ? 'Najnovije prvo' : 'Najstarije prvo'}
              </Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddButtonPress}
              >
                <Text style={styles.addButtonText}>Dodaj vest</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {news.length === 0 ? (
            <Text style={styles.noNewsMessage}>
              Nema još objavljenih vesti.
            </Text>
          ) : (
            news.map((newsItem) => (
              <NewsCard
                key={newsItem.id}
                {...newsItem}
                isAdmin={isAdmin}
                onEdit={handleEditNews}
                onDelete={() => handleDeleteNewsIconClick(newsItem.id)}
              />
            ))
          )}
        </ScrollView>

        <AddNewsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAdd={handleAddNews}
          onEdit={handleEditNewsSubmit}
          errorMessage={errorMessage}
          editNews={editNews}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          animationType="fade"
          transparent={true}
          onRequestClose={cancelDelete}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>
                Da li ste sigurni da želite da obrišete ovu vest?
              </Text>
              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmDelete}
                >
                  <Text style={styles.confirmButtonText}>Da</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelDelete}
                >
                  <Text style={styles.cancelButtonText}>Ne</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  newsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  newsControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    gap: 8,
    flex: 1,
  },
  sortButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noNewsMessage: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666666',
    marginTop: 50,
    fontWeight: '500',
  },
  deleteModalOverlay: {
    flex: 1,
    
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default News;