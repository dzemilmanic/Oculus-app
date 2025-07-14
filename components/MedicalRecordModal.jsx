import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';

const MedicalRecordModal = ({ isOpen, onClose, appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  useEffect(() => {
    let filtered = appointments.filter((app) => app.status === 2);

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
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

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vaš Karton</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Zatvori</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži po lekaru ili usluzi..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sortiraj po:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                Alert.alert('Sortiranje', 'Izaberite opciju', [
                  {
                    text: 'Najskoriji prvo',
                    onPress: () => setSortBy('newest'),
                  },
                  {
                    text: 'Najstariji prvo',
                    onPress: () => setSortBy('oldest'),
                  },
                  { text: 'Otkaži', style: 'cancel' },
                ]);
              }}
            >
              <Text style={styles.sortButtonText}>
                {sortBy === 'newest' ? 'Najskoriji prvo' : 'Najstariji prvo'}
              </Text>
              <ArrowUpDown size={16} color="#007AFF" />
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
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>{formattedDate}</Text>
                    <Text style={styles.appointmentTime}>{formattedTime}</Text>
                  </View>

                  <Text style={styles.appointmentDetail}>
                    <Text style={styles.appointmentLabel}>Usluga: </Text>
                    {appointment.serviceName}
                  </Text>

                  {appointment.notes && (
                    <Text style={styles.appointmentDetail}>
                      <Text style={styles.appointmentLabel}>Beleška: </Text>
                      {appointment.notes}
                    </Text>
                  )}

                  <Text style={styles.appointmentDetail}>
                    <Text style={styles.appointmentLabel}>Lekar: </Text>
                    {appointment.doctorFullName}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.noAppointmentsContainer}>
              <Text style={styles.noAppointmentsText}>
                Nemate završenih termina.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  searchInput: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  sortButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentsList: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  appointmentDetail: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 6,
    lineHeight: 20,
  },
  appointmentLabel: {
    fontWeight: '600',
    color: '#007AFF',
  },
  noAppointmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MedicalRecordModal;