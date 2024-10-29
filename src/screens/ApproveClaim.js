import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, View, TextInput, Linking, Alert, SafeAreaView } from 'react-native';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { getEmpClaim } from '../services/productServices';
import HeaderComponent from './HeaderComponent';
import ImageViewer from 'react-native-image-zoom-viewer'; // Import the Image Zoom Viewer
import ModalComponent from '../components/ModalComponent';

const Container = styled.View`
  flex: 1;
  padding: 10px;
  background-color: #f8f9fa;
`;

const ClaimCard = styled.TouchableOpacity`
  background-color: #ffffff;
  border-radius: 16px;
  border-width: 0;
  padding: 20px;
  margin-bottom: 15px;
  border: 1px solid #a970ff;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 10px;
  elevation: 5;
`;

const ClaimStatusContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ClaimText = styled.Text`
  font-size: 15px;
  color: #2f2f2f;
  font-weight: 500;
`;
const ClaimText2 = styled.Text`
  font-size: 15px;
  font-weight: 500;
  color: ${(props) => (props.disabledColor ? props.disabledColor : '#28a745')};
`;

const ClaimAmountText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #007bff;
`;


const ViewButton = styled.TouchableOpacity`
  background-color: #e9ecef;
  padding: 12px 16px;
  border-radius: 28px;
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;

const ApproveButton = styled.TouchableOpacity`
  background-color: ${(props) => (props.disabled ? props.disabledColor : '#28a745')};
  padding: 12px 16px;
  border-radius: 28px;
  margin-top: 10px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;

const ActionButton = styled.TouchableOpacity`
  background-color: #ffc107;
  padding: 12px 16px;
  border-radius: 28px;
  margin-top: 10px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #e9ecef;
  padding: 12px;
  border-radius: 28px;
  margin-bottom: 15px;
`;

const ApplicationList = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,  // Hide vertical scrollbar
  showsHorizontalScrollIndicator: false,  // Hide horizontal scrollbar
})`
`;

const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: #495057;
  padding-left: 10px;
`;

const ImageViewerContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #fff;
`;
const StatusData=styled.View`
border: 1px solid black;
padding: 3px;
border-radius: 5px;
background-color: ${(props) => (props.disabled ? props.disabledColor : '#28a745')};
`
const ApproveClaim = () => {
  
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [claimData, setClaimData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const navigation = useNavigation();
  const router = useRouter();
  const requestData = 'APPROVE';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    fetchClaimDetails();
  }, []);

  const fetchClaimDetails = () => {
    getEmpClaim(requestData).then((res) => {
      setClaimData(res.data);
      setFilteredData(res.data);
    });
  };

  const getClaimStatus = (status) => {
    switch (status) {
      case 'S':
        return 'SUBMITTED';
      case 'A':
        return 'APPROVED';
      case 'F':
        return 'FORWARDED';
      case 'R':
        return 'REJECTED';
      default:
        return 'UNKNOWN';
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = claimData.filter((item) => {
      const empIdMatch = item.employee_name.match(/\[(.*?)\]/);
      const empId = empIdMatch ? empIdMatch[1] : '';
      return empId.includes(text);
    });
    setFilteredData(filtered);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleViewFile = (fileUrl) => {
    const fileExtension = fileUrl.split('.').pop().split('?')[0].toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      setSelectedImageUrl(fileUrl);
    } else if (fileExtension === 'pdf') {
      Alert.alert('File Downloading', 'The file is being downloaded.');
      Linking.openURL(fileUrl).catch((err) => console.error('Failed to open URL:', err));
    } else {
      console.warn('Unsupported file type:', fileExtension);
    }
  };

  const handleApprove = (claimDetails, callType) => {
    const formattedClaimDetails = typeof claimDetails === 'object'
      ? JSON.stringify(claimDetails)
      : claimDetails; // Use it directly if it's already a string

    router.push({
      pathname: 'ApproveDetails',
      params: {
        claimDetails: formattedClaimDetails, // Pass the formatted string
        callType
      },
    });
  };

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

  const renderClaimItem = ({ item }) => {
    const status = getClaimStatus(item.expense_status);
    const isSubmitted = status === 'SUBMITTED';
    const isForwarded = status === 'FORWARDED';
    const isRejected = status === 'REJECTED';
    const isApproved = status === 'APPROVED';

    return (
      <ClaimCard 
      key={item.id}
      status={item.status_display}
      onPress={() => handleCardPress(item)}>
        <ClaimStatusContainer>
          <View>
            <ClaimText>Claim ID: {item.claim_id}</ClaimText>
            <ClaimText>Expense Date: {item.expense_date}</ClaimText>
            <ClaimText>Item Name: {item.item_name}</ClaimText>
            <ClaimText>Emp: {item.employee_name}</ClaimText>
          </View>
          <View style={{alignItems:'center'}}>
            {/* <StatusData> */}
            <ClaimText2  disabledColor={isRejected ? '#dc3545' : isForwarded ? '#ffc107' : '#28a745'}>{status}</ClaimText2>
            {/* </StatusData> */}
            <ClaimAmountText> ₹ {item.expense_amt}</ClaimAmountText>
          </View>
        </ClaimStatusContainer>

        <ClaimStatusContainer>
          {item.submitted_file_1 && (
            <ViewButton onPress={() => handleViewFile(item.submitted_file_1)}>
              <MaterialIcons name="visibility" size={20} color="#333" />
              <ClaimText style={{ marginLeft: 5 }}>View File</ClaimText>
            </ViewButton>
          )}

          {isSubmitted && (
            <ActionButton onPress={() => handleApprove(item, 'Return')}>
              <ButtonText>Return Claim</ButtonText>
            </ActionButton>
          )}
          {!isApproved && !isForwarded&&!isRejected&&(
            <ApproveButton
              disabled={!isSubmitted}
              disabledColor={isRejected ? '#dc3545' : isForwarded ? '#ffc107' : '#28a745'}
              onPress={() => handleApprove(item, 'Approve')}
            >
              <ButtonText>{isRejected ? 'REJECTED' : isApproved ? 'APPROVED' : isForwarded ? 'FORWARDED' : 'Approve'}</ButtonText>
            </ApproveButton>
          )}
        </ClaimStatusContainer>
      </ClaimCard>
    );
  };

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
    <>
      <HeaderComponent headerTitle="Approve Claim List" onBackPress={handleBackPress} />
      <Container>
        <SearchContainer>
          <MaterialIcons name="search" size={24} color="#888" />
          <SearchInput
            placeholder="Search Employee ID"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </SearchContainer>
        <ApplicationList>
        <FlatList
          data={[...filteredData].reverse()}
          renderItem={renderClaimItem}
          keyExtractor={(item) => item.claim_id.toString()}
          showsVerticalScrollIndicator={false}
        />
        </ApplicationList>
      {selectedClaim && (
        <ModalComponent
          isVisible={isModalVisible}
          claim={selectedClaim}
          onClose={closeModal}
        />
      )}
      </Container>
    </>
  );
};

export default ApproveClaim;
