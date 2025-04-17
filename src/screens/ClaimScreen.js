import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, SafeAreaView, View, Alert, Linking } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { getEmpClaim } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import ImageViewer from 'react-native-image-zoom-viewer';
import ModalComponent from '../components/ModalComponent';
import ClaimCard from '../components/ClaimCard';
import ApplyButton from '../components/ApplyButton';
import Loader from '../components/old_components/Loader'; // Import the Loader component
import styled from 'styled-components/native';
import EmptyMessage from '../components/EmptyMessage';

const Container = styled.View`
  flex: 1;
  padding: 10px;
  background-color: #fff;
`;

const ClaimScreen = ({ headerTitle = "My Claim", buttonLabel = "Apply Claim", fetchClaimData = getEmpClaim }) => {
  const router = useRouter();
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [claimData, setClaimData] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // State to control Loader visibility
  const navigation = useNavigation();
  const requestData = 'GET';

  useEffect(() => {
    fetchClaimDetails();
  }, []);

  const fetchClaimDetails = () => {
    setIsLoading(true); // Show loader before fetching
    fetchClaimData(requestData).then((res) => {
      setClaimData(res.data);
      setIsLoading(false); // Hide loader after data is fetched
    }).catch((err) => {
      setIsLoading(false); // Hide loader in case of error
      console.error("Error fetching claim data:", err);
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
      setSelectedImageUrl(fileUrl);
    } else if (fileExtension === 'pdf') {
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
      claim={item}
      onPress={handleCardPress}
      onViewFile={handleViewFile}
      getStatusText={getStatusText}
    />
  );

  console.log("Claim===",)

  if (selectedImageUrl) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderComponent headerTitle="View Image" onBackPress={handleBackPress} />
        <View style={{ flex: 1 }}>
          <ImageViewer 
            imageUrls={[{ url: selectedImageUrl }]}
            enableSwipeDown={true}
            onSwipeDown={handleBackPress}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HeaderComponent headerTitle={headerTitle} onBackPress={handleBackPress} />
      <Container>
        <FlatList
          data={[...claimData].reverse()}
          renderItem={renderClaimItem}
          keyExtractor={(item) => item.claim_id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<EmptyMessage data={`claim`} />}
        />
        <ApplyButton onPress={handlePress} buttonText={buttonLabel} />
        {selectedClaim && (
          <ModalComponent
            isVisible={isModalVisible}
            claim={selectedClaim}
            onClose={closeModal}
          />
        )}
      </Container>
      
      {/* Loader Component */}
      {/* <Loader visible={isLoading} /> */}
      <Loader
        visible={isLoading}
        // onTimeout={() => {
        //   setIsLoading(false); // Hide loader
        //   Alert.alert('Timeout', 'Not able to proceed');
        // }}
      />
    </SafeAreaView>
  );
};

export default ClaimScreen;
