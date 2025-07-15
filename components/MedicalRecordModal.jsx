import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';

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

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Vaš Karton</Text>

          <View style={styles.filterSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pretraži po lekaru ili usluzi..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'newest' && styles.activeSortButton
                ]}
                onPress={() => setSortBy('newest')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'newest' && styles.activeSortButtonText
                ]}>
                  Najskoriji
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'oldest' && styles.activeSortButton
                ]}
                onPress={() => setSortBy('oldest')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'oldest' && styles.activeSortButtonText
                ]}>
                  Najstariji
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.appointmentsList}>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => {
                const date = new Date(appointment.appointmentDate);
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
                  <View key={appointment.id} style={styles.appointmentItem}>
                    <Text style={styles.appointmentText}>
                      <Text style={styles.boldText}>Datum:</Text> {formattedDate}
                    </Text>
                    <Text style={styles.appointmentText}>
                      <Text style={styles.boldText}>Vreme:</Text> {formattedTime}
                    </Text>
                    <Text style={styles.appointmentText}>
                      <Text style={styles.boldText}>Usluga:</Text> {appointment.serviceName}
                    </Text>
                    {appointment.notes && (
                      <Text style={styles.appointmentText}>
                        <Text style={styles.boldText}>Beleška:</Text> {appointment.notes}
                      </Text>
                    )}
                    <Text style={styles.appointmentText}>
                      <Text style={styles.boldText}>Lekar:</Text> {appointment.doctorFullName}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noAppointmentsText}>Nemate završenih termina.</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Zatvori</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
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
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  filterSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  activeSortButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  appointmentsList: {
    flex: 1,
    marginBottom: 16,
  },
  appointmentItem: {
    backgroundColor: '#F5F5F7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  appointmentText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  noAppointmentsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    padding: 32,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MedicalRecordModal;