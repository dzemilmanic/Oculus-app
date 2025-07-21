import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

const NewsCard = ({ id, title, content, publishedDate, isAdmin, onEdit, onDelete }) => {
  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Datum nije dostupan';
      
      // Debug log da vidimo šta tačno stiže iz backend-a
      //console.log('Raw date from backend:', dateString, typeof dateString);
      
      let date;
      
      // Različiti načini parsiranja datuma ovisno o formatu
      if (typeof dateString === 'string') {
        // Pokušaj 1: Direktno parsiranje kao ISO string
        date = new Date(dateString);
        
        // Pokušaj 2: Ako direktno parsiranje ne radi, pokušaj sa čišćenjem
        if (isNaN(date.getTime())) {
          // Ukloni sve što nije dio validnog datuma
          const cleanedDate = dateString
            .replace(/[^\d\-T:\.Z\+]/g, '') // Ukloni sve osim brojeva, crtice, T, dvotačke, tačke, Z, +
            .replace(/(\d{4}-\d{2}-\d{2})$/, '$1T00:00:00.000Z'); // Dodaj vrijeme ako ga nema
          
          //console.log('Cleaned date:', cleanedDate);
          date = new Date(cleanedDate);
        }
        
        // Pokušaj 3: Ako je .NET JSON format (/Date(timestamp)/)
        if (isNaN(date.getTime()) && dateString.includes('/Date(')) {
          const timestamp = dateString.match(/\/Date\((\d+)\)\//);
          if (timestamp) {
            date = new Date(parseInt(timestamp[1], 10));
          }
        }
        
        // Pokušaj 4: Ako je timestamp kao string
        if (isNaN(date.getTime()) && /^\d+$/.test(dateString)) {
          const timestamp = parseInt(dateString, 10);
          // Ako je broj manji od 10^10, vjerovatno je u sekundama, inače milisekundama
          date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
        }
        
      } else if (typeof dateString === 'number') {
        // Ako je već broj, provjeri da li je u sekundama ili milisekundama
        date = new Date(dateString < 10000000000 ? dateString * 1000 : dateString);
      }
      
      // Provjeri da li je datum valjan nakon svih pokušaja
      if (!date || isNaN(date.getTime())) {
        //console.error('Failed to parse date:', dateString);
        return 'Nepravilan datum';
      }
      
      //console.log('Parsed date:', date);
      
      return date.toLocaleDateString('sr-RS', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      //console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Greška u formatiranju datuma';
    }
  };

  const truncateContent = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <View style={styles.newsCard}>
      <View style={styles.newsCardHeader}>
        <Text style={styles.newsTitle}>{title || 'Bez naslova'}</Text>
        {isAdmin && (
          <View style={styles.newsCardActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onEdit(id)}
            >
              <Pencil size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onDelete(id)}
            >
              <Trash2 size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text style={styles.newsContent}>
        {truncateContent(content)}
      </Text>
      <Text style={styles.newsDate}>
        {formatDate(publishedDate)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.1)',
  },
  newsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  newsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    lineHeight: 24,
    marginRight: 12,
  },
  newsCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: '#F2F2F7',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 16,
  },
  newsDate: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});

export default NewsCard;