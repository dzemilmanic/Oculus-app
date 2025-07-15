import { decode } from 'react-native-base64';

export const decodeJWTToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      console.log('Invalid token provided');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid JWT token format');
      return null;
    }

    const payload = parts[1];
    
    let paddedPayload = payload;
    while (paddedPayload.length % 4) {
      paddedPayload += '=';
    }
    
    const decodedPayload = decode(paddedPayload);
    const parsedPayload = JSON.parse(decodedPayload);
    
    console.log('Successfully decoded JWT token');
    return parsedPayload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

export const getUserRoleFromToken = (token) => {
  const payload = decodeJWTToken(token);
  if (!payload) return '';
  
  return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
};

export const getUserIdFromToken = (token) => {
  const payload = decodeJWTToken(token);
  if (!payload) return '';
  
  return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
};

export const getUserFromToken = () => {
  const token = AsyncStorage.getItem('jwtToken');
  if (!token) return null;

  try {
    const payload = decodeJWTToken(token);
    if (!payload) return null;
    
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
    return { role };
  } catch (error) {
    console.error('Greška prilikom dekodiranja tokena:', error);
    return null;
  }
};

export const isTokenValid = (token) => {
  const payload = decodeJWTToken(token);
  if (!payload) return false;
  
  // Check if token is expired
  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < currentTime) {
    console.log('Token is expired');
    return false;
  }
  
  return true;
};