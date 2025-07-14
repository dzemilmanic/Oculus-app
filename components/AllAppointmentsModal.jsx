import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ArrowUpDown, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AllAppointmentsModal = ({ isOpen, onClose, appointments, userRole }) => {
  const [isAddNotesModalOpen, setIsAddNotesModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: 'nearest',
    status: 'all',
    timeFilter: 'all',
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
        filtered = filtered.filter((app) =>
          isAppointmentPassed(app.appointmentDate)
        );
      } else if (filters.timeFilter === 'upcoming') {
        filtered = filtered.filter(
          (app) => !isAppointmentPassed(app.appointmentDate)
        );
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
        return 'Završen';
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

  const renderNotesModal = () => (
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
            style={styles.notesTextArea}
            placeholder="Unesite napomene..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <View style={styles.notesModalButtons}>
            <TouchableOpacity
              style={[styles.notesModalButton, styles.cancelNotesButton]}
              onPress={handleCloseAddNotesModal}
            >
              <Text style={styles.cancelNotesButtonText}>Zatvori</Text>
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
  );

  return (
    <>
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Vaši termini</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Zatvori</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sortiraj:</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    Alert.alert('Sortiranje', 'Izaberite opciju', [
                      {
                        text: 'Najskoriji prvo',
                        onPress: () =>
                          setFilters((prev) => ({ ...prev, sortBy: 'nearest' })),
                      },
                      {
                        text: 'Najdalji prvo',
                        onPress: () =>
                          setFilters((prev) => ({ ...prev, sortBy: 'furthest' })),
                      },
                      { text: 'Otkaži', style: 'cancel' },
                    ]);
                  }}
                >
                  <Text style={styles.pickerText}>
                    {filters.sortBy === 'nearest'
                      ? 'Najskoriji prvo'
                      : 'Najdalji prvo'}
                  </Text>
                  <ArrowUpDown size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {userRole && userRole.includes('Doctor') && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Vreme:</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      Alert.alert('Vreme', 'Izaberite opciju', [
                        {
                          text: 'Svi termini',
                          onPress: () =>
                            setFilters((prev) => ({
                              ...prev,
                              timeFilter: 'all',
                            })),
                        },
                        {
                          text: 'Prošli termini',
                          onPress: () =>
                            setFilters((prev) => ({
                              ...prev,
                              timeFilter: 'past',
                            })),
                        },
                        {
                          text: 'Budući termini',
                          onPress: () =>
                            setFilters((prev) => ({
                              ...prev,
                              timeFilter: 'upcoming',
                            })),
                        },
                        { text: 'Otkaži', style: 'cancel' },
                      ]);
                    }}
                  >
                    <Text style={styles.pickerText}>
                      {filters.timeFilter === 'all'
                        ? 'Svi termini'
                        : filters.timeFilter === 'past'
                        ? 'Prošli termini'
                        : 'Budući termini'}
                    </Text>
                    <Clock size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status:</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    const options = [
                      { text: 'Svi statusi', value: 'all' },
                      ...(userRole === 'User'
                        ? [{ text: 'Čeka se odobrenje', value: '0' }]
                        : []),
                      { text: 'Odobren', value: '1' },
                      ...(userRole === 'User'
                        ? [{ text: 'Otkazan', value: '3' }]
                        : [{ text: 'Završen', value: '2' }]),
                    ];

                    Alert.alert(
                      'Status',
                      'Izaberite opciju',
                      [
                        ...options.map((option) => ({
                          text: option.text,
                          onPress: () =>
                            setFilters((prev) => ({
                              ...prev,
                              status: option.value,
                            })),
                        })),
                        { text: 'Otkaži', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {filters.status === 'all'
                      ? 'Svi statusi'
                      : getStatusText(parseInt(filters.status))}
                  </Text>
                  <ArrowUpDown size={16} color="#666" />
                </TouchableOpacity>
              </View>
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

                const appointmentPassed = isAppointmentPassed(
                  appointment.appointmentDate
                );

                return (
                  <View
                    key={appointment.id}
                    style={[
                      styles.appointmentCard,
                      appointmentPassed
                        ? styles.pastAppointment
                        : styles.upcomingAppointment,
                    ]}
                  >
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentDate}>
                        {formattedDate}
                      </Text>
                      <View style={styles.timeContainer}>
                        <Text style={styles.appointmentTime}>
                          {formattedTime}
                        </Text>
                        <View
                          style={[
                            styles.timeBadge,
                            appointmentPassed
                              ? styles.pastTimeBadge
                              : styles.futureTimeBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeBadgeText,
                              appointmentPassed
                                ? styles.pastTimeBadgeText
                                : styles.futureTimeBadgeText,
                            ]}
                          >
                            {appointmentPassed ? 'Prošao' : 'Predstoji'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.appointmentService}>
                      <Text style={styles.appointmentLabel}>Usluga: </Text>
                      {appointment.serviceName}
                    </Text>

                    <Text style={styles.appointmentStatus}>
                      <Text style={styles.appointmentLabel}>Status: </Text>
                      {getStatusText(appointment.status)}
                    </Text>

                    {userRole &&
                      userRole.includes('Doctor') &&
                      appointment.status !== 2 &&
                      appointmentPassed && (
                        <TouchableOpacity
                          style={styles.addNotesButton}
                          onPress={() =>
                            handleOpenAddNotesModal(appointment.id)
                          }
                        >
                          <Text style={styles.addNotesButtonText}>
                            Dodaj belešku
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                );
              })
            ) : (
              <View style={styles.noAppointmentsContainer}>
                <Text style={styles.noAppointmentsText}>
                  Nemate zakazane termine.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {renderNotesModal()}
    </>
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 80,
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  pickerText: {
    fontSize: 14,
    color: '#1C1C1E',
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
  },
  pastAppointment: {
    borderLeftWidth: 4,
    borderLeftColor: '#8C8C8C',
    backgroundColor: '#F8F8F8',
  },
  upcomingAppointment: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pastTimeBadge: {
    backgroundColor: '#F1F1F1',
  },
  futureTimeBadge: {
    backgroundColor: '#E6F7E6',
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pastTimeBadgeText: {
    color: '#666',
  },
  futureTimeBadgeText: {
    color: '#2E7D32',
  },
  appointmentLabel: {
    fontWeight: '600',
    color: '#007AFF',
  },
  appointmentService: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  appointmentStatus: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  addNotesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addNotesButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  notesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  notesModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  notesTextArea: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  notesModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelNotesButton: {
    backgroundColor: '#E5E5E7',
  },
  cancelNotesButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  saveNotesButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveNotesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AllAppointmentsModal;