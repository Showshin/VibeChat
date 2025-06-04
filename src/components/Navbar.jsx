import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, MessageCircle, Cloud, Users, LogOut, Globe, HelpCircle, ChevronRight, Share2, MessageSquare, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userApi } from '../api/firebaseApi';
import HelpPanel from './HelpPanel';

function Navbar({ activePage, onAvatarClick }) {
    const navigate = useNavigate();
    const { currentUser, logout, userInfo } = useAuth();
    const { currentLanguage, changeLanguage, t } = useLanguage();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLanguageSubmenuOpen, setIsLanguageSubmenuOpen] = useState(false);
    const [isHoveringLanguageOption, setIsHoveringLanguageOption] = useState(false);
    const [showHelpPanel, setShowHelpPanel] = useState(false);

    const settingsMenuRef = useRef(null);
    const languageSubmenuRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Lỗi khi đăng xuất (Navbar component):', error);
        }
    };

    const handleAvatarClick = () => {
        if (onAvatarClick) {
            onAvatarClick();
        }
    };

    const toggleSettings = () => {
        setIsSettingsOpen(prev => !prev);
        setIsLanguageSubmenuOpen(false);
    };

    const toggleLanguageSubmenu = () => {
        console.log("Language submenu toggled", !isLanguageSubmenuOpen); 
        setIsLanguageSubmenuOpen(prev => !prev);
    };

    const handleChangeLanguage = (lang) => {
        changeLanguage(lang);
        setIsLanguageSubmenuOpen(false);
        setIsSettingsOpen(false);
    };

    const handleHelpClick = () => {
        setShowHelpPanel(true);
        setIsSettingsOpen(false);
    };

    const handleCloseHelpPanel = () => {
        setShowHelpPanel(false);
    };

    return (
        <>
            <div className="w-16 bg-gradient-to-b from-indigo-600 to-purple-700 flex flex-col items-center py-4 text-white pt-[32px] pb-[12px] justify-between">
                <div className="flex flex-col items-center">
                    <div
                        className="w-12 h-12 rounded-full mb-6 cursor-pointer overflow-hidden border-2 border-white"
                        onClick={handleAvatarClick}
                    >
                        {!userInfo ? (
                            <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : userInfo.img ? (
                            <img
                                src={userInfo.img}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                                <span className="text-white text-lg font-medium">
                                    {userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        className={`hover:bg-indigo-700 m-1 rounded ${activePage === 'chat' ? 'bg-purple-700' : ''}`}
                        onClick={() => navigate('/chat')}
                    >
                        <MessageCircle className='m-2' size={29} />
                    </button>
                    <button
                        className={`hover:bg-indigo-700 m-1 rounded ${activePage === 'friends' ? 'bg-purple-700' : ''}`}
                        onClick={() => navigate('/friends')}
                    >
                        <Users className='m-2' size={29} />
                    </button>
                    <button
                        className={`hover:bg-indigo-700 m-1 rounded ${activePage === 'social' ? 'bg-purple-700' : ''}`}
                        onClick={() => navigate('/social')}
                    >
                        <Share2 className='m-2' size={29} />
                    </button>
                </div>

                {/* Cloud Section */}
                <div className="flex flex-col items-center mt-auto mb-2">
                    <button
                        className={`hover:bg-indigo-700 m-1 rounded ${activePage === 'cloud' ? 'bg-purple-700' : ''}`}
                        onClick={() => navigate('/cloud')}
                    >
                        <Cloud className='m-2' size={29} />
                    </button>
                    <div className='w-12 border-b border-white/50'></div>
                </div>

                {/* Settings Section */}
                <div className="flex flex-col items-center">
                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            id="settings-button"
                            className="hover:bg-indigo-700 m-1 rounded"
                            onClick={toggleSettings}
                        >
                            <Settings className='m-2' size={29} />
                        </button>
                        {isSettingsOpen && (
                            <div className="fixed left-12 top-auto bottom-12 w-40 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 z-50">
                                <div className="py-1 relative">
                                    {/* Language Option */}
                                    <button
                                        onClick={toggleLanguageSubmenu}
                                        onMouseEnter={() => setIsHoveringLanguageOption(true)}
                                        onMouseLeave={() => setIsHoveringLanguageOption(false)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <span className="flex items-center">
                                            <Globe size={18} className="mr-3 text-gray-500" />
                                            {t('language')}
                                        </span>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </button>
                                    
                                    {/* Language submenu - as a floating panel */}
                                    {isLanguageSubmenuOpen && (
                                        <div 
                                            className="absolute top-0 left-full w-48 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 py-1 z-[60]"
                                            onMouseEnter={() => setIsHoveringLanguageOption(true)}
                                            onMouseLeave={() => setIsHoveringLanguageOption(false)}
                                        >
                                            <button
                                                onClick={() => handleChangeLanguage('vi')}
                                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <span className="flex items-center">
                                                    <span className="mr-3">🇻🇳</span>
                                                    {t('vietnamese')}
                                                </span>
                                                {currentLanguage === 'vi' && <span className="text-blue-600">✓</span>}
                                            </button>
                                            <button
                                                onClick={() => handleChangeLanguage('en')}
                                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <span className="flex items-center">
                                                    <span className="mr-3">🇺🇸</span>
                                                    {t('english')}
                                                </span>
                                                {currentLanguage === 'en' && <span className="text-blue-600">✓</span>}
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Help/Support Option */}
                                    <button
                                        onClick={handleHelpClick}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <span className="flex items-center">
                                            <HelpCircle size={18} className="mr-3 text-gray-500" />
                                            {t('support')}
                                        </span>
                                    </button>
                                    
                                    <div className="border-t border-gray-200 my-1"></div>
                                    
                                    {/* Log out option - red */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-gray-100"
                                    >
                                        {t('logout')}
                                    </button>
                                    
                                    {/* Exit option - blue */}
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-gray-100"
                                    >
                                        {t('exit')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Panel */}
            {showHelpPanel && (
                <HelpPanel onClose={handleCloseHelpPanel} language={currentLanguage} />
            )}
        </>
    );
}

export default Navbar;