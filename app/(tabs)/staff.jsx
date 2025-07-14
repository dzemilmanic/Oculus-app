import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPlus, FileText, X, Check, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth } = Dimensions.get('window');

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Form states
  const [biography, setBiography] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRequestStatus();
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

      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        try {
          const payload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payload));
          const roles =
            decodedPayload[
              'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
            ] || 'User';
          setRole(roles);
        } catch (error) {
          setError('Greška prilikom dekodovanja tokena.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestStatus = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    try {
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
        throw new Error('Failed to fetch request status.');
      }

      const data = await response.json();
      setRequestStatus(data.status);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchRoleRequests = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/RoleRequest/all',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch role requests.');
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/RoleRequest/${action}/${requestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ažuriranje statusa zahteva nije uspelo.');
      }

      Alert.alert(
        'Uspeh',
        `Zahtev je ${action === 'approve' ? 'odobren' : 'odbijen'}.`
      );
      fetchRoleRequests();
    } catch (err) {
      Alert.alert('Greška', 'Greška pri ažuriranju statusa zahteva: ' + err.message);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Greška', 'Potrebna je dozvola za pristup galeriji!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleFormSubmit = async () => {
    if (biography.length < 10) {
      setFormError('Biografija mora imati makar 10 karaktera.');
      return;
    }
    if (!selectedImage) {
      setFormError('Molimo dodajte fotografiju.');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append('biography', biography);
      formData.append('image', {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.fileName || 'image.jpg',
      });

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
        throw new Error('Failed to submit role request.');
      }

      Alert.alert('Uspeh', 'Zahtev je uspešno poslan.');
      setShowForm(false);
      setBiography('');
      setSelectedImage(null);
      setFormError('');
    } catch (err) {
      Alert.alert('Greška', 'Greška pri slanju zahteva: ' + err.message);
    }
  };

  const renderRoleRequestForm = () => (
    <Modal
      visible={showForm}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowForm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pošalji zahtev</Text>
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Biografija:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                value={biography}
                onChangeText={setBiography}
                placeholder="Unesite vašu biografiju..."
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fotografija:</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <User size={40} color="#666" />
                    <Text style={styles.imagePlaceholderText}>Dodajte fotografiju</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {formError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#dc2626" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}
            
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleFormSubmit}
              >
                <Text style={styles.submitButtonText}>Pošalji</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>Zatvori</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderRoleRequests = () => (
    <Modal
      visible={showRequests}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowRequests(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Zahtevi za pridruživanje</Text>
            <TouchableOpacity
              onPress={() => setShowRequests(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {requests.length === 0 ? (
              <View style={styles.noRequestsContainer}>
                <FileText size={48} color="#666" />
                <Text style={styles.noRequestsText}>Nema pristiglih zahteva</Text>
              </View>
            ) : (
              requests.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestHeader}>
                    <Image
                      source={{
                        uri: request.imageUrl || 'https://apotekasombor.rs/wp-content/uploads/2020/12/izabrani-lekar-730x365.jpg'
                      }}
                      style={styles.requestImage}
                    />
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>
                        {request.firstName} {request.lastName}
                      </Text>
                      <Text style={styles.requestBiography} numberOfLines={3}>
                        {request.biography}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleRequestAction(request.id, 'approve')}
                    >
                      <Check size={18} color="#ffffff" />
                      <Text style={styles.approveButtonText}>Odobri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRequestAction(request.id, 'reject')}
                    >
                      <X size={18} color="#ffffff" />
                      <Text style={styles.rejectButtonText}>Odbij</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDoctorModal = () => (
    <Modal
      visible={!!selectedDoctor}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedDoctor(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.doctorModalContent}>
          <TouchableOpacity
            style={styles.doctorModalClose}
            onPress={() => setSelectedDoctor(null)}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Image
            source={{
              uri: selectedDoctor?.profileImagePath || 'https://apotekasombor.rs/wp-content/uploads/2020/12/izabrani-lekar-730x365.jpg'
            }}
            style={styles.doctorModalImage}
          />
          
          <View style={styles.doctorModalOverlay}>
            <Text style={styles.doctorModalName}>
              {selectedDoctor?.firstName} {selectedDoctor?.lastName}
            </Text>
            <Text style={styles.doctorModalEmail}>{selectedDoctor?.email}</Text>
          </View>
          
          <View style={styles.doctorModalBody}>
            <Text style={styles.doctorModalBiographyTitle}>Biografija</Text>
            <Text style={styles.doctorModalBiography}>{selectedDoctor?.biography}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          <AlertCircle size={48} color="#dc2626" />
          <Text style={styles.errorText}>Greška: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Naš stručni tim</Text>
          
          {role === 'User' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (requestStatus === 'Pending') {
                  Alert.alert(
                    'Obaveštenje',
                    'Već imate zahtev na čekanju. Molimo pričekajte rezultat.'
                  );
                } else {
                  setShowForm(true);
                }
              }}
            >
              <UserPlus size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Postani jedan od nas</Text>
            </TouchableOpacity>
          )}
          
          {role === 'Admin' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowRequests(true);
                fetchRoleRequests();
              }}
            >
              <FileText size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Vidi zahteve</Text>
            </TouchableOpacity>
          )}
        </View>

        {users.length === 0 ? (
          <View style={styles.noUsersContainer}>
            <User size={48} color="#666" />
            <Text style={styles.noUsersText}>Nema dodatih lekara.</Text>
          </View>
        ) : (
          <View style={styles.staffGrid}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.staffCard}
                onPress={() => setSelectedDoctor(user)}
              >
                <Image
                  source={{
                    uri: user.profileImagePath || 'https://apotekasombor.rs/wp-content/uploads/2020/12/izabrani-lekar-730x365.jpg'
                  }}
                  style={styles.staffImage}
                />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {user.firstName} {user.lastName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {renderRoleRequestForm()}
      {renderRoleRequests()}
      {renderDoctorModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noUsersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  noUsersText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  staffGrid: {
    padding: 24,
    gap: 16,
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  staffImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  staffInfo: {
    padding: 16,
    alignItems: 'center',
  },
  staffName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
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
  textArea: {
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1a1a1a',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noRequestsContainer: {
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  noRequestsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  requestItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  requestHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  requestImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  requestBiography: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  doctorModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    position: 'relative',
  },
  doctorModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  doctorModalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  doctorModalOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
  },
  doctorModalName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  doctorModalEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  doctorModalBody: {
    padding: 24,
  },
  doctorModalBiographyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  doctorModalBiography: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});