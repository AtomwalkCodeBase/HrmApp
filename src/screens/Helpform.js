import React, { useState, useEffect, useLayoutEffect } from "react";
import { Keyboard, SafeAreaView, Alert, Text } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { postEmpRequest } from "../services/productServices";
import HeaderComponent from "../components/HeaderComponent";
import RequestTextInput from "../components/RequestTextInput";
import RemarksTextArea from "../components/RemarkInput";
import FilePicker from "../components/FilePicker";
import SubmitButton from "../components/SubmitButton";
import SuccessModal from "../components/SuccessModal";
import Loader from "../components/old_components/Loader";
import styled from "styled-components/native";
import { colors } from "../Styles/appStyle";
import { useLocalSearchParams } from "expo-router";
import ErrorModal from "../components/ErrorModal";

// Try to import useRoute, with a fallback
let useRoute;
try {
  useRoute = require("expo-router").useRoute;
} catch (error) {
  console.warn("useRoute not available, falling back to props:", error);
  useRoute = null;
}

const Container = styled.ScrollView`
  flex: 1;
  padding: 10px;
  background-color: #fff;
  height: 100%;
`;

const CategoryLabel = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const CategoryValue = styled.Text`
  font-size: 16px;
  color: ${colors.text};
  padding: 10px;
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: 5px;
  background-color: #f9f9f9;
  margin-bottom: 12px;
`;

const Helpform = () => {
  const { data } = useLocalSearchParams();
  const [empId, setEmpId] = useState("");
  const [requestText, setRequestText] = useState("");
  const [remark, setRemark] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUri, setFileUri] = useState("");
  const [fileMimeType, setFileMimeType] = useState("");
  const [requestCategory, setRequestCategory] = useState("");
  const [errors, setErrors] = useState({});
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const router = useRouter();

  const parsedProduct = typeof data === "string" ? JSON.parse(data) : data;

  const request_type = parsedProduct?.request_type || "H";
  const headerTitle =
    request_type === "H" ? "Resolve Help Request" : "Resolve General Request";

  useEffect(() => {
    if (parsedProduct?.emp_id) {
      setEmpId(parsedProduct.emp_id);
    }
    if (parsedProduct?.request_category_name) {
      setRequestCategory(parsedProduct.request_category_name);
    }
  }, [parsedProduct]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleBackPress = () => {
    router.push({
      pathname: "MoreScreen",
      params: { empId },
    });
  };

  const handleError = (error, input) => {
    setErrors((prevState) => ({ ...prevState, [input]: error }));
  };

  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;

    if (!requestText) {
      handleError("Please describe your request", "requestText");
      isValid = false;
    }

    if (!remark) {
      handleError("Please fill the remark field", "remarks");
      isValid = false;
    }

    if (!fileUri) {
      handleError("Please attach supporting document", "file");
      isValid = false;
    }

    if (isValid) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append("emp_id", empId);
    formData.append("request_category_id",  "0");
    formData.append("call_mode", "RESOLVED");
    formData.append("request_type", parsedProduct?.request_type);
    formData.append("request_id", parsedProduct?.request_id);
    formData.append("request_text", requestText);
    formData.append("remarks", remark);

    if (fileUri) {
      formData.append("submitted_file_1", {
        uri: fileUri,
        name: fileName || "supporting_document.jpg",
        type: fileMimeType || "image/jpeg",
      });
    }

    try {
      const res = await postEmpRequest(formData);
      console.log("API Response:", res);

      if (res.status === 200) {
        setIsSuccessModalVisible(true);
      } else {
        console.error("Unexpected response:", res);
        // Alert.alert(
        //   "Request Error",
        //   `Failed to submit request. Status: ${res.status}`
        // );
      }
    } catch (error) {
      console.error("Submission error:", error);
      console.error("Error response:", error.response);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit request"
      );
      setIsErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HeaderComponent
        headerTitle={headerTitle}
        onBackPress={handleBackPress}
      />
      {isLoading ? (
        <Loader
          visible={isLoading}
          onTimeout={() => {
            setIsLoading(false);
            setErrorMessage("Not able to submit the request.");
            setIsErrorModalVisible(true);
          }}
        />
      ) : (
        <Container>
          <CategoryLabel>
            {request_type === "H" ? "Help Category" : "Request Category"}
          </CategoryLabel>
          <CategoryValue>
            {parsedProduct?.request_sub_type || "N/A"}
          </CategoryValue>

          <RequestTextInput
            label={
              request_type === "H" ? "Help Request Details" : "Request Details"
            }
            value={requestText}
            onChangeText={setRequestText}
            placeholder={
              request_type === "H"
                ? "Describe your help request in detail..."
                : "Describe your request in detail..."
            }
            error={errors.requestText}
          />

          <RemarksTextArea
            remark={remark}
            setRemark={setRemark}
            placeholder="Additional remarks (optional)"
            error={errors.remarks}
          />

          <FilePicker
            label="Attach Supporting Document"
            fileName={fileName}
            setFileName={setFileName}
            setFileUri={setFileUri}
            setFileMimeType={setFileMimeType}
            error={errors.file}
          />

          <SubmitButton
            label={
              request_type === "H" ? "Submit Help Request" : "Submit Request"
            }
            onPress={validate}
            bgColor={colors.primary}
            textColor="white"
          />
        </Container>
      )}

      <SuccessModal
        visible={isSuccessModalVisible}
        onClose={() => {
          setIsSuccessModalVisible(false);
          router.push("ClaimScreen");
        }}
        message={
          request_type === "H"
            ? "Help request submitted successfully!"
            : "Request submitted successfully!"
        }
      />
      <ErrorModal
        visible={isErrorModalVisible}
        message={errorMessage}
        onClose={() => setIsErrorModalVisible(false)}
        // onRetry={validate}
      />
    </SafeAreaView>
  );
};

export default Helpform;
