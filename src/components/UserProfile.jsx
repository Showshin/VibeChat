import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Save, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { userApi } from '../api/firebaseApi';
import { auth } from '../firebase/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const translations = {
    vi: {
        // Change Password component
        changePassword: "Đổi mật khẩu",
        currentPassword: "Mật khẩu hiện tại",
        newPassword: "Mật khẩu mới",
        confirmPassword: "Xác nhận mật khẩu mới",
        passwordMismatch: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        passwordSameAsOld: "Mật khẩu mới không được trùng với mật khẩu cũ",
        userNotFound: "Không tìm thấy thông tin người dùng",
        wrongPassword: "Mật khẩu hiện tại không đúng",
        passwordError: "Có lỗi xảy ra khi đổi mật khẩu",
        passwordSuccess: "Đổi mật khẩu thành công",
        submitChangePassword: "Đổi mật khẩu",
        weakPassword: "Mật khẩu phải có ít nhất 6 ký tự",
        
        // User Profile component
        back: "Quay lại",
        profile: "Hồ sơ cá nhân",
        fullName: "Họ và tên",
        email: "Email",
        phoneNumber: "Số điện thoại",
        invalidPhone: "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng số điện thoại Việt Nam (10 số, bắt đầu bằng 0)",
        updateProfile: "Cập nhật thông tin",
        loading: "Đang tải thông tin...",
        updateSuccess: "Cập nhật thông tin thành công",
        updateFailed: "Cập nhật thông tin thất bại",
        changeProfilePicture: "Thay đổi ảnh đại diện",
        imageTooLarge: "Ảnh không được lớn hơn 5MB",
        imageFormatError: "Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)",
        avatarUpdateSuccess: "Cập nhật ảnh đại diện thành công",
        uploadFailed: "Upload ảnh thất bại",
        editProfile: "Chỉnh sửa hồ sơ"
    },
    en: {
        // Change Password component
        changePassword: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        passwordMismatch: "New password and confirmation do not match",
        passwordSameAsOld: "New password cannot be the same as the old password",
        userNotFound: "User information not found",
        wrongPassword: "Current password is incorrect",
        passwordError: "An error occurred while changing the password",
        passwordSuccess: "Password changed successfully",
        submitChangePassword: "Change Password",
        weakPassword: "Password must be at least 6 characters long",
        
        // User Profile component
        back: "Back",
        profile: "Personal Profile",
        fullName: "Full Name",
        email: "Email",
        phoneNumber: "Phone Number",
        invalidPhone: "Invalid phone number. Please enter a valid phone number format",
        updateProfile: "Update Profile",
        loading: "Loading information...",
        updateSuccess: "Profile updated successfully",
        updateFailed: "Update failed",
        changeProfilePicture: "Change Profile Picture",
        imageTooLarge: "Image should not be larger than 5MB",
        imageFormatError: "Only image files allowed (JPEG, PNG, GIF)",
        avatarUpdateSuccess: "Profile picture updated successfully",
        uploadFailed: "Image upload failed",
        editProfile: "Edit Profile"
    }
};

