import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
export const LanguageContext = createContext();

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);

// Language provider component
export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('vi'); // Default to Vietnamese

    // Try to load saved language from localStorage on initial load
    useEffect(() => {
        const savedLanguage = localStorage.getItem('vibechat_language');
        if (savedLanguage) {
            setCurrentLanguage(savedLanguage);
        }
    }, []);

    // Change language function
    const changeLanguage = (lang) => {
        setCurrentLanguage(lang);
        localStorage.setItem('vibechat_language', lang); // Save to localStorage
    };

    // Value that will be provided to consumers of this context
    const value = {
        currentLanguage,
        changeLanguage,
        t: (key) => {
            const translations = {
                vi: {
                    language: "Ngôn ngữ",
                    support: "Hỗ trợ",
                    logout: "Đăng xuất",
                    exit: "Thoát",
                    vietnamese: "Tiếng Việt",
                    english: "English",
                    loading: "Đang tải...",
                    searchConversations: "Tìm kiếm cuộc trò chuyện...",
                    searchMessagesPlaceholder: "Tìm tin nhắn...",
                    noConversations: "Không có cuộc trò chuyện nào.",
                    editGroupTitle: "Chỉnh sửa nhóm",
                    messageInputPlaceholder: "Nhập @, tin nhắn tới ",
                    welcomeToZalaChat: "Chào mừng bạn đến với VibeChat",
                    selectConversationToStart: "Vui lòng chọn một cuộc trò chuyện để bắt đầu nhắn tin.",
                    addNewFriend: "Thêm bạn mới",
                    deleteMessageTitle: "Xóa tin nhắn",
                    deleteMessageBody: "Tin nhắn sẽ chỉ bị xóa đối với bạn. Người khác vẫn sẽ nhìn thấy tin nhắn này.",
                    cancel: "Hủy",
                    deleteForMe: "Xóa chỉ mình tôi",
                    revokeMessageTitle: "Thu hồi tin nhắn",
                    revokeMessageBody: "Bạn có chắc muốn thu hồi tin nhắn này? Tin nhắn sẽ bị xóa khỏi cuộc trò chuyện.",
                    revoke: "Thu hồi",
                    forwardMessageTitle: "Chuyển tiếp tin nhắn",
                    messageLabel: "Tin nhắn: ",
                    searchConversationsPlaceholder: "Tìm kiếm cuộc trò chuyện...",
                    noConversationsFound: "Không tìm thấy cuộc trò chuyện.",
                    forwardButton: "Chuyển tiếp",
                    user: "Người dùng",
                    conversation: "Cuộc trò chuyện",
                    group: "Nhóm",
                    directChat: "Chat riêng",
                    membersSuffix: "thành viên",
                    imagePreview: "🖼️ [Hình ảnh]",
                    videoPreview: "🎬 [Video]",
                    filePreviewPrefix: "📎 [File: ",
                    you: "Bạn",
                    otherUser: "Người dùng khác",
                    cancelReplyTitle: "Hủy trả lời",
                    attachFileTitle: "Gửi file đính kèm (tối đa 5MB)",
                    online: "Online",
                    offline: "Offline",
                    loadingStatus: "Đang tải trạng thái...",
                    noMessagesYet: "Chưa có tin nhắn nào.",
                    noMessagesFoundMatching: "Không tìm thấy tin nhắn nào khớp với",
                    messageRevoked: "Tin nhắn đã bị thu hồi",
                    messageDeleted: "Tin nhắn đã bị xóa",
                    replyToMessage: "Trả lời tin nhắn",
                    moreOptions: "Tùy chọn thêm",
                    revokeMessage: "Thu hồi tin nhắn",
                    forwardMessage: "Chuyển tiếp tin nhắn",
                    deleteMessage: "Xóa tin nhắn",
                    directChatTitle: "Chat riêng với bạn bè",
                    noFriends: "Bạn chưa có bạn bè nào",
                    createNewGroupChat: "Tạo nhóm chat mới",
                    groupNameLabel: "Tên nhóm",
                    enterGroupNamePlaceholder: "Nhập tên nhóm",
                    addMembers: "Thêm thành viên",
                    searchFriendsPlaceholder: "Tìm kiếm bạn bè...",
                    selectedFriendsCountPrefix: "Đã chọn ",
                    selectedFriendsCountSuffix: " người",
                    noFriendsFound: "Không tìm thấy bạn bè.",
                    addFriendsBeforeCreatingGroup: "Vui lòng thêm bạn bè trước khi tạo nhóm.",
                    creating: "Đang tạo...",
                    createGroup: "Tạo nhóm",
                    groupMembersTitle: "Thành viên nhóm",
                    groupMembersSubtitleSuffix1: " - ",
                    groupMembersSubtitleSuffix2: " thành viên",
                    admin: "Admin",
                    removeFromGroupTitle: "Xóa khỏi nhóm",
                    disbandGroup: "Giải tán nhóm",
                    leaveGroup: "Rời khỏi nhóm",
                    createNewChatTitle: "Tạo cuộc trò chuyện mới",
                    directChatWithFriends: "Chat riêng với bạn bè",
                    close: "Đóng",
                    noFriendsYet: "Bạn chưa có bạn bè nào.",
                    noMatchingFriendsFound: "Không tìm thấy bạn bè nào phù hợp.",
                    addMembersToGroupTitle: "Thêm thành viên vào nhóm",
                    selectFriendsToAddPrefix: "Chọn bạn bè để thêm vào \"",
                    selectFriendsToAddSuffix: "\"",
                    allFriendsInGroup: "Tất cả bạn bè đã ở trong nhóm này.",
                    adding: "Đang thêm...",
                    editGroup: "Chỉnh sửa nhóm",
                    changeGroupImage: "Thay đổi ảnh nhóm",
                    updating: "Đang cập nhật...",
                    update: "Cập nhật",
                    fileSizeLimitError: "File không được vượt quá 5MB.",
                    cannotRemoveAdminError: "Không thể xóa quản trị viên khỏi nhóm.",
                    memberRemovedNotificationMiddle: " đã bị xóa khỏi nhóm",
                    groupDisbandNotification: "Nhóm sẽ bị giải tán",
                    memberLeftNotificationMiddle: " đã rời khỏi nhóm",
                    memberAddedNotificationMiddle: " đã được thêm vào nhóm",
                    groupNameChangedNotificationPrefix: " đã đổi tên nhóm thành \"",
                    groupNameChangedNotificationSuffix: "\"",
                    groupInfoUpdatedNotificationMiddle: " đã cập nhật thông tin nhóm",
                    groupUpdateSuccessAlert: "Đã cập nhật thông tin nhóm thành công!",
                    searchingIn: "Đang tìm trong: ",
                    noMessagesFoundSimple: "Không tìm thấy tin nhắn.",
                    typeToSearchMessages: "Nhập để tìm tin nhắn.",
                    imageType: "Hình ảnh",
                    videoType: "Video",
                    messageType: "Tin nhắn",
                    system: "Hệ thống",
                    closeSearchPanel: "Đóng bảng tìm kiếm",
                    originalMessageRevoked: "Tin nhắn gốc đã được thu hồi",
                    clickToViewOriginal: "Nhấn để xem tin nhắn gốc",
                    posts: "Mạng xã hội",
                    createPost: "Tạo bài viết",
                    noPosts: "Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!",
                    newPost: "Tạo bài viết mới",
                    postTitle: "Tiêu đề",
                    postContent: "Nội dung",
                    enterPostTitle: "Nhập tiêu đề bài viết",
                    enterPostContent: "Nhập nội dung bài viết",
                    publishing: "Đang đăng...",
                    publish: "Đăng bài",
                    enterTitleAndContent: "Vui lòng nhập cả tiêu đề và nội dung bài viết",
                    postCreateError: "Có lỗi xảy ra khi tạo bài viết",
                    likes: "lượt thích",
                    like: "Thích",
                    unlike: "Bỏ thích",
                    addPhoto: "Thêm ảnh",
                    addVideo: "Thêm video",
                    media: "Ảnh/Video",
                    removeMedia: "Xóa file",
                    dropMediaHere: "Kéo thả ảnh/video vào đây hoặc nhấn để chọn",
                    mediaUploadError: "Có lỗi xảy ra khi tải lên file",
                    mediaFileSizeLimit: "File không được vượt quá 5MB",
                    mediaTypeNotSupported: "Định dạng file không được hỗ trợ",
                    // Post deletion translations
                    deletePost: "Xóa bài viết",
                    confirmDelete: "Xác nhận xóa",
                    deletePostConfirmation: "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.",
                    delete: "Xóa",
                    notAuthorized: "Bạn không có quyền xóa bài viết này",
                    deleteError: "Có lỗi xảy ra khi xóa bài viết",
                    // AI Image Generation translations
                    generateWithAI: "Tạo ảnh bằng AI",
                    uploadMedia: "Tải lên",
                    enterImagePrompt: "Nhập mô tả ảnh bạn muốn tạo...",
                    generating: "Đang tạo...",
                    generateImage: "Tạo ảnh",
                    generatingImage: "Đang tạo ảnh, vui lòng đợi...",
                    imageGenerationError: "Có lỗi xảy ra khi tạo ảnh",
                    previewGeneratedImage: "Xem trước ảnh đã tạo",
                    useInPost: "Sử dụng trong bài viết",
                    // Cloud Storage translations
                    cloud: "Lưu trữ",
                    myCloud: "Lưu trữ của tôi",
                    uploadToCloud: "Tải lên",
                    uploadToCloudTitle: "Tải file lên lưu trữ",
                    uploadSuccess: "Tải lên thành công",
                    uploadError: "Có lỗi xảy ra khi tải lên",
                    deleteFile: "Xóa file",
                    deleteFileConfirm: "Bạn có chắc chắn muốn xóa file này?",
                    deleteSuccess: "Xóa file thành công",
                    deleteFileError: "Có lỗi xảy ra khi xóa file",
                    noFiles: "Chưa có file nào được lưu trữ",
                    fileSize: "Kích thước",
                    uploadDate: "Ngày tải lên",
                    fileType: "Loại file",
                    allFiles: "Tất cả",
                    images: "Hình ảnh",
                    videos: "Video",
                    documents: "Tài liệu",
                    searchFiles: "Tìm kiếm file...",
                    download: 'Tải xuống',
                    downloadError: 'Có lỗi xảy ra khi tải xuống file',
                    fileNotFound: 'Không tìm thấy file',
                    unauthorizedAccess: 'Bạn không có quyền truy cập file này',
                    // Translations for VerifyNoticePage
                    verifyNoticePageTitle: "Xác Minh Email",
                    verifyNoticeEmailNotVerified: "Email của bạn chưa được xác minh.",
                    verifyNoticePleaseCheckEmail: "Vui lòng kiểm tra hộp thư đến (và cả thư mục spam) của bạn tại",
                    verifyNoticeClickLink: "và nhấp vào liên kết xác minh.",
                    verifyNoticeResendEmailButton: "Gửi lại Email Xác Minh",
                    verifyNoticeEmailResentSuccess: "Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
                    verifyNoticeEmailResentError: "Không thể gửi lại email xác minh. Vui lòng thử lại sau.",
                    verifyNoticeCheckVerificationButton: "Tôi Đã Xác Minh, Kiểm Tra Ngay",
                    verifyNoticeVerifyingProcess: "Đang kiểm tra...",
                    verifyNoticeStillNotVerified: "Email của bạn vẫn chưa được xác minh. Vui lòng kiểm tra lại email hoặc thử gửi lại.",
                    verifyNoticeVerificationSuccess: "Xác minh email thành công! Đang chuyển hướng...",
                    dbError: "Không thể lưu thông tin tài khoản sau khi xác thực. Vui lòng thử đăng nhập lại.",
                    pleaseLogin: "Vui lòng đăng nhập.",
                    verifyNoticeEmailAlreadyVerified: "Email của bạn đã được xác minh trước đó."
                },
                en: {
                    language: "Language",
                    support: "Support",
                    logout: "Log out",
                    exit: "Exit",
                    vietnamese: "Vietnamese",
                    english: "English",
                    loading: "Loading...",
                    searchConversations: "Search conversations...",
                    searchMessagesPlaceholder: "Search messages...",
                    noConversations: "No conversations yet.",
                    editGroupTitle: "Edit group",
                    messageInputPlaceholder: "Message @, text to ",
                    welcomeToZalaChat: "Welcome to VibeChat",
                    selectConversationToStart: "Please select a conversation to start messaging.",
                    addNewFriend: "Add new friend",
                    deleteMessageTitle: "Delete message",
                    deleteMessageBody: "The message will only be deleted for you. Others will still see this message.",
                    cancel: "Cancel",
                    deleteForMe: "Delete for me only",
                    revokeMessageTitle: "Revoke message",
                    revokeMessageBody: "Are you sure you want to revoke this message? It will be deleted from the conversation.",
                    revoke: "Revoke",
                    forwardMessageTitle: "Forward message",
                    messageLabel: "Message: ",
                    searchConversationsPlaceholder: "Search conversations...",
                    noConversationsFound: "No conversations found.",
                    forwardButton: "Forward",
                    user: "User",
                    conversation: "Conversation",
                    group: "Group",
                    directChat: "Direct Chat",
                    membersSuffix: "members",
                    imagePreview: "🖼️ [Image]",
                    videoPreview: "🎬 [Video]",
                    filePreviewPrefix: "📎 [File: ",
                    you: "You",
                    otherUser: "Other user",
                    cancelReplyTitle: "Cancel reply",
                    attachFileTitle: "Attach file (max 5MB)",
                    online: "Online",
                    offline: "Offline",
                    loadingStatus: "Loading status...",
                    noMessagesYet: "No messages yet.",
                    noMessagesFoundMatching: "No messages found matching",
                    messageRevoked: "Message has been revoked",
                    messageDeleted: "Message has been deleted",
                    replyToMessage: "Reply to message",
                    moreOptions: "More options",
                    revokeMessage: "Revoke message",
                    forwardMessage: "Forward message",
                    deleteMessage: "Delete message",
                    directChatTitle: "Direct chat with friends",
                    noFriends: "You have no friends yet",
                    createNewGroupChat: "Create new group chat",
                    groupNameLabel: "Group name",
                    enterGroupNamePlaceholder: "Enter group name",
                    addMembers: "Add members",
                    searchFriendsPlaceholder: "Search friends...",
                    selectedFriendsCountPrefix: "Selected ",
                    selectedFriendsCountSuffix: " people",
                    noFriendsFound: "No friends found.",
                    addFriendsBeforeCreatingGroup: "Please add friends before creating a group.",
                    creating: "Creating...",
                    createGroup: "Create group",
                    groupMembersTitle: "Group members",
                    groupMembersSubtitleSuffix1: " - ",
                    groupMembersSubtitleSuffix2: " members",
                    admin: "Admin",
                    removeFromGroupTitle: "Remove from group",
                    disbandGroup: "Disband group",
                    leaveGroup: "Leave group",
                    createNewChatTitle: "Create new chat",
                    directChatWithFriends: "Direct chat with friends",
                    close: "Close",
                    noFriendsYet: "You have no friends yet.",
                    noMatchingFriendsFound: "No matching friends found.",
                    addMembersToGroupTitle: "Add members to group",
                    selectFriendsToAddPrefix: "Select friends to add to \"",
                    selectFriendsToAddSuffix: "\"",
                    allFriendsInGroup: "All friends are already in this group.",
                    adding: "Adding...",
                    editGroup: "Edit Group",
                    changeGroupImage: "Change group image",
                    updating: "Updating...",
                    update: "Update",
                    fileSizeLimitError: "File cannot exceed 5MB.",
                    cannotRemoveAdminError: "Cannot remove admin from the group.",
                    memberRemovedNotificationMiddle: " has been removed from the group",
                    groupDisbandNotification: "The group will be disbanded",
                    memberLeftNotificationMiddle: " has left the group",
                    memberAddedNotificationMiddle: " has been added to the group",
                    groupNameChangedNotificationPrefix: " changed the group name to \"",
                    groupNameChangedNotificationSuffix: "\"",
                    groupInfoUpdatedNotificationMiddle: " updated the group information",
                    groupUpdateSuccessAlert: "Group information updated successfully!",
                    searchingIn: "Searching in: ",
                    noMessagesFoundSimple: "No messages found.",
                    typeToSearchMessages: "Type to search messages.",
                    imageType: "Image",
                    videoType: "Video",
                    messageType: "Message",
                    system: "System",
                    closeSearchPanel: "Close search panel",
                    originalMessageRevoked: "Original message has been revoked",
                    clickToViewOriginal: "Nhấn để xem tin nhắn gốc",
                    posts: "Social",
                    createPost: "Create post",
                    noPosts: "No posts yet. Be the first to share!",
                    newPost: "Create new post",
                    postTitle: "Title",
                    postContent: "Content",
                    enterPostTitle: "Enter post title",
                    enterPostContent: "Enter post content",
                    publishing: "Publishing...",
                    publish: "Publish",
                    enterTitleAndContent: "Please enter both title and content for your post",
                    postCreateError: "An error occurred while creating the post",
                    likes: "likes",
                    like: "Like",
                    unlike: "Unlike",
                    addPhoto: "Add photo",
                    addVideo: "Add video",
                    media: "Media",
                    removeMedia: "Remove file",
                    dropMediaHere: "Drag and drop image/video here or click to select",
                    mediaUploadError: "An error occurred while uploading the file",
                    mediaFileSizeLimit: "File cannot exceed 5MB",
                    mediaTypeNotSupported: "File type not supported",
                    // Post deletion translations
                    deletePost: "Delete post",
                    confirmDelete: "Confirm Deletion",
                    deletePostConfirmation: "Are you sure you want to delete this post? This action cannot be undone.",
                    delete: "Delete",
                    notAuthorized: "You are not authorized to delete this post",
                    deleteError: "An error occurred while deleting the post",
                    // AI Image Generation translations
                    generateWithAI: "Generate with AI",
                    uploadMedia: "Upload",
                    enterImagePrompt: "Enter description for the image you want to generate...",
                    generating: "Generating...",
                    generateImage: "Generate Image",
                    generatingImage: "Generating image, please wait...",
                    imageGenerationError: "An error occurred while generating the image",
                    previewGeneratedImage: "Preview Generated Image",
                    useInPost: "Use in Post",
                    // Cloud Storage translations
                    cloud: "Cloud",
                    myCloud: "My Cloud",
                    uploadToCloud: "Upload",
                    uploadToCloudTitle: "Upload to Cloud",
                    uploadSuccess: "Upload successful",
                    uploadError: "An error occurred while uploading",
                    deleteFile: "Delete file",
                    deleteFileConfirm: "Are you sure you want to delete this file?",
                    deleteSuccess: "File deleted successfully",
                    deleteFileError: "An error occurred while deleting the file",
                    noFiles: "No files stored yet",
                    fileSize: "Size",
                    uploadDate: "Upload date",
                    fileType: "File type",
                    allFiles: "All",
                    images: "Images",
                    videos: "Videos",
                    documents: "Documents",
                    searchFiles: "Search files...",
                    download: 'Download',
                    downloadError: 'An error occurred while downloading the file',
                    fileNotFound: 'File not found',
                    unauthorizedAccess: 'You do not have permission to access this file',
                    // Translations for VerifyNoticePage
                    verifyNoticePageTitle: "Verify Email",
                    verifyNoticeEmailNotVerified: "Your email is not verified.",
                    verifyNoticePleaseCheckEmail: "Please check your inbox (and spam folder) at",
                    verifyNoticeClickLink: "and click the verification link.",
                    verifyNoticeResendEmailButton: "Resend Verification Email",
                    verifyNoticeEmailResentSuccess: "Verification email has been resent. Please check your inbox.",
                    verifyNoticeEmailResentError: "Could not resend verification email. Please try again later.",
                    verifyNoticeCheckVerificationButton: "I Have Verified, Check Now",
                    verifyNoticeVerifyingProcess: "Verifying...",
                    verifyNoticeStillNotVerified: "Your email is still not verified. Please check your email again or try resending.",
                    verifyNoticeVerificationSuccess: "Email verification successful! Redirecting...",
                    dbError: "Could not save account details after verification. Please try logging in again.",
                    pleaseLogin: "Please log in.",
                    verifyNoticeEmailAlreadyVerified: "Your email was already verified."
                }
            };
            return translations[currentLanguage]?.[key] || key;
        }
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageProvider; 