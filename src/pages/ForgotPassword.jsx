import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useLanguage } from '../contexts/LanguageContext';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const { currentLanguage, changeLanguage } = useLanguage();

    // Translations
    const translations = {
        vi: {
            forgotPassword: "Quên mật khẩu",
            enterEmail: "Nhập email của bạn để đặt lại mật khẩu",
            email: "Email",
            resetPassword: "Đặt lại mật khẩu",
            backToLogin: "Quay lại đăng nhập",
            resetEmailSent: "Email đặt lại mật khẩu đã được gửi!",
            checkEmail: "Vui lòng kiểm tra email của bạn và làm theo hướng dẫn để đặt lại mật khẩu.",
            vietnamese: "Tiếng Việt",
            english: "English"
        },
        en: {
            forgotPassword: "Forgot Password",
            enterEmail: "Enter your email to reset your password",
            email: "Email",
            resetPassword: "Reset Password",
            backToLogin: "Back to Login",
            resetEmailSent: "Password reset email has been sent!",
            checkEmail: "Please check your email and follow the instructions to reset your password.",
            vietnamese: "Vietnamese",
            english: "English"
        }
    };

    // Helper function to get translation
    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.vi[key];
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setResetEmailSent(true);
            setError('');
        } catch (error) {
            console.error('Error sending password reset email:', error);
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-10">
            <div className="max-w-md w-full space-y-6 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {t('forgotPassword')}
                    </h2>
                    <p className="text-gray-600 text-sm">{t('enterEmail')}</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}
                    {resetEmailSent && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-100">
                            <p className="font-medium">{t('resetEmailSent')}</p>
                            <p className="mt-1">{t('checkEmail')}</p>
                        </div>
                    )}

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

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </span>
                            {t('resetPassword')}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors duration-200">
                        {t('backToLogin')}
                    </Link>
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

export default ForgotPassword; 