const ChangePassword = ({ onBack }) => {
    const { currentLanguage } = useLanguage();
    
    // Helper function to get translation
    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.vi[key];
    };
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    const handleChangePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordData;

        // Check if new password is same as old password
        if (currentPassword === newPassword) {
            setPasswordError(t('passwordSameAsOld'));
            return;
        }

        // Check if new password matches confirmation
        if (newPassword !== confirmPassword) {
            setPasswordError(t('passwordMismatch'));
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                setPasswordError(t('userNotFound'));
                return;
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update to new password
            await updatePassword(user, newPassword);

            // Reset form and show success
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordError('');
            alert(t('passwordSuccess'));
            onBack();
        } catch (error) {
            console.error('Error changing password:', error);
            if (error.code === 'auth/wrong-password') {
                setPasswordError(t('wrongPassword'));
            } else if (error.code === 'auth/weak-password') {
                setPasswordError(t('weakPassword'));
            } else {
                setPasswordError(t('passwordError'));
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
                <div className="flex items-center mb-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mr-2">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-semibold">{t('changePassword')}</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('currentPassword')}</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('newPassword')}</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('confirmPassword')}</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {passwordError && (
                        <p className="text-red-500 text-sm">{passwordError}</p>
                    )}

                    <button
                        onClick={handleChangePassword}
                        className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:from-indigo-600 hover:to-purple-600"
                    >
                        <Lock size={16} className="mr-2" />
                        {t('submitChangePassword')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserProfile = ({ userId, onClose }) => {
    const { refreshUserInfo } = useAuth();
    const { currentLanguage } = useLanguage();
    
    // Helper function to get translation
    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.vi[key];
    };
    
    const [userInfo, setUserInfo] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        img: '',
        status: 'offline'
    });
    const [editedInfo, setEditedInfo] = useState({
        fullName: '',
        phoneNumber: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [newAvatar, setNewAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const data = await userApi.getUserInfo(userId);
                if (data) {
                    setUserInfo(data);
                    setEditedInfo({
                        fullName: data.fullName || '',
                        phoneNumber: data.phoneNumber || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();
    }, [userId]);

    const validatePhoneNumber = (phoneNumber) => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone === '') {
            return true; // Allow empty
        }
        const isValidVNPhone = /^0\d{9}$/.test(cleanPhone);
        return isValidVNPhone;
    };

    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setEditedInfo(prev => ({ ...prev, phoneNumber: phone }));

        if (phone.trim() !== '' && !validatePhoneNumber(phone)) {
            setPhoneError(t('invalidPhone'));
        } else {
            setPhoneError('');
        }
    };

    const handleUpdateProfile = async () => {
        if (editedInfo.phoneNumber && !validatePhoneNumber(editedInfo.phoneNumber)) {
            setPhoneError(t('invalidPhone'));
            return;
        }

        try {
            setIsUploading(true);
            let imgUrl = userInfo.img;

            // Upload new avatar if selected
            if (newAvatar) {
                imgUrl = await userApi.updateUserAvatar(userId, newAvatar);
            }

            // Update user info
            const updatedInfo = {
                ...userInfo,
                fullName: editedInfo.fullName,
                phoneNumber: editedInfo.phoneNumber,
                img: imgUrl
            };

            await userApi.updateUserInfo(userId, updatedInfo);

            // Update local state
            setUserInfo(updatedInfo);
            setNewAvatar(null);

            // Call refreshUserInfo after successfully updating
            if (refreshUserInfo) {
                await refreshUserInfo();
            }

            alert(t('updateSuccess'));
            // Tự động đóng modal sau khi cập nhật thành công
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(t('updateFailed'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(t('imageTooLarge'));
            return;
        }

        // Check file format
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert(t('imageFormatError'));
            return;
        }

        setNewAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    if (showChangePassword) {
        return <ChangePassword onBack={() => setShowChangePassword(false)} />;
    }

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 w-96">
                    <p>{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px] max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{t('profile')}</h2>
                    {!isUploading && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center mb-6">
                    <div
                        className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-2 cursor-pointer"
                        onClick={handleImageClick}
                    >
                        {newAvatar && avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : userInfo.img ? (
                            <img
                                src={userInfo.img}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-400 flex items-center justify-center text-white text-2xl">
                                {userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                            <Camera size={24} className="text-white opacity-0 hover:opacity-100" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        onClick={handleImageClick}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                        {t('changeProfilePicture')}
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('fullName')}
                        </label>
                        <input
                            type="text"
                            value={editedInfo.fullName}
                            onChange={(e) => setEditedInfo(prev => ({ ...prev, fullName: e.target.value }))}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('email')}
                        </label>
                        <input
                            type="email"
                            value={userInfo.email}
                            disabled
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('phoneNumber')}
                        </label>
                        <input
                            type="tel"
                            value={editedInfo.phoneNumber}
                            onChange={handlePhoneChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="0xxxxxxxxx"
                        />
                        {phoneError && (
                            <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                            onClick={handleUpdateProfile}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:from-indigo-600 hover:to-purple-600"
                            disabled={isUploading}
                        >
                            <Save size={16} className="mr-2" />
                            {t('updateProfile')}
                        </button>
                        
                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                        >
                            <Lock size={16} className="mr-2" />
                            {t('changePassword')}
                        </button>
                    </div>
                </div>

                {isUploading && (
                    <div className="mt-4 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile; 