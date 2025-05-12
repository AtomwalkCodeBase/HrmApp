import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Text,
  Keyboard,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CommentInput = ({ 
  onSend, 
  initialValue = '', 
  disabled = false, 
  buttonText = 'Send',
  autoFocus = false
}) => {
  const [text, setText] = useState(initialValue);
  const [imageUri, setImageUri] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const animatedHeight = useRef(new Animated.Value(56)).current;

  const handleSend = () => {
    if ((text.trim() || imageUri) && !disabled) {
      onSend(text, imageUri, imageName, imageMimeType);
      setText('');
      setImageUri(null);
      setImageName(null);
      setImageMimeType(null);
      Keyboard.dismiss();
    }
  };

  const pickImage = async () => {
    try {
      setIsUploading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert("You need to allow access to your photos to upload an image.");
        setIsUploading(false);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Handle the new ImagePicker result format
        const selectedAsset = result.assets?.[0];
        if (selectedAsset) {
          setImageUri(selectedAsset.uri);
          
          // Extract file name and mime type
          const uriParts = selectedAsset.uri.split('/');
          const fileName = uriParts[uriParts.length - 1];
          setImageName(fileName);
          
          // Use the provided mime type or fallback to a generic one
          const mimeType = selectedAsset.mimeType || 'image/jpeg';
          setImageMimeType(mimeType);
          
          // Animate input height to accommodate the image preview
          Animated.timing(animatedHeight, {
            toValue: 120,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("There was an error picking the image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert("You need to allow access to your camera to take a photo.");
        setIsUploading(false);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Handle the new ImagePicker result format
        const selectedAsset = result.assets?.[0];
        if (selectedAsset) {
          setImageUri(selectedAsset.uri);
          
          // Extract file name and mime type
          const uriParts = selectedAsset.uri.split('/');
          const fileName = uriParts[uriParts.length - 1];
          setImageName(fileName);
          
          // Use the provided mime type or fallback to a generic one
          const mimeType = selectedAsset.mimeType || 'image/jpeg';
          setImageMimeType(mimeType);
          
          // Animate input height to accommodate the image preview
          Animated.timing(animatedHeight, {
            toValue: 120,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      alert("There was an error taking the photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageName(null);
    setImageMimeType(null);
    
    // Animate input height back to normal
    Animated.timing(animatedHeight, {
      toValue: 56,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { height: animatedHeight }]}>
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={removeImage}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Write a comment..."
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            autoFocus={autoFocus}
            editable={!disabled}
          />
        </View>
        
        <View style={styles.actionButtons}>
          {!imageUri && (
            <>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={takePhoto}
                disabled={disabled || isUploading}
              >
                <Feather name="camera" size={22} color={disabled ? "#ccc" : "#666"} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={pickImage}
                disabled={disabled || isUploading}
              >
                <Feather name="image" size={22} color={disabled ? "#ccc" : "#666"} />
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              ((!text.trim() && !imageUri) || disabled) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={(!text.trim() && !imageUri) || disabled}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.sendButtonText}>{buttonText}</Text>
                <Feather name="send" size={16} color="#fff" style={styles.sendIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f2f3f5',
    borderRadius: 20,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    paddingHorizontal: 16,
    marginRight: 8,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    color: '#333',
    maxHeight: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#a970ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sendIcon: {
    marginLeft: 4,
  },
});