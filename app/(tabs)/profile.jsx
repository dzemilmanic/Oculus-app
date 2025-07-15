import React, { useState, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Lock, Eye, EyeOff, CreditCard as Edit3, User, LogOut } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRoleFromToken, getUserIdFromToken, decodeJWTToken, isTokenValid } from '@/utils/tokenUtils';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token || !isTokenValid(token)) {
        // Resetuj state ako nema token ili je nevaljan
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
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

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
        if (response.status === 401) {
          await AsyncStorage.removeItem('jwtToken');
          setIsLoggedIn(false);
        }
      }

      // Uvek refresh-uj role i doctorId
      const roles = getUserRoleFromToken(token);
      setRole(roles);
      if (roles.includes('Doctor')) {
        const doctorId = getUserIdFromToken(token);
        setDoctorId(doctorId);
      } else {
        setDoctorId('');
      }
    } catch (error) {
      console.error('Greška prilikom poziva API-ja:', error);
      // Resetuj state ako je greška
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
      setIsLoggedIn(false);
    }
  }, []);

  // Koristi useFocusEffect umesto useEffect da se podaci učitaju svaki put kad se fokusira na tab
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const fetchAppointments = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token && isTokenValid(token)) {
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
          if (response.status === 401) {
            await AsyncStorage.removeItem('jwtToken');
            setIsLoggedIn(false);
          }
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
      if (!token || !isTokenValid(token)) {
        Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
        await AsyncStorage.removeItem('jwtToken');
        setIsLoggedIn(false);
        return;
      }

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
        setErrorMessage('');
      } else {
        if (response.status === 401) {
          Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          setIsLoggedIn(false);
          return;
        }
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
              // Resetuj state nakon odjave
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
              setIsLoggedIn(false);
              console.log('User logged out');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  // Ako korisnik nije ulogovan, prikaži login poruku
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <User size={80} color="#64748B" style={styles.notLoggedInIcon} />
          <Text style={styles.notLoggedInTitle}>Niste prijavljeni</Text>
          <Text style={styles.notLoggedInSubtitle}>
            Molimo prijavite se da biste pristupili vašem profilu
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileContainer}>
          <Text style={styles.title}>Moj profil</Text>

          {user.profileImagePath ? (
            <Image source={{ uri: user.profileImagePath }} style={styles.profileImage} />
          ) : (
            <View style={styles.defaultProfileImage}>
              <User size={60} color="#007AFF" />
            </View>
          )}

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
                placeholder="Nema biografije"
                placeholderTextColor="#9CA3AF"
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
              style={[styles.appointmentsButton, styles.medicalRecordButton]}
              onPress={async () => {
                await fetchAppointments();
                setIsMedicalRecordModalOpen(true);
              }}
            >
              <Text style={styles.appointmentsButtonText}>Vaš karton</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FFFFFF" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Odjavi se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {modalField === 'password' ? 'Promena lozinke' : 'Ažuriraj podatke'}
                </Text>

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  {modalField === 'ime' && (
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>Ime:</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newIme}
                        onChangeText={setNewIme}
                        placeholder="Unesite ime"
                        placeholderTextColor="#9CA3AF"
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
                        placeholderTextColor="#9CA3AF"
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
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
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
                            placeholderTextColor="#9CA3AF"
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
                            placeholderTextColor="#9CA3AF"
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
                </ScrollView>

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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notLoggedInIcon: {
    marginBottom: 24,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  notLoggedInSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
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
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  profileField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  biographyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  biographyText: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
  },
  biographyEditIcon: {
    padding: 8,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
  },
  appointmentsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  medicalRecordButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  appointmentsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'row',
    gap: 8,
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    minWidth: '98%',
    maxWidth: 800,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalScrollView: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: 400,
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
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
    top: 14,
    padding: 4,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
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
    backgroundColor: '#6B7280',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;