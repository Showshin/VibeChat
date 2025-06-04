import React from 'react';
import { Mail, Phone, Globe, Info, Facebook, Twitter } from 'lucide-react';

const HelpPanel = ({ onClose, language = 'vi' }) => {
    // Multilingual content
    const translations = {
        vi: {
            title: "Thông tin & Hỗ trợ",
            company: "Thông tin công ty",
            companyName: "VibeChat Messenger",
            version: "Phiên bản",
            versionNumber: "1.0.0 (Beta)",
            developed: "Phát triển bởi",
            developer: "CNM - Nhóm 11",
            contact: "Liên hệ hỗ trợ",
            email: "support@vibechat.com",
            phone: "1900 1800",
            website: "www.vibechat.com",
            copyright: "© 2023 VibeChat Messenger. Tất cả quyền được bảo lưu.",
            close: "Đóng",
            socialMedia: "Mạng xã hội",
            follow: "Theo dõi chúng tôi:"
        },
        en: {
            title: "Information & Support",
            company: "Company Information",
            companyName: "VibeChat Messenger",
            version: "Version",
            versionNumber: "1.0.0 (Beta)",
            developed: "Developed by",
            developer: "CNM - Group 11",
            contact: "Support Contact",
            email: "support@vibechat.com",
            phone: "1900 1800",
            website: "www.vibechat.com",
            copyright: "© 2023 VibeChat Messenger. All rights reserved.",
            close: "Close",
            socialMedia: "Social Media",
            follow: "Follow us:"
        }
    };

    const t = translations[language] || translations.vi;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
                    <h2 className="text-xl font-semibold flex items-center">
                        <Info className="mr-2" size={20} />
                        {t.title}
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {/* Company Information */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {t.company}
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-center mb-4">
                                <div className="h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    Z
                                </div>
                            </div>
                            <h4 className="text-center text-lg font-semibold text-gray-800 mb-1">{t.companyName}</h4>
                            <p className="text-center text-sm text-gray-600">
                                <span className="font-medium">{t.version}:</span> {t.versionNumber}
                            </p>
                            <p className="text-center text-sm text-gray-600 mt-1">
                                <span className="font-medium">{t.developed}</span> {t.developer}
                            </p>
                        </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {t.contact}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                                <Mail size={18} className="text-indigo-600 mr-3" />
                                <span className="text-sm text-gray-700">{t.email}</span>
                            </div>
                            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                                <Phone size={18} className="text-indigo-600 mr-3" />
                                <span className="text-sm text-gray-700">{t.phone}</span>
                            </div>
                            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                                <Globe size={18} className="text-indigo-600 mr-3" />
                                <span className="text-sm text-gray-700">{t.website}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Social Media */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {t.socialMedia}
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-3">{t.follow}</p>
                            <div className="flex justify-center space-x-4">
                                <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                                    <Facebook size={18} />
                                </button>
                                <button className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500">
                                    <Twitter size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-center text-gray-500 mt-4">
                        {t.copyright}
                    </p>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpPanel; 