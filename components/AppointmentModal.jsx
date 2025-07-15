import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeJWTToken } from '@/utils/tokenUtils';

const AppointmentModal = ({ isOpen, onClose, service }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const generateTimeSlots = (date) => {
    if (!date) return [];

    const day = date.getDay();

    // Sunday (0) is not available
    if (day === 0) return [];

    // Saturday (6) has different hours
    if (day === 6) {
      return generateHalfHourSlots('09:00', '12:00');
    }

    // Monday to Friday
    return generateHalfHourSlots('08:00', '16:00');
  };

  const generateHalfHourSlots = (start, end) => {
    const slots = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute <= endMinute)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, '0')}:${currentMinute
          .toString()
          .padStart(2, '0')}`
      );

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  };

  useEffect(() => {
    if (selectedDate && isOpen) {
      checkAvailableTimes();
    }
  }, [selectedDate, isOpen]);

  const checkAvailableTimes = async () => {
    if (!selectedDate || !service) return;

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      setError('Niste prijavljeni');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const timeSlots = generateTimeSlots(selectedDate);
      const availableSlots = [];

      for (const time of timeSlots) {
        const [hours, minutes] = time.split(':');
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        try {
          const response = await fetch(
            `https://klinikabackend-production.up.railway.app/api/Appointment/check-availability`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(appointmentDate.toISOString()),
            }
          );

          if (response.ok) {
            availableSlots.push(time);
          } else if (response.status === 401) {
            setError('Sesija je istekla. Molimo prijavite se ponovo.');
            return;
          }
        } catch (err) {
          console.error(`Error checking availability for time ${time}:`, err);
        }
      }

      setAvailableTimes(availableSlots);
    } catch (err) {
      setError('Greška prilikom provere dostupnih termina');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!service || !selectedDate || !selectedTime) {
      setError('Molimo izaberite datum i vreme');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      setError('Niste prijavljeni');
      return;
    }

    try {
      const decoded = decodeJWTToken(token);
      const patientId =
        decoded[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ];
      const patientFullName = `${decoded.FirstName} ${decoded.LastName}`;

      // Create appointment date
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Final availability check
      const availabilityResponse = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Appointment/check-availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(appointmentDate.toISOString()),
        }
      );

      if (!availabilityResponse.ok) {
        if (availabilityResponse.status === 401) {
          setError('Sesija je istekla. Molimo prijavite se ponovo.');
        } else {
          setError('Izabrani termin više nije dostupan');
        }
        return;
      }

      const appointmentData = {
        serviceId: service.id,
        serviceName: service.name,
        patientId: patientId,
        patientFullName: patientFullName,
        appointmentDate: appointmentDate.toISOString(),
        notes: '',
      };

      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Appointment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(appointmentData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesija je istekla. Molimo prijavite se ponovo.');
        }
        throw new Error('Greška prilikom zakazivanja termina');
      }

      Alert.alert('Uspeh', 'Termin uspešno zakazan!');
      onClose();
      setSelectedTime('');
      setError('');
    } catch (err) {
      setError(err.message || 'Greška prilikom zakazivanja termina');
      console.error(err);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedTime('');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('sr-RS', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isValidDate = (date) => {
    const day = date.getDay();
    const today = new Date();
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return day !== 0 && date > today && date <= maxDate;
  };

  if (!isOpen || !service) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Zakazivanje termina</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{service.price} RSD</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Calendar size={20} color="#007AFF" />
                    <Text style={styles.sectionTitle}>Izaberite datum</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color="#007AFF" style={styles.dateButtonIcon} />
                    <Text style={styles.dateButtonText}>
                      {formatDate(selectedDate)}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'compact' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                        maximumDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                        style={styles.datePicker}
                        textColor="#1E293B"
                        accentColor="#007AFF"
                      />
                    </View>
                  )}
                </View>

                {selectedDate && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Clock size={20} color="#007AFF" />
                      <Text style={styles.sectionTitle}>Izaberite vreme</Text>
                    </View>
                    
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.loadingText}>Učitavanje dostupnih termina...</Text>
                      </View>
                    ) : availableTimes.length === 0 ? (
                      <Text style={styles.noTimesText}>
                        Nema dostupnih termina za izabrani datum
                      </Text>
                    ) : (
                      <View style={styles.timeSlotsContainer}>
                        {availableTimes.map((time) => (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeSlot,
                              selectedTime === time && styles.selectedTimeSlot,
                            ]}
                            onPress={() => setSelectedTime(time)}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                selectedTime === time && styles.selectedTimeSlotText,
                              ]}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    (!selectedDate || !selectedTime || loading) && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedDate || !selectedTime || loading}
                >
                  <Text style={styles.modalButtonText}>Potvrdi termin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.modalButtonText}>Otkaži</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 0,
    minWidth: '95%',
    maxWidth: 400,
    maxHeight: '90%',
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  serviceInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButtonIcon: {
    marginRight: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    flex: 1,
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePicker: {
    backgroundColor: 'white',
    borderRadius: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  noTimesText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalButton: {
    flex: 1,
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
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentModal;