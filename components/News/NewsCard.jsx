import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

const NewsCard = ({ id, title, content, publishedDate, isAdmin, onEdit, onDelete }) => {
  return (
    <View style={styles.newsCard}>
      <View style={styles.newsCardHeader}>
        <Text style={styles.newsTitle}>{title}</Text>
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
      <Text style={styles.newsContent}>{content}</Text>
      <Text style={styles.newsDate}>
        {new Date(publishedDate).toLocaleDateString()}
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