import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowUpDown, Clock } from 'lucide-react-native';

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
      
      // Apply time filter
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
          
          if (dateA > now && dateB > now) {
            return dateA - dateB;
          } else if (dateA < now && dateB < now) {
            return dateB - dateA;
          } else {
            return dateA > now ? -1 : 1;
          }
        });
      } else if (filters.sortBy === 'furthest') {
        filtered.sort((a, b) => {
          const dateA = new Date(a.appointmentDate);
          const dateB = new Date(b.appointmentDate);
          
          if (dateA > now && dateB > now) {
            return dateB - dateA;
          } else if (dateA < now && dateB < now) {
            return dateA - dateB;
          } else {
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
        return 'Zavrsen';
      case 3:
        return 'Otkazan';
      default:
        return 'Nepoznato';
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
    setLoading(true);
    try {
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Appointment/update-notes/${selectedAppointmentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(note),
        }
      );

      if (response.ok) {
        Alert.alert('Uspeh', 'Beleška uspešno dodata!');
        handleCloseAddNotesModal();
      } else {
        Alert.alert('Greška', 'Greška prilikom dodavanja beleške!');
      }
    } catch (error) {
      Alert.alert('Greška', 'Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isAppointmentPassed = (appointmentDate) => {
    const now = new Date();
    const appDate = new Date(appointmentDate);
    return appDate < now;
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vaši termini</Text>

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sortiraj:</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      filters.sortBy === 'nearest' && styles.activeFilter
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy: 'nearest' }))}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filters.sortBy === 'nearest' && styles.activeFilterText
                    ]}>
                      Najskoriji
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      filters.sortBy === 'furthest' && styles.activeFilter
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy: 'furthest' }))}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filters.sortBy === 'furthest' && styles.activeFilterText
                    ]}>
                      Najdalji
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {userRole && userRole.includes('Doctor') && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Vreme:</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        filters.timeFilter === 'all' && styles.activeFilter
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, timeFilter: 'all' }))}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        filters.timeFilter === 'all' && styles.activeFilterText
                      ]}>
                        Svi
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        filters.timeFilter === 'past' && styles.activeFilter
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, timeFilter: 'past' }))}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        filters.timeFilter === 'past' && styles.activeFilterText
                      ]}>
                        Prošli
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        filters.timeFilter === 'upcoming' && styles.activeFilter
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, timeFilter: 'upcoming' }))}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        filters.timeFilter === 'upcoming' && styles.activeFilterText
                      ]}>
                        Budući
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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

                  const appointmentPassed = isAppointmentPassed(appointment.appointmentDate);

                  return (
                    <View
                      key={appointment.id}
                      style={[
                        styles.appointmentItem,
                        appointmentPassed ? styles.pastAppointment : styles.upcomingAppointment
                      ]}
                    >
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentText}>
                          <Text style={styles.boldText}>Datum:</Text> {formattedDate}
                        </Text>
                        <Text style={styles.appointmentText}>
                          <Text style={styles.boldText}>Vreme:</Text> {formattedTime}
                          <Text style={[
                            styles.timeIndicator,
                            appointmentPassed ? styles.timePast : styles.timeFuture
                          ]}>
                            {appointmentPassed ? ' (Prošao)' : ' (Predstoji)'}
                          </Text>
                        </Text>
                        <Text style={styles.appointmentText}>
                          <Text style={styles.boldText}>Usluga:</Text> {appointment.serviceName}
                        </Text>
                        <Text style={styles.appointmentText}>
                          <Text style={styles.boldText}>Status:</Text> {getStatusText(appointment.status)}
                        </Text>
                      </View>
                      
                      {userRole &&
                        userRole.includes('Doctor') &&
                        appointment.status !== 2 &&
                        appointmentPassed && (
                          <TouchableOpacity
                            style={styles.addNotesButton}
                            onPress={() => handleOpenAddNotesModal(appointment.id)}
                          >
                            <Text style={styles.addNotesButtonText}>Dodaj belešku</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noAppointmentsText}>Nemate zakazane termine.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={isAddNotesModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAddNotesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notesModalContent}>
            <Text style={styles.modalTitle}>Dodaj belešku</Text>
            <TextInput
              style={styles.notesTextArea}
              placeholder="Unesite napomene..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={6}
            />
            <View style={styles.notesModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseAddNotesModal}
              >
                <Text style={styles.cancelButtonText}>Zatvori</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveNotes}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Spremi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  activeFilterText: {
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
  },
  pastAppointment: {
    borderLeftColor: '#8C8C8C',
    backgroundColor: '#F5F5F5',
  },
  upcomingAppointment: {
    borderLeftColor: '#4CAF50',
  },
  appointmentInfo: {
    marginBottom: 8,
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
  timeIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
  timePast: {
    color: '#666',
  },
  timeFuture: {
    color: '#2E7D32',
  },
  addNotesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  addNotesButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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
  notesTextArea: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: 12,
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

export default AllAppointmentsModal;