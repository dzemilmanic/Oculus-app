import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isTokenValid, getUserRoleFromToken } from '@/utils/tokenUtils';

export default function TabLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check login status and admin role
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const loggedIn = token && token.trim() !== '' && isTokenValid(token);
      
      console.log('Auth check - Token exists:', loggedIn);
      setIsLoggedIn(loggedIn);
      
      // Check if user is admin
      if (loggedIn && token) {
        const userRole = getUserRoleFromToken(token);
        const adminStatus = userRole === 'Admin';
        console.log('User role:', userRole, 'Is admin:', adminStatus);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      
      // If token is invalid, remove it
      if (token && !loggedIn) {
        console.log('Removing invalid token');
        await AsyncStorage.removeItem('jwtToken');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Check when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        checkAuthStatus();
      }
    });

    return () => subscription.remove();
  }, [checkAuthStatus]);

  // Check when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      checkAuthStatus();
    }, [checkAuthStatus])
  );

  // Frequent check for auth changes (every 1000ms)
  useEffect(() => {
    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  if (loading) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Usluge',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vision-test"
        options={{
          title: 'Test',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="help-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Osoblje',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Vesti',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      
      {/* Appointments tab - only show for admins */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Termini',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          // Hide tab if user is not admin
          href: isLoggedIn && isAdmin ? undefined : null,
        }}
      />

      {/* Users tab - only show for admins */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Korisnici',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          // Hide tab if user is not admin
          href: isLoggedIn && isAdmin ? undefined : null,
        }}
      />

      {/* Conditionally render login OR profile tab */}
      {isLoggedIn ? (
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      ) : (
        <Tabs.Screen
          name="login"
          options={{
            title: 'Prijavi se',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="log-in" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Hide the other tab when not needed */}
      <Tabs.Screen
        name={isLoggedIn ? "login" : "profile"}
        options={{
          href: null, // This hides the tab
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null, // ima tab bar ali se ne prikazuje unutar njega
        }}
      />
    </Tabs>
  );
}