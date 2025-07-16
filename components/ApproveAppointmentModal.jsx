import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';

const ApproveAppointmentModal = ({
  visible,
  onClose,
  title,
  doctors,
  selectedDoctor,
  onSelectDoctor,
  onAssign,
  selectedAppointment,
  checkTimeConflict,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.doctorList} showsVerticalScrollIndicator={false}>
                {doctors.map((doctor) => {
                  const hasConflict = selectedAppointment && 
                    checkTimeConflict(selectedAppointment.appointmentDate);
                  const isSelected = selectedDoctor?.id === doctor.id;
                  
                  return (
                    <TouchableOpacity
                      key={doctor.id}
                      style={[
                        styles.doctorItem,
                        isSelected && styles.selectedDoctorItem,
                      ]}
                      onPress={() => onSelectDoctor(doctor)}
                    >
                      <Text style={[
                        styles.doctorName,
                        isSelected && styles.selectedDoctorName,
                      ]}>
                        {doctor.firstName} {doctor.lastName}
                      </Text>
                      {isSelected && hasConflict && (
                        <Text style={styles.conflictWarning}>
                          ⚠️ Ima zakazan termin u ovo vreme
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Otkaži</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    !selectedDoctor && styles.disabledButton,
                  ]}
                  onPress={onAssign}
                  disabled={!selectedDoctor}
                >
                  <Text style={[
                    styles.assignButtonText,
                    !selectedDoctor && styles.disabledButtonText,
                  ]}>
                    Dodeli lekara
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  doctorList: {
    maxHeight: 300,
    padding: 16,
  },
  doctorItem: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  selectedDoctorItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDoctorName: {
    color: 'white',
  },
  conflictWarning: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  assignButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default ApproveAppointmentModal;