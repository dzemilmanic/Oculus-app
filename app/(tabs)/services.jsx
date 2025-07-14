import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search,
  ArrowUpDown,
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  Clock,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('none');
  
  // Modal states
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Form states
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  
  // Appointment states
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchCategories();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const roles =
          decodedPayload[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
          ] || 'User';
        setRole(roles);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Service',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Greška prilikom fetchovanja usluga.');
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/ServiceCategory',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Greška:', error);
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.description || !newService.price || !newService.categoryId) {
      Alert.alert('Greška', 'Molimo popunite sva polja.');
      return;
    }

    if (newService.name.length < 5) {
      Alert.alert('Greška', 'Naziv usluge mora imati najmanje 5 karaktera.');
      return;
    }

    if (newService.description.length < 5) {
      Alert.alert('Greška', 'Opis usluge mora imati najmanje 5 karaktera.');
      return;
    }

    if (parseFloat(newService.price) < 500) {
      Alert.alert('Greška', 'Cena usluge mora biti najmanje 500.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Service',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newService.name,
            price: parseFloat(newService.price),
            description: newService.description,
            categoryId: newService.categoryId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Greška pri dodavanju usluge.');
      }

      const data = await response.json();
      setServices((prevServices) => [...prevServices, data]);
      setShowAddServiceModal(false);
      setNewService({
        name: '',
        description: '',
        price: '',
        categoryId: '',
      });
      Alert.alert('Uspeh', 'Usluga uspešno dodata!');
    } catch (err) {
      Alert.alert('Greška', err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      Alert.alert('Greška', 'Molimo popunite sva polja.');
      return;
    }

    if (newCategory.name.length < 3) {
      Alert.alert('Greška', 'Naziv kategorije mora biti najmanje 3 karaktera.');
      return;
    }

    if (newCategory.description.length < 3) {
      Alert.alert('Greška', 'Opis kategorije mora biti najmanje 3 karaktera.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/ServiceCategory',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newCategory),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories((prevCategories) => [...prevCategories, data]);
        setShowAddCategoryModal(false);
        setNewCategory({ name: '', description: '' });
        Alert.alert('Uspeh', 'Kategorija uspešno dodata!');
      } else {
        Alert.alert('Greška', 'Greška prilikom dodavanja kategorije.');
      }
    } catch (error) {
      Alert.alert('Greška', 'Greška prilikom dodavanja kategorije.');
    }
  };

  const handleDeleteService = async () => {
    try {
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Service/${selectedServiceId}`,
        {
          method: 'DELETE',
        }
      );
      if (response.ok) {
        setServices((prevServices) =>
          prevServices.filter((service) => service.id !== selectedServiceId)
        );
        setShowDeleteModal(false);
        Alert.alert('Uspeh', 'Usluga uspešno izbrisana!');
      } else {
        throw new Error('Greška pri brisanju usluge.');
      }
    } catch (err) {
      Alert.alert('Greška', 'Greška pri brisanju usluge.');
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(newPrice)) {
      Alert.alert('Greška', 'Unesite validnu cenu.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Service/${selectedServiceId}/price`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: selectedServiceId,
            price: parseFloat(newPrice),
          }),
        }
      );

      if (!response.ok) {
        Alert.alert('Greška', 'Greška pri ažuriranju cene usluge.');
        return;
      }

      setServices((prevServices) =>
        prevServices.map((service) =>
          service.id === selectedServiceId
            ? { ...service, price: parseFloat(newPrice) }
            : service
        )
      );

      Alert.alert('Uspeh', 'Cena uspešno ažurirana!');
      setShowPriceModal(false);
      setNewPrice('');
      setSelectedServiceId(null);
    } catch (err) {
      Alert.alert('Greška', 'Greška prilikom ažuriranja cene.');
    }
  };

  const handleReserveClick = (service) => {
    if (role === '') {
      Alert.alert('Greška', 'Morate biti prijavljeni da biste rezervisali termin.');
      return;
    }
    if (!service) {
      Alert.alert('Greška', 'Nepoznata usluga');
      return;
    }
    setSelectedService(service);
    setShowAppointmentModal(true);
  };

  const filteredAndSortedServices = services
    .filter((service) => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      switch (sortType) {
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const renderAddServiceModal = () => (
    <Modal
      visible={showAddServiceModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddServiceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dodaj novu uslugu</Text>
            <TouchableOpacity
              onPress={() => setShowAddServiceModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Naziv:</Text>
              <TextInput
                style={styles.textInput}
                value={newService.name}
                onChangeText={(text) =>
                  setNewService({ ...newService, name: text })
                }
                placeholder="Unesite naziv usluge..."
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Opis:</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={4}
                value={newService.description}
                onChangeText={(text) =>
                  setNewService({ ...newService, description: text })
                }
                placeholder="Unesite opis usluge..."
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cena:</Text>
              <TextInput
                style={styles.textInput}
                value={newService.price}
                onChangeText={(text) =>
                  setNewService({ ...newService, price: text })
                }
                placeholder="Unesite cenu..."
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kategorija:</Text>
              <View style={styles.pickerContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      newService.categoryId === category.id && styles.selectedCategory,
                    ]}
                    onPress={() =>
                      setNewService({ ...newService, categoryId: category.id })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        newService.categoryId === category.id && styles.selectedCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddService}
            >
              <Text style={styles.submitButtonText}>Dodaj uslugu</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAddCategoryModal = () => (
    <Modal
      visible={showAddCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dodaj novu kategoriju</Text>
            <TouchableOpacity
              onPress={() => setShowAddCategoryModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Naziv:</Text>
              <TextInput
                style={styles.textInput}
                value={newCategory.name}
                onChangeText={(text) =>
                  setNewCategory({ ...newCategory, name: text })
                }
                placeholder="Unesite naziv kategorije..."
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Opis:</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={4}
                value={newCategory.description}
                onChangeText={(text) =>
                  setNewCategory({ ...newCategory, description: text })
                }
                placeholder="Unesite opis kategorije..."
                placeholderTextColor="#999"
              />
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.submitButtonText}>Dodaj kategoriju</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Učitavanje usluga...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Greška: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Naše usluge</Text>
          
          {/* Search and Sort */}
          <View style={styles.filtersSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pretraži usluge..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  const sortOptions = [
                    { label: 'Bez sortiranja', value: 'none' },
                    { label: 'Cena (rastuće)', value: 'priceAsc' },
                    { label: 'Cena (opadajuće)', value: 'priceDesc' },
                    { label: 'Naziv (A-Z)', value: 'nameAsc' },
                    { label: 'Naziv (Z-A)', value: 'nameDesc' },
                  ];
                  
                  Alert.alert(
                    'Sortiraj po',
                    '',
                    sortOptions.map(option => ({
                      text: option.label,
                      onPress: () => setSortType(option.value),
                    }))
                  );
                }}
              >
                <ArrowUpDown size={20} color="#007AFF" />
                <Text style={styles.sortButtonText}>Sortiraj</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Admin Buttons */}
          {role === 'Admin' && (
            <View style={styles.adminButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddServiceModal(true)}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.addButtonText}>Dodaj uslugu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddCategoryModal(true)}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.addButtonText}>Dodaj kategoriju</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Services Grid */}
        {filteredAndSortedServices.length === 0 ? (
          <View style={styles.noServicesContainer}>
            <Text style={styles.noServicesText}>Nema pronađenih usluga.</Text>
          </View>
        ) : (
          <View style={styles.servicesGrid}>
            {filteredAndSortedServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceCardHeader}>
                  <Text style={styles.serviceTitle}>{service.name}</Text>
                  {role === 'Admin' && (
                    <View style={styles.serviceActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setSelectedServiceId(service.id);
                          setShowPriceModal(true);
                        }}
                      >
                        <Pencil size={18} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setSelectedServiceId(service.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={18} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <Text style={styles.servicePrice}>Cena: {service.price} RSD</Text>
                
                {role !== 'Admin' && (
                  <TouchableOpacity
                    style={styles.reserveButton}
                    onPress={() => handleReserveClick(service)}
                  >
                    <Calendar size={18} color="#ffffff" />
                    <Text style={styles.reserveButtonText}>Rezerviši termin</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderAddServiceModal()}
      {renderAddCategoryModal()}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>
              Da li ste sigurni da želite da obrišete ovu uslugu?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonYes]}
                onPress={handleDeleteService}
              >
                <Text style={styles.confirmButtonText}>Da</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonNo]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.confirmButtonText}>Ne</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Price Update Modal */}
      <Modal
        visible={showPriceModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Ažuriraj cenu</Text>
            <TextInput
              style={styles.priceInput}
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder="Unesite novu cenu"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonYes]}
                onPress={handleUpdatePrice}
              >
                <Text style={styles.confirmButtonText}>Sačuvaj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonNo]}
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={styles.confirmButtonText}>Otkaži</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  filtersSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  sortContainer: {
    minWidth: 100,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  adminButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noServicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  noServicesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  servicesGrid: {
    padding: 24,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    gap: 8,
  },
  categoryOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    backgroundColor: '#ffffff',
  },
  selectedCategory: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonYes: {
    backgroundColor: '#dc2626',
  },
  confirmButtonNo: {
    backgroundColor: '#6b7280',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  priceInput: {
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
});