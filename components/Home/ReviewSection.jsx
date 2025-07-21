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

const GRAPHQL_ENDPOINT = 'https://oculus-app-backend-production.up.railway.app/graphql';

export default function ReviewSection({ reviews, onAddReview, onDeleteReview, role, isLoggedIn }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, content: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userHasReview, setUserHasReview] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Safely get reviews length
  const reviewsLength = localReviews && Array.isArray(localReviews) ? localReviews.length : 0;

  // Ensure currentIndex is within bounds
  useEffect(() => {
    if (reviewsLength > 0 && currentIndex >= reviewsLength) {
      setCurrentIndex(0);
    }
  }, [reviewsLength, currentIndex]);

  // GraphQL queries and mutations
  const REVIEWS_QUERY = `
    query GetReviews {
      reviews {
        Id
        Rating
        Content
        CreatedOn
        UpdatedOn
        AuthorName
      }
    }
  `;

  const USER_REVIEW_CHECK_QUERY = `
    query UserReviewCheck {
      userReviewCheck {
        hasReview
      }
    }
  `;

  const CREATE_REVIEW_MUTATION = `
    mutation CreateReview($input: ReviewInput!) {
      createReview(input: $input) {
        Id
        Rating
        Content
        CreatedOn
        UpdatedOn
        AuthorName
      }
    }
  `;

  const DELETE_REVIEW_MUTATION = `
    mutation DeleteReview($id: ID!) {
      deleteReview(id: $id) {
        Success
        Message
      }
    }
  `;

  // GraphQL request helper
  const makeGraphQLRequest = async (query, variables = {}, requireAuth = false) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (requireAuth) {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token || !isTokenValid(token)) {
          throw new Error('Token nije valjan ili je istekao');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL greška');
      }

      return result.data;
    } catch (error) {
      //console.error('GraphQL request error:', error);
      throw error;
    }
  };

  // Fetch reviews from GraphQL
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await makeGraphQLRequest(REVIEWS_QUERY);
      
      // Transform data to match expected format
      const transformedReviews = data.reviews.map(review => ({
        id: review.Id,
        rating: review.Rating,
        content: review.Content,
        createdOn: review.CreatedOn,
        updatedOn: review.UpdatedOn,
        authorName: review.AuthorName,
      }));
      
      setLocalReviews(transformedReviews);
    } catch (error) {
      //console.error('Greška pri dohvatanju recenzija:', error);
      Alert.alert('Greška', 'Nije moguće učitati recenzije.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has review
  const checkUserReviewStatus = async () => {
    if (!isLoggedIn) {
      setUserHasReview(false);
      return;
    }

    try {
      const data = await makeGraphQLRequest(USER_REVIEW_CHECK_QUERY, {}, true);
      setUserHasReview(data.userReviewCheck.hasReview);
    } catch (error) {
      //console.error('Greška pri proveri statusa recenzije:', error);
      setUserHasReview(false);
    }
  };

  // Add review via GraphQL
  const handleAddReviewGraphQL = async () => {
    if (newReview.rating === 0) {
      Alert.alert('Greška', 'Molimo odaberite ocenu.');
      return;
    }
    if (newReview.content.trim() === '') {
      Alert.alert('Greška', 'Molimo unesite komentar.');
      return;
    }

    try {
      setLoading(true);
      
      const variables = {
        input: {
          Rating: newReview.rating,
          Content: newReview.content.trim(),
        },
      };

      const data = await makeGraphQLRequest(CREATE_REVIEW_MUTATION, variables, true);
      
      // Transform and add to local state
      const newReviewData = {
        id: data.createReview.Id,
        rating: data.createReview.Rating,
        content: data.createReview.Content,
        createdOn: data.createReview.CreatedOn,
        updatedOn: data.createReview.UpdatedOn,
        authorName: data.createReview.AuthorName,
      };

      setLocalReviews(prev => [newReviewData, ...prev]);
      setNewReview({ rating: 0, content: '' });
      setIsModalVisible(false);
      setUserHasReview(true);
      
      Alert.alert('Uspeh', 'Recenzija je uspešno dodana!');
    } catch (error) {
      //console.error('Greška pri dodavanju recenzije:', error);
      Alert.alert('Greška', error.message || 'Došlo je do greške prilikom dodavanja recenzije.');
    } finally {
      setLoading(false);
    }
  };

  // Delete review via GraphQL
  const handleDeleteReviewGraphQL = async (reviewId) => {
    try {
      setLoading(true);
      
      const variables = { id: reviewId };
      const data = await makeGraphQLRequest(DELETE_REVIEW_MUTATION, variables, true);
      
      if (data.deleteReview.Success) {
        setLocalReviews(prev => prev.filter(review => review.id !== reviewId));
        Alert.alert('Uspeh', 'Recenzija je uspešno obrisana!');
      } else {
        Alert.alert('Greška', data.deleteReview.Message || 'Greška pri brisanju recenzije.');
      }
    } catch (error) {
      //console.error('Greška pri brisanju recenzije:', error);
      Alert.alert('Greška', error.message || 'Došlo je do greške prilikom brisanja recenzije.');
    } finally {
      setLoading(false);
    }
  };

  // Format date function (improved)
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Datum nije dostupan';
      
      //console.log('Raw date from GraphQL:', dateString, typeof dateString);
      
      let date;
      
      if (typeof dateString === 'string') {
        // Try direct parsing as ISO string
        date = new Date(dateString);
        
        // If direct parsing fails, try cleaning the string
        if (isNaN(date.getTime())) {
          const cleanedDate = dateString
            .replace(/[^\d\-T:\.Z\+]/g, '')
            .replace(/(\d{4}-\d{2}-\d{2})$/, '$1T00:00:00.000Z');
          
          //console.log('Cleaned date:', cleanedDate);
          date = new Date(cleanedDate);
        }
        
        // Try .NET JSON format (/Date(timestamp)/)
        if (isNaN(date.getTime()) && dateString.includes('/Date(')) {
          const timestamp = dateString.match(/\/Date\((\d+)\)\//);
          if (timestamp) {
            date = new Date(parseInt(timestamp[1], 10));
          }
        }
        
        // Try timestamp as string
        if (isNaN(date.getTime()) && /^\d+$/.test(dateString)) {
          const timestamp = parseInt(dateString, 10);
          date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
        }
        
      } else if (typeof dateString === 'number') {
        date = new Date(dateString < 10000000000 ? dateString * 1000 : dateString);
      }
      
      if (!date || isNaN(date.getTime())) {
        //console.error('Failed to parse date:', dateString);
        return 'Nepravilan datum';
      }
      
      //console.log('Parsed date:', date);
      
      return date.toLocaleDateString('sr-RS', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      //console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Greška u formatiranju datuma';
    }
  };

  const goToPrevious = () => {
    if (reviewsLength <= 1) return;
    
    try {
      const isFirstSlide = currentIndex === 0;
      const newIndex = isFirstSlide ? reviewsLength - 1 : currentIndex - 1;
      setCurrentIndex(Math.max(0, Math.min(newIndex, reviewsLength - 1)));
    } catch (error) {
      setCurrentIndex(0);
    }
  };

  const goToNext = () => {
    if (reviewsLength <= 1) return;
    
    try {
      const isLastSlide = currentIndex === reviewsLength - 1;
      const newIndex = isLastSlide ? 0 : currentIndex + 1;
      setCurrentIndex(Math.max(0, Math.min(newIndex, reviewsLength - 1)));
    } catch (error) {
      setCurrentIndex(0);
    }
  };

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      if (!localReviews || !Array.isArray(localReviews) || localReviews.length <= 1) {
        return;
      }
      
      const threshold = 50;
      
      if (event.translationX > threshold) {
        goToPrevious();
      } else if (event.translationX < -threshold) {
        goToNext();
      }
    })
    .runOnJS(true);

  const handleStarPress = (rating) => {
    setNewReview({ ...newReview, rating });
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
          onPress: () => handleDeleteReviewGraphQL(reviewId),
        },
      ]
    );
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

  // Load data on component mount and when login status changes
  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      checkUserReviewStatus();
    } else {
      setUserHasReview(false);
    }
  }, [isLoggedIn]);

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
                    (newReview.rating === 0 || newReview.content.trim() === '' || loading) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAddReviewGraphQL}
                  disabled={newReview.rating === 0 || newReview.content.trim() === '' || loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Šalje se...' : 'Pošalji recenziju'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Safe check for reviews
  if (!localReviews || !Array.isArray(localReviews) || localReviews.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recenzije pacijenata</Text>
        <View style={styles.noReviewsContainer}>
          <Text style={styles.noReviewsText}>Trenutno nema recenzija</Text>
          <Text style={styles.noReviewsSubtext}>
            Budite prvi koji će podeliti svoje iskustvo!
          </Text>
          <TouchableOpacity
            style={[styles.addReviewButton, loading && styles.addReviewButtonDisabled]}
            onPress={handleAddReviewPress}
            disabled={loading}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addReviewButtonText}>
              {loading ? 'Učitava...' : 'Napiši prvu recenziju'}
            </Text>
          </TouchableOpacity>
        </View>
        {renderModal()}
      </View>
    );
  }

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.max(0, Math.min(currentIndex, reviewsLength - 1));

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recenzije pacijenata</Text>
      
      <View style={styles.carouselContainer}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.reviewsCarousel}>
            {localReviews.map((review, index) => {
              if (!review || !review.id) return null;
              
              try {
                let translateX = (index - safeCurrentIndex) * (screenWidth - 48);
                let scale = index === safeCurrentIndex ? 1 : 0.85;
                let opacity = index === safeCurrentIndex ? 1 : 0.4;
                
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
                        {renderStars(review.rating || 0)}
                        <Text style={styles.ratingText}>({review.rating || 0}/5)</Text>
                      </View>
                      {role === 'Admin' && (
                        <TouchableOpacity
                          onPress={() => handleDeleteReview(review.id)}
                          style={styles.deleteButton}
                          disabled={loading}
                        >
                          <Trash2 size={18} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <Text style={styles.reviewContent}>"{review.content || ''}"</Text>
                    
                    <View style={styles.reviewFooter}>
                      <Text style={styles.reviewAuthor}>
                        {review.authorName || 'Anonimni korisnik'}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.createdOn)}
                      </Text>
                    </View>
                  </View>
                );
              } catch (error) {
                //console.error('Error rendering review card:', error);
                return null;
              }
            })}
          </View>
        </GestureDetector>
        
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {localReviews.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === safeCurrentIndex ? '#007AFF' : '#E5E5E7',
                  transform: [{ scale: index === safeCurrentIndex ? 1.2 : 1 }],
                },
              ]}
              onPress={() => {
                if (index >= 0 && index < reviewsLength) {
                  setCurrentIndex(index);
                }
              }}
            />
          ))}
        </View>
      </View>

      {/* Add Review Button - samo za prijavljene korisnike koji nemaju recenziju */}
      {isLoggedIn && !userHasReview && role !== 'Admin' && (
        <TouchableOpacity
          style={[styles.addReviewButton, loading && styles.addReviewButtonDisabled]}
          onPress={handleAddReviewPress}
          disabled={loading}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addReviewButtonText}>
            {loading ? 'Učitava...' : 'Napiši recenziju'}
          </Text>
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
    color: '#003366',
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
    backgroundColor: '#003366',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    alignSelf: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addReviewButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#003366',
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