import AsyncStorage from '@react-native-async-storage/async-storage';

// Manual base64 decode function
const base64Decode = (str) => {
  try {
    // Add padding if needed
    let paddedStr = str;
    while (paddedStr.length % 4) {
      paddedStr += '=';
    }
    
    // Base64 character set
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    
    // Remove padding and process in chunks of 4
    const cleanStr = paddedStr.replace(/=/g, '');
    
    for (let i = 0; i < cleanStr.length; i += 4) {
      const chunk = cleanStr.substr(i, 4);
      let bits = 0;
      let validBits = 0;
      
      for (let j = 0; j < chunk.length; j++) {
        const charIndex = chars.indexOf(chunk[j]);
        if (charIndex !== -1) {
          bits = (bits << 6) | charIndex;
          validBits += 6;
        }
      }
      
      // Extract bytes
      while (validBits >= 8) {
        validBits -= 8;
        result += String.fromCharCode((bits >> validBits) & 0xFF);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Base64 decode error:', error);
    return null;
  }
};

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
    const decodedPayload = base64Decode(payload);
    
    if (!decodedPayload) {
      console.log('Failed to decode payload');
      return null;
    }
    
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

export const getUserFromToken = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return null;

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