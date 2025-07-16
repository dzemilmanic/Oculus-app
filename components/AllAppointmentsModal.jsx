import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { ArrowUpDown, Clock, X, FileText, ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenValid } from '@/utils/tokenUtils';

const CustomSelector = ({ label, value, options, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <View style={styles.customSelectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.selectorButtonText}>
          {selectedOption?.label || 'Odaberite'}
        </Text>
        <ChevronDown 
          size={16} 
          color="#6B7280"
          style={[styles.chevron, isOpen && styles.chevronUp]}
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.selectorDropdown}>
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
            >
              <Text style={[
                styles.selectorOptionText,
                value === option.value && styles.selectorOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const AllAppointmentsModal = ({ isOpen, onClose, appointments, userRole }) => {
  const [isAddNotesModalOpen, setIsAddNotesModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: 'nearest',
    status: 'all',
    timeFilter: 'all'
  });

  useEffect(() => {
    const filterAppointments = () => {
      let initialAppointments = [...appointments];

      if (userRole === 'User') {
        initialAppointments = initialAppointments.filter(
          (app) => app.status !== 2
        );
      }

      let filtered = [...initialAppointments];
      
      // Apply time filter (past or all)
      if (filters.timeFilter === 'past') {
        filtered = filtered.filter(app => isAppointmentPassed(app.appointmentDate));
      } else if (filters.timeFilter === 'upcoming') {
        filtered = filtered.filter(app => !isAppointmentPassed(app.appointmentDate));
      }

      // Apply sorting
      const now = new Date();
      if (filters.sortBy === 'nearest') {
        filtered.sort((a, b) => {
          const dateA = new Date(a.appointmentDate);
          const dateB = new Date(b.appointmentDate);
          
          // If both are in the future, sort by nearest
          if (dateA > now && dateB > now) {
            return dateA - dateB;
          }
          // If both are in the past, sort by most recent
          else if (dateA < now && dateB < now) {
            return dateB - dateA;
          }
          // Future dates come before past dates
          else {
            return dateA > now ? -1 : 1;
          }
        });
      } else if (filters.sortBy === 'furthest') {
        filtered.sort((a, b) => {
          const dateA = new Date(a.appointmentDate);
          const dateB = new Date(b.appointmentDate);
          
          // If both are in the future, sort by furthest
          if (dateA > now && dateB > now) {
            return dateB - dateA;
          }
          // If both are in the past, sort by oldest
          else if (dateA < now && dateB < now) {
            return dateA - dateB;
          }
          // Future dates come before past dates
          else {
            return dateA > now ? -1 : 1;
          }
        });
      }

      // Apply status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(
          (app) => app.status === parseInt(filters.status)
        );
      }

      setFilteredAppointments(filtered);
    };

    filterAppointments();
  }, [appointments, filters, userRole]);

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'Čeka se dodela lekara';
      case 1:
        return 'Odobren';
      case 2:
        return 'Završen';
      case 3:
        return 'Otkazan';
      default:
        return 'Nepoznato';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return '#F59E0B';
      case 1:
        return '#10B981';
      case 2:
        return '#6B7280';
      case 3:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleOpenAddNotesModal = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setIsAddNotesModalOpen(true);
  };

  const handleCloseAddNotesModal = () => {
    setIsAddNotesModalOpen(false);
    setSelectedAppointmentId(null);
    setNote('');
  };

  const handleSaveNotes = async () => {
    if (!note.trim()) {
      Alert.alert('Greška', 'Napomena ne može biti prazna');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token || !isTokenValid(token)) {
      Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Appointment/update-notes/${selectedAppointmentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(note),
        }
      );

      if (response.ok) {
        Alert.alert('Uspeh', 'Beleška uspešno dodata!');
        handleCloseAddNotesModal();
      } else {
        if (response.status === 401) {
          Alert.alert('Greška', 'Sesija je istekla. Molimo prijavite se ponovo.');
          await AsyncStorage.removeItem('jwtToken');
        } else {
          Alert.alert('Greška', 'Greška prilikom dodavanja beleške!');
        }
      }
    } catch (error) {
      Alert.alert('Greška', 'Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isAppointmentPassed = (appointmentDate) => {
    const now = new Date();
    const appDate = new Date(appointmentDate);
    return appDate < now;
  };

  const sortOptions = [
    { label: 'Najskoriji prvo', value: 'nearest' },
    { label: 'Najdalji prvo', value: 'furthest' }
  ];

  const timeFilterOptions = [
    { label: 'Svi termini', value: 'all' },
    { label: 'Prošli termini', value: 'past' },
    { label: 'Budući termini', value: 'upcoming' }
  ];

  const getStatusOptions = () => {
    const baseOptions = [{ label: 'Svi statusi', value: 'all' }];
    
    if (userRole === 'User') {
      return [
        ...baseOptions,
        { label: 'Čeka se odobrenje', value: '0' },
        { label: 'Odobren', value: '1' },
        { label: 'Otkazan', value: '3' }
      ];
    } else {
      return [
        ...baseOptions,
        { label: 'Čeka se odobrenje', value: '0' },
        { label: 'Odobren', value: '1' },
        { label: 'Završen', value: '2' },
        { label: 'Otkazan', value: '3' }
      ];
    }
  };

  const renderAppointmentItem = ({ item }) => {
    const date = new Date(item.appointmentDate);
    const formattedDate = date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const appointmentPassed = isAppointmentPassed(item.appointmentDate);

    return (
      <View style={[
        styles.appointmentCard,
        appointmentPassed ? styles.pastAppointment : styles.upcomingAppointment
      ]}>
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentDate}>{formattedDate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <View style={styles.timeContainer}>
          <Clock size={16} color="#64748B" />
          <Text style={styles.appointmentTime}>{formattedTime}</Text>
        </View>
        
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        
        {item.doctorFullName && (
          <Text style={styles.doctorName}>Lekar: {item.doctorFullName}</Text>
        )}

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Beleška:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {userRole &&
          userRole.includes('Doctor') &&
          item.status !== 2 &&
          appointmentPassed && (
            <TouchableOpacity
              style={styles.addNotesButton}
              onPress={() => handleOpenAddNotesModal(item.id)}
            >
              <FileText size={16} color="#FFFFFF" />
              <Text style={styles.addNotesButtonText}>Dodaj belešku</Text>
            </TouchableOpacity>
          )}
      </View>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vaši termini</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <ArrowUpDown size={20} color="#374151" />
              <Text style={styles.filterSectionTitle}>Filteri i sortiranje</Text>
            </View>
            
            <View style={styles.filtersGrid}>
              <CustomSelector
                label="Sortiranje"
                value={filters.sortBy}
                options={sortOptions}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              />
              
              <CustomSelector
                label="Status"
                value={filters.status}
                options={getStatusOptions()}
                onValueChange={(value) => handleFilterChange('status', value)}
              />
              
              {userRole && userRole.includes('Doctor') && (
                <CustomSelector
                  label="Vreme"
                  value={filters.timeFilter}
                  options={timeFilterOptions}
                  onValueChange={(value) => handleFilterChange('timeFilter', value)}
                />
              )}
            </View>
          </View>

          {filteredAppointments.length > 0 ? (
            <FlatList
              data={filteredAppointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.appointmentsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noAppointmentsContainer}>
              <Text style={styles.noAppointmentsText}>Nemate zakazane termine sa ovim filterima.</Text>
            </View>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalButtonText}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Notes Modal */}
      <Modal
        visible={isAddNotesModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAddNotesModal}
      >
        <View style={styles.notesModalOverlay}>
          <View style={styles.notesModalContent}>
            <Text style={styles.notesModalTitle}>Dodaj belešku</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Unesite napomene..."
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.notesModalButtons}>
              <TouchableOpacity
                style={styles.notesModalButton}
                onPress={handleCloseAddNotesModal}
              >
                <Text style={styles.notesModalButtonText}>Zatvori</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.notesModalButton, styles.saveNotesButton]}
                onPress={handleSaveNotes}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveNotesButtonText}>Spremi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    minHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterSection: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  filtersGrid: {
    gap: 12,
  },
  customSelectorContainer: {
    position: 'relative',
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
  chevron: {
    transition: 'transform 0.2s',
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  selectorDropdown: {
    position: 'absolute',
    top: 44,
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
    elevation: 10,
    zIndex: 9999,
  },
  selectorOption: {
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
  },
  selectorOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pastAppointment: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
    backgroundColor: '#F9FAFB',
  },
  upcomingAppointment: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#64748B',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  notesContainer: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  addNotesButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  addNotesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  noAppointmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Notes Modal Styles
  notesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notesModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  notesModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  notesModalButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  notesModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  saveNotesButton: {
    backgroundColor: '#007AFF',
  },
  saveNotesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AllAppointmentsModal;