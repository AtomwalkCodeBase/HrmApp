import React from 'react';
import { Text } from 'react-native';
import styled from 'styled-components/native';
import {colors} from '../Styles/appStyle';

const TextArea = styled.TextInput`
  border: 1px solid #ccc;
  padding: 10px;
  text-align-vertical: top;
  border-radius: 8px;
  font-size: 16px;
`;

const Label = styled.Text`
  font-size: 16px;
  margin-top: 15px;
  margin-bottom: 5px;
`;

const RemarksInput = ({ error, remark, setRemark }) => {
  return (
    <>
      <Label>Remarks :</Label>
      <TextArea
        placeholder="Remark"
        value={remark}
        onChangeText={setRemark}
        multiline
        numberOfLines={4}
      />
      {error && (
        <Text style={{marginTop: 7, color: colors.red, fontSize: 12}}>
          {error}
        </Text>
      )}
    </>
  );
};

export default RemarksInput;
