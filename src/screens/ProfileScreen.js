import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { getProfileInfo } from '../services/authServices';
import { useNavigation, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRModal from '../components/QRModal';
import HeaderComponent from '../components/HeaderComponent';
import Loader from '../components/old_components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';

const { width, height } = Dimensions.get('window');

const ProfileScreen = () => {
  const { logout } = useContext(AppContext);
  const [profile, setProfile] = useState({});
  const [userGroup, setUserGroup] = useState({});
  const [userPin, setUserPin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [useFingerprint, setUseFingerprint] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await getProfileInfo();
        setProfile(res?.data);
        setUserGroup(res.data?.user_group);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserPin = async () => {
      const storedPin = await AsyncStorage.getItem('userPin');
      setUserPin(storedPin);
    };

    fetchProfile();
    fetchUserPin();
  }, []);

  useEffect(() => {
    const fetchFingerprintPreference = async () => {
      const stored = await AsyncStorage.getItem('useFingerprint');
      if (stored !== null) {
        const value = stored === 'true';
        setUseFingerprint(value);
      }
    };
    fetchFingerprintPreference();
  }, []);

  const toggleFingerprint = async () => {
    const newValue = !useFingerprint;
    setUseFingerprint(newValue);
    await AsyncStorage.setItem('useFingerprint', newValue.toString());
  };

  const handleSwitchToggle = (newValue) => {
    setPendingValue(newValue);
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    setUseFingerprint(pendingValue);
    await AsyncStorage.setItem('useFingerprint', pendingValue.toString());
    setModalVisible(false);
    setPendingValue(null);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setPendingValue(null);
  };

  const handleBackPress = () => router.back();
  const handlePressPassword = () => router.push({ pathname: 'ResetPassword' });
  const handleQRPress = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);

  return (
    <>
      <HeaderComponent headerTitle="My Profile" onBackPress={handleBackPress} />
      {isLoading ? (
        <Loader visible={isLoading} />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Profile Header Section */}
          <TouchableOpacity style={styles.qrButton} onPress={() => setIsLogoutModalVisible(true)}>
          <MaterialCommunityIcons name="logout" size={28} color="#FF0031" />
        </TouchableOpacity>


          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: profile?.emp_data?.image || profile?.image }} 
                style={styles.profileImage} 
              />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{profile?.emp_data?.name || 'Employee'}</Text>
              <Text style={styles.userNameSmall}>@{profile?.user_name}</Text>
              {/* <Text style={styles.userRole}>{userGroup?.name || 'Employee'}</Text> */}
              <View style={styles.roleContainer}>
                <Text style={styles.userRole}>{userGroup?.name || 'Employee'}</Text>
              </View>
              
              <View style={styles.userMeta}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="identifier" size={16} color="#7f8c8d" />
                  <Text style={styles.metaText}>{profile?.emp_data?.emp_id}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="office-building" size={16} color="#7f8c8d" />
                  <Text style={styles.metaText}>{profile?.emp_data?.department_name}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Personal Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <InfoRow 
              icon="email" 
              label="Email" 
              value={profile?.emp_data?.email_id || 'Not available'} 
            />
            
            <InfoRow 
              icon="phone" 
              label="Mobile" 
              value={profile?.mobile_number || profile?.emp_data?.mobile_number || 'Not available'} 
            />
            
            <InfoRow 
              icon="cake" 
              label="Date of Birth" 
              value={profile?.emp_data?.dob || 'Not available'} 
            />
            
            <InfoRow 
              icon="calendar" 
              label="Date of Joining" 
              value={profile?.emp_data?.date_of_join || 'Not available'} 
            />
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <MaterialCommunityIcons name="fingerprint" size={20} color="#555" />
                <Text style={styles.switchText}>Use Fingerprint for Login</Text>
              </View>
              <Switch
                value={useFingerprint}
                onValueChange={handleSwitchToggle}
                trackColor={{ false: "#dcdcdc", true: "#2A73FC" }}
                thumbColor={useFingerprint ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handlePressPassword}
            >
              <MaterialCommunityIcons name="lock" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {userPin ? 'Update Your Pin' : 'Set Your Pin'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setIsLogoutModalVisible(true)}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#d9534f" />
              <Text style={[styles.actionButtonText, { color: '#d9534f' }]}>Log Out</Text>
            </TouchableOpacity>
          </View>

          {/* QR Modal */}
          <QRModal
            isVisible={isModalVisible}
            onClose={handleCloseModal}
            qrValue={profile?.emp_data?.emp_id || 'Envalid Emp Id'}
          />
          
          <ConfirmationModal
            visible={isLogoutModalVisible}
            message="Are you sure you want to logout?"
            onConfirm={() => {
              setIsLogoutModalVisible(false);
              logout();
            }}
            onCancel={() => setIsLogoutModalVisible(false)}
            confirmText="Logout"
            cancelText="Cancel"
          />

          <ConfirmationModal
            visible={modalVisible}
            message="Are you sure you want to change this setting?"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </ScrollView>
      )}
    </>
  );
};

// Updated InfoRow Component
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={20} color="#555" style={styles.infoIcon} />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f7fa',
    paddingBottom: 30,
  },
  qrButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: '#FBE6EA',
    padding: 10,
    borderRadius: 25,
    elevation: 3,
    zIndex: 10,
  },

  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  userNameSmall: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
  },
   roleContainer: {
    alignSelf: 'flex-start',
    marginBottom: 1,
  },
  userRole: {
    fontSize: 14,
    color: '#2A73FC',
    fontWeight: '500',
    marginBottom: 8,
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  userMeta: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#95a5a6',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#34495e',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 15,
    color: '#34495e',
    marginLeft: 12,
  },
  actionsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2A73FC',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default ProfileScreen;