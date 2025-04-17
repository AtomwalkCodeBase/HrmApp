import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getEmployeeRequest } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import { useRouter } from 'expo-router';

const ResolveHelp = () => {
  const router = useRouter();
  const [requestData, setRequestData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequestData();
  }, []);

  const getRequestData = async () => {
    try {
      const res = await getEmployeeRequest();
      setRequestData(res.data);
    } catch (error) {
      console.error('Error fetching request data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    router.push({
      pathname: 'MoreScreen',
    });
  };

  const HybridCard = ({ item }) => {
    const handleResolve = () => {
      router.push({
        pathname: 'Helpform',
        params: {
          data: JSON.stringify(item),
        },
      });
    };

    const getStatusColor = (status = '') => {
      if (status.includes('Assigned')) return '#F59E0B';
      if (status.includes('Resolved')) return '#10B981';
      return '#3B82F6';
    };

    const statusColor = getStatusColor(item.status_display);

    const isHelpRequest = item.request_type === 'H';
    const buttonColor = isHelpRequest ? '#ff6b81' : '#5c95ff';
    const buttonText = isHelpRequest ? 'Resolve Help' : 'Resolve Request';

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.leftBorder, { backgroundColor: '#7e57c2' }]} />
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.subType}>{item.request_sub_type}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status_display}</Text>
            </View>
          </View>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Request ID</Text>
                <Text style={styles.infoValue}>{item.request_id}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{item.created_date}</Text>
              </View>
            </View>
            <View style={styles.requestTextContainer}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.requestText} numberOfLines={2}>{item.request_text}</Text>
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.resolveButton, { backgroundColor: buttonColor }]}
              onPress={handleResolve}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <HeaderComponent
        headerTitle="Request Desk"
        onBackPress={handleBackPress}
        showActionButton={false}
      />
      <View style={styles.container}>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <FlatList
            data={requestData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <HybridCard item={item} />}
            contentContainerStyle={styles.listContainer}
			showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#7e57c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  leftBorder: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  requestTextContainer: {
    marginTop: 8,
  },
  requestText: {
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0e7ff',
    marginBottom: 12,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
    color: '#FFFFFF',
  },
});

export default ResolveHelp;