import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

const RoleRequests = ({ requests, onAction }) => {
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Zahtevi za pridruživanje</Text>
        <Text style={styles.noRequestsMessage}>Nema pristiglih zahteva</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zahtevi za pridruživanje</Text>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {requests.map((request, index) => {
          const firstName = request.firstName || request.FirstName || 'N/A';
          const lastName = request.lastName || request.LastName || 'N/A';
          const biography = request.biography || 'Nema biografije';
          const imageUrl = request.imageUrl || request.profileImagePath || 'https://apotekasombor.rs/wp-content/uploads/2020/12/izabrani-lekar-730x365.jpg';
          
          return (
            <View key={request.id} style={styles.requestItem}>
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.profileImage}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {firstName} {lastName}
                  </Text>
                  <View style={styles.biographyContainer}>
                    <Text style={styles.biographyLabel}>Biografija:</Text>
                    <Text style={styles.userBiography}>
                      {biography}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => onAction(request.id, 'approve')}
                >
                  <Text style={styles.approveButtonText}>✓</Text>
                  <Text style={styles.buttonLabel}>Odobri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => onAction(request.id, 'reject')}
                >
                  <Text style={styles.rejectButtonText}>✕</Text>
                  <Text style={styles.buttonLabel}>Odbij</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 500,
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 400,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  noRequestsMessage: {
    textAlign: 'center',
    fontSize: 18,
    color: '#8E8E93',
    padding: 40,
    fontStyle: 'italic',
  },
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  biographyContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  biographyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 6,
  },
  userBiography: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'justify',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  approveButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
  },
  rejectButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default RoleRequests;