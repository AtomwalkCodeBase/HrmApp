import React, { useContext, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import styled from 'styled-components/native';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { getProfileInfo } from '../services/authServices';
import HeaderComponent from './HeaderComponent';
import { useNavigation, useRouter } from 'expo-router';

// Styled components
const Container = styled.View`
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #fff;
  padding: 10px;
  padding-top: 50px;
`;

const AvatarContainer = styled.View`
  background-color: #e5d1ff;
  width: 100px;
  height: 100px;
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

const Avatar = styled.Image`
  width: 70px;
  height: 70px;
`;

const UserName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const InfoText = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
`;
const ProfileImage = styled.Image`
  width: 85px;
  height: 85px;
  border-radius: 60px;
`;

const IsManagerContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const ManagerText = styled.Text`
  font-size: 16px;
  margin-right: 10px;
`;

const LogOutButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-top: 20px;
`;

const LogOutText = styled.Text`
  color: red;
  font-size: 16px;
  margin-left: 10px;
`;

const ChangePasswordButton = styled.TouchableOpacity`
  background-color: #007bff;
  padding: 10px 20px;
  border-radius: 10px;
  margin-top: 20px;
`;

const ChangePasswordText = styled.Text`
  color: white;
  font-size: 16px;
`;
const ProfileScreen = () => {
  const { logout } = useContext(AppContext);
  const [profile, setProfile] = useState({});
  const [isManager, setIsManager] = useState(false);

  const router = useRouter();
  
  const navigation = useNavigation();
  
  console.log('Profile data--',profile)

  useEffect(() => {
    // Fetch profile data
    getProfileInfo().then((res) => {
      setProfile(res.data);
      setIsManager(res.data.user_group.is_manager);
    });
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handlePressPassword = () => {
    router.push({
      pathname: 'ResetPassword' 
    });
  };

  return (
    <>
    <HeaderComponent headerTitle="My Profile" onBackPress={handleBackPress} />
    <Container>
      
      <AvatarContainer>
        <ProfileImage source={{ uri: profile?.image }} />
      </AvatarContainer>
      <UserName>{profile&&profile?.emp_data?.name}</UserName>
      <UserName>{profile&&profile?.user_name}</UserName>

      <IsManagerContainer>
        <ManagerText>Is Manager:</ManagerText>
        {isManager ?
        <MaterialCommunityIcons name="check-circle" size={24} color="lightblue" />:
        <MaterialCommunityIcons name="cancel" size={24} color="red" />
        }
      </IsManagerContainer>

      
      {profile?.emp_data?.emp_id ? (
        <InfoText>Employee Id : {profile?.emp_data?.emp_id}</InfoText>
      ) : null}
      {profile?.emp_data?.department_name ? (
        <InfoText>Department : {profile?.emp_data?.department_name}</InfoText>
      ) : null}
      {profile?.mobile_number ? (
        <InfoText>Mob. No. : {profile.mobile_number}</InfoText>
      ) : null}

      <LogOutButton onPress={() => {logout()}}>
        <MaterialCommunityIcons name="logout" size={24} color="red" />
        <LogOutText>Log Out</LogOutText>
      </LogOutButton>

      <ChangePasswordButton onPress={() => {handlePressPassword()}}>
        <ChangePasswordText>Change Your Password</ChangePasswordText>
      </ChangePasswordButton>
    </Container>
    </>
  );
};

export default ProfileScreen;
