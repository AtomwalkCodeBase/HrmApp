import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Alert, Keyboard, SafeAreaView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { getExpenseItem, getExpenseProjectList, postClaim } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import DropdownPicker from '../components/DropdownPicker';
import AmountInput from '../components/AmountInput';
import DatePicker from '../components/DatePicker';
import FilePicker from '../components/FilePicker';
import RemarksTextArea from '../components/RemarkInput';
import SubmitButton from '../components/SubmitButton';
import styled from 'styled-components/native';
import {colors} from '../Styles/appStyle';

const Container = styled.ScrollView`
  flex: 1;
  padding: 10px;
  background-color: #fff;
  height: 100%;
`;

const AddClaim = () => {
  const [claimAmount, setClaimAmount] = useState('');
  const [remark, setRemark] = useState('');
  // const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [fileMimeType, setFileMimeType] = useState('');
  const [claimItem, setClaimItem] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [item, setItem] = useState('');
  const [project, setProject] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const router = useRouter();

  console.log("Project List--",projectList)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    fetchClaimItemList();
    fetchProjectList();
  }, []);

  const fetchClaimItemList = async () => {
    try {
      const response = await getExpenseItem();
      setClaimItem(response.data);
    } catch (error) {
      console.error("Error fetching expense items:", error);
    }
  };

  const fetchProjectList = async () => {
    try {
      const response = await getExpenseProjectList();
      setProjectList(response.data);
    } catch (error) {
      console.error("Error fetching project list:", error);
    }
  };

  const handleBackPress = () => {
    router.push('ClaimScreen');
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({...prevState, [input]: error}));
  };

  
  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;

    if (!item) {
        handleError('Please select a Expense Item', 'item');
        isValid = false;
    } 

    if (!expenseDate) {
        handleError('Please select the date', 'expenseDate');
        isValid = false;
    }

      if (!remark) {
        handleError('Please fill the remark field', 'remarks');
        isValid = false;
      }
  
    if (!claimAmount){
          handleError('Please enter the claim amount', 'claimAmount');
          isValid = false;
    }
    if (!fileUri){
      handleError('Please select a file', 'file');
      isValid = false;
}  
  
    if (isValid){
      handleSubmit()
    }  

};

  const handleSubmit = async () => {
    if (!item || !expenseDate || !claimAmount || !fileUri) {
      Alert.alert('Error', 'Please fill all fields and attach a valid file.');
      return;
    }
    
    const expense_date = `${expenseDate.getDate().toString().padStart(2, '0')}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}-${expenseDate.getFullYear()}`;

    const formData = new FormData();
    formData.append('file_1', {
      uri: fileUri,
      name: fileName,
      type: fileMimeType,
    });
    formData.append('remarks', remark);
    formData.append('item', item);
    formData.append('quantity', '1');
    formData.append('expense_amt', claimAmount);
    formData.append('expense_date', expense_date);

    if (project) {
      formData.append('project', project);
    }

    postClaim(formData)
      .then((res) => {
        if (res.status === 200) {
          Alert.alert('Success', 'Claim submitted successfully.');
          router.push('ClaimScreen');
        } else {
          console.error('Unexpected response:', res);
          Alert.alert('Claim Submission Error', 'Failed to claim. Unexpected response.');
        }
      })
      .catch((error) => {
        Alert.alert('Claim Submission Failed', `Failed to claim: ${error.response?.data?.detail || error.message}`);
      });
  };


  


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HeaderComponent headerTitle="Add Claim" onBackPress={handleBackPress} />
      <Container>
        <DropdownPicker
          label="Expense Item"
          data={claimItem}
          value={item}
          setValue={setItem}
          error={errors.item}
        />
        <DropdownPicker
          label="Project"
          data={projectList}
          value={project}
          setValue={setProject}
        />
        <DatePicker 
        cDate={expenseDate} 
        label='Expense Date' 
        setCDate={setExpenseDate}
        error={errors.expenseDate}
        />
        <AmountInput 
        claimAmount={claimAmount} 
        label='Expense Amount' 
        setClaimAmount={setClaimAmount}
        error={errors.claimAmount}
        />
        <FilePicker 
          label='Attach File'
          fileName={fileName}
          
          setFileName={setFileName}
          setFileUri={setFileUri}
          setFileMimeType={setFileMimeType}
          error={errors.file}
        />
        <RemarksTextArea 
        remark={remark} 
        setRemark={setRemark}
        error={errors.remarks}
        />
        <SubmitButton
          label="Submit Claim"
          onPress={validate}
          bgColor={colors.primary}
          textColor="white"
        />
      </Container>
    </SafeAreaView>
  );
};

export default AddClaim;
