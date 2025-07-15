import React, { useEffect, useState } from 'react';
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

const AddNewsModal = ({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  errorMessage,
  editNews,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (editNews) {
      setTitle(editNews.title);
      setContent(editNews.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [editNews]);

  const handleSubmit = () => {
    if (editNews) {
      onEdit(title, content);
      Alert.alert('Uspeh', 'Vest uspešno ažurirana!');
    } else {
      onAdd(title, content);
      Alert.alert('Uspeh', 'Vest uspešno dodata!');
    }
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
            <Text style={styles.modalTitle}>
              {editNews ? 'Uredi vest' : 'Dodaj novu vest'}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Naslov</Text>
              <TextInput
                style={styles.input}
                placeholder="Naslov"
                value={title}
                onChangeText={setTitle}
                multiline={false}
              />
              {errorMessage && title.length < 2 && (
                <Text style={styles.errorText}>
                  Naslov mora imati najmanje 2 slova.
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sadržaj</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Sadržaj"
                value={content}
                onChangeText={setContent}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />
              {errorMessage && content.length < 10 && (
                <Text style={styles.errorText}>
                  Sadržaj mora imati najmanje 10 slova.
                </Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editNews ? 'Spremi' : 'Dodaj'}
                </Text>
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
  input: {
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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

export default AddNewsModal;