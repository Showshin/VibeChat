import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { userApi } from '../api/firebaseApi';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { currentLanguage, changeLanguage } = useLanguage();

    // Translations
    const translations = {
        vi: {
            login: "Đăng nhập",
            email: "Email",
            password: "Mật khẩu",
            forgotPassword: "Quên mật khẩu?",
            noAccount: "Chưa có tài khoản?",
            register: "Đăng ký ngay",
            loginError: "Lỗi đăng nhập",
            vietnamese: "Tiếng Việt",
            english: "English",
            rememberMe: "Ghi nhớ đăng nhập",
            loginButton: "Đăng nhập",
            showPassword: "Hiện mật khẩu",
            hidePassword: "Ẩn mật khẩu",
            invalidCredentials: "Tài khoản hoặc mật khẩu không đúng",
            "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
            "auth/wrong-password": "Mật khẩu không đúng. Vui lòng thử lại.",
            "auth/invalid-credential": "Thông tin đăng nhập không hợp lệ (có thể sai email hoặc mật khẩu).",
            "auth/too-many-requests": "Truy cập bị tạm khóa do quá nhiều lần thử. Vui lòng thử lại sau.",
            "auth/invalid-email": "Địa chỉ email không hợp lệ.",
            "auth/network-request-failed": "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.",
            "auth/user-disabled": "Tài khoản này đã bị vô hiệu hóa.",
            dbErrorLogin: "Không thể cập nhật hồ sơ, nhưng bạn đã đăng nhập."
        },
        en: {
            login: "Login",
            email: "Email",
            password: "Password",
            forgotPassword: "Forgot password?",
            noAccount: "Don't have an account?",
            register: "Register now",
            loginError: "Login error",
            vietnamese: "Vietnamese",
            english: "English",
            rememberMe: "Remember me",
            loginButton: "Login",
            showPassword: "Show password",
            hidePassword: "Hide password",
            invalidCredentials: "Incorrect account or password",
            "auth/user-not-found": "No account found with this email.",
            "auth/wrong-password": "Incorrect password. Please try again.",
            "auth/invalid-credential": "Invalid credentials (could be wrong email or password).",
            "auth/too-many-requests": "Access temporarily disabled due to too many failed login attempts. Please try again later.",
            "auth/invalid-email": "The email address is not valid.",
            "auth/network-request-failed": "Network error. Please check your connection and try again.",
            "auth/user-disabled": "This account has been disabled.",
            dbErrorLogin: "Could not update profile, but you are logged in."
        }
    };

    // Helper function to get translation
    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.vi[key] || translations.en[key] || key;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.emailVerified) {
                try {
                    const userDoc = await userApi.checkUserExists(user.uid);
                    if (!userDoc) {
                        console.log("User document not found in Firestore after login, creating now...");
                        await userApi.createUser(user.uid, {
                            user_id: user.uid,
                            email: user.email,
                            fullName: user.displayName || 'N/A',
                            phoneNumber: '',
                            img: '',
                            status: 'online',
                            lastSeen: new Date(),
                            emailVerified: true
                        });
                    } else {
                        await userApi.updateUser(user.uid, { status: 'online', lastSeen: new Date() });
                    }
                } catch (dbError) {
                    console.error("Error ensuring/updating user document in Firestore during login:", dbError);
                }
                navigate('/chat');
            } else {
                navigate('/verify-notice', { state: { email: user.email } });
            }
        } catch (error) {
            console.error(`${t('loginError')}:`, error.code, error.message);
            let message = t(error.code);
            if (message === error.code) {
                message = t('invalidCredentials');
            }
            setError(error.code ? `${message}` : message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-10">
            <div className="max-w-md w-full space-y-6 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {t('login')}
                    </h2>
                    <p className="text-gray-600 text-sm">Welcome back to VibeChat</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors duration-200"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                                {t('rememberMe')}
                            </label>
                        </div>
                        <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200">
                            {t('forgotPassword')}
                        </Link>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            </span>
                            {t('loginButton')}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        {t('noAccount')} <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors duration-200">{t('register')}</Link>
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
}

export default LoginPage;