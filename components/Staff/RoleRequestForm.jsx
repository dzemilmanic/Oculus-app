import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const RoleRequestForm = ({ onSubmit, onClose, isOpen }) => {
  const [biography, setBiography] = useState('');
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Greška', 'Potrebna je dozvola za pristup galeriji.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    if (biography.length < 10) {
      setErrorMessage('Biografija mora imati makar 10 karaktera.');
      return;
    }
    if (!image) {
      setErrorMessage('Molimo dodajte fotografiju.');
      return;
    }

    const formData = new FormData();
    formData.append('biography', biography);
    formData.append('image', {
      uri: image.uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });
    
    onSubmit(formData);
    setBiography('');
    setImage(null);
    setErrorMessage('');
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pošalji zahtev</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Biografija</Text>
              <TextInput
                style={[styles.textArea]}
                placeholder="Napišite vašu biografiju..."
                value={biography}
                onChangeText={setBiography}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />
              {errorMessage && biography.length < 10 && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fotografija</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonText}>
                  {image ? 'Promeniti fotografiju' : 'Dodaj fotografiju'}
                </Text>
              </TouchableOpacity>
              {image && (
                <Text style={styles.imageSelectedText}>
                  Fotografija je odabrana ✓
                </Text>
              )}
              {errorMessage && !image && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Pošalji</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Zatvori</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    height: 120,
    textAlignVertical: 'top',
  },
  imageButton: {
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  imageSelectedText: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoleRequestForm;