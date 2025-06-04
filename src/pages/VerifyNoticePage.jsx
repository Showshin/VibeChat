import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { userApi } from '../api/firebaseApi'; // Assuming this path is correct

const VerifyNoticePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentLanguage, changeLanguage, t } = useLanguage(); 
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUserEmail(currentUser.email || location.state?.email || '');
        if (currentUser.emailVerified) {
            navigate('/', { 
                replace: true, 
            });
        }
    }, [currentUser, navigate, location.state, t]);

    const handleResendEmail = async () => {
        setError('');
        setSuccessMessage('');
        if (!currentUser) {
            setError(t('userNotFound') || "User not logged in."); 
            return;
        }
        setLoading(true);
        try {
            await sendEmailVerification(currentUser);
            setSuccessMessage(t('verifyNoticeEmailResentSuccess'));
        } catch (err) {
            console.error("Error resending verification email:", err);
            setError(t('verifyNoticeEmailResentError') + (err.code ? ` (${err.code})` : ''));
        }
        setLoading(false);
    };

    const handleCheckVerification = async () => {
        setError('');
        setSuccessMessage('');
        if (!currentUser) {
            setError(t('userNotFound') || "User not logged in.");
            return;
        }
        setLoading(true);
        try {
            await currentUser.reload();
            if (currentUser.emailVerified) {
                setSuccessMessage(t('verifyNoticeVerificationSuccess'));
                try {
                    const userDoc = await userApi.checkUserExists(currentUser.uid);
                    if (!userDoc) {
                        console.log("User document not found in Firestore after verification, creating now...");
                        await userApi.createUser(currentUser.uid, {
                            user_id: currentUser.uid,
                            email: currentUser.email,
                            fullName: currentUser.displayName || 'N/A', 
                            phoneNumber: '',
                            img: '',
                            status: 'online',
                            lastSeen: new Date(),
                            emailVerified: true
                        });
                    } else if (!userDoc.emailVerified) { 
                        await userApi.updateUser(currentUser.uid, { 
                            emailVerified: true, 
                            lastSeen: new Date() 
                        });
                    } else {
                        // User doc exists and is verified, no specific DB action needed here before redirecting to login
                        // await userApi.updateUser(currentUser.uid, { status: 'offline', lastSeen: new Date() });
                    }
                    
                    setTimeout(() => {
                        navigate('/', { 
                            replace: true, 
                        });
                    }, 1500);
                } catch (dbError) {
                    console.error("Error ensuring/creating user document in Firestore:", dbError);
                    setError(t('dbError')); 
                }
            } else {
                setError(t('verifyNoticeStillNotVerified'));
            }
        } catch (err) {
            console.error("Error checking verification status:", err);
            setError(t('verifyNoticeStillNotVerified') + (err.code ? ` (${err.code})` : ''));
        }
        setLoading(false);
    };

    if (!currentUser) { 
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <p>{t('loading') || "Redirecting to login..."}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500 py-10 px-4">
            <div className="max-w-lg w-full space-y-8 p-8 sm:p-10 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl text-center">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        {t('verifyNoticePageTitle')}
                    </h2>
                    <p className="mt-3 text-gray-600">
                        {t('verifyNoticeEmailNotVerified')}
                    </p>
                    <p className="mt-2 text-gray-600">
                        {t('verifyNoticePleaseCheckEmail')}{' '}
                        <strong className="text-gray-700">{userEmail}</strong>{' '}
                        {t('verifyNoticeClickLink')}
                    </p>
                </div>

                {error && (
                    <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 animate-shake">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                        {successMessage}
                    </div>
                )}

                <div className="space-y-4 mt-6">
                    <button
                        onClick={handleResendEmail}
                        disabled={loading}
                        className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-150"
                    >
                        {loading ? t('verifyNoticeVerifyingProcess') : t('verifyNoticeResendEmailButton')}
                    </button>
                    <button
                        onClick={handleCheckVerification}
                        disabled={loading}
                        className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-150"
                    >
                        {loading ? t('verifyNoticeVerifyingProcess') : t('verifyNoticeCheckVerificationButton')}
                    </button>
                </div>
                <div className="mt-6 text-sm">
                    <button onClick={() => { auth.signOut(); navigate('/login'); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                        {t('login')}
                    </button>
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

export default VerifyNoticePage; 