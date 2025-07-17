import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  
  const handleSubmit = async () => {
    if (!email) {
      setError('Molimo unesite vašu email adresu.');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/ForgotPassword',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );
      
      if (response.ok) {
        setSuccessMessage('Link za resetovanje lozinke je poslat na vašu email adresu.');
        setEmail('');
        
        // Show success alert
        Alert.alert(
          'Uspešno!',
          'Link za resetovanje lozinke je poslat na vašu email adresu.',
          [{ text: 'OK' }]
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Došlo je do greške. Proverite da li je email ispravan.');
      }
    } catch (err) {
      setError('Došlo je do greške. Proverite da li je email ispravan.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Resetovanje lozinke</Text>
          <Text style={styles.description}>
            Unesite email adresu povezanu sa vašim nalogom, i poslaćemo vam link za resetovanje lozinke.
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email adresa</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Unesite vašu email adresu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Pošalji link za resetovanje</Text>
            )}
          </TouchableOpacity>
          
          {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Nazad na prijavu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#959da5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#003366',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#4b5563',
    lineHeight: 20,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    color: '#4b5563',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#003366',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  successMessage: {
    color: '#10b981',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#003366',
    fontSize: 14,
    fontWeight: '500',
  },
});