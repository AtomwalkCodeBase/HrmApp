import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { getProfileInfo } from '../services/authServices';
import { getClaimApprover, postClaimAction } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import AmountInput from '../components/AmountInput';
import RemarksInput from '../components/RemarkInput';
import DropdownPicker from '../components/DropdownPicker';
import SuccessModal from '../components/SuccessModal'; // Import SuccessModal component
import Loader from '../components/old_components/Loader';

const Container = styled.View`
  flex: 1;
  padding: 16px;
  background-color: #ffffff;
`;

const ClaimDetailContainer = styled.View`
  border: 1px solid #a970ff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const ClaimDetailText = styled.Text`
  font-size: 18px;
  color: ${(props) => props.color || '#333'};
  margin-bottom: 8px;
  font-weight: 500;
`;

const FillFieldsContainer = styled.View`
  margin-top: 10px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

const ActionButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${(props) => props.color || '#4d88ff'};
  padding: 15px;
  margin: 0 5px;
  border-radius: 12px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
`;

const ApproveClaimDetails = (props) => {
  const [profile, setProfile] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State to control SuccessModal visibility
  const [isLoading, setIsLoading] = useState(false); // Loader state

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
  const [approveAmount, setApproveAmount] = useState('');
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
        const profileRes = await getProfileInfo();
        setProfile(profileRes.data);

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
    router.push('ApproveClaim');
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


const handleAction = (res1) => {
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

  const claimPayload = {
    approve_by_id: selectedManager,
    approve_amt: `${approveAmount}`,
    claim_id: `${claim?.id}`,
    remarks,
    call_mode: res1,
  };

  postClaimAction(claimPayload)
    .then((res) => {
      setShowSuccessModal(true); // Show SuccessModal on successful action
    })
    .catch((error) => {
      Alert.alert('Action Failed', `Failed to ${res1} claim.`);
    });
};

  return (
    <>
      <HeaderComponent headerTitle={"Approve" + " " + `(${claim?.claim_id})`} onBackPress={handleBackPress} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Container>
          <ClaimDetailContainer>
            <ClaimDetailText>Expense Item: {claim?.item_name}</ClaimDetailText>
            <ClaimDetailText>Expense Date: {claim?.expense_date}</ClaimDetailText>
            <ClaimDetailText>Emp: {claim?.employee_name}</ClaimDetailText>
            <ClaimDetailText>Claim Amount: {claim?.expense_amt}</ClaimDetailText>
            <ClaimDetailText>Claim Remark: {claim?.remarks}</ClaimDetailText>
          </ClaimDetailContainer>

          <FillFieldsContainer>
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
          </FillFieldsContainer>

          <ButtonContainer>
            <ActionButton color="#ff5722" onPress={() => handleAction('REJECT')}>
              <ButtonText>Reject Claim</ButtonText>
            </ActionButton>
            {callType === 'Approve' && (
              <ActionButton color="#06BF63" onPress={() => handleAction('APPROVE')}>
                <ButtonText>Approve Claim</ButtonText>
              </ActionButton>
            )}
            {callType === 'Return' && (
              <ActionButton color="#ffa500" onPress={() => handleAction('SEND_BACK')}>
                <ButtonText>Back to Claimant</ButtonText>
              </ActionButton>
            )}
          </ButtonContainer>
        </Container>
      </ScrollView>

      {/* Success Modal */}
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
    </>
  );
};

export default ApproveClaimDetails;
