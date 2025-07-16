import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetLinkSent, setIsResetLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    const loginData = { email, password };

    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/Login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Došlo je do greške prilikom prijave.');
      }

      const data = await response.json();
      setSuccessMessage('Uspešno ste se prijavili!');
      await AsyncStorage.setItem('jwtToken', data.jwtToken);
      
      // Wait a bit to ensure token is saved and clear form
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Clear form
      setEmail('');
      setPassword('');
      
      Alert.alert('Uspeh', 'Uspešno ste se prijavili!', [
        {
          text: 'OK',
          onPress: () => {
            // Tab layout will automatically detect the change
            console.log('Login successful, token saved');
          }
        }
      ]);
    } catch (err) {
      setError(err.message || 'Došlo je do greške prilikom prijave.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Molimo unesite vašu email adresu.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Došlo je do greške. Proverite da li je email ispravan.');
      }

      setSuccessMessage('Link za resetovanje lozinke je poslat na vašu email adresu.');
      setIsResetLinkSent(true);
      Alert.alert('Uspeh', 'Link za resetovanje lozinke je poslat na vašu email adresu.');
    } catch (err) {
      setError(err.message || 'Došlo je do greške. Proverite da li je email ispravan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    router.push('/register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.loginContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <LogIn size={32} color="#3e48d6ff" />
            </View>
          </View>
          <Text style={styles.loginTitle}>Prijavi se</Text>
          <Text style={styles.loginSubtitle}>Unesite vaše podatke za pristup aplikaciji</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Unesite vaš email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email && (
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={isLoading || isResetLinkSent}
                  style={styles.forgotPasswordButton}
                >
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      isResetLinkSent && styles.linkDisabled,
                    ]}
                  >
                    {isResetLinkSent ? 'Link poslat' : 'Zaboravljena lozinka?'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Lozinka</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Unesite vašu lozinku"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Prijavi se</Text>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.errorMessage}>{error}</Text>}
          {successMessage && <Text style={styles.successMessage}>{successMessage}</Text>}

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Nemate registrovan nalog?{' '}
              <TouchableOpacity onPress={handleRegisterPress}>
                <Text style={styles.registerLink}>Registrujte se</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  loginContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
    borderTopWidth: 4,
    borderTopColor: '#667eea',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 56,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordButton: {
    padding: 4,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  linkDisabled: {
    color: '#10b981',
  },
  loginButton: {
    backgroundColor: '#003366',
    paddingVertical: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#003366',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    fontWeight: '500',
  },
  successMessage: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    fontWeight: '500',
  },
  registerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  registerLink: {
    color: '#667eea',
    fontWeight: '700',
  },
});

export default Login;