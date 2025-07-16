import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { ArrowUpDown, Search, X, FileText, User, Calendar, ChevronDown } from 'lucide-react-native';

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

const MedicalRecordModal = ({ isOpen, onClose, appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  useEffect(() => {
    let filtered = appointments.filter(app => app.status === 2);

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.doctorFullName?.toLowerCase().includes(searchLower) ||
        app.serviceName?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      return sortBy === 'newest' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, sortBy]);

  const sortOptions = [
    { label: 'Najskoriji prvo', value: 'newest' },
    { label: 'Najstariji prvo', value: 'oldest' }
  ];

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

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.dateTimeContainer}>
            <Calendar size={16} color="#007AFF" />
            <Text style={styles.appointmentDate}>{formattedDate}</Text>
            <Text style={styles.appointmentTime}>{formattedTime}</Text>
          </View>
        </View>
        
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        
        {item.doctorFullName && (
          <View style={styles.doctorContainer}>
            <User size={16} color="#10B981" />
            <Text style={styles.doctorName}>Lekar: {item.doctorFullName}</Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={16} color="#0369A1" />
              <Text style={styles.notesLabel}>Beleška:</Text>
            </View>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
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
            <Text style={styles.modalTitle}>Vaš Karton</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pretraži po lekaru ili usluzi..."
                placeholderTextColor="#9CA3AF"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            
            <View style={styles.filterHeader}>
              <ArrowUpDown size={20} color="#374151" />
              <Text style={styles.filterSectionTitle}>Sortiranje</Text>
            </View>
            
            <CustomSelector
              label="Sortiraj po datumu"
              value={sortBy}
              options={sortOptions}
              onValueChange={setSortBy}
            />
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
              <FileText size={60} color="#9CA3AF" />
              <Text style={styles.noAppointmentsText}>Nemate završenih termina.</Text>
            </View>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalButtonText}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
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
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
  },
  doctorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  noAppointmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
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
});

export default MedicalRecordModal;