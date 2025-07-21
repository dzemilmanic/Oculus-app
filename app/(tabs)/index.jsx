import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, MapPin, Phone, Heart, Users, Calendar, CircleCheck as CheckCircle2, Info, X } from 'lucide-react-native';
import ImageSlider from '@/components/Home/ImageSlider';
import ReviewSection from '@/components/Home/ReviewSection';
import { getUserRoleFromToken, isTokenValid } from '@/utils/tokenUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SLIDER_HEIGHT = screenHeight * 0.92; 

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedServiceInfo, setSelectedServiceInfo] = useState(null);

  const slides = [
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika1.jpeg',
      title: 'klinika1',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika2.jpeg',
      title: 'klinika2',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika5.jpg',
      title: 'klinika5',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika6.jpg',
      title: 'klinika6',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika7.jpg',
      title: 'klinika7',
    },
  ];

  const workingHours = [
    { day: 'Ponedeljak - Petak', hours: '08:00 - 16:30' },
    { day: 'Subota', hours: '09:00 - 12:00' },
    { day: 'Nedelja', hours: 'Zatvoreno' },
  ];

  const checkUserRole = React.useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (token && isTokenValid(token)) {
        const role = getUserRoleFromToken(token);
        setUserRole(role);
        setIsLoggedIn(true);
      } else {
        setUserRole('');
        setIsLoggedIn(false);
      }
    } catch (error) {
      setUserRole('');
      setIsLoggedIn(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!showSplash) {
        checkUserRole();
      }
    }, [checkUserRole, showSplash])
  );

  useEffect(() => {
    if (!showSplash) {
      const interval = setInterval(checkUserRole, 1000);
      return () => clearInterval(interval);
    }
  }, [checkUserRole, showSplash]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Service',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Greška prilikom fetchovanja usluga.');
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    const url = 'https://maps.google.com/?q=Pešterska+17,+Tutin';
    Linking.openURL(url);
  };

  const callPhone = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      checkUserRole();
      fetchServices();
    }
  }, [showSplash]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={{
            uri: 'https://dzemil.blob.core.windows.net/slike/oculus.png',
          }}
          style={styles.splashImage}
          resizeMode="contain"
        />
        <Text style={styles.splashText}>Oculus</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Image Slider Section - Sada je deo scroll view-a */}
        <View style={styles.sliderContainer}>
          <ImageSlider slides={slides} />
          <View style={styles.welcomeOverlay}>
            <Text style={styles.welcomeText}>Dobrodošli u Oculus</Text>
            <Text style={styles.welcomeSubtitle}>
              Vaš vid je naša misija
            </Text>
            <TouchableOpacity
              style={styles.reserveButton}
              onPress={() => router.push('/services')}
            >
              <Text style={styles.reserveButtonText}>
                Rezerviši svoj termin na vreme!
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mission Section */}
        <View style={[styles.section, styles.missionSection]}>
          <Text style={styles.sectionTitle}>Naša Misija</Text>
          <Text style={styles.sectionText}>
            U Oculus očnoj klinici, naša misija je da pružimo vrhunsku
            oftalmološku negu koristeći najsavremeniju tehnologiju i stručnost
            našeg medicinskog tima. Posvećeni smo očuvanju i poboljšanju vida
            naših pacijenata kroz personalizovani pristup i kontinuiranu
            edukaciju.
          </Text>
          <View style={styles.missionPoints}>
            <View style={styles.missionPoint}>
              <Heart size={32} color="#3a6d9fff" />
              <Text style={styles.missionPointTitle}>Briga o pacijentima</Text>
              <Text style={styles.missionPointText}>
                Individualni pristup svakom pacijentu
              </Text>
            </View>
            <View style={styles.missionPoint}>
              <Users size={32} color="#3a6d9fff" />
              <Text style={styles.missionPointTitle}>Stručni tim</Text>
              <Text style={styles.missionPointText}>
                Iskusni oftalmolozi i medicinsko osoblje
              </Text>
            </View>
            <View style={styles.missionPoint}>
              <CheckCircle2 size={32} color="#3a6d9fff" />
              <Text style={styles.missionPointTitle}>Kvalitet</Text>
              <Text style={styles.missionPointText}>
                Najviši standardi medicinske nege
              </Text>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={[styles.section, styles.servicesSection]}>
          <Text style={styles.sectionTitle}>Naše Usluge</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#003366" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.servicesGrid}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <CheckCircle2 size={24} color="#34C759" />
                  <Text style={styles.serviceText}>{service.name}</Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => {
                      setSelectedServiceInfo(service);
                      setShowInfoModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Info size={16} color="#003366" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Working Hours Section */}
        <View style={[styles.section, styles.workingHoursSection]}>
          <Text style={styles.sectionTitle}>Radno Vreme</Text>
          <View style={styles.workingHoursContainer}>
            {workingHours.map((schedule, index) => (
              <View key={index} style={styles.hoursItem}>
                <Clock size={24} color="#667eea" />
                <View style={styles.hoursTextContainer}>
                  <Text style={styles.hoursDay}>{schedule.day}</Text>
                  <Text style={styles.hoursTime}>{schedule.hours}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={[styles.section, styles.contactSection]}>
          <Text style={styles.sectionTitle}>Kontakt Informacije</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactItem} onPress={openMap}>
              <MapPin size={32} color="#667eea" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Adresa</Text>
                <Text style={styles.contactText}>Pešterska 17, Tutin</Text>
                <Text style={styles.tapToOpenText}>Dodirni za mapu</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.contactItem}>
              <Phone size={32} color="#667eea" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Telefon</Text>
                <TouchableOpacity onPress={() => callPhone('020123456')}>
                  <Text style={styles.phoneNumber}>020/123-456</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => callPhone('0601234567')}>
                  <Text style={styles.phoneNumber}>060/123-4567</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <Calendar size={32} color="#667eea" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Zakazivanje</Text>
                <TouchableOpacity
                  style={styles.appointmentButton}
                  onPress={() => router.push('/services')}
                >
                  <Text style={styles.appointmentButtonText}>Zakaži pregled</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <ReviewSection
          role={userRole}
          isLoggedIn={isLoggedIn}
        />
      </ScrollView>

      {/* Service Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowInfoModal(false)}>
          <View style={styles.infoModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.infoModalContent}>
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {selectedServiceInfo?.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.infoModalCloseButton}
                    onPress={() => setShowInfoModal(false)}
                    activeOpacity={0.7}
                  >
                    <X size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  style={styles.infoModalScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.infoModalDescription}>
                    {selectedServiceInfo?.description}
                  </Text>
                  <View style={styles.infoModalPriceContainer}>
                    <Text style={styles.infoModalPriceLabel}>Cena:</Text>
                    <Text style={styles.infoModalPrice}>
                      {selectedServiceInfo?.price} RSD
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
  },
  splashText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    backgroundColor: '#1a1a1a',
    position: 'relative', // Umesto 'absolute'
  },
  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    paddingHorizontal: 32,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
  },
  reserveButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  missionSection: {
    backgroundColor: '#ffffff', // Dodao belu pozadinu
    borderTopLeftRadius: 0, // Uklonio zaokružene uglove
    borderTopRightRadius: 0,
    paddingTop: 48,
  },
  servicesSection: {
    backgroundColor: '#f8f9fa',
  },
  workingHoursSection: {
    backgroundColor: '#ffffff',
  },
  contactSection: {
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  missionPoints: {
    gap: 24,
  },
  missionPoint: {
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderTopWidth: 3,
    borderTopColor: '#003366',
  },
  missionPointTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a202c',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  missionPointText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginVertical: 32,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 32,
    fontWeight: '500',
  },
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a202c',
    flex: 1,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderTopWidth: 4,
    borderTopColor: '#667eea',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    flex: 1,
    marginRight: 12,
  },
  infoModalCloseButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  infoModalScrollView: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: 300,
  },
  infoModalDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
    marginBottom: 24,
  },
  infoModalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  infoModalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginRight: 8,
  },
  infoModalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
  },
  workingHoursContainer: {
    gap: 16,
  },
  hoursItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
    borderRadius: 16,
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  hoursTextContainer: {
    flex: 1,
  },
  hoursDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  hoursTime: {
    fontSize: 14,
    color: '#64748b',
  },
  contactGrid: {
    gap: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    gap: 20,
    borderTopWidth: 3,
    borderTopColor: '#667eea',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 22,
  },
  tapToOpenText: {
    fontSize: 13,
    color: '#667eea',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  phoneNumber: {
    fontSize: 16,
    color: '#667eea',
    marginBottom: 4,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  appointmentButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 8,
    alignSelf: 'flex-start',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appointmentButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});