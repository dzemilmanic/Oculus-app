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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Star, Plus, X, Trash2 } from 'lucide-react-native';
import { isTokenValid, decodeJWTToken } from '@/utils/tokenUtils';

const { width: screenWidth } = Dimensions.get('window');

export default function ReviewSection({ reviews, onAddReview, onDeleteReview, role, isLoggedIn }) {
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
      if (token && isTokenValid(token)) {
        const payload = decodeJWTToken(token);
        const authorName = `${payload.FirstName || 'Nepoznato'} ${
          payload.LastName || 'Nepoznato'
        }`;
        
        const reviewWithAuthor = { ...newReview, authorName };
        await onAddReview(reviewWithAuthor);
        setNewReview({ rating: 0, content: '' });
        setIsModalVisible(false);
        setUserHasReview(true);
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

  const checkUserStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token && isTokenValid(token)) {
        // Proveri da li korisnik već ima recenziju
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
      } else {
        setUserHasReview(false);
      }
    } catch (error) {
      //console.error('Greška pri proveri statusa korisnika:', error);
      setUserHasReview(false);
    }
  };

  const handleAddReviewPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Potrebna prijava',
        'Morate biti prijavljeni da biste napisali recenziju.',
        [{ text: 'U redu', style: 'default' }]
      );
      return;
    }
    
    if (userHasReview) {
      Alert.alert(
        'Već imate recenziju',
        'Možete napisati samo jednu recenziju.',
        [{ text: 'U redu', style: 'default' }]
      );
      return;
    }
    
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (isLoggedIn) {
      checkUserStatus();
    } else {
      setUserHasReview(false);
    }
  }, [role, isLoggedIn]);

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
              size={interactive ? 28 : 20}
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              
              <ScrollView 
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
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
                    returnKeyType="done"
                  />
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (newReview.rating === 0 || newReview.content.trim() === '') && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitReview}
                  disabled={newReview.rating === 0 || newReview.content.trim() === ''}
                >
                  <Text style={styles.submitButtonText}>Pošalji recenziju</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recenzije pacijenata</Text>
        <View style={styles.noReviewsContainer}>
          <Text style={styles.noReviewsText}>Trenutno nema recenzija</Text>
          <Text style={styles.noReviewsSubtext}>
            Budite prvi koji će podeliti svoje iskustvo!
          </Text>
          <TouchableOpacity
            style={styles.addReviewButton}
            onPress={handleAddReviewPress}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addReviewButtonText}>Napiši prvu recenziju</Text>
          </TouchableOpacity>
        </View>
        {renderModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recenzije pacijenata</Text>
      
      <View style={styles.carouselContainer}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.reviewsCarousel}>
            {reviews.map((review, index) => {
              let translateX = (index - currentIndex) * (screenWidth - 48);
              let scale = index === currentIndex ? 1 : 0.85;
              let opacity = index === currentIndex ? 1 : 0.4;
              
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
                    <View style={styles.reviewRatingContainer}>
                      {renderStars(review.rating)}
                      <Text style={styles.ratingText}>({review.rating}/5)</Text>
                    </View>
                    {role === 'Admin' && (
                      <TouchableOpacity
                        onPress={() => handleDeleteReview(review.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={18} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <Text style={styles.reviewContent}>"{review.content}"</Text>
                  
                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewAuthor}>
                      {review.authorName || 'Anonimni korisnik'}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdOn).toLocaleDateString('sr-RS')}
                    </Text>
                  </View>
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
                  transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
                },
              ]}
              onPress={() => setCurrentIndex(index)}
            />
          ))}
        </View>
      </View>

      {/* Add Review Button - samo za prijavljene korisnike koji nemaju recenziju */}
      {isLoggedIn && !userHasReview && role !== 'Admin' && (
        <TouchableOpacity
          style={styles.addReviewButton}
          onPress={handleAddReviewPress}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addReviewButtonText}>Napiši recenziju</Text>
        </TouchableOpacity>
      )}

      {/* Info text for non-logged users */}
      {!isLoggedIn && (
        <View style={styles.loginPromptContainer}>
          <Text style={styles.loginPromptText}>
            Prijavite se da biste mogli da napišete recenziju
          </Text>
        </View>
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
    paddingHorizontal: 24,
  },
  noReviewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 32,
    textAlign: 'center',
  },
  carouselContainer: {
    height: 320,
    marginBottom: 32,
  },
  reviewsCarousel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    position: 'absolute',
    width: screenWidth - 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
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
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
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
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
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
  loginPromptContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    minWidth: '98%',
    maxWidth: 800,
    maxHeight: '50%',
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});