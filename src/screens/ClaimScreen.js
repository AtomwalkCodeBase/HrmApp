import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, StatusBar, View, SafeAreaView, Linking, Alert, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { useNavigation, useRouter } from 'expo-router';
import { getEmpClaim } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import ImageViewer from 'react-native-image-zoom-viewer';
import ModalComponent from '../components/ModalComponent';

const screenHeight = Dimensions.get('window').height;
const responsiveMarginBottom = screenHeight * 0.0005;

// Container for the whole screen
const Container = styled.View`
  flex: 1;
  padding: 10px;
  background-color: #fff;
`;

// Card container for claim information
const ClaimCard = styled.TouchableOpacity`
  background-color: #e1d7f5;
  border-radius: 12px;
  border-width: 1px;
  border-color: #ccc;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

// Claim text styles
const ClaimText = styled.Text`
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ClaimAmountContainer = styled.View`
  position: absolute;
  right: 16px;
  top: 16px;
  background-color: #fff5e6;
  padding: 4px 8px;
  border-radius: 8px;
`;

const ClaimAmountText = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: #ff8800;
`;

// Button for applying a new claim
const ApplyClaimButton = styled.TouchableOpacity`
  background-color: #4d88ff;
  padding: 12px 16px;
  border-radius: 25px;
  align-self: center;
  margin-bottom: ${responsiveMarginBottom}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const ViewButton = styled.TouchableOpacity`
  background-color: #fff;
  border: 1px solid #4d88ff;
  border-radius: 24px;
  padding: 8px 16px;
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  margin-top: 12px;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-left: 8px;
`;

const ViewButtonText = styled.Text`
  color: #4d88ff;
  font-size: 14px;
  font-weight: 600;
  margin-left: 4px;
`;

const ClaimScreen = () => {
  const router = useRouter();
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [claimData, setClaimData] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const navigation = useNavigation();
  const requestData = 'GET';

  useEffect(() => {
    fetchClaimDetails();
  }, []);

  const fetchClaimDetails = () => {
    getEmpClaim(requestData).then((res) => {
      setClaimData(res.data);
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleBackPress = () => {
    if (selectedImageUrl) {
      setSelectedImageUrl(null);
    } else {
      router.push('home');
    }
  };

  const handleCardPress = (claim) => {
    setSelectedClaim(claim);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
  };

  const handlePress = () => {
    router.push('ClaimApply');
  };

  const handleViewFile = (fileUrl) => {
    const fileExtension = fileUrl.split('.').pop().split('?')[0].toLowerCase();

    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      // Set the selected image URL to display the image
      setSelectedImageUrl(fileUrl);
    } else if (fileExtension === 'pdf') {
      // Show alert and open the PDF URL for download
      Alert.alert('File Downloading', 'The file is being downloaded.');
      Linking.openURL(fileUrl).catch((err) =>
        console.error('Failed to open URL:', err)
      );
    } else {
      console.warn('Unsupported file type:', fileExtension);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'S':
        return 'SUBMITTED';
      case 'A':
        return 'APPROVED';
      case 'F':
        return 'FORWARDED';
      case 'B':
        return 'BACK TO CLAIMANT';
      case 'R':
        return 'REJECTED';
      default:
        return 'UNKNOWN STATUS';
    }
  };

  const renderClaimItem = ({ item }) => (
    <ClaimCard 
    key={item.id}
    status={item.status_display}
    onPress={() => handleCardPress(item)}>
      <View>
      <ClaimText>{item.claim_id}</ClaimText>
      <ClaimText>Item Name: {item.item_name}</ClaimText>
      <ClaimText>Expense Date: {item.expense_date}</ClaimText>

      {/* Display Claim Status based on expense_status */}
      <ClaimText>Status: {getStatusText(item.expense_status)}</ClaimText>
      
      {item.approved_by && (
      <ClaimText>Approved By: {item.approved_by}</ClaimText>
      )}
      </View>
      <ClaimAmountContainer>
        <ClaimAmountText>₹ {item.expense_amt}</ClaimAmountText>
      </ClaimAmountContainer>
      {item.submitted_file_1 && (
        <ViewButton onPress={() => handleViewFile(item.submitted_file_1)}>
          <MaterialIcons name="visibility" size={20} color="#4d88ff" />
          <ViewButtonText>View File</ViewButtonText>
        </ViewButton>
      )}
    </ClaimCard>
  );

  if (selectedImageUrl) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderComponent headerTitle="View Image" onBackPress={handleBackPress} />
        <View style={{ flex: 1 }}>
          {/* Using ImageViewer for zoom functionality */}
          <ImageViewer 
            imageUrls={[{ url: selectedImageUrl }]} // Array of images
            enableSwipeDown={true}
            onSwipeDown={handleBackPress} // Close the image viewer on swipe down
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HeaderComponent headerTitle="My Claim" onBackPress={handleBackPress} />

      <Container>
        <FlatList
          data={[...claimData].reverse()}
          renderItem={renderClaimItem}
          keyExtractor={(item) => item.claim_id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for the button
        />
        {/* Apply Claim Button */}
        <ApplyClaimButton onPress={handlePress}>
          <MaterialIcons name="add-circle" size={24} color="#fff" />
          <ButtonText>Apply Claim</ButtonText>
        </ApplyClaimButton>

        {selectedClaim && (
        <ModalComponent
          isVisible={isModalVisible}
          claim={selectedClaim}
          onClose={closeModal}
        />
      )}
      </Container>
    </SafeAreaView>
  );
};

export default ClaimScreen;
