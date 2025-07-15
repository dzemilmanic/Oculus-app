import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Lock, Eye, EyeOff, Pencil, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = () => {
  const [user, setUser] = useState({
    ime: '',
    prezime: '',
    email: '',
    biography: '',
    profileImagePath: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalField, setModalField] = useState('');
  const [newIme, setNewIme] = useState('');
  const [newPrezime, setNewPrezime] = useState('');
  const [newBiography, setNewBiography] = useState('');
  const [newOldPassword, setNewOldPassword] = useState('');
  const [newNewPassword, setNewNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [role, setRole] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentsModalOpen, setAppointmentsModalOpen] = useState(false);
  const [isMedicalRecordModalOpen, setIsMedicalRecordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        return;
      }

      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/GetUserData',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser({
          ime: data.firstName || 'nepoznato',
          prezime: data.lastName || 'nepoznato',
          email: data.email || 'nepoznato',
          biography: data.biography || '',
          profileImagePath: data.profileImagePath || '',
        });
      } else {
        Alert.alert('Greška', 'Greška prilikom učitavanja podataka o korisniku');
      }

      // Decode JWT token for role
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(
        Buffer.from(payload, 'base64').toString()
      );
      const roles =
        decodedPayload[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ];
      setRole(roles);
      
      if (roles && roles.includes('Doctor')) {
        const doctorId =
          decodedPayload[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
          ];
        setDoctorId(doctorId);
      }
    } catch (error) {
      Alert.alert('Greška', 'Greška prilikom poziva API-ja');
    }
  };

  const fetchAppointments = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(
          Buffer.from(payload, 'base64').toString()
        );
        const patientId =
          decodedPayload[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
          ];

        let response;
        if (role.includes('Doctor') && doctorId) {
          response = await fetch(
            `https://klinikabackend-production.up.railway.app/api/Appointment/doctor/${doctorId}/appointments`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          response = await fetch(
            `https://klinikabackend-production.up.railway.app/api/Appointment/user/${patientId}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        } else {
          Alert.alert('Greška', 'Greška prilikom dohvatanja termina.');
        }
      } catch (error) {
        Alert.alert('Greška', 'Greška prilikom poziva API-ja');
      }
    }
  };

  const handleOpenAppointmentsModal = async () => {
    await fetchAppointments();
    setAppointmentsModalOpen(true);
  };

  const handleCloseAppointmentsModal = () => {
    setAppointmentsModalOpen(false);
  };

  const handleEdit = (field) => {
    setModalField(field);
    setIsModalOpen(true);
    setErrorMessage('');
    
    if (field === 'ime') {
      setNewIme(user.ime);
    } else if (field === 'prezime') {
      setNewPrezime(user.prezime);
    } else if (field === 'biography') {
      setNewBiography(user.biography);
    } else if (field === 'password') {
      setNewOldPassword('');
      setNewNewPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
    }
  };

  const validatePasswordChange = () => {
    if (!newOldPassword) {
      setErrorMessage('Stara lozinka je obavezna.');
      return false;
    }
    if (!newNewPassword) {
      setErrorMessage('Nova lozinka je obavezna.');
      return false;
    }
    if (newNewPassword.length < 6) {
      setErrorMessage('Nova lozinka mora imati najmanje 6 karaktera.');
      return false;
    }
    return true;
  };

  const handleSaveModal = async () => {
    if (modalField === 'ime' && newIme.length < 2) {
      setErrorMessage('Ime mora imati najmanje 2 karaktera.');
      return;
    }
    if (modalField === 'prezime' && newPrezime.length < 2) {
      setErrorMessage('Prezime mora imati najmanje 2 karaktera.');
      return;
    }
    if (modalField === 'biography' && newBiography.length < 2) {
      setErrorMessage('Biografija mora imati najmanje 2 karaktera.');
      return;
    }
    if (modalField === 'password' && !validatePasswordChange()) {
      return;
    }

    const updatedUser = {
      ...user,
      ime: modalField === 'ime' ? newIme : user.ime,
      prezime: modalField === 'prezime' ? newPrezime : user.prezime,
      biography: modalField === 'biography' ? newBiography : user.biography,
    };

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/ChangeUserData/update',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            FirstName: updatedUser.ime,
            LastName: updatedUser.prezime,
            Biography: updatedUser.biography,
            OldPassword: newOldPassword || '',
            NewPassword: newNewPassword || '',
          }),
        }
      );

      if (response.ok) {
        setUser(updatedUser);
        setIsModalOpen(false);
        
        if (modalField === 'password') {
          Alert.alert('Uspeh', 'Lozinka je uspešno promenjena!');
        } else {
          Alert.alert('Uspeh', 'Podaci su uspešno ažurirani!');
        }
        
        // Reset password fields
        setNewOldPassword('');
        setNewNewPassword('');
        setShowOldPassword(false);
        setShowNewPassword(false);
      } else {
        const textResponse = await response.text();
        try {
          const errorData = JSON.parse(textResponse);
          setErrorMessage(
            errorData.message || 'Greška prilikom ažuriranja podataka.'
          );
        } catch (error) {
          setErrorMessage(
            textResponse || 'Greška prilikom ažuriranja podataka.'
          );
        }
      }
    } catch (error) {
      setErrorMessage('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage('');
    setNewOldPassword('');
    setNewNewPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Odjava',
      'Da li ste sigurni da se želite odjaviti?',
      [
        { text: 'Ne', style: 'cancel' },
        {
          text: 'Da',
          onPress: async () => {
            try {
              // Remove token from storage
              await AsyncStorage.removeItem('jwtToken');
              
              // Wait a bit to ensure token is removed
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Clear all user data from state
              setUser({
                ime: '',
                prezime: '',
                email: '',
                biography: '',
                profileImagePath: '',
              });
              setRole('');
              setDoctorId('');
              setAppointments([]);
              
              // Close any open modals
              setIsModalOpen(false);
              setAppointmentsModalOpen(false);
              setIsMedicalRecordModalOpen(false);
              
              console.log('User logged out successfully');
              Alert.alert('Uspeh', 'Uspešno ste se odjavili!');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Greška', 'Greška prilikom odjave');
            }
          },
        },
      ]
    );
  };

  const renderEditModal = () => {
    if (!isModalOpen) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {modalField === 'password'
              ? 'Promena lozinke'
              : 'Ažuriraj podatke'}
          </Text>

          {modalField === 'ime' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ime:</Text>
              <TextInput
                style={styles.input}
                value={newIme}
                onChangeText={setNewIme}
                placeholder="Unesite ime"
              />
            </View>
          )}

          {modalField === 'prezime' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prezime:</Text>
              <TextInput
                style={styles.input}
                value={newPrezime}
                onChangeText={setNewPrezime}
                placeholder="Unesite prezime"
              />
            </View>
          )}

          {modalField === 'biography' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Biografija:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newBiography}
                onChangeText={setNewBiography}
                placeholder="Unesite biografiju"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          )}

          {modalField === 'password' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stara lozinka:</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={newOldPassword}
                    onChangeText={setNewOldPassword}
                    placeholder="Unesite staru lozinku"
                    secureTextEntry={!showOldPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova lozinka:</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={newNewPassword}
                    onChangeText={setNewNewPassword}
                    placeholder="Unesite novu lozinku"
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveModal}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Sačuvaj</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCloseModal}
            >
              <Text style={styles.cancelButtonText}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Moj profil</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            {user.profileImagePath && (
              <Image
                source={{ uri: user.profileImagePath }}
                style={styles.profileImage}
              />
            )}

            <View style={styles.profileField}>
              <Text style={styles.label}>Ime:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.disabledInput}
                  value={user.ime}
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={() => handleEdit('ime')}
                >
                  <Pencil size={18} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.profileField}>
              <Text style={styles.label}>Prezime:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.disabledInput}
                  value={user.prezime}
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={() => handleEdit('prezime')}
                >
                  <Pencil size={18} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.profileField}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.disabledInput}
                value={user.email}
                editable={false}
              />
            </View>

            <View style={styles.profileField}>
              <Text style={styles.label}>Biografija:</Text>
              <View style={styles.biographyContainer}>
                <TextInput
                  style={[styles.disabledInput, styles.biographyText]}
                  value={user.biography}
                  editable={false}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.biographyEditIcon}
                  onPress={() => handleEdit('biography')}
                >
                  <Pencil size={18} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.profileField}>
              <Text style={styles.label}>Lozinka:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.disabledInput}
                  value="••••••••"
                  editable={false}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={() => handleEdit('password')}
                >
                  <Lock size={18} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {!role.includes('Admin') && (
              <TouchableOpacity
                style={styles.appointmentsButton}
                onPress={handleOpenAppointmentsModal}
              >
                <Text style={styles.appointmentsButtonText}>Vaši termini</Text>
              </TouchableOpacity>
            )}

            {role.includes('User') && !role.includes('Doctor') && (
              <TouchableOpacity
                style={styles.appointmentsButton}
                onPress={async () => {
                  await fetchAppointments();
                  setIsMedicalRecordModalOpen(true);
                }}
              >
                <Text style={styles.appointmentsButtonText}>Vaš karton</Text>
              </TouchableOpacity>
            )}
          </View>

          {renderEditModal()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disabledInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
  },
  biographyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  biographyText: {
    height: 80,
    textAlignVertical: 'top',
  },
  editIcon: {
    padding: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biographyEditIcon: {
    padding: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  appointmentsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  appointmentsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;