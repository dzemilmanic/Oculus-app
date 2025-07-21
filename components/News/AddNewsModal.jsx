import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
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
      setTitle(editNews.title || '');
      setContent(editNews.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [editNews, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }
    
    if (!content.trim()) {
      return;
    }

    if (title.length < 2) {
      return;
    }

    if (content.length < 10) {
      return;
    }

    // KRITIČNA ISPRAVKA: NE pozivaj Alert ovdje!
    // Alert će biti pozvan u parent komponenti NAKON uspješne operacije
    if (editNews) {
      onEdit(title.trim(), content.trim());
    } else {
      onAdd(title.trim(), content.trim());
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
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
                    {title.length > 0 && title.length < 2 && (
                      <Text style={styles.errorText}>
                        Naslov mora imati najmanje 2 karaktera.
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
                    {content.length > 0 && content.length < 10 && (
                      <Text style={styles.errorText}>
                        Sadržaj mora imati najmanje 10 karaktera.
                      </Text>
                    )}
                  </View>

                  {errorMessage ? (
                    <View style={styles.generalErrorContainer}>
                      <Text style={styles.generalErrorText}>
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (title.length < 2 || content.length < 10) && styles.submitButtonDisabled
                      ]}
                      onPress={handleSubmit}
                      disabled={title.length < 2 || content.length < 10}
                    >
                      <Text style={styles.submitButtonText}>
                        {editNews ? 'Ažuriraj' : 'Dodaj'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleClose}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    minWidth: '98%',
    maxWidth: 800,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxHeight: '60%',
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
    fontSize: 14,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  generalErrorContainer: {
    marginBottom: 24,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    textAlign: 'center',
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
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
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