import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Star, Plus, X, Trash2 } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function ReviewSection({ reviews, onAddReview, onDeleteReview, role }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, content: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userHasReview, setUserHasReview] = useState(false);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? reviews.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === reviews.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX > 50) {
        goToPrevious();
      } else if (event.translationX < -50) {
        goToNext();
      }
    });

  const handleStarPress = (rating) => {
    setNewReview({ ...newReview, rating });
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      Alert.alert('Greška', 'Molimo odaberite ocenu.');
      return;
    }
    if (newReview.content.trim() === '') {
      Alert.alert('Greška', 'Molimo unesite komentar.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        // Decode token to get user info
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const authorName = `${decodedPayload.FirstName || 'nepoznato'} ${
          decodedPayload.LastName || 'nepoznato'
        }`;
        
        const reviewWithAuthor = { ...newReview, authorName };
        await onAddReview(reviewWithAuthor);
        setNewReview({ rating: 0, content: '' });
        setIsModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Greška', 'Došlo je do greške prilikom dodavanja recenzije.');
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      'Potvrda brisanja',
      'Da li ste sigurni da želite da obrišete ovu recenziju?',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: () => onDeleteReview(reviewId),
        },
      ]
    );
  };

  const checkIfUserHasReview = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const response = await fetch(
          'https://klinikabackend-production.up.railway.app/api/Review/user-review',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserHasReview(data.hasReview);
        }
      }
    } catch (error) {
      console.error('Greška pri proveri recenzije:', error);
    }
  };

  useEffect(() => {
    checkIfUserHasReview();
  }, []);

  const renderStars = (rating, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && handleStarPress(star)}
            disabled={!interactive}
            style={styles.starButton}
          >
            <Star
              size={interactive ? 24 : 20}
              color={star <= rating ? '#FFD700' : '#E5E5E7'}
              fill={star <= rating ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dodaj recenziju</Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ocena:</Text>
              {renderStars(newReview.rating, true)}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Komentar:</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={newReview.content}
                onChangeText={(text) =>
                  setNewReview({ ...newReview, content: text })
                }
                placeholder="Unesite vaš komentar..."
                placeholderTextColor="#999"
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                newReview.rating === 0 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={newReview.rating === 0}
            >
              <Text style={styles.submitButtonText}>Pošalji</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recenzije</Text>
        <View style={styles.noReviewsContainer}>
          <Text style={styles.noReviewsText}>Nema recenzija</Text>
          {role === 'User' && !userHasReview && (
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.addReviewButtonText}>Napiši prvu recenziju</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recenzije</Text>
      
      <View style={styles.carouselContainer}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.reviewsCarousel}>
            {reviews.map((review, index) => {
              let translateX = (index - currentIndex) * (screenWidth - 64);
              let scale = index === currentIndex ? 1 : 0.8;
              let opacity = index === currentIndex ? 1 : 0.3;
              
              return (
                <View
                  key={review.id}
                  style={[
                    styles.reviewCard,
                    {
                      transform: [{ translateX }, { scale }],
                      opacity,
                    },
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    {renderStars(review.rating)}
                    {role === 'Admin' && (
                      <TouchableOpacity
                        onPress={() => handleDeleteReview(review.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={18} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <Text style={styles.reviewContent}>{review.content}</Text>
                  <Text style={styles.reviewAuthor}>Autor: {review.authorName}</Text>
                  <Text style={styles.reviewDate}>
                    Datum: {new Date(review.createdOn).toLocaleDateString()}
                  </Text>
                </View>
              );
            })}
          </View>
        </GestureDetector>
        
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {reviews.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? '#007AFF' : '#E5E5E7',
                },
              ]}
              onPress={() => setCurrentIndex(index)}
            />
          ))}
        </View>
      </View>

      {role === 'User' && !userHasReview && (
        <TouchableOpacity
          style={styles.addReviewButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addReviewButtonText}>Napiši recenziju</Text>
        </TouchableOpacity>
      )}

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  carouselContainer: {
    height: 280,
    marginBottom: 32,
  },
  reviewsCarousel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    position: 'absolute',
    width: screenWidth - 64,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  reviewContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#718096',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    alignSelf: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addReviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1a1a1a',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});