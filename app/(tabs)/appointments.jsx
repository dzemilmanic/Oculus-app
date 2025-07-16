import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { UserPlus, ChevronDown } from 'lucide-react-native';
import ApproveAppointmentModal from '@/components/ApproveAppointmentModal';

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

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  const showToast = (message, type = 'success') => {
    Alert.alert(
      type === 'success' ? 'Uspeh' : 'Greška',
      message,
      [{ text: 'OK' }]
    );
  };

  const checkAndUpdateExpiredAppointments = async (appointments) => {
    const now = new Date();
    const expiredAppointments = appointments.filter(
      (appointment) =>
        appointment.status === 0 && new Date(appointment.appointmentDate) < now
    );

    for (const appointment of expiredAppointments) {
      try {
        const response = await fetch(
          `https://klinikabackend-production.up.railway.app/api/Appointment/${appointment.id}/cancel`,
          { method: 'PUT' }
        );

        if (!response.ok) {
          console.error(`Failed to cancel appointment ${appointment.id}`);
          continue;
        }

        const updatedAppointment = await response.json();
        setAppointments((prevAppointments) =>
          prevAppointments.map((app) =>
            app.id === appointment.id ? updatedAppointment : app
          )
        );
      } catch (err) {
        console.error(`Error canceling appointment ${appointment.id}:`, err);
      }
    }

    if (expiredAppointments.length > 0) {
      setFilteredAppointments((prevFiltered) => {
        const updatedFiltered = prevFiltered.map((app) => {
          if (expiredAppointments.some((expired) => expired.id === app.id)) {
            return { ...app, status: 3 };
          }
          return app;
        });
        return updatedFiltered;
      });
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Appointment'
      );
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data);
      setFilteredAppointments(data);
      await checkAndUpdateExpiredAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Roles/doctors'
      );
      if (!response.ok) throw new Error('Greška prilikom fetchovanja lekara.');
      const data = await response.json();
      setDoctors(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDoctorAppointments = async () => {
    if (selectedDoctor) {
      try {
        const response = await fetch(
          `https://klinikabackend-production.up.railway.app/api/Appointment/doctor/${selectedDoctor.id}/appointments`
        );
        if (!response.ok) throw new Error("Failed to fetch doctor's appointments");
        const data = await response.json();
        setDoctorAppointments(data);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();

    const intervalId = setInterval(() => {
      checkAndUpdateExpiredAppointments(appointments);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchDoctorAppointments();
  }, [selectedDoctor]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, []);

  const checkTimeConflict = (appointmentDate) => {
    const appointmentTime = new Date(appointmentDate);
    const appointmentEnd = new Date(appointmentTime.getTime() + 30 * 60000);

    return doctorAppointments.some((existingAppointment) => {
      const existingTime = new Date(existingAppointment.appointmentDate);
      const existingEnd = new Date(existingTime.getTime() + 30 * 60000);

      return (
        (appointmentTime >= existingTime && appointmentTime < existingEnd) ||
        (appointmentEnd > existingTime && appointmentEnd <= existingEnd) ||
        (appointmentTime <= existingTime && appointmentEnd >= existingEnd)
      );
    });
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctor || !selectedAppointment) {
      showToast('Molimo izaberite lekara.', 'error');
      return;
    }

    if (checkTimeConflict(selectedAppointment.appointmentDate)) {
      showToast(
        'Lekar već ima zakazan termin u ovo vreme. Molimo izaberite drugog lekara.',
        'error'
      );
      return;
    }

    try {
      const response = await fetch(
        `https://klinikabackend-production.up.railway.app/api/Appointment/${selectedAppointment.id}/assign-doctor?doctorId=${selectedDoctor.id}`,
        { method: 'PUT' }
      );

      if (!response.ok) throw new Error('Greška prilikom dodele lekara.');

      const updatedAppointment = await response.json();
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === selectedAppointment.id ? updatedAppointment : appointment
        )
      );
      
      // Update filtered appointments as well
      setFilteredAppointments((prevFiltered) =>
        prevFiltered.map((appointment) =>
          appointment.id === selectedAppointment.id ? updatedAppointment : appointment
        )
      );
      
      setModalOpen(false);
      setSelectedDoctor(null);
      setSelectedAppointment(null);
      showToast('Lekar uspešno dodeljen!');
    } catch (err) {
      setError(err.message);
      showToast('Greška prilikom dodele lekara.', 'error');
    }
  };

  const handleStatusChange = (selectedStatus) => {
    setStatusFilter(selectedStatus);

    if (selectedStatus === '') {
      setFilteredAppointments(appointments);
    } else {
      const filtered = appointments.filter(
        (appointment) => appointment.status === selectedStatus
      );
      setFilteredAppointments(filtered);
    }
  };

  const openDoctorModal = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDoctor(null);
    setDoctorAppointments([]);
    setModalOpen(true);
  };

  const getStatusStyle = (status) => {
    const statusStyles = {
      0: { backgroundColor: '#FEF3C7', color: '#92400E' },
      1: { backgroundColor: '#D1FAE5', color: '#065F46' },
      2: { backgroundColor: '#E0E7FF', color: '#3730A3' },
      3: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    };
    return statusStyles[status] || { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  const statusMap = {
    0: 'Za dodelu lekara',
    1: 'Odobren',
    2: 'Završen',
    3: 'Otkazan',
  };

  // Priprema opcija za status filter
  const statusOptions = [
    { label: 'Svi termini', value: '' },
    { label: 'Za dodelu lekara', value: 0 },
    { label: 'Odobren', value: 1 },
    { label: 'Završen', value: 2 },
    { label: 'Otkazan', value: 3 }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Učitavanje termina...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Greška: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAppointments}>
          <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Termini</Text>
        
        <View style={styles.filtersSection}>
          <CustomSelector
            label="Filtriraj po statusu"
            value={statusFilter}
            options={statusOptions}
            onValueChange={handleStatusChange}
            placeholder="Svi termini"
          />
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredAppointments.map((appointment) => (
          <View key={appointment.id} style={styles.card}>
            <Text style={styles.cardTitle}>{appointment.serviceName}</Text>
            <Text style={styles.cardText}>
              <Text style={styles.boldText}>Datum: </Text>
              {new Date(appointment.appointmentDate).toLocaleString('sr-RS')}
            </Text>
            
            <View style={[styles.statusBadge, getStatusStyle(appointment.status)]}>
              <Text style={[styles.statusText, { color: getStatusStyle(appointment.status).color }]}>
                {statusMap[appointment.status] || 'Nepoznato'}
              </Text>
            </View>

            {appointment.status === 0 && new Date(appointment.appointmentDate) > new Date() && (
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => openDoctorModal(appointment)}
              >
                <UserPlus size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.assignButtonText}>Dodeli lekaru</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {filteredAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nema termina za prikaz</Text>
          </View>
        )}
      </ScrollView>

      <ApproveAppointmentModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Izaberi lekara"
        doctors={doctors}
        selectedDoctor={selectedDoctor}
        onSelectDoctor={setSelectedDoctor}
        onAssign={handleAssignDoctor}
        selectedAppointment={selectedAppointment}
        checkTimeConflict={checkTimeConflict}
      />
    </View>
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
    paddingTop: 60,
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
    marginBottom: 4,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default Appointments;