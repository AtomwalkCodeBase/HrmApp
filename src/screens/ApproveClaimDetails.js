import { useNavigation, useRouter } from 'expo-router';
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, View, StyleSheet,  Modal, Image, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { getProfileInfo } from '../services/authServices';
import { getClaimApprover, postClaimAction } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import AmountInput from '../components/AmountInput';
import RemarksInput from '../components/RemarkInput';
import DropdownPicker from '../components/DropdownPicker';
import SuccessModal from '../components/SuccessModal'; // Import SuccessModal component
import Loader from '../components/old_components/Loader';
import ImageViewer from 'react-native-image-zoom-viewer';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';

// const Container = styled.View`
//   flex: 1;
//   padding: 16px;
//   background-color: #ffffff;
// `;

// const ClaimDetailContainer = styled.View`
//   border: 1px solid #a970ff;
//   padding: 16px;
//   border-radius: 12px;
//   margin-bottom: 20px;
//   box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
// `;

// const ViewButtonContainer = styled.View`
//   /* border: 1px solid #a970ff; */
//   align-items: flex-end;
//   margin-right: -10px;
//   margin-top: -10px;
//   /* padding: 16px; */
//   /* border-radius: 12px; */
//   /* margin-bottom: 20px; */
//   /* box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); */
// `;

// const ViewButton = styled.TouchableOpacity`
//   background-color:rgb(216, 233, 250);
//   border: 1px solid rgb(57, 168, 253);
//   padding: 7px 8px;
//   border-radius: 5px;
//   flex-direction: row;
//   align-items: center;
//   justify-content: center;
//   /* margin-top: 10px; */
//   shadow-color: #000;
//   shadow-offset: 0px 1px;
//   shadow-opacity: 0.1;
//   shadow-radius: 2px;
//   /* width: 40%; */
// `;

// const ClaimText = styled.Text`
//   font-size: 15px;
//   color: #2f2f2f;
//   font-weight: 500;
// `;

// const ClaimDetailText = styled.Text`
//   font-size: 18px;
//   color: ${(props) => props.color || '#333'};
//   margin-bottom: 8px;
//   font-weight: 500;
// `;

// const FillFieldsContainer = styled.View`
//   margin-top: 10px;
// `;

// const ButtonContainer = styled.View`
//   flex-direction: row;
//   justify-content: space-between;
//   margin-top: 20px;
// `;

// const ActionButton = styled.TouchableOpacity`
//   flex: 1;
//   background-color: ${(props) => props.color || '#4d88ff'};
//   padding: 15px;
//   margin: 0 5px;
//   border-radius: 12px;
//   align-items: center;
// `;

// const ButtonText = styled.Text`
//   color: #ffffff;
//   font-size: 16px;
//   font-weight: bold;
// `;

const ApproveClaimDetails = (props) => {
  const { profile } = useContext(AppContext);
  // const [profile, setProfile] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State to control SuccessModal visibility
  const [isLoading, setIsLoading] = useState(false); // Loader state
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  let claim;
  const claimData = props?.claim_data;
  if (claimData) {
    const claimDetails = claimData.claimDetails;
    if (typeof claimDetails === 'string' && claimDetails !== "[object Object]") {
      try {
        claim = JSON.parse(claimDetails);
      } catch (error) {
        console.error("Error parsing claimDetails: ", error);
      }
    } else {
      claim = claimDetails && typeof claimDetails === 'object' ? claimDetails : {};
    }
  } else {
    console.warn("claim_data is undefined or null");
  }

  const callType = props?.claim_data?.callType;
  const navigation = useNavigation();
  const router = useRouter();
  const managerData = profile?.emp_data;

  const [claimAmount, setClaimAmount] = useState(claim?.expense_amt);
  const [approveAmount, setApproveAmount] = useState(claim?.expense_amt);
  const [remarks, setRemarks] = useState(claim?.approval_remarks);
  const [selectedManager, setSelectedManager] = useState('');
  const [eligible, setEligible] = useState(false);
  const [managers, setManagers] = useState([]);
  const [claimAmt, setClaimAmt] = useState('');
  const [claimGradeLevel, setClaimGradeLevel] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Show loader
      try {
        const approversRes = await getClaimApprover();
        setManagers(approversRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false); // Hide loader
      }
    };

    fetchData();
  }, []);


  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleBackPress = () => {
    if (selectedImageUrl) {
      setSelectedImageUrl(null);
    } else {
      router.push('ApproveClaim');
    }
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

  // Parse and calculate dates for claim submission
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('-');
    const monthMap = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04',
      May: '05', Jun: '06', Jul: '07', Aug: '08',
      Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const formattedMonth = monthMap[month] || '01';
    return `${year}-${formattedMonth}-${day}`;
  };

  const submittedDate = new Date(parseDate(claim.submitted_date));
  const expenseDate = new Date(parseDate(claim.expense_date));

  if (isNaN(submittedDate) || isNaN(expenseDate)) {
    Alert.alert('Date Format Error', 'Invalid date format. Please check the dates.');

    return;
  }

  const timeDifference = submittedDate - expenseDate;
  const daysDifference = timeDifference / (1000 * 3600 * 24);
  const maxApproveDays = managerData?.approve_data?.find(data => data.max_days)?.max_days || 0;

  useEffect(() => {
    // Ensure manager data and claim amount are available before running the conditions
    if (managerData?.approve_data && claimAmount) {
        const approveGradeLevel = managerData.approve_data.find(data => data.claim_grade_level)?.claim_grade_level;
        const maxClaimAmount = managerData.approve_data.find(data => data.max_claim_amt)?.max_claim_amt;
        setClaimGradeLevel(profile?.emp_data?.grade_level);


        // Check if the manager's grade level is lower than the claim grade level
        if (approveGradeLevel > claimGradeLevel) {
            if (parseFloat(claimAmount) > maxClaimAmount) {
              Alert.alert('Limit Exceeded', 'Claim amount exceeds your approval limit.');
              setEligible(true);
            }
            if (daysDifference > maxApproveDays) {
                Alert.alert('Approval Not Allowed', `Claim cannot be approved as the difference is greater than ${maxApproveDays} days.`);
                setEligible(true);
            }
        }

        // Check if the claim amount exceeds the manager's approval limit
        
    }
}, [managerData, claimAmount, claimGradeLevel, maxApproveDays]);

