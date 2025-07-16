import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { CircleUser as UserCircle2, Mail, Trash2, Search, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRoleFromToken, isTokenValid } from '@/utils/tokenUtils';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [role, setRole] = useState('');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roles: ['User'],
  });

  // Check if user is admin
  const checkAdminAccess = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token || !isTokenValid(token)) {
        setRole('');
        return false;
      }

      const userRole = getUserRoleFromToken(token);
      setRole(userRole);
      
      return userRole === 'Admin';
    } catch (error) {
      console.error('Error checking admin access:', error);
      setRole('');
      return false;
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    const hasAccess = await checkAdminAccess();
    
    if (!hasAccess) {
      setError('Nemate dozvolu za pristup ovoj stranici.');
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/GetUsers',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('jwtToken');
          setRole('');
          throw new Error('Sesija je istekla. Molimo prijavite se ponovo.');
        }
        throw new Error('Greška prilikom učitavanja korisnika.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [checkAdminAccess]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Auth/${userToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          setRole('');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.Message || 'Greška prilikom brisanja korisnika.');
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete));
      Alert.alert('Uspeh', 'Korisnik je uspešno obrisan.');
    } catch (err) {
      Alert.alert('Greška', err.message);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleInputChange = (name, value) => {
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      Alert.alert('Greška', 'Molimo popunite sva polja.');
      return;
    }

    if (newUser.password.length < 6) {
      Alert.alert('Greška', 'Lozinka mora imati najmanje 6 karaktera.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/Register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newUser),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          setRole('');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.Message || 'Greška prilikom dodavanja korisnika.');
      }

      const addedUser = await response.json();
      setUsers((prevUsers) => [...prevUsers, addedUser]);
      Alert.alert('Uspeh', 'Korisnik je uspešno dodat!');
      setShowAddModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roles: ['User'],
      });
    } catch (err) {
      Alert.alert('Greška', err.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchTerm = searchQuery.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm) || email.includes(searchTerm);

    if (selectedRole !== 'all') {
      return matchesSearch && user.roles && user.roles.includes(selectedRole);
    }

    return matchesSearch;
  });

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userCardContent}>
        <View style={styles.avatarContainer}>
          {item.profileImagePath ? (
            <Text style={styles.avatarText}>
              {item.firstName?.charAt(0)}{item.lastName?.charAt(0)}
            </Text>
          ) : (
            <UserCircle2 size={32} color="#007AFF" />
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={styles.userDetail}>
            <Mail size={16} color="#666" />
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.rolesContainer}>
            {item.roles && item.roles.length > 0 ? (
              item.roles.map((role, index) => (
                <View key={index} style={[styles.roleBadge, styles[`role${role}`]]}>
                  <Text style={[styles.roleBadgeText, styles[`roleText${role}`]]}>
                    {role}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noRoles}>Nema dodeljenih uloga</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show access denied if not admin
  if (role !== '' && role !== 'Admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedTitle}>Pristup odbijen</Text>
          <Text style={styles.accessDeniedText}>
            Nemate dozvolu za pristup ovoj stranici.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Učitavanje korisnika...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Greška: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUsers} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Registrovani korisnici</Text>
          
          <View style={styles.filtersSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pretraži korisnike..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <View style={styles.roleFilterContainer}>
              <Text style={styles.filterLabel}>Filtriranje po ulozi:</Text>
              <View style={styles.roleButtons}>
                {[
                  { key: 'all', label: 'Svi' },
                  { key: 'User', label: 'Korisnici' },
                  { key: 'Doctor', label: 'Lekari' },
                  { key: 'Admin', label: 'Admini' }
                ].map((roleOption) => (
                  <TouchableOpacity
                    key={roleOption.key}
                    style={[
                      styles.roleButton,
                      selectedRole === roleOption.key && styles.roleButtonActive
                    ]}
                    onPress={() => setSelectedRole(roleOption.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      selectedRole === roleOption.key && styles.roleButtonTextActive
                    ]}>
                      {roleOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Dodaj novog korisnika</Text>
          </TouchableOpacity>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.noUsersContainer}>
            <Text style={styles.noUsers}>Nema pronađenih korisnika</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.usersList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Dodaj novog korisnika</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowAddModal(false)}
                    activeOpacity={0.7}
                  >
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Ime</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite ime"
                      placeholderTextColor="#9CA3AF"
                      value={newUser.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Prezime</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite prezime"
                      placeholderTextColor="#9CA3AF"
                      value={newUser.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite email"
                      placeholderTextColor="#9CA3AF"
                      value={newUser.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Lozinka</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite lozinku"
                      placeholderTextColor="#9CA3AF"
                      value={newUser.password}
                      onChangeText={(text) => handleInputChange('password', text)}
                      secureTextEntry
                      returnKeyType="done"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Uloga</Text>
                    <View style={styles.roleSelectionContainer}>
                      {['User', 'Doctor', 'Admin'].map((roleOption) => (
                        <TouchableOpacity
                          key={roleOption}
                          style={[
                            styles.roleSelectionButton,
                            newUser.roles[0] === roleOption && styles.roleSelectionButtonActive
                          ]}
                          onPress={() => handleInputChange('roles', [roleOption])}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.roleSelectionText,
                            newUser.roles[0] === roleOption && styles.roleSelectionTextActive
                          ]}>
                            {roleOption === 'User' ? 'Korisnik' : 
                             roleOption === 'Doctor' ? 'Lekar' : 'Administrator'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={handleAddUser}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Dodaj korisnika</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setShowAddModal(false);
                      setNewUser({
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        roles: ['User'],
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Otkaži</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Potvrda brisanja</Text>
            <Text style={styles.modalText}>
              Da li ste sigurni da želite da obrišete ovog korisnika?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButtonModal]} 
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Obriši</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Otkaži</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  filtersSection: {
    marginBottom: 20,
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  roleFilterContainer: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  userInfo: {
    flex: 1,
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleUser: {
    backgroundColor: '#E3F2FD',
  },
  roleDoctor: {
    backgroundColor: '#E8F5E9',
  },
  roleAdmin: {
    backgroundColor: '#FCE4EC',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleTextUser: {
    color: '#1976D2',
  },
  roleTextDoctor: {
    color: '#2E7D32',
  },
  roleTextAdmin: {
    color: '#C2185B',
  },
  noRoles: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  noUsersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noUsers: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 0,
    minWidth: '98%',
    maxWidth: 800,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FAFBFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalScrollView: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    minHeight: 200,
  },
  modalText: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1E293B',
    backgroundColor: 'white',
    minHeight: 52,
  },
  roleSelectionContainer: {
    gap: 8,
  },
  roleSelectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleSelectionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleSelectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  roleSelectionTextActive: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 28,
    paddingBottom: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFBFC',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  deleteButtonModal: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default Users;