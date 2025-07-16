import React, { useEffect, useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import RoleRequestForm from '../../components/Staff/RoleRequestForm';
import RoleRequests from '../../components/Staff/RoleRequests';
import { getUserRoleFromToken, isTokenValid } from '../../utils/tokenUtils';

const Staff = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Check auth status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkUserRole();
    }, [])
  );

  // Also check periodically for auth changes
  useEffect(() => {
    const interval = setInterval(checkUserRole, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUsers();
    if (isLoggedIn) {
      fetchRequestStatus();
    }
  }, [isLoggedIn]);

  const checkUserRole = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      //console.log('Checking user role, token exists:', !!token);
      
      if (token && token.trim() !== '' && isTokenValid(token)) {
        const userRole = getUserRoleFromToken(token);
        //console.log('User role from token:', userRole);
        setRole(userRole || 'User');
        setIsLoggedIn(true);
      } else {
        //console.log('No valid token found, setting as User');
        setRole('User');
        setIsLoggedIn(false);
        if (token) {
          await AsyncStorage.removeItem('jwtToken');
        }
      }
    } catch (error) {
      //console.error('Error checking user role:', error);
      setRole('User');
      setIsLoggedIn(false);
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Roles/doctors',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Greška prilikom fetchovanja lekara.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRequestStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || !isTokenValid(token)) return;

      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/RoleRequest/status',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          return;
        }
        throw new Error('Failed to fetch request status.');
      }

      const data = await response.json();
      setRequestStatus(data.status);
    } catch (err) {
      //console.error('Error fetching request status:', err);
    }
  };

  const fetchRoleRequests = async () => {
    //console.log('=== FETCHING ROLE REQUESTS ===');
    setRequestsLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      //console.log('Token exists:', !!token);
      
      if (!token) {
        Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }
      
      if (!isTokenValid(token)) {
        Alert.alert('Greška', 'Token je istekao. Molimo prijavite se ponovo.');
        await AsyncStorage.removeItem('jwtToken');
        checkUserRole();
        return;
      }

      //console.log('Making API request to fetch role requests...');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/RoleRequest/all',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      //console.log('Response status:', response.status);
      //console.log('Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Greška', 'Nemate dozvolu. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          return;
        }
        throw new Error('Failed to fetch role requests.');
      }

      const data = await response.json();
      //console.log('=== API RESPONSE DATA ===');
      //console.log('Raw data:', data);
      //console.log('Data type:', typeof data);
      //console.log('Is array:', Array.isArray(data));
      //console.log('Data length:', data?.length);
      
      if (Array.isArray(data) && data.length > 0) {
        //console.log('First request sample:', data[0]);
        //console.log('First request keys:', Object.keys(data[0]));
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      //console.error('Error fetching role requests:', err);
      setError(err.message);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    //console.log(`Attempting to ${action} request ${requestId}`);
    
    // Double check if user is still admin
    if (role !== 'Admin') {
      Alert.alert('Greška', 'Nemate dozvolu za ovu akciju.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || !isTokenValid(token)) {
        Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }

      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/RoleRequest/${action}/${requestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      //console.log(`${action} response status:`, response.status);

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Greška', 'Nemate dozvolu. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          return;
        }
        throw new Error('Ažuriranje statusa zahteva nije uspelo.');
      }

      Alert.alert(
        'Uspeh',
        `Zahtev je ${action === 'approve' ? 'odobren' : 'odbijen'}.`
      );
      fetchRoleRequests(); // Refresh requests after action
    } catch (err) {
      //console.error(`Error ${action}ing request:`, err);
      Alert.alert('Greška', 'Greška pri ažuriranju statusa zahteva: ' + err.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    // Double check if user is still logged in
    if (!isLoggedIn) {
      Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || !isTokenValid(token)) {
        Alert.alert('Greška', 'Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }

      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/RoleRequest/submit',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Greška', 'Nemate dozvolu. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          checkUserRole();
          return;
        }
        throw new Error('Failed to submit role request.');
      }

      Alert.alert('Uspeh', 'Zahtev je uspešno poslan.');
      setShowForm(false);
      fetchRequestStatus();
    } catch (err) {
      Alert.alert('Greška', 'Greška pri slanju zahteva: ' + err.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    checkUserRole();
    if (isLoggedIn) {
      fetchRequestStatus();
    }
  };

  const handleBeMemberPress = () => {
    // Double check if user is still logged in and is User
    if (!isLoggedIn || role !== 'User') {
      Alert.alert('Greška', 'Nemate dozvolu za ovu akciju.');
      return;
    }

    if (requestStatus === 'Pending') {
      Alert.alert(
        'Obaveštenje',
        'Već imate zahtev na čekanju. Molimo pričekajte rezultat.'
      );
    } else {
      setShowForm(true);
    }
  };

  const handleViewRequestsPress = () => {
    // Double check if user is still admin
    if (role !== 'Admin') {
      Alert.alert('Greška', 'Nemate dozvolu za ovu akciju.');
      return;
    }

    //console.log('=== OPENING REQUESTS MODAL ===');
    //console.log('Current role:', role);
    //console.log('Is admin:', role === 'Admin');
    
    setShowRequests(true);
    fetchRoleRequests();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Učitavanje osoblja...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Greška: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
            <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isUser = isLoggedIn && role === 'User';
  const isAdmin = isLoggedIn && role === 'Admin';

  //console.log('=== RENDER STATE ===');
  //console.log('Role:', role);
  //console.log('Is Admin:', isAdmin);
  //console.log('Is User:', isUser);
  //console.log('Is Logged In:', isLoggedIn);
  //console.log('Show Requests:', showRequests);
  //console.log('Requests count:', requests.length);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.staffContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Naš stručni tim</Text>
            {isUser && (
              <TouchableOpacity
                style={styles.beMemberButton}
                onPress={handleBeMemberPress}
              >
                <Text style={styles.beMemberButtonText}>Postani jedan od nas</Text>
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                style={styles.viewRequestsButton}
                onPress={handleViewRequestsPress}
              >
                <Text style={styles.viewRequestsButtonText}>Vidi zahteve ({requests.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {users.length === 0 ? (
            <Text style={styles.noUsersMessage}>Nema dodatih lekara.</Text>
          ) : (
            <View style={styles.cardsGrid}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.staffCard}
                  onPress={() => setSelectedDoctor(user)}
                >
                  <Image
                    source={{
                      uri: user.profileImagePath ||
                        'https://apotekasombor.rs/wp-content/uploads/2020/12/izabrani-lekar-730x365.jpg'
                    }}
                    style={styles.staffImage}
                  />
                  <Text style={styles.staffName}>
                    {user.firstName} {user.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <RoleRequestForm
            onSubmit={handleFormSubmit}
            onClose={() => setShowForm(false)}
            isOpen={showForm}
          />

          {/* Role Requests Modal */}
          <Modal
            visible={showRequests}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowRequests(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.requestsModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Zahtevi za pridruživanje</Text>
                </View>
                
                {requestsLoading ? (
                  <View style={[styles.loadingContainer, styles.requestsContainer]}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Učitavanje zahteva...</Text>
                  </View>
                ) : (
                  <View style={styles.requestsContainer}>
                    <RoleRequests
                      requests={requests}
                      onAction={handleRequestAction}
                    />
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowRequests(false)}
                >
                  <Text style={styles.closeButtonText}>Zatvori</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Doctor Details Modal */}
          <Modal
            visible={!!selectedDoctor}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setSelectedDoctor(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.doctorModalContent}>
                {selectedDoctor && (
                  <>
                    <View style={styles.doctorModalHeader}>
                      <Image
                        source={{
                          uri: selectedDoctor.profileImagePath ||
                            'https://apotekasombor.rs/wp-content/uploads/2020/12/izabrani-lekar-730x365.jpg'
                        }}
                        style={styles.doctorModalImage}
                      />
                      <View style={styles.doctorModalTitle}>
                        <Text style={styles.doctorModalName}>
                          {selectedDoctor.firstName} {selectedDoctor.lastName}
                        </Text>
                        <Text style={styles.doctorModalEmail}>
                          {selectedDoctor.email}
                        </Text>
                      </View>
                    </View>
                    <ScrollView style={styles.doctorModalBody}>
                      <View style={styles.doctorModalBiography}>
                        <Text style={styles.biographyTitle}>Biografija</Text>
                        <Text style={styles.biographyText}>
                          {selectedDoctor.biography || 'Biografija nije dostupna.'}
                        </Text>
                      </View>
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.doctorModalClose}
                      onPress={() => setSelectedDoctor(null)}
                    >
                      <Text style={styles.doctorModalCloseText}>Zatvori</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  staffContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSection: {
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
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  beMemberButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  beMemberButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewRequestsButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  viewRequestsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.1)',
    width: '48%',
  },
  staffImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    padding: 16,
  },
  noUsersMessage: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666666',
    marginTop: 50,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: '#003366',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxWidth: 600,
    maxHeight: '80%',
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  requestsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  noRequestsMessage: {
    textAlign: 'center',
    fontSize: 20,
    color: '#666666',
    padding: 50,
  },
  closeButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#1C1C1E',
    fontSize: 17,
    fontWeight: '600',
  },
  doctorModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  doctorModalHeader: {
    position: 'relative',
  },
  doctorModalImage: {
    width: '100%',
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  doctorModalTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  doctorModalName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  doctorModalEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  doctorModalBody: {
    padding: 20,
    maxHeight: 200,
  },
  doctorModalBiography: {
    marginBottom: 20,
  },
  biographyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  biographyText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  doctorModalClose: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 20,
  },
  doctorModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Staff;