if (isLoading) {
  return <Loader visible={isLoading} />; // Show loader while data is loading
}

const formattedClaimId = claim?.claim_id?.length > 7 
    ? `...${claim.claim_id.slice(-8)}` 
    : claim?.claim_id;


const handleAction = async (res1)  => {
  
  
  let validationErrors = {};

  
  if (res1 === 'APPROVE') {
    if (!approveAmount || approveAmount.trim() === '') {
      validationErrors.claimAmt = 'Approve amount is required';
    } else if (parseFloat(approveAmount) > parseFloat(claimAmount)) {
      validationErrors.claimAmt = 'The approved amount must be less than or equal to the claim amount';
    }

    if (remarks.trim() === '') {
      validationErrors.remarks = 'Remarks are required';
    }

    if (eligible && !selectedManager) {
      validationErrors.selectedManager = 'Please select a manager';
    }
  }

  if (res1 === 'SEND_BACK' && remarks.trim() === '') {
    validationErrors.remarks = 'Remarks are required to send back';
  }

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return; // Stop the function if there are validation errors
  }

  setIsLoading(true);

  const claimPayload = {
    approve_by_id: selectedManager,
    approve_amt: `${approveAmount}`,
    claim_id: `${claim?.id}`,
    remarks,
    call_mode: res1,
  };

  try {
    await postClaimAction(claimPayload);
    setShowSuccessModal(true);
  } catch (error) {
    Alert.alert('Action Failed', `Failed to ${res1} claim.`);
  } finally {
    setIsLoading(false);
  }
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
  <HeaderComponent headerTitle={`Approve (${formattedClaimId})`} onBackPress={handleBackPress} />
  <SafeAreaView style={styles.container}>
    
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.claimDetailContainer}>
        {claim.submitted_file_1 && (
          <View style={styles.viewButtonContainer}>
            <TouchableOpacity style={styles.viewButton} onPress={() => handleViewFile(claim.submitted_file_1)}>
              <MaterialIcons name="visibility" size={20} color="#333" />
              <Text style={styles.claimText}>View File</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.claimDetailText}>Expense Item: {claim?.item_name}</Text>
        <Text style={styles.claimDetailText}>Expense Date: {claim?.expense_date}</Text>
        <Text style={styles.claimDetailText}>Emp: {claim?.employee_name}</Text>
        <Text style={styles.claimDetailText}>Claim Amount: {claim?.expense_amt}</Text>
        <Text style={styles.claimDetailText}>Claim Remark: {claim?.remarks}</Text>
      </View>

      <View style={styles.fillFieldsContainer}>
      <AmountInput
            label="Approve Amount:"
            claimAmount={approveAmount}
            setClaimAmount={setApproveAmount}
            error={errors.claimAmt} // Updated to use errors.claimAmt for the claim amount error
          />
            <RemarksInput
              remark={remarks}
              setRemark={setRemarks}
              error={errors.remarks}
            />
        {eligible && (
              <>
              <DropdownPicker
                label="Select Manager"
                data={managers.map(data => ({
                  label: `${data.name} [${data.emp_id}]`,
                  value: data.id,
                }))}
                value={selectedManager}
                setValue={setSelectedManager}
                error={errors.selectedManager}

              />
              </>
            )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ff5722' }]} onPress={() => handleAction('REJECT')}>
          <Text style={styles.buttonText}>Reject Claim</Text>
        </TouchableOpacity>
        {callType === 'Approve' && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#06BF63' }]} onPress={() => handleAction('APPROVE')}>
            <Text style={styles.buttonText}>Approve Claim</Text>
          </TouchableOpacity>
        )}
        {callType === 'Return' && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ffa500' }]} onPress={() => handleAction('SEND_BACK')}>
              <Text style={styles.buttonText}>Back to Claimant</Text>
            </TouchableOpacity>
            )}
      </View>
    </ScrollView>
    {showSuccessModal && (
        <SuccessModal
          isVisible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.push('ApproveClaim'); // Navigate back after modal closes
          }}
          message="Claim action updated successfully."
        />
    )}
  </SafeAreaView>
  </>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  claimDetailContainer: {
    borderWidth: 1,
    borderColor: '#a970ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // elevation: 3,
  },
  viewButtonContainer: {
    alignItems: 'flex-end',
    marginRight: -10,
    marginTop: -10,
  },
  viewButton: {
    backgroundColor: 'rgb(216, 233, 250)',
    borderWidth: 1,
    borderColor: 'rgb(57, 168, 253)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: {
    fontSize: 15,
    color: '#2f2f2f',
    fontWeight: '500',
  },
  claimDetailText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  fillFieldsContainer: {
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ApproveClaimDetails;
