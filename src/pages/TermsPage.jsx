import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext'; // Assuming you might want to translate this page

const translations = {
    vi: {
        title: "Điều khoản và Điều kiện",
        backToHome: "Quay lại trang chủ",
        introductionTitle: "1. Giới thiệu",
        introductionContent: "Chào mừng bạn đến với VibeChat! Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện này. Vui lòng đọc kỹ.",
        userResponsibilitiesTitle: "2. Trách nhiệm của Người dùng",
        userResponsibilitiesContent: "Bạn chịu trách nhiệm về hoạt động của mình trên VibeChat, bao gồm nội dung bạn đăng tải và tương tác với người dùng khác. Bạn đồng ý không sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp hoặc bị cấm nào.",
        contentOwnershipTitle: "3. Quyền sở hữu Nội dung",
        contentOwnershipContent: "Bạn giữ quyền sở hữu đối với nội dung bạn tạo ra. Tuy nhiên, bằng việc đăng tải nội dung, bạn cấp cho VibeChat một giấy phép không độc quyền, toàn cầu để sử dụng, sao chép, và hiển thị nội dung đó liên quan đến việc cung cấp dịch vụ.",
        privacyTitle: "4. Quyền riêng tư",
        privacyContent: "Chính sách Quyền riêng tư của chúng tôi giải thích cách chúng tôi thu thập và sử dụng thông tin cá nhân của bạn. Bằng việc sử dụng dịch vụ, bạn đồng ý với việc thu thập và sử dụng thông tin này theo Chính sách Quyền riêng tư.",
        disclaimersTitle: "5. Tuyên bố Miễn trừ Trách nhiệm",
        disclaimersContent: "Dịch vụ được cung cấp 'NGUYÊN TRẠNG' mà không có bất kỳ bảo đảm nào, dù rõ ràng hay ngụ ý. Chúng tôi không đảm bảo rằng dịch vụ sẽ không bị gián đoạn hoặc không có lỗi.",
        limitationTitle: "6. Giới hạn Trách nhiệm",
        limitationContent: "Trong phạm vi tối đa được pháp luật cho phép, VibeChat sẽ không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, do hậu quả hoặc trừng phạt nào, hoặc bất kỳ tổn thất lợi nhuận hoặc doanh thu nào.",
        changesTitle: "7. Thay đổi Điều khoản",
        changesContent: "Chúng tôi có thể sửa đổi các Điều khoản này theo thời gian. Nếu chúng tôi thực hiện các thay đổi quan trọng, chúng tôi sẽ thông báo cho bạn. Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các điều khoản mới.",
        contactTitle: "8. Liên hệ",
        contactContent: "Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi qua email: support@vibechat.example.com.",
        lastUpdated: "Cập nhật lần cuối: 30 tháng 5 năm 2025"
    },
    en: {
        title: "Terms and Conditions",
        backToHome: "Back to Home",
        introductionTitle: "1. Introduction",
        introductionContent: "Welcome to VibeChat! By using our services, you agree to comply with these terms and conditions. Please read them carefully.",
        userResponsibilitiesTitle: "2. User Responsibilities",
        userResponsibilitiesContent: "You are responsible for your activity on VibeChat, including the content you post and your interactions with other users. You agree not to use the service for any illegal or prohibited purposes.",
        contentOwnershipTitle: "3. Content Ownership",
        contentOwnershipContent: "You retain ownership of the content you create. However, by posting content, you grant VibeChat a non-exclusive, worldwide license to use, copy, and display such content in connection with providing the service.",
        privacyTitle: "4. Privacy",
        privacyContent: "Our Privacy Policy explains how we collect and use your personal information. By using the service, you agree to the collection and use of this information in accordance with the Privacy Policy.",
        disclaimersTitle: "5. Disclaimers",
        disclaimersContent: "The service is provided 'AS IS' without any warranties, express or implied. We do not guarantee that the service will be uninterrupted or error-free.",
        limitationTitle: "6. Limitation of Liability",
        limitationContent: "To the maximum extent permitted by law, VibeChat shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.",
        changesTitle: "7. Changes to Terms",
        changesContent: "We may modify these Terms from time to time. If we make material changes, we will notify you. Your continued use of the service after the changes take effect constitutes your acceptance of the new terms.",
        contactTitle: "8. Contact Us",
        contactContent: "If you have any questions about these Terms, please contact us at support@vibechat.example.com.",
        lastUpdated: "Last updated: May 30, 2025"
    }
};

const TermsPage = () => {
    const { currentLanguage, t: translate } = useLanguage();
    const pageTranslations = translations[currentLanguage] || translations.en;

    // Helper function to get translation, falling back to English if key not found in current language
    const t = (key) => pageTranslations[key] || translations.en[key] || key;


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg p-8 md:p-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-8">
                    {t('title')}
                </h1>

                <div className="prose prose-indigo max-w-none text-gray-700">
                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('introductionTitle')}</h2>
                        <p>{t('introductionContent')}</p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('userResponsibilitiesTitle')}</h2>
                        <p>{t('userResponsibilitiesContent')}</p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('contentOwnershipTitle')}</h2>
                        <p>{t('contentOwnershipContent')}</p>
                    </section>
                    
                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('privacyTitle')}</h2>
                        <p>{t('privacyContent')}</p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('disclaimersTitle')}</h2>
                        <p>{t('disclaimersContent')}</p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('limitationTitle')}</h2>
                        <p>{t('limitationContent')}</p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('changesTitle')}</h2>
                        <p>{t('changesContent')}</p>
                    </section>

                    <section className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('contactTitle')}</h2>
                        <p>{t('contactContent')}</p>
                    </section>
                    
                    <p className="text-sm text-gray-500 mt-8">
                        {t('lastUpdated')}
                    </p>
                </div>

                <div className="mt-10 text-center">
                    <Link 
                        to="/" 
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                    >
                        {t('backToHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TermsPage; 