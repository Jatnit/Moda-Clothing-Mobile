import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import authService from '../services/authService';

const RegisterScreen = ({ navigation, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Update form data
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username phải có ít nhất 3 ký tự';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    
    if (!agreeTerms) {
      newErrors.terms = 'Bạn cần đồng ý với điều khoản sử dụng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle go back to Home
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Handle register
  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });
      
      if (response.success) {
        // Cập nhật user state và quay về trang chính
        onRegisterSuccess?.(response.data.user);
        // Navigate back to Home
        navigation?.navigate?.('Home');
      } else {
        Alert.alert('❌ Lỗi', response.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert(
        '❌ Lỗi', 
        error.message || 'Không thể kết nối đến server. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Render input field
  const renderInput = (config) => {
    const { field, label, icon, placeholder, keyboardType, secure, showToggle, showState, setShowState } = config;
    
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputContainer, errors[field] && styles.inputError]}>
          <Ionicons name={icon} size={20} color={colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            value={formData[field]}
            onChangeText={(text) => updateField(field, text)}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
            autoCorrect={false}
            secureTextEntry={secure && !showState}
          />
          {showToggle && (
            <TouchableOpacity onPress={() => setShowState(!showState)}>
              <Ionicons 
                name={showState ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
          )}
        </View>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Tạo tài khoản</Text>
            <Text style={styles.headerSubtitle}>Đăng ký để bắt đầu mua sắm</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {renderInput({
              field: 'fullName',
              label: 'Họ và tên *',
              icon: 'person-outline',
              placeholder: 'Nhập họ và tên',
            })}

            {renderInput({
              field: 'username',
              label: 'Username *',
              icon: 'at-outline',
              placeholder: 'Nhập username',
            })}

            {renderInput({
              field: 'email',
              label: 'Email *',
              icon: 'mail-outline',
              placeholder: 'Nhập email',
              keyboardType: 'email-address',
            })}

            {renderInput({
              field: 'phone',
              label: 'Số điện thoại',
              icon: 'call-outline',
              placeholder: 'Nhập số điện thoại (không bắt buộc)',
              keyboardType: 'phone-pad',
            })}

            {renderInput({
              field: 'password',
              label: 'Mật khẩu *',
              icon: 'lock-closed-outline',
              placeholder: 'Nhập mật khẩu (tối thiểu 6 ký tự)',
              secure: true,
              showToggle: true,
              showState: showPassword,
              setShowState: setShowPassword,
            })}

            {renderInput({
              field: 'confirmPassword',
              label: 'Xác nhận mật khẩu *',
              icon: 'lock-closed-outline',
              placeholder: 'Nhập lại mật khẩu',
              secure: true,
              showToggle: true,
              showState: showConfirmPassword,
              setShowState: setShowConfirmPassword,
            })}

            {/* Terms Checkbox */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
                {' '}và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Đăng ký</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  
  // Header
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
  },
  
  // Form
  form: {
    flex: 1,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  
  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  
  // Register Button
  registerButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...shadows.medium,
  },
  registerButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 'auto',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  loginLink: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RegisterScreen;
