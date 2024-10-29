import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import HeaderComponent from './HeaderComponent';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
`;

const Background = styled.ImageBackground`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

const Content = styled.View`
  padding: 20px;
  align-items: center;
`;

const Title = styled.Text`
  font-size: 18px;
  text-align: center;
  color: black;
  margin-bottom: 10px;
  padding-horizontal: 20px;
`;

const ResetButton = styled.TouchableOpacity`
  background-color: #3c91e6;
  padding: 15px 30px;
  border-radius: 25px;
  margin-top: 20px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const ResetPasswordScreen = () => {
    const navigation = useNavigation();
    const router = useRouter();
  const handlePress = () => {
    Linking.openURL('https://www.atomwalk.com/users/password_change/');
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <>
    <HeaderComponent headerTitle="Change Password" onBackPress={handleBackPress} />
    <Container>
      <Background source={require('../../assets/images/back_design.png')} resizeMode="cover">
        <Content>
          <Title>
            This feature is only supported on the ATOMWALK website.
          </Title>
          <Title>
            Please visit the 'atomwalk.com' to change your password.
          </Title>
          {/* <ResetButton onPress={handlePress}>
            <ButtonText>Reset Password</ButtonText>
          </ResetButton> */}
        </Content>
      </Background>
    </Container>
    </>
  );
};

export default ResetPasswordScreen;
