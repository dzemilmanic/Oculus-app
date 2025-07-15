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
  TouchableWithoutFeedback,
  Keyboard,
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                <ScrollView 
                  style={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalTitle}>
                    {editNews ? 'Uredi vest' : 'Dodaj novu vest'}
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Naslov</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Unesite naslov vesti..."
                      placeholderTextColor="#9CA3AF"
                      value={title}
                      onChangeText={setTitle}
                      multiline={false}
                      returnKeyType="next"
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
                      placeholder="Unesite sadržaj vesti..."
                      placeholderTextColor="#9CA3AF"
                      value={content}
                      onChangeText={setContent}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical="top"
                      returnKeyType="done"
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    minWidth: '98%',
    maxWidth: 800,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalContent: {
    padding: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1C1C1E',
    backgroundColor: 'white',
    minHeight: 52,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 15,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default AddNewsModal;