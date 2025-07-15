import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Lock, Eye, EyeOff, Edit3 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRoleFromToken, getUserIdFromToken, decodeJWTToken } from '@/utils/tokenUtils';
import AllAppointmentsModal from '@/components/AllAppointmentsModal';
import MedicalRecordModal from '@/components/MedicalRecordModal';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
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
          console.error('Greška prilikom učitavanja podataka o korisniku');
        }

        if (token) {
          const roles = getUserRoleFromToken(token);
          setRole(roles);
          if (roles.includes('Doctor')) {
            const doctorId = getUserIdFromToken(token);
            setDoctorId(doctorId);
          }
        }
      } catch (error) {
        console.error('Greška prilikom poziva API-ja:', error);
      }
    };

    fetchUserData();
  }, []);

  const fetchAppointments = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = decodeJWTToken(token);
        const patientId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

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
          console.error('Greška prilikom dohvatanja termina.');
        }
      } catch (error) {
        console.error('Greška prilikom poziva API-ja:', error);
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

    setLoading(true);
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
        setNewOldPassword('');
        setNewNewPassword('');
        setShowOldPassword(false);
        setShowNewPassword(false);
      } else {
        const textResponse = await response.text();
        try {
          const errorData = JSON.parse(textResponse);
          setErrorMessage(errorData.message || 'Greška prilikom ažuriranja podataka.');
        } catch (error) {
          setErrorMessage(textResponse || 'Greška prilikom ažuriranja podataka.');
        }
      }
    } catch (error) {
      console.error('Greška:', error);
      setErrorMessage('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      setLoading(false);
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
      'Potvrda',
      'Da li ste sigurni da se želite odjaviti?',
      [
        {
          text: 'Otkaži',
          style: 'cancel',
        },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('jwtToken');
              console.log('User logged out');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileContainer}>
          <Text style={styles.title}>Moj profil</Text>
          
          {user.profileImagePath ? (
            <Image source={{ uri: user.profileImagePath }} style={styles.profileImage} />
          ) : null}

          <View style={styles.profileField}>
            <Text style={styles.label}>Ime:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={user.ime}
                editable={false}
              />
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => handleEdit('ime')}
              >
                <Edit3 size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.label}>Prezime:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={user.prezime}
                editable={false}
              />
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => handleEdit('prezime')}
              >
                <Edit3 size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={user.email}
              editable={false}
            />
          </View>

          <View style={styles.profileField}>
            <Text style={styles.label}>Biografija:</Text>
            <View style={styles.biographyContainer}>
              <TextInput
                style={styles.biographyText}
                value={user.biography}
                editable={false}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                style={styles.biographyEditIcon}
                onPress={() => handleEdit('biography')}
              >
                <Edit3 size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.label}>Lozinka:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value="••••••••"
                editable={false}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => handleEdit('password')}
              >
                <Lock size={20} color="#007AFF" />
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

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Odjavi se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalField === 'password' ? 'Promena lozinke' : 'Ažuriraj podatke'}
            </Text>

            {modalField === 'ime' && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Ime:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newIme}
                  onChangeText={setNewIme}
                  placeholder="Unesite ime"
                />
              </View>
            )}

            {modalField === 'prezime' && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Prezime:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPrezime}
                  onChangeText={setNewPrezime}
                  placeholder="Unesite prezime"
                />
              </View>
            )}

            {modalField === 'biography' && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Biografija:</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={newBiography}
                  onChangeText={setNewBiography}
                  placeholder="Unesite biografiju"
                  multiline
                  numberOfLines={6}
                />
              </View>
            )}

            {modalField === 'password' && (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Stara lozinka:</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.modalInput, styles.passwordInput]}
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

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Nova lozinka:</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.modalInput, styles.passwordInput]}
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

            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveModal}
                disabled={loading}
              >
                {loading ? (
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
      </Modal>

      <AllAppointmentsModal
        isOpen={appointmentsModalOpen}
        onClose={handleCloseAppointmentsModal}
        appointments={appointments}
        userRole={role}
      />

      <MedicalRecordModal
        isOpen={isMedicalRecordModalOpen}
        onClose={() => setIsMedicalRecordModalOpen(false)}
        appointments={appointments}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  profileField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
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
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editIcon: {
    padding: 8,
  },
  biographyEditIcon: {
    padding: 8,
    marginTop: 8,
  },
  appointmentsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  appointmentsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
  },
  modalTextArea: {
    minHeight: 120,
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
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Profile;