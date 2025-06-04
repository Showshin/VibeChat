import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { userApi } from '../api/firebaseApi';
import { useLanguage } from '../contexts/LanguageContext';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { currentLanguage, changeLanguage } = useLanguage();

    // Translations
    const translations = {
        vi: {
            register: "Đăng ký tài khoản",
            email: "Email",
            fullName: "Họ và tên",
            password: "Mật khẩu",
            confirmPassword: "Xác nhận mật khẩu",
            agreeTerms: "Tôi đồng ý với",
            termsOfUse: "Điều khoản sử dụng",
            registerButton: "Đăng ký",
            haveAccount: "Đã có tài khoản?",
            loginNow: "Đăng nhập ngay",
            passwordMismatch: "Mật khẩu không khớp",
            pleaseAgreeTerms: "Vui lòng đồng ý với điều khoản sử dụng",
            verifyEmail: "Xác thực Email",
            emailSent: "Chúng tôi đã gửi một email xác thực đến",
            checkEmail: "Vui lòng kiểm tra email và nhấp vào liên kết xác thực",
            verified: "Đã xác thực email",
            notVerified: "Email chưa được xác thực. Vui lòng kiểm tra email và thử lại.",
            vietnamese: "Tiếng Việt",
            english: "English",
            showPassword: "Hiện mật khẩu",
            hidePassword: "Ẩn mật khẩu",
            emailInUse: "Địa chỉ email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.",
            userNotFound: "Không tìm thấy người dùng. Vui lòng đăng nhập lại.",
            sessionExpired: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
            networkError: "Lỗi kết nối mạng, vui lòng kiểm tra và thử lại.",
            unknownError: "Đã xảy ra lỗi không mong muốn trong quá trình kiểm tra xác thực.",
            dbError: "Không thể lưu thông tin người dùng sau khi xác thực. Vui lòng thử đăng nhập."
        },
        en: {
            register: "Register Account",
            email: "Email",
            fullName: "Full Name",
            password: "Password",
            confirmPassword: "Confirm Password",
            agreeTerms: "I agree to the",
            termsOfUse: "Terms of Use",
            registerButton: "Register",
            haveAccount: "Already have an account?",
            loginNow: "Login now",
            passwordMismatch: "Passwords do not match",
            pleaseAgreeTerms: "Please agree to the terms of use",
            verifyEmail: "Verify Email",
            emailSent: "We have sent a verification email to",
            checkEmail: "Please check your email and click on the verification link",
            verified: "Email verified",
            notVerified: "Email not verified. Please check your email and try again.",
            vietnamese: "Vietnamese",
            english: "English",
            showPassword: "Show password",
            hidePassword: "Hide password",
            emailInUse: "This email address is already in use. Please use a different email or log in.",
            userNotFound: "User not found. Please log in again.",
            sessionExpired: "Your session has expired. Please log in again.",
            networkError: "Network error. Please check your connection and try again.",
            unknownError: "An unexpected error occurred while checking verification.",
            dbError: "Failed to save user details after verification. Please try logging in."
        }
    };

    // Helper function to get translation
    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.vi[key];
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('passwordMismatch'));
            return;
        }

        if (!agreeTerms) {
            setError(t('pleaseAgreeTerms'));
            return;
        }

        try {
            // Create new account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile
            await updateProfile(user, { displayName: fullName });

            // Send verification email
            await sendEmailVerification(user);

            // Navigate to verification notice page
            setError('');
            navigate('/verify-notice', { state: { email: user.email, fromRegistration: true } });
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setError(t('emailInUse') || "This email address is already in use. Please use a different email or log in.");
            } else {
                setError(error.message);
            }
        }
    };

    // Check email verification status
    const checkEmailVerification = async () => {
        setError('');
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setError(t('notVerified') + " " + (translations[currentLanguage]?.userNotFound || "User not found. Please log in again."));
            return;
        }

        try {
            await currentUser.reload();

            if (currentUser.emailVerified) {
                try {
                    await userApi.createUser(currentUser.uid, {
                        user_id: currentUser.uid,
                        email: currentUser.email,
                        fullName: fullName,
                        phoneNumber: '',
                        img: '',
                        status: 'offline',
                        lastSeen: new Date(),
                        emailVerified: true
                    });
                    navigate('/');
                } catch (dbError) {
                    console.error("Error creating user document in Firestore:", dbError);
                    setError(t('dbError') || "Failed to save user details after verification. Please try logging in.");
                }
            } else {
                setError(t('notVerified'));
            }
        } catch (error) {
            console.error("Error checking email verification:", error);
            let errorMessage = t('notVerified');

            if (error.code === 'auth/user-token-expired') {
                errorMessage = translations[currentLanguage]?.sessionExpired || "Your session has expired. Please log in again.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = translations[currentLanguage]?.networkError || "Network error. Please check your connection and try again.";
            } else if (error.message) {
                errorMessage = `${t('notVerified')} (${error.message})`;
            } else {
                errorMessage = translations[currentLanguage]?.unknownError || "An unexpected error occurred while checking verification.";
            }
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-10">
            <div className="max-w-md w-full space-y-6 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {t('register')}
                    </h2>
                    <p className="text-gray-600 text-sm">Join VibeChat and connect with friends</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="email"
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder={t('email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder={t('fullName')}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    title={showPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder={t('confirmPassword')}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    title={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="agreeTerms"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors duration-200"
                        />
                        <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-600">
                            {t('agreeTerms')} <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200">{t('termsOfUse')}</Link> của VibeChat
                        </label>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            {t('registerButton')}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        {t('haveAccount')} <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors duration-200">{t('loginNow')}</Link>
                    </p>
                </div>
            </div>

            <div className="mt-8 flex items-center space-x-4">
                <button 
                    onClick={() => changeLanguage('vi')} 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentLanguage === 'vi' 
                            ? 'bg-white/20 text-white shadow-lg' 
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {t('vietnamese')}
                </button>
                <button 
                    onClick={() => changeLanguage('en')} 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentLanguage === 'en' 
                            ? 'bg-white/20 text-white shadow-lg' 
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {t('english')}
                </button>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;