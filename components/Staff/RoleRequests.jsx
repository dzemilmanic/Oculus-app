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
        <Text style={styles.noRequestsMessage}>Nema pristiglih zahteva</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
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
                  style={[styles.iconButton, styles.approveButton]}
                  onPress={() => onAction(request.id, 'approve')}
                >
                  <Text style={styles.approveIcon}>✔️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.rejectButton]}
                  onPress={() => onAction(request.id, 'reject')}
                >
                  <Text style={styles.rejectIcon}>❌</Text>
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
  },
  scrollContainer: {
    flex: 1,
  },
  noRequestsMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    padding: 40,
    fontStyle: 'italic',
  },
  requestItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  biographyContainer: {
    flex: 1,
  },
  biographyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  userBiography: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
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