import React, { useEffect, useState, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Pencil, Trash2, Search, X, ChevronDown, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRoleFromToken, isTokenValid, decodeJWTToken } from '@/utils/tokenUtils';
import AppointmentModal from '@/components/AppointmentModal';

const { height: screenHeight } = Dimensions.get('window');

const CustomSelector = ({ label, value, options, onValueChange, placeholder = "Odaberite opciju" }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <View style={styles.customSelectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.selectorButtonText,
          !selectedOption && styles.placeholderText
        ]}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown 
          size={16} 
          color="#6B7280"
          style={[styles.chevron, isOpen && styles.chevronUp]}
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.selectorDropdown}>
          <ScrollView 
            style={styles.selectorScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectorOption,
                  value === option.value && styles.selectorOptionSelected
                ]}
                onPress={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectorOptionText,
                  value === option.value && styles.selectorOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Funkcija za čitanje i validaciju tokena
  const checkTokenAndSetRole = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        setRole('');
        return;
      }

      if (!isTokenValid(token)) {
        await AsyncStorage.removeItem('jwtToken');
        setRole('');
        return;
      }

      const roles = getUserRoleFromToken(token);
      setRole(roles);
    } catch (error) {
      console.error('Greška prilikom čitanja tokena:', error);
      await AsyncStorage.removeItem('jwtToken');
      setRole('');
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Service',
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Greška prilikom učitavanja usluga.');
      }

      const data = await response.json();
      setServices(data);

      await checkTokenAndSetRole();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [checkTokenAndSetRole]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || !isTokenValid(token)) {
        
        return;
      }

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
      } else {
        throw new Error('Greška prilikom učitavanja kategorija.');
      }
    } catch (error) {
      console.error('Greška:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Funkcija za preuzimanje podataka o selektovanoj kategoriji
  const fetchCategoryData = async (categoryId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || !isTokenValid(token)) {
        console.error('Nema validnog tokena');
        return;
      }

      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/ServiceCategory/${categoryId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSelectedCategory(data);
      } else {
        throw new Error('Greška prilikom preuzimanja podataka o kategoriji.');
      }
    } catch (err) {
      console.error('Greška:', err.message);
    }
  };

  // Funkcija za proveru postojanja usluge
  const checkIfServiceExists = async (name) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || !isTokenValid(token)) {
        return false;
      }

      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Service/exists?name=${encodeURIComponent(name)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Greška prilikom provere postojanja usluge.');
      }

      const exists = await response.json();
      return exists;
    } catch (err) {
      console.error('Greška:', err.message);
      return false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices();
      fetchCategories();
    }, [fetchServices, fetchCategories])
  );

  // Funkcija za otvaranje modala - učitaj kategorije kad se otvara
  const handleOpenAddServiceModal = () => {
    setShowModal(true);
    if (categories.length === 0) {
      fetchCategories();
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.description || !newService.price || !newService.categoryId) {
      Alert.alert('Greška', 'Molimo popunite sva polja i odaberite kategoriju.');
      return;
    }

    // Validacija kao u React verziji
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

    // Proveri da li usluga već postoji
    const serviceExists = await checkIfServiceExists(newService.name);
    if (serviceExists) {
      Alert.alert('Greška', 'Usluga sa tim imenom već postoji.');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token || !isTokenValid(token)) {
      Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
      return;
    }

    try {
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
            category: selectedCategory,
          }),
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
        console.log('Error data:', errorData); // Debug log
        throw new Error(
          errorData?.errors
            ? Object.values(errorData.errors).flat().join(', ')
            : 'Greška pri dodavanju usluge.'
        );
      }

      const data = await response.json();
      setServices((prevServices) => [...prevServices, data]);
      setShowModal(false);
      setNewService({
        name: '',
        description: '',
        price: '',
        categoryId: '',
      });
      setSelectedCategory(null);
      Alert.alert('Uspeh', 'Usluga uspešno dodata!');
    } catch (err) {
      console.log('Add service error:', err.message); // Debug log
      Alert.alert('Greška', `Error: ${err.message}`);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedServiceId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token || !isTokenValid(token)) {
      Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
      return;
    }

    try {
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Service/${selectedServiceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        setServices((prevServices) =>
          prevServices.filter((service) => service.id !== selectedServiceId)
        );
        setShowDeleteModal(false);
        Alert.alert('Uspeh', 'Usluga uspešno izbrisana!');
      } else if (response.status === 401) {
        Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
        await AsyncStorage.removeItem('jwtToken');
        setRole('');
      } else {
        throw new Error('Greška pri brisanju usluge.');
      }
    } catch (err) {
      Alert.alert('Greška', 'Greška pri brisanju usluge.');
    }
  };

  const cancelDelete = () => {
    setSelectedServiceId(null);
    setShowDeleteModal(false);
  };

  const handleReserveClick = async (service) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      Alert.alert('Greška', 'Morate biti prijavljeni da biste rezervisali termin.');
      return;
    }
    
    if (!service) {
      Alert.alert('Greška', 'Nepoznata usluga');
      return;
    }
    setSelectedService(service);
    setIsAppointmentModalOpen(true);
  };

  const handlePriceChangeClick = (id) => {
    setSelectedServiceId(id);
    setShowPriceModal(true);
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(newPrice)) {
      Alert.alert('Greška', 'Unesite validnu cenu.');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token || !isTokenValid(token)) {
      Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
      return;
    }

    try {
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
        if (response.status === 401) {
          Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
          setRole('');
          return;
        }
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

  const handleAddCategory = async () => {
    if (!name || !description) {
      setErrorMessage('Molimo popunite sva polja.');
      return;
    }
    if (name.length < 3) {
      setErrorMessage('Naziv kategorije mora biti najmanje 3 karaktera.');
      return;
    }

    if (description.length < 3) {
      setErrorMessage('Opis kategorije mora biti najmanje 3 karaktera.');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token || !isTokenValid(token)) {
      Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
      return;
    }

    try {
      const checkResponse = await fetch(
        `https://klinikabackend-production.up.railway.app/api/ServiceCategory/exists?name=${encodeURIComponent(
          name
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!checkResponse.ok) {
        throw new Error('Greška prilikom provere postojanja kategorije.');
      }

      const categoryExists = await checkResponse.json();
      if (categoryExists) {
        Alert.alert('Greška', 'Kategorija sa ovim imenom već postoji.');
        return;
      }

      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/ServiceCategory',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description }),
        }
      );

      if (response.ok) {
        const newCategory = await response.json();
        setCategories((prevCategories) => [...prevCategories, newCategory]);
        setShowModal2(false);
        setName('');
        setDescription('');
        setErrorMessage('');
        Alert.alert('Uspeh', 'Kategorija uspešno dodata!');
      } else {
        Alert.alert('Greška', 'Greška prilikom dodavanja kategorije.');
      }
    } catch (error) {
      console.error('Greška:', error);
    }
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

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceCardHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        {role === 'Admin' && (
          <View style={styles.serviceCardActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handlePriceChangeClick(item.id)}
              activeOpacity={0.7}
            >
              <Pencil size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteClick(item.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text style={styles.serviceDescription}>{item.description}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.servicePrice}>{item.price} RSD</Text>
      </View>
      {role !== 'Admin' && (
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={() => handleReserveClick(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.reserveButtonText}>Rezerviši termin</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Priprema opcija za sortiranje
  const sortOptions = [
    { label: 'Sortiraj po...', value: 'none' },
    { label: 'Cena (rastuće)', value: 'priceAsc' },
    { label: 'Cena (opadajuće)', value: 'priceDesc' },
    { label: 'Naziv (A-Z)', value: 'nameAsc' },
    { label: 'Naziv (Z-A)', value: 'nameDesc' }
  ];

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
          <TouchableOpacity style={styles.retryButton} onPress={fetchServices} activeOpacity={0.8}>
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
          <Text style={styles.title}>Naše usluge</Text>
          
          <View style={styles.filtersSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pretraži usluge..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <CustomSelector
              label="Sortiranje"
              value={sortType}
              options={sortOptions}
              onValueChange={setSortType}
              placeholder="Sortiraj po..."
            />
          </View>

          {role === 'Admin' && (
            <View style={styles.adminButtonsContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleOpenAddServiceModal}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Dodaj novu uslugu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addButton, styles.secondaryButton]}
                onPress={() => setShowModal2(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Dodaj novu kategoriju</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {filteredAndSortedServices.length === 0 ? (
          <View style={styles.noServicesContainer}>
            <Text style={styles.noServices}>Nema pronađenih usluga</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedServices}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={1}
            contentContainerStyle={styles.servicesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        service={selectedService}
      />

      {/* Add Service Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Dodaj novu uslugu</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      setShowModal(false);
                      setNewService({
                        name: '',
                        description: '',
                        price: '',
                        categoryId: '',
                      });
                    }}
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
                    <Text style={styles.inputLabel}>Naziv usluge</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite naziv usluge"
                      placeholderTextColor="#9CA3AF"
                      value={newService.name}
                      onChangeText={(text) => setNewService({ ...newService, name: text })}
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Opis usluge</Text>
                    <TextInput
                      style={[styles.modalInput, styles.textArea]}
                      placeholder="Unesite opis usluge"
                      placeholderTextColor="#9CA3AF"
                      value={newService.description}
                      onChangeText={(text) => setNewService({ ...newService, description: text })}
                      multiline
                      numberOfLines={4}
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Cena (RSD)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite cenu"
                      placeholderTextColor="#9CA3AF"
                      value={newService.price}
                      onChangeText={(text) => setNewService({ ...newService, price: text })}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Kategorija</Text>
                    {categoriesLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.loadingText}>Učitavanje kategorija...</Text>
                      </View>
                    ) : (
                      <View style={styles.categoryPickerContainer}>
                        <Picker
                          selectedValue={newService.categoryId}
                          onValueChange={(value) => {
                            setNewService({ ...newService, categoryId: value });
                            if (value) {
                              fetchCategoryData(value);
                            }
                          }}
                          style={styles.categoryPicker}
                          itemStyle={styles.categoryPickerItem}
                        >
                          <Picker.Item label="Odaberite kategoriju" value="" />
                          {categories.map((category) => (
                            <Picker.Item
                              key={category.id}
                              label={category.name}
                              value={category.id}
                            />
                          ))}
                        </Picker>
                      </View>
                    )}
                  </View>
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={handleAddService}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Dodaj uslugu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setShowModal(false);
                      setNewService({
                        name: '',
                        description: '',
                        price: '',
                        categoryId: '',
                      });
                      setSelectedCategory(null);
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

      {/* Add Category Modal */}
      <Modal
        visible={showModal2}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal2(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Dodaj novu kategoriju</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      setShowModal2(false);
                      setName('');
                      setDescription('');
                      setErrorMessage('');
                    }}
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
                    <Text style={styles.inputLabel}>Naziv kategorije</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Unesite naziv kategorije"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Opis kategorije</Text>
                    <TextInput
                      style={[styles.modalInput, styles.textArea]}
                      placeholder="Unesite opis kategorije"
                      placeholderTextColor="#9CA3AF"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      returnKeyType="done"
                    />
                  </View>

                  {errorMessage && (
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                  )}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={handleAddCategory}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Dodaj kategoriju</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setShowModal2(false);
                      setName('');
                      setDescription('');
                      setErrorMessage('');
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
            <Text style={styles.modalText}>Da li ste sigurni da želite da obrišete ovu uslugu?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
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

      {/* Price Update Modal */}
      <Modal
        visible={showPriceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ažuriraj cenu</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      setShowPriceModal(false);
                      setNewPrice('');
                      setSelectedServiceId(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nova cena (RSD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Unesite novu cenu"
                    placeholderTextColor="#9CA3AF"
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={handleUpdatePrice}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Sačuvaj</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setShowPriceModal(false);
                      setNewPrice('');
                      setSelectedServiceId(null);
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
  // Custom Selector Styles
  customSelectorContainer: {
    position: 'relative',
    zIndex: 1,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  selectorButtonText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  chevron: {
    transition: 'transform 0.2s',
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  selectorDropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 10000,
    maxHeight: 200,
  },
  selectorScrollView: {
    maxHeight: 200,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorOptionSelected: {
    backgroundColor: '#EBF8FF',
  },
  selectorOptionText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  selectorOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  adminButtonsContainer: {
    gap: 12,
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
  secondaryButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  serviceCard: {
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
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    flex: 1,
    marginRight: 12,
  },
  serviceCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  serviceDescription: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 22,
  },
  priceContainer: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0369A1',
  },
  reserveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  reserveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noServicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noServices: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 20,
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    width: '100%',
  },
  pickerItem: {
    fontSize: 17,
    color: '#1E293B',
  },
  // Improved Category Picker Styles
  categoryPickerContainer: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 14,
    backgroundColor: 'white',
    overflow: 'hidden',
    minHeight: 52,
  },
  categoryPicker: {
    height: 52,
    width: '100%',
    backgroundColor: 'white',
  },
  categoryPickerItem: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '500',
    height: 52,
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
  deleteButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});

export default Services;