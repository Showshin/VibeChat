import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, LogOut, MessageCircle, Image, Paperclip, Send, Smile, Users, UserPlus, Video, Contact, X, Trash2, Edit2, Plus, Forward, ArrowLeft, CornerUpRight, File, Edit3, Phone, Mic, XCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ConversationItem from '../components/ConversationItem.jsx';
import MessageComponent from '../components/MessageItem';
import NotificationMessage from '../components/NotificationMessage';
import ImageMessage from '../components/ImageMessage';
import VideoMessage from '../components/VideoMessage';
import FileMessage from '../components/FileMessage';
import ReplyMessage from '../components/ReplyMessage';
import UserProfile from '../components/UserProfile.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../firebase/firebase';
import { conversationApi, messageApi, userApi, storageApi } from '../api/firebaseApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; // Import useLanguage
import Navbar from '../components/Navbar';
import { updateDoc, serverTimestamp, onSnapshot, setDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { collection, query, where, getDocs, doc as firestoreDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../index.css';
import { toast } from 'react-toastify';

// Fix lỗi "global is not defined" khi sử dụng simple-peer
if (typeof global === 'undefined') {
    window.global = window;
}

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
        <div className="text-indigo-500 text-lg font-medium">Loading...</div>
        <div className="flex mt-4">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mx-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-purple-500 mx-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500 mx-1 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    </div>
);

function ChatPage() {
    const { currentUser, updateUserInfo } = useAuth();
    const { t } = useLanguage(); // Extract the t() function for translations
    const userId = currentUser?.uid;
    const navigate = useNavigate();
    const { conversationId } = useParams();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userInfo, setUserInfo] = useState({ phoneNumber: '', fullName: '', img: '' });
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
    const [groupImage, setGroupImage] = useState(null);
    const [groupImagePreview, setGroupImagePreview] = useState('');
    const messagesEndRef = useRef(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [searchConversation, setSearchConversation] = useState('');
    const [memberInfoCache, setMemberInfoCache] = useState({});
    const [hasSelectedFile, setHasSelectedFile] = useState(false);
    const [replyMessage, setReplyMessage] = useState(null);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [availableFriends, setAvailableFriends] = useState([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [friendSearch, setFriendSearch] = useState('');
    const [membersList, setMembersList] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showChatOptions, setShowChatOptions] = useState(false);
    const [showDirectChatModal, setShowDirectChatModal] = useState(false);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [friends, setFriends] = useState([]);
    const [creatingChat, setCreatingChat] = useState(false);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [isAddingMembers, setIsAddingMembers] = useState(false);

    // State for message search
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
    const [isTransferringAdmin, setIsTransferringAdmin] = useState(false);
    const [newAdminId, setNewAdminId] = useState(null);

    // Stores the unsubscribe function for the other user's info listener
    const otherUserInfoUnsubscribeRef = useRef(null);

    // Add this ref to track the conversation title listener
    const conversationTitleListenerRef = useRef(null);

    useEffect(() => {
        if (!userId) {
            navigate('/login');
        } else {
            userApi.checkUserExists(userId).then(exists => {
                if (!exists) {
                    userApi.createUser(userId, {
                        user_id: userId,
                        email: currentUser.email,
                        fullName: currentUser.displayName || '',
                        phoneNumber: '',
                        img: '',
                        status: 'offline',
                        lastSeen: new Date()
                    });
                }
            });
        }
    }, [userId, navigate, currentUser]);

    useEffect(() => {
        if (userId) {
            userApi.getUserInfo(userId).then(data => {
                if (data) setUserInfo(data);
            });
        }
    }, [userId]);

    /**
     * Lấy các cuộc trò chuyện của người dùng từ Firestore
     * @returns {Function} Hàm unsubscribe để hủy đăng ký listener
     */
    const fetchConversations = useCallback(() => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        return conversationApi.getConversations(userId, (conversations) => {
            setConversations(conversations);
            setIsLoading(false);
        });
    }, [userId]);

    useEffect(() => {
        const unsubscribe = fetchConversations();
        return () => unsubscribe && unsubscribe();
    }, [fetchConversations]);

    /**
     * Cuộn xuống tin nhắn cuối cùng
     */
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    /**
     * Đặt lại input file sau khi upload
     */
    const resetFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            setHasSelectedFile(false);
        }
    }, []);

    /**
     * Lấy các tin nhắn từ cuộc trò chuyện đã chọn
     * @returns {Function} Hàm unsubscribe để hủy đăng ký listener
     */
    const fetchMessages = useCallback(() => {
        if (!selectedConversation) return;
        setIsLoadingMessages(true);
        return messageApi.getMessages(selectedConversation.con_id, (messages) => {
            setMessages(messages);
            scrollToBottom();
            setIsLoadingMessages(false);
        });
    }, [selectedConversation, scrollToBottom]);

    useEffect(() => {
        const unsubscribe = fetchMessages();
        return () => unsubscribe && unsubscribe();
    }, [fetchMessages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Gửi tin nhắn văn bản đến cuộc trò chuyện hiện tại
     */
    const handleSendMessage = useCallback(async () => {
        if (!message.trim() || !selectedConversation) return;
        const messageContent = message.trim();
        setMessage('');
        const messageData = {
            con_id: selectedConversation.con_id,
            content: messageContent,
            sender_id: userId,
            type: 'text'
        };
        if (replyMessage) {
            const senderName = replyMessage.sender_id === userId ? 'Bạn' : (otherUserInfo?.fullName || 'Người dùng');
            messageData.replyTo = {
                id: replyMessage.id,
                content: replyMessage.content,
                type: replyMessage.type,
                senderName: senderName,
                timestamp: replyMessage.timestamp,
                sender_id: replyMessage.sender_id
            };
            setReplyMessage(null);
        }
        await messageApi.sendMessage(messageData);
        const conversationRef = doc(db, 'Conversations', selectedConversation.con_id);
        await updateDoc(conversationRef, { mess_info: [messageContent, Date.now()] });
        
        // Cuộn xuống dưới sau khi gửi tin nhắn
        scrollToBottom();
    }, [message, selectedConversation, userId, replyMessage, otherUserInfo, scrollToBottom]);

    /**
     * Xử lý phím tắt Enter để gửi tin nhắn
     * @param {Event} e - Sự kiện bàn phím
     */
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    /**
     * Xử lý khi chọn biểu tượng cảm xúc
     * @param {Object} emojiData - Dữ liệu của emoji được chọn
     */
    const handleEmojiClick = useCallback((emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    }, []);

    /**
     * Xử lý chọn file để gửi trong cuộc trò chuyện
     * @param {Event} e - Sự kiện thay đổi input file
     */
    const handleFileSelect = useCallback(async (e) => {
        if (!e.target.files.length || !selectedConversation) {
            resetFileInput();
            return;
        }
        const file = e.target.files[0];
        setHasSelectedFile(true);
        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            alert('File không được vượt quá 5MB');
            resetFileInput();
            return;
        }
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const fileType = isImage ? 'image' : isVideo ? 'video' : 'file';
        setIsUploading(true);
        const fileUrl = await storageApi.uploadFile(file, userId);
        await messageApi.sendMessage({
            con_id: selectedConversation.con_id,
            content: file.name,
            sender_id: userId,
            type: fileType,
            url: fileUrl
        });
        const messagePreview = isImage ? '🖼️ [Hình ảnh]' : isVideo ? '🎬 [Video]' : '📎 [File]';
        const conversationRef = doc(db, 'Conversations', selectedConversation.con_id);
        await updateDoc(conversationRef, { mess_info: [messagePreview, Date.now()] });
        scrollToBottom();
        setIsUploading(false);
        resetFileInput();
    }, [selectedConversation, userId, scrollToBottom, resetFileInput]);

    useEffect(() => {
        if (!fileInputRef.current) {
            fileInputRef.current = document.createElement('input');
            fileInputRef.current.type = 'file';
            fileInputRef.current.accept = '*/*';
            fileInputRef.current.onchange = handleFileSelect;
        }
    }, [handleFileSelect]);

    const handleAvatarClick = useCallback(() => setShowProfile(true), []);
    const handleProfileClose = useCallback(() => {
        setShowProfile(false);
    }, []);

    /**
     * Lấy tiêu đề cho cuộc trò chuyện
     * @param {Object} conversation - Thông tin cuộc trò chuyện
     * @returns {Promise<string>} Tiêu đề cuộc trò chuyện
     */
    const getConversationTitle = useCallback(async (conversation) => {
        if (conversation.is_group && conversation.name) return conversation.name;
        if (conversation.members && conversation.members.length === 2) {
            const otherMember = conversation.members.find(member => {
                const memberId = typeof member === 'object' ? member.user_id : member;
                return memberId !== userId;
            });
            if (otherMember) {
                // Luôn lấy ID người dùng, dù otherMember là đối tượng hay chuỗi
                const otherMemberId = typeof otherMember === 'object' ? otherMember.user_id : otherMember;
                
                try {
                    // Luôn lấy thông tin người dùng mới nhất từ cơ sở dữ liệu bằng ID
                    const userData = await userApi.getUserInfo(otherMemberId);
                    return userData ? userData.fullName || userData.user_name || 'Người dùng' : 'Người dùng';
                } catch (error) {
                    console.error(`Lỗi khi lấy thông tin người dùng với ID ${otherMemberId}:`, error);
                    // Sử dụng dữ liệu cục bộ nếu có
                    if (typeof otherMember === 'object') {
                        return otherMember.fullName || otherMember.user_name || 'Người dùng';
                    }
                    return 'Người dùng';
                }
            }
        }
        return 'Chat riêng';
    }, [userId]);

    /**
     * Xử lý khi chọn một cuộc trò chuyện
     * @param {Object} conversation - Cuộc trò chuyện được chọn
     */
    const handleSelectConversation = useCallback(async (conversation) => {
        // Dọn dẹp listener trước đó nếu có
        if (conversationTitleListenerRef.current) {
            conversationTitleListenerRef.current();
            conversationTitleListenerRef.current = null;
        }
        
        setSelectedConversation(conversation);
        
        // Initial title setting
        const initialTitle = await getConversationTitle(conversation);
        setSelectedContact({
            id: conversation.con_id,
            name: initialTitle,
            isGroup: conversation.is_group,
            img: conversation.img || 'Con mèo',
            messages: []
        });
        
        // Thiết lập real-time listener cho nhóm chat
        if (conversation.is_group && conversation.con_id) {
            // Set up real-time listener for group info changes (name, image)
            const conversationRef = doc(db, 'Conversations', conversation.con_id);
            conversationTitleListenerRef.current = onSnapshot(conversationRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const updatedConversation = docSnapshot.data();
                    setSelectedContact(prev => ({
                        ...prev,
                        name: updatedConversation.name || prev.name,
                        img: updatedConversation.img || prev.img
                    }));
                }
            });
        }
        // Set up real-time listener for user info updates if it's a direct chat
        else if (!conversation.is_group && conversation.members && conversation.members.length === 2) {
            const otherMember = conversation.members.find(member => {
                const memberId = typeof member === 'object' ? member.user_id : member;
                return memberId !== userId;
            });
            
            if (otherMember) {
                const otherMemberId = typeof otherMember === 'object' ? otherMember.user_id : otherMember;
                
                // Set up real-time listener for the other user's info
                conversationTitleListenerRef.current = userApi.listenToUserInfo(otherMemberId, (userData) => {
                    if (userData) {
                        setSelectedContact(prev => ({
                            ...prev,
                            name: userData.fullName || userData.user_name || 'Người dùng'
                        }));
                    }
                });
            }
        }
        
        // Reset message search when conversation changes
        setMessageSearchQuery('');
        setShowSearchPanel(false);
    }, [getConversationTitle, userId]);
    
    // Add cleanup on component unmount
    useEffect(() => {
        return () => {
            if (conversationTitleListenerRef.current) {
                conversationTitleListenerRef.current();
                conversationTitleListenerRef.current = null;
            }
        };
    }, []);

    /**
     * Xóa một tin nhắn đối với người dùng hiện tại
     * @param {string} messageId - ID của tin nhắn cần xóa
     */
    const handleDeleteMessage = useCallback(async (messageId) => {
        const [con_id, timestamp] = messageId.split('/');
        const messagesQuery = query(
            collection(db, 'Messages'),
            where('con_id', '==', con_id),
            where('timestamp', '==', Number(timestamp) || timestamp)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        if (messagesSnapshot.empty) return;
        const messageDoc = messagesSnapshot.docs[0];
        const messageData = messageDoc.data();
        const deletedFor = messageData.deletedFor || [];
        if (deletedFor.includes(userId)) return;
        deletedFor.push(userId);
        await updateDoc(messageDoc.ref, { deletedFor: deletedFor, lastDeletedAt: serverTimestamp() });
    }, [userId]);

    /**
     * Thu hồi một tin nhắn cho tất cả người dùng
     * @param {string} messageId - ID của tin nhắn cần thu hồi
     */
    const handleRevokeMessage = useCallback(async (messageId) => {
        const [con_id, timestamp] = messageId.split('/');
        const messagesQuery = query(
            collection(db, 'Messages'),
            where('con_id', '==', con_id),
            where('timestamp', '==', Number(timestamp) || timestamp)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        if (messagesSnapshot.empty) return;
        const messageRef = messagesSnapshot.docs[0].ref;
        await updateDoc(messageRef, { revoked: true });
        
        // Tìm và thu hồi tất cả các trả lời cho tin nhắn này
        const repliesQuery = query(
            collection(db, 'Messages'),
            where('con_id', '==', con_id),
            where('replyTo.id', '==', messageId)
        );
        
        try {
            const repliesSnapshot = await getDocs(repliesQuery);
            const batch = writeBatch(db);
            
            repliesSnapshot.forEach((replyDoc) => {
                batch.update(replyDoc.ref, { 
                    revoked: true,
                    systemRevoked: true // Đánh dấu rằng tin nhắn này được thu hồi tự động (không phải bởi người dùng)
                });
            });
            
            if (!repliesSnapshot.empty) {
                await batch.commit();
                console.log(`Đã thu hồi ${repliesSnapshot.size} tin nhắn trả lời cho tin nhắn ${messageId}`);
            }
        } catch (error) {
            console.error("Lỗi khi thu hồi tin nhắn trả lời:", error);
        }
    }, []);

    /**
     * Mở modal xác nhận xóa tin nhắn
     * @param {Object} message - Tin nhắn cần xóa
     */
    const openDeleteModal = useCallback((message) => {
        setSelectedMessage(message);
        setShowDeleteModal(true);
    }, []);

    /**
     * Mở modal xác nhận thu hồi tin nhắn
     * @param {Object} message - Tin nhắn cần thu hồi
     */
    const openRevokeModal = useCallback((message) => {
        setSelectedMessage(message);
        setShowRevokeModal(true);
    }, []);

    /**
     * Xác nhận và thực hiện xóa tin nhắn
     */
    const confirmDeleteMessage = useCallback(() => {
        if (selectedMessage) {
            handleDeleteMessage(`${selectedMessage.con_id}/${selectedMessage.timestamp}`);
            setShowDeleteModal(false);
            setSelectedMessage(null);
        }
    }, [selectedMessage, handleDeleteMessage]);

    /**
     * Xác nhận và thực hiện thu hồi tin nhắn
     */
    const confirmRevokeMessage = useCallback(() => {
        if (selectedMessage) {
            handleRevokeMessage(`${selectedMessage.con_id}/${selectedMessage.timestamp}`);
            setShowRevokeModal(false);
            setSelectedMessage(null);
        }
    }, [selectedMessage, handleRevokeMessage]);

    /**
     * Thiết lập listener theo dõi thông tin người dùng khác trong cuộc trò chuyện
     * @param {Object} conversation - Cuộc trò chuyện hiện tại
     */
    const fetchOtherUserInfo = useCallback((conversation) => { 
        if (!conversation || conversation.is_group || !userId) {
            setOtherUserInfo(null); // Xóa thông tin nếu không áp dụng
            // Hủy đăng ký nếu chúng ta đang xóa do loại cuộc trò chuyện không hợp lệ
            if (otherUserInfoUnsubscribeRef.current) {
                otherUserInfoUnsubscribeRef.current();
                otherUserInfoUnsubscribeRef.current = null;
            }
            return;
        }
        const otherMemberIdObject = conversation.members?.find(member => {
            const memberId = typeof member === 'object' ? member.user_id : member;
            return memberId !== userId;
        });

        if (!otherMemberIdObject) {
            setOtherUserInfo(null);
            if (otherUserInfoUnsubscribeRef.current) {
                otherUserInfoUnsubscribeRef.current();
                otherUserInfoUnsubscribeRef.current = null;
            }
            return;
        }

        const targetId = typeof otherMemberIdObject === 'object' ? otherMemberIdObject.user_id : otherMemberIdObject;
        if (!targetId) {
             setOtherUserInfo(null);
             if (otherUserInfoUnsubscribeRef.current) {
                otherUserInfoUnsubscribeRef.current();
                otherUserInfoUnsubscribeRef.current = null;
            }
             return;
        }

        // Hủy đăng ký listener trước đó trước khi bắt đầu một cái mới
        if (otherUserInfoUnsubscribeRef.current) {
            otherUserInfoUnsubscribeRef.current();
        }

        // Thiết lập listener mới và lưu trữ hàm hủy đăng ký
        otherUserInfoUnsubscribeRef.current = userApi.listenToUserInfo(targetId, (userData) => {
            setOtherUserInfo(userData);
        });

    }, [userId]); // userId là dependency duy nhất vì nó ổn định và được sử dụng để so sánh

    useEffect(() => {
        if (selectedConversation && !selectedConversation.is_group) {
            fetchOtherUserInfo(selectedConversation);
        } else {
            // Not a 1-on-1 chat, or no conversation selected, clear user info and unsubscribe
            setOtherUserInfo(null);
            if (otherUserInfoUnsubscribeRef.current) {
                otherUserInfoUnsubscribeRef.current();
                otherUserInfoUnsubscribeRef.current = null; // Good practice to nullify after calling
            }
        }

        // Cleanup listener on component unmount
        return () => {
            if (otherUserInfoUnsubscribeRef.current) {
                otherUserInfoUnsubscribeRef.current();
                otherUserInfoUnsubscribeRef.current = null; // Good practice to nullify after calling
            }
        };
    // Rerun when selectedConversation changes. fetchOtherUserInfo is stable.
    }, [selectedConversation, fetchOtherUserInfo]);

    /**
     * Mở modal để chuyển tiếp tin nhắn
     * @param {Object} message - Tin nhắn cần chuyển tiếp
     */
    const openForwardModal = useCallback((message) => {
        setForwardMessage(message);
        setShowForwardModal(true);
        setSelectedConversations([]);
    }, []);

    /**
     * Chọn hoặc bỏ chọn cuộc trò chuyện khi chuyển tiếp tin nhắn
     * @param {Object} conversation - Cuộc trò chuyện cần chọn/bỏ chọn
     */
    const toggleConversationSelection = useCallback((conversation) => {
        setSelectedConversations(prev => {
            const isSelected = prev.some(c => c.con_id === conversation.con_id);
            return isSelected ? prev.filter(c => c.con_id !== conversation.con_id) : [...prev, conversation];
        });
    }, []);

    /**
     * Gửi tin nhắn đã chọn đến các cuộc trò chuyện đã chọn
     */
    const handleSendForwardMessage = useCallback(async () => {
        if (!forwardMessage || !selectedConversations.length) return;
        const messageData = {
            sender_id: userId,
            content: forwardMessage.content,
            type: forwardMessage.type || 'text'
        };
        if (forwardMessage.type === 'image' || forwardMessage.type === 'video' || forwardMessage.type === 'file') {
            messageData.url = forwardMessage.url;
        }
        const getMessagePreviewForInfo = () => {
            switch (forwardMessage.type) {
                case 'image': return '🖼️ [Hình ảnh]';
                case 'video': return '🎬 [Video]';
                case 'file': return '📎 [File: ' + forwardMessage.content + ']';
                default: return forwardMessage.content;
            }
        };
        const messagePreview = getMessagePreviewForInfo();
        const currentTime = Date.now();
        await Promise.all(
            selectedConversations.map(async (conv) => {
                await messageApi.sendMessage({ ...messageData, con_id: conv.con_id });
                const conversationRef = doc(db, 'Conversations', conv.con_id);
                await updateDoc(conversationRef, { mess_info: [messagePreview, currentTime] });
            })
        );
        setShowForwardModal(false);
        setForwardMessage(null);
        setSelectedConversations([]);
    }, [forwardMessage, selectedConversations, userId]);

    /**
     * Lấy thông tin cho cuộc trò chuyện trong danh sách
     * @param {Object} conv - Cuộc trò chuyện cần lấy thông tin
     * @returns {Object} Thông tin tiêu đề và chữ cái đầu của cuộc trò chuyện
     */
    const getConversationInfo = useCallback((conv) => {
        if (conv.is_group && conv.name) return { title: conv.name, letter: conv.name.charAt(0).toUpperCase() };
        if (conv.members?.length === 2) {
            const otherMember = conv.members.find(m => (typeof m === 'object' ? m.user_id : m) !== userId);
            if (!otherMember) return { title: 'Người dùng', letter: 'U' };
            if (typeof otherMember === 'object') {
                const name = otherMember.fullName || otherMember.user_name || 'Người dùng';
                return { title: name, letter: name.charAt(0).toUpperCase() };
            }
            if (memberInfoCache[otherMember]) {
                const name = memberInfoCache[otherMember].fullName || 'Người dùng';
                return { title: name, letter: name.charAt(0).toUpperCase() };
            }
            userApi.getUserInfo(otherMember)
                .then(userData => userData && setMemberInfoCache(prev => ({ ...prev, [otherMember]: userData })));
            return { title: 'Đang tải...', letter: '?' };
        }
        return { title: 'Cuộc trò chuyện', letter: 'C' };
    }, [userId, memberInfoCache]);

    /**
     * Trả lời một tin nhắn
     * @param {Object} message - Tin nhắn cần trả lời
     */
    const handleReplyMessage = useCallback((message) => {
        if (!message) return;
        setReplyMessage({
            id: `${message.con_id}/${message.timestamp}`,
            content: message.content || message.text,
            type: message.type || 'text',
            timestamp: message.timestamp,
            sender_id: message.sender_id || message.from,
            url: message.url
        });
    }, []);

    /**
     * Hủy bỏ trả lời tin nhắn
     */
    const cancelReply = useCallback(() => {
        setReplyMessage(null);
    }, []);

    /**
     * Hiển thị danh sách thành viên của nhóm
     */
    const handleShowMembers = useCallback(() => {
        setShowMembersModal(true);
    }, []);

    const fetchGroupMembers = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.members) return;
        if (isLoadingMembers) return;
        setIsLoadingMembers(true);
        const members = [];
        const memberIds = selectedConversation.members.map(member =>
            typeof member === 'object' ? member.user_id : member
        ).filter(id => id);
        setIsAdmin(selectedConversation.admin === userId);
        const memberIdsToFetch = [];
        for (const id of memberIds) {
            if (!id) continue;
            if (memberInfoCache[id]) {
                members.push({
                    ...memberInfoCache[id],
                    id: id,
                    isAdmin: id === selectedConversation.admin
                });
            } else {
                memberIdsToFetch.push(id);
            }
        }
        if (memberIdsToFetch.length > 0) {
            for (const id of memberIdsToFetch) {
                const userData = await userApi.getUserInfo(id);
                if (userData) {
                    members.push({
                        ...userData,
                        id: id,
                        isAdmin: id === selectedConversation.admin
                    });
                    setMemberInfoCache(prev => ({ ...prev, [id]: userData }));
                }
            }
        }
        setMembersList(members);
        setIsLoadingMembers(false);
    }, [selectedConversation, userId, memberInfoCache]);

    useEffect(() => {
        if (!selectedConversation) return;
        let unsubscribe = null;
        if (selectedConversation.is_group && selectedConversation.con_id) {
            const updateMembersList = async () => {
                if (!selectedConversation || !selectedConversation.members) return;
                setIsLoadingMembers(true);
                const members = [];
                const memberIds = selectedConversation.members.map(member =>
                    typeof member === 'object' ? member.user_id : member
                ).filter(id => id);

                // Check if current user is still a member
                const isCurrentUserMember = memberIds.includes(userId);
                if (!isCurrentUserMember) {
                    // Reset chat if user is no longer a member
                    setSelectedConversation(null);
                    setSelectedContact(null);
                    setMembersList([]);
                    setIsAdmin(false);
                    setIsLoadingMembers(false);
                    setMessages([]);
                    setReplyMessage(null);
                    setShowMembersModal(false);
                    setShowEditGroupModal(false);
                    setShowAddMembersModal(false);
                    setForwardMessage(null);
                    setShowForwardModal(false);
                    setShowSearchPanel(false);
                    setMessageSearchQuery('');
                    return;
                }

                setIsAdmin(selectedConversation.admin === userId);
                const memberIdsToFetch = [];
                for (const id of memberIds) {
                    if (!id) continue;
                    if (memberInfoCache[id]) {
                        members.push({
                            ...memberInfoCache[id],
                            id: id,
                            isAdmin: id === selectedConversation.admin
                        });
                    } else {
                        memberIdsToFetch.push(id);
                    }
                }
                if (memberIdsToFetch.length > 0) {
                    for (const id of memberIdsToFetch) {
                        const userData = await userApi.getUserInfo(id);
                        if (userData) {
                            members.push({
                                ...userData,
                                id: id,
                                isAdmin: id === selectedConversation.admin
                            });
                            setMemberInfoCache(prev => ({ ...prev, [id]: userData }));
                        }
                    }
                }
                setMembersList(members);
                setIsLoadingMembers(false);
            };

            // Initial update
            updateMembersList();

            // Set up real-time listener for conversation changes
            const conversationRef = doc(db, 'Conversations', selectedConversation.con_id);
            unsubscribe = onSnapshot(conversationRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const updatedConversation = docSnapshot.data();
                    if (!updatedConversation.members) return;

                    // Check if current user is still a member
                    const memberIds = updatedConversation.members.map(member =>
                        typeof member === 'object' ? member.user_id : member
                    ).filter(id => id);
                    const isCurrentUserMember = memberIds.includes(userId);

                    if (!isCurrentUserMember) {
                        // Reset chat if user is no longer a member
                        setSelectedConversation(null);
                        setSelectedContact(null);
                        setMembersList([]);
                        setIsAdmin(false);
                        setMessages([]);
                        setReplyMessage(null);
                        setShowMembersModal(false);
                        setShowEditGroupModal(false);
                        setShowAddMembersModal(false);
                        setForwardMessage(null);
                        setShowForwardModal(false);
                        setShowSearchPanel(false);
                        setMessageSearchQuery('');
                        return;
                    }

                    // Update selected conversation state
                    setSelectedConversation(prev => {
                        if (!prev) return updatedConversation;
                        return {
                            ...prev,
                            members: updatedConversation.members || [],
                            name: updatedConversation.name,
                            admin: updatedConversation.admin
                        };
                    });

                    // Update members list whenever conversation changes
                    updateMembersList();
                }
            });
        } else {
            setMembersList([]);
            setIsAdmin(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedConversation?.con_id, userId, memberInfoCache]);

    const addMemberToGroup = useCallback(async (friendId) => {
        if (!selectedConversation || !selectedConversation.is_group) return;
        await conversationApi.addMemberToGroup(selectedConversation.con_id, friendId);
    }, [selectedConversation]);

    const removeMemberFromGroup = useCallback(async (memberId) => {
        if (!selectedConversation || !selectedConversation.is_group || !isAdmin) return;
        if (selectedConversation.admin === memberId) {
            alert('Không thể xóa quản trị viên khỏi nhóm.');
            return;
        }
        const memberToRemove = membersList.find(member => member.id === memberId);
        const memberName = memberToRemove?.fullName || 'Một thành viên';
        await conversationApi.removeMemberFromGroup(selectedConversation.con_id, memberId);
        setMembersList(prev => prev.filter(member => member.id !== memberId));
        await messageApi.sendMessage({
            con_id: selectedConversation.con_id,
            content: `${memberName} đã bị xóa khỏi nhóm`,
            sender_id: "system",
            type: "notification"
        });
        const updatedConversationsSnapshot = await conversationApi.getConversationById(selectedConversation.con_id);
        if (updatedConversationsSnapshot) {
            setSelectedConversation(prev => ({ ...prev, members: updatedConversationsSnapshot.members }));
        }
    }, [selectedConversation, isAdmin, membersList]);

    const fetchFriends = useCallback(async () => {
        if (!userId) return;
        const friends = await userApi.getFriendsList(userId);
        setAvailableFriends(friends || []);
    }, [userId]);

    const toggleFriendSelection = useCallback((friend) => {
        if (!friend || !friend.user_id) {
            console.error('Thông tin bạn bè không hợp lệ:', friend);
            return;
        }

        setSelectedFriends(prev => {
            const isSelected = prev.some(f => f.user_id === friend.user_id);
            console.log(`${isSelected ? 'Bỏ chọn' : 'Chọn'} bạn: ${friend.fullName || friend.email || friend.user_id}`);
            return isSelected ? prev.filter(f => f.user_id !== friend.user_id) : [...prev, friend];
        });
    }, []);

    const groupFriendsFiltered = useMemo(() => {
        if (!friendSearch.trim()) return availableFriends;
        const query = friendSearch.toLowerCase();
        return availableFriends.filter(friend =>
            friend.fullName?.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query)
        );
    }, [availableFriends, friendSearch]);

    const handleCreateGroup = async () => {
        // Kiểm tra tên nhóm
        if (!groupName || !groupName.trim()) {
            toast.error('Vui lòng nhập tên nhóm');
            return;
        }

        // Kiểm tra thành viên
        if (!selectedFriends || !Array.isArray(selectedFriends) || selectedFriends.length < 1) {
            toast.error('Vui lòng chọn ít nhất 1 bạn bè để tạo nhóm');
            return;
        }

        // Kiểm tra từng thành viên có đủ thông tin cần thiết không
        const validFriends = selectedFriends.filter(friend => friend && friend.user_id);
        if (validFriends.length < 1) {
            toast.error('Không đủ thành viên hợp lệ để tạo nhóm');
            console.error('Danh sách bạn bè không hợp lệ:', selectedFriends);
            return;
        }

        setIsCreatingGroup(true);

        try {
            const createdAt = new Date();
            // Đảm bảo currentUser.uid tồn tại
            if (!currentUser || !currentUser.uid) {
                throw new Error('Người dùng hiện tại không hợp lệ');
            }

            // Thêm người dùng hiện tại vào danh sách thành viên
            const allMembers = [
                {
                    user_id: currentUser.uid,
                    user_name: currentUser.fullName || userInfo.fullName || 'Người dùng'
                }
            ];

            // Thêm các bạn bè đã chọn vào danh sách
            for (const friend of validFriends) {
                if (friend && friend.user_id) {
                    allMembers.push({
                        user_id: friend.user_id,
                        user_name: friend.fullName || friend.email || 'Người dùng'
                    });
                }
            }

            // Log để debug
            console.log('Danh sách thành viên:', allMembers);

            const groupData = {
                name: groupName.trim(),
                members: allMembers,
                admin: currentUser.uid,
                created_at: createdAt
            };

            // Log để debug
            console.log('Dữ liệu nhóm sẽ tạo:', groupData);

            const groupId = await conversationApi.createGroup(groupData);

            if (groupId) {
                // Lấy thông tin nhóm mới tạo
                const groupData = await conversationApi.getConversationById(groupId);
                console.log('Nhóm đã tạo:', groupData);

                // Cập nhật UI
                setSelectedConversation(groupData || groupId);
                setSelectedFriends([]);
                setGroupName('');
                setShowCreateGroupModal(false);
                toast.success('Tạo nhóm thành công');
            } else {
                toast.error('Không thể tạo nhóm');
            }
        } catch (error) {
            console.error('Lỗi khi tạo nhóm:', error);
            toast.error('Có lỗi xảy ra khi tạo nhóm: ' + (error.message || 'Lỗi không xác định'));
        }

        setIsCreatingGroup(false);
    };

    const fetchFriendsList = useCallback(async () => {
        setIsLoadingFriends(true);
        const friendsList = await userApi.getFriendsList(userId);
        setFriends(friendsList);
        setIsLoadingFriends(false);
    }, [userId]);

    const handleOpenChatOptions = useCallback(() => {
        setShowChatOptions(true);
    }, []);

    const handleCloseChatOptions = useCallback(() => {
        setShowChatOptions(false);
    }, []);

    const handleOpenDirectChat = useCallback(() => {
        setShowDirectChatModal(true);
        setShowChatOptions(false);
        fetchFriendsList();
    }, [fetchFriendsList]);

    const handleCloseDirectChat = useCallback(() => {
        setShowDirectChatModal(false);
        setFriendSearch('');
    }, []);

    const directChatFriendsFiltered = useMemo(() => {
        if (!friendSearch.trim()) return friends;
        const query = friendSearch.toLowerCase();
        return friends.filter(friend =>
            (friend.fullName && friend.fullName.toLowerCase().includes(query)) ||
            (friend.email && friend.email.toLowerCase().includes(query))
        );
    }, [friends, friendSearch]);

    const createDirectChat = useCallback(async (friend) => {
        setCreatingChat(friend.user_id);
        const existingConversationId = await conversationApi.findConversationBetweenUsers(userId, friend.user_id);
        let selectedConvId = existingConversationId;
        if (!existingConversationId) {
            selectedConvId = await conversationApi.createConversation(
                userId,
                friend.user_id,
                userInfo.fullName || '',
                friend.fullName || ''
            );
        }
        let targetConversation = conversations.find(conv => conv.con_id === selectedConvId);
        if (!targetConversation) {
            await fetchConversations();
            if (!existingConversationId) {
                targetConversation = {
                    con_id: selectedConvId,
                    is_group: false,
                    members: [
                        { user_id: userId },
                        { user_id: friend.user_id }
                    ],
                    mess_info: ['', ''],
                    createdAt: Date.now()
                };
            }
        }
        if (targetConversation) {
            handleSelectConversation(targetConversation);
        }
        handleCloseDirectChat();
        setCreatingChat(false);
    }, [userId, conversations, userInfo.fullName, handleCloseDirectChat, fetchConversations, handleSelectConversation]);

    const handleOpenCreateGroup = useCallback(() => {
        setShowCreateGroupModal(true);
        setShowChatOptions(false);
        fetchFriends();
    }, [fetchFriends]);

    const handleDisbandGroup = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.is_group || !isAdmin) return;
        if (!confirm('Bạn có chắc muốn giải tán nhóm này? Hành động này không thể hoàn tác.')) return;
        await messageApi.sendMessage({
            con_id: selectedConversation.con_id,
            content: "Nhóm sẽ bị giải tán",
            sender_id: "system",
            type: "notification"
        });
        await conversationApi.deleteConversation(selectedConversation.con_id);
        setShowMembersModal(false);
        fetchConversations();
        setSelectedConversation(null);
        setSelectedContact(null);
    }, [selectedConversation, isAdmin, fetchConversations]);

    const handleLeaveGroup = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.is_group) return;
        if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;
        await messageApi.sendMessage({
            con_id: selectedConversation.con_id,
            content: `${userInfo.fullName || 'Một thành viên'} đã rời khỏi nhóm`,
            sender_id: "system",
            type: "notification"
        });
        await conversationApi.removeMemberFromGroup(selectedConversation.con_id, userId);
        setShowMembersModal(false);
        fetchConversations();
        setSelectedConversation(null);
        setSelectedContact(null);
    }, [selectedConversation, userId, userInfo.fullName, fetchConversations]);

    const renderMembers = useMemo(() => {
        if (isLoadingMembers) {
            return (
                <div className="d-flex justify-content-center p-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            );
        }
        if (!membersList || membersList.length === 0) {
            return <p className="text-center p-3">Không có thành viên nào</p>;
        }
        return membersList.map(member => (
            <div key={member.id || member.user_id} className="p-3 d-flex align-items-center border-bottom">
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white">
                        {member.fullName ? member.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                            <p className="font-medium truncate">{member.fullName || 'Người dùng'}</p>
                            {selectedConversation?.admin === member.id && (
                                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                    Admin
                                </span>
                            )}
                            {member.id === userId && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                    Bạn
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{member.email || ''}</p>
                    </div>
                    {isAdmin && member.id !== userId && member.id !== selectedConversation?.admin && (
                        <button
                            onClick={() => removeMemberFromGroup(member.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Xóa khỏi nhóm"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        ));
    }, [membersList, isLoadingMembers, userId, isAdmin, selectedConversation, removeMemberFromGroup]);

    const handleAddMembersToGroup = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.is_group) return;
        const existingMemberIds = membersList.map(member => member.id);
        setFriendSearch('');
        setSelectedFriends([]);
        setIsLoadingFriends(true);
        const allFriends = await userApi.getFriendsList(userId);
        const availableFriendsToAdd = allFriends.filter(friend => !existingMemberIds.includes(friend.user_id));
        setAvailableFriends(availableFriendsToAdd);
        setIsLoadingFriends(false);
        setShowAddMembersModal(true);
        setShowMembersModal(false);
    }, [selectedConversation, membersList, userId]);

    const confirmAddMembers = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.is_group || selectedFriends.length === 0) return;
        setIsAddingMembers(true);
        const addedMembers = [];
        for (const friend of selectedFriends) {
            await conversationApi.addMemberToGroup(selectedConversation.con_id, friend.user_id);
            await messageApi.sendMessage({
                con_id: selectedConversation.con_id,
                content: `${friend.fullName || 'Một thành viên mới'} đã được thêm vào nhóm`,
                sender_id: "system",
                type: "notification"
            });
            addedMembers.push({ ...friend, id: friend.user_id, isAdmin: false });
        }
        setMembersList(prev => [...prev, ...addedMembers]);
        const updatedConversationsSnapshot = await conversationApi.getConversationById(selectedConversation.con_id);
        if (updatedConversationsSnapshot) {
            setSelectedConversation(prev => ({ ...prev, members: updatedConversationsSnapshot.members }));
        }
        setShowAddMembersModal(false);
        setSelectedFriends([]);
        setIsAddingMembers(false);
    }, [selectedConversation, selectedFriends]);

    const handleOpenEditGroupModal = useCallback(() => {
        setNewGroupName(selectedConversation.name || '');
        setGroupImagePreview(selectedContact?.img || '');
        setGroupImage(null);
        setShowEditGroupModal(true);
    }, [selectedConversation, selectedContact]);

    const handleGroupImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGroupImage(file);
            setGroupImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateGroupInfo = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.is_group || !isAdmin || !newGroupName.trim()) return;
        setIsUpdatingGroup(true);
        try {
            let imgUrl = selectedContact?.img || '';
            if (groupImage) {
                const storageRef = ref(storage, `group_avatars/${selectedConversation.con_id}_${Date.now()}`);
                await uploadBytes(storageRef, groupImage);
                imgUrl = await getDownloadURL(storageRef);
            }
            
            const conversationRef = doc(db, 'Conversations', selectedConversation.con_id);
            const updateData = { 
                name: newGroupName.trim(), 
                img: imgUrl 
            };
            
            await updateDoc(conversationRef, updateData);
            
            let notificationMessage = `${userInfo.fullName || 'Admin'} đã đổi tên nhóm thành "${newGroupName.trim()}"`;
            if (groupImage) {
                if (selectedContact?.img) {
                    notificationMessage = `${userInfo.fullName || 'Admin'} đã cập nhật ảnh nhóm`;
                } else {
                    notificationMessage = `${userInfo.fullName || 'Admin'} đã cập nhật thông tin nhóm`;
                }
            }
            
            await messageApi.sendMessage({
                con_id: selectedConversation.con_id,
                content: notificationMessage,
                sender_id: "system",
                type: "notification"
            });
            
            // Cập nhật UI local trong khi chờ listener cập nhật
            setSelectedConversation(prev => ({ 
                ...prev, 
                ...updateData
            }));
            
            setSelectedContact(prev => ({ 
                ...prev, 
                name: newGroupName.trim(), 
                img: imgUrl 
            }));
            
            setShowEditGroupModal(false);
            toast.success('Đã cập nhật thông tin nhóm thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin nhóm:', error);
            toast.error('Không thể cập nhật thông tin nhóm. Vui lòng thử lại sau.');
        } finally {
            setIsUpdatingGroup(false);
        }
    }, [selectedConversation, isAdmin, newGroupName, userInfo.fullName, groupImage, selectedContact]);

    // Helper function to highlight search matches
    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const startIndex = lowerText.indexOf(lowerQuery);
        if (startIndex === -1) return text;
        const endIndex = startIndex + lowerQuery.length;
        return (
            <>
                {text.substring(0, startIndex)}
                <mark className="bg-yellow-300">{text.substring(startIndex, endIndex)}</mark>
                {text.substring(endIndex)}
            </>
        );
    };

    // Memoize filtered and searched messages
    const filteredAndSearchedMessages = useMemo(() => {
        if (!messageSearchQuery.trim()) {
            return messages; // Return all messages if no search query
        }
        return messages.filter(msg => 
            msg.content && msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
        );
    }, [messages, messageSearchQuery]);

    const handleTransferAdmin = useCallback(async () => {
        if (!newAdminId || !selectedConversation || !isAdmin) return;
        
        const newAdminMember = membersList.find(member => member.id === newAdminId);
        if (!newAdminMember) {
            toast.error('Không tìm thấy thành viên đã chọn.');
            return;
        }
        
        const newAdminName = newAdminMember.fullName || 'Người dùng';
        
        if (!confirm(`Bạn có chắc muốn chuyển quyền admin cho ${newAdminName}? Bạn sẽ mất quyền quản trị viên của mình.`)) return;
        
        setIsTransferringAdmin(true);
        try {
            await conversationApi.updateConversation(selectedConversation.con_id, { admin: newAdminId });
            
            await messageApi.sendMessage({
                con_id: selectedConversation.con_id,
                content: `${newAdminName} đã trở thành quản trị viên mới của nhóm.`,
                sender_id: "system",
                type: "notification"
            });
            
            setSelectedConversation(prev => ({ ...prev, admin: newAdminId }));
            setIsAdmin(false);
            toast.success(`Đã chuyển quyền admin cho ${newAdminName}.`);
            setShowTransferAdminModal(false);
            setNewAdminId(null);
        } catch (error) {
            console.error("Lỗi khi chuyển quyền admin:", error);
            toast.error("Không thể chuyển quyền admin. Vui lòng thử lại.");
        } finally {
            setIsTransferringAdmin(false);
        }
    }, [newAdminId, selectedConversation, isAdmin, membersList, userId]);

    useEffect(() => {
        if (showMembersModal && selectedConversation && selectedConversation.is_group) {
            // Gọi lại hàm cập nhật danh sách thành viên
            if (typeof fetchGroupMembers === 'function') {
                fetchGroupMembers();
            }
        }
    }, [showMembersModal, selectedConversation?.members]);

    /**
     * Lọc cuộc trò chuyện dựa trên từ khóa tìm kiếm
     */
    const filteredConversations = useMemo(() => {
        if (!searchConversation.trim()) return conversations;
        const query = searchConversation.toLowerCase();
        return conversations.filter(conv => {
            const info = getConversationInfo(conv);
            return info.title.toLowerCase().includes(query);
        });
    }, [conversations, searchConversation, getConversationInfo]);

    /**
     * Lấy thông tin người dùng cho các cuộc trò chuyện khi hiển thị modal chuyển tiếp
     */
    useEffect(() => {
        if (!showForwardModal) return;
        const userIdsToFetch = conversations
            .filter(conv => !conv.is_group && conv.members) // Đảm bảo conv.members tồn tại
            .flatMap(conv => conv.members) // Bây giờ flatMap mảng members
            .map(member => (typeof member === 'object' ? member.user_id : member)) // Lấy ID
            .filter(memberId => memberId && memberId !== userId && !memberInfoCache[memberId]); // Kiểm tra cache sử dụng ID
        
        [...new Set(userIdsToFetch)].forEach(memberId => {
            if (memberId) { // Đảm bảo memberId không undefined/null trước khi fetch
                userApi.getUserInfo(memberId)
                    .then(userData => userData && setMemberInfoCache(prev => ({ ...prev, [memberId]: userData })));
            }
        });
    }, [showForwardModal, conversations, userId, memberInfoCache]);

    /**
     * Hiển thị danh sách cuộc trò chuyện cho modal chuyển tiếp
     * @returns {JSX.Element} Component hiển thị danh sách cuộc trò chuyện
     */
    const renderConversationList = () => {
        const filtered = filteredConversations; // Sử dụng mảng đã được memo hóa
        if (!filtered.length) return <p className="text-center text-gray-500 py-4">{t('noConversationsFound')}</p>;
        return (
            <div className="space-y-2">
                {filtered.map(conv => {
                    const isSelected = selectedConversations.some(c => c.con_id === conv.con_id);
                    const { title, letter } = getConversationInfo(conv);
                    return (
                        <div
                            key={conv.con_id}
                            className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                            onClick={() => toggleConversationSelection(conv)}
                        >
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white">
                                {letter}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{title}</p>
                                <p className="text-xs text-gray-500">
                                    {conv.is_group ? t('group') : t('directChat')} · {conv.members?.length || 0} {t('membersSuffix')}
                                </p>
                            </div>
                            <div className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                                {isSelected && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    /**
     * Lấy xem trước nội dung tin nhắn để hiển thị trong modal chuyển tiếp
     * @returns {string} Nội dung xem trước tin nhắn
     */
    const getMessagePreview = () => {
        if (!forwardMessage) return '';
        switch (forwardMessage.type) {
            case 'image': return t('imagePreview');
            case 'video': return t('videoPreview');
            case 'file': return t('filePreviewPrefix') + forwardMessage.content + ']';
            default: return forwardMessage.content;
        }
    };

    // Add this useEffect to correctly update isAdmin when selectedConversation changes
    useEffect(() => {
        if (selectedConversation && selectedConversation.is_group && userId) {
            const currentIsAdmin = selectedConversation.admin === userId;
            setIsAdmin(currentIsAdmin);
        } else {
            // Reset isAdmin if not a group, no selected conversation, or no userId
            setIsAdmin(false);
        }
    }, [selectedConversation, userId]); // Dependencies: selectedConversation and userId

    return (
        <div className="flex h-screen bg-gray-100">
            <Navbar activePage="chat" onAvatarClick={handleAvatarClick} />
            <div className="w-[21rem] bg-white border-r h-screen">
                <div className="p-4 border-b flex justify-between">
                    <div className="flex items-center bg-gray-200 rounded-lg p-2">
                        <Search className="w-4 h-4 text-gray-500 items-center ml-2 mr-2" />
                        <input className="bg-transparent ml-2 outline-none text-sm flex-1 items-center" placeholder={t('searchConversations')} />
                    </div>
                    <div className="flex items-center">
                        <button className="hover:bg-gray-200 rounded cursor-pointer" onClick={() => navigate('/friends')}><UserPlus className="text-gray-500 cursor-pointer m-2" size={21} /></button>
                        <button className="hover:bg-gray-200 rounded cursor-pointer" onClick={handleOpenChatOptions}><Plus className="text-gray-500 cursor-pointer m-2" size={21} /></button>
                    </div>
                </div>
                <div className="overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-lg" style={{ maxHeight: 'calc(100vh - 70px)' }}>
                    {Array.isArray(conversations) && conversations.length > 0 ? (
                        conversations.map((conversation) => {
                            const [lastMessage, lastMessageTs] = conversation.mess_info || ['', ''];
                            const formattedConversation = {
                                con_id: conversation.con_id || '',
                                is_group: conversation.is_group || false,
                                name: conversation.name || '',
                                fullName: conversation.fullName || '',
                                last_message: lastMessage,
                                last_message_ts: lastMessageTs,
                                img: conversation.img || '',
                                members: conversation.members || [],
                                currentUserId: userId,
                                admin: conversation.admin || '',
                                time: conversation.time || ''
                            };
                            return (
                                <ConversationItem
                                    key={conversation.con_id}
                                    conversation={formattedConversation}
                                    onClick={handleSelectConversation}
                                    isSelected={selectedConversation?.con_id === conversation.con_id}
                                />
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            {t('noConversations')}
                        </div>
                    )}
                </div>
            </div>
            <div className={`flex-1 flex flex-col ${showSearchPanel ? 'border-r border-gray-200' : ''}`}>
                {selectedConversation ? (
                    <>
                        <div className="border-b bg-white flex items-center py-3 px-4 justify-between">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                                    {selectedConversation.is_group ? (
                                        selectedContact && selectedContact.img ? (
                                            <img src={selectedContact.img} alt="Group" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                                                <span className="text-white text-lg font-medium">
                                                    {selectedContact && selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : 'G'}
                                                </span>
                                            </div>
                                        )
                                    ) : (
                                        otherUserInfo && otherUserInfo.img ? (
                                            <img src={otherUserInfo.img} alt="Contact" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                                                <span className="text-white text-lg font-medium">
                                                    {otherUserInfo && otherUserInfo.fullName
                                                        ? otherUserInfo.fullName.charAt(0).toUpperCase()
                                                        : selectedContact?.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                                <div className="ml-3">
                                    <div className="font-medium">{selectedContact && selectedContact.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {selectedConversation.is_group
                                            ? `${selectedConversation.members?.length || 0} thành viên`
                                            :                                             otherUserInfo ? (
                                                otherUserInfo.status === 'online' ? (
                                                    <span className="flex items-center">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animation-pulse"></span>
                                                        {t('online')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center">
                                                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                                                        {t('offline')}
                                                        {otherUserInfo.lastSeen && otherUserInfo.lastSeen.seconds && (
                                                            ` - ${new Date(otherUserInfo.lastSeen.seconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                                        )}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="italic">{t('loadingStatus')}</span>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                {selectedConversation.is_group && (
                                    <>
                                        {isAdmin && (
                                            <button
                                                className="hover:bg-gray-200 m-1 rounded cursor-pointer"
                                                onClick={handleOpenEditGroupModal}
                                                title="Chỉnh sửa nhóm"
                                            >
                                                <Edit2 className="text-gray-500 m-2" size={20} />
                                            </button>
                                        )}
                                        <button
                                            className="hover:bg-gray-200 m-1 rounded cursor-pointer"
                                            onClick={handleShowMembers}
                                        >
                                            <Users className="text-gray-500 m-2" size={20} />
                                        </button>
                                    </>
                                )}
                                <button 
                                    className="hover:bg-gray-200 m-1 rounded cursor-pointer"
                                    onClick={() => setShowSearchPanel(!showSearchPanel)} // Toggle search panel
                                    title="Search Messages"
                                >
                                    <Search className="text-gray-500 m-2" size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div>
                                {/* Main chat ALWAYS renders from the full 'messages' array and is NOT filtered by messageSearchQuery */}
                                {messages.length > 0 ? (
                                    <>
                                        {messages.map((msg) => {
                                            const numericalTimestamp = (typeof msg.timestamp === 'object' && msg.timestamp && typeof msg.timestamp.toMillis === 'function') 
                                                ? msg.timestamp.toMillis() 
                                                : msg.timestamp;
                                            const messageDOMId = `message-${msg.con_id}-${numericalTimestamp}`;

                                            if (msg.sender_id !== userId || (msg.sender_id === userId && msg.seen !== false)) {
                                                const messageKey = `${msg.con_id}-${msg.createdAt}`;

                                                // Restore senderName logic for main chat display
                                                let senderName = '';
                                                if (selectedConversation?.is_group && msg.sender_id !== userId && msg.sender_id !== 'system') {
                                                    const memberInfoFromList = membersList.find(member => member.id === msg.sender_id);
                                                    if (memberInfoFromList) {
                                                        senderName = memberInfoFromList.fullName || 'User';
                                                    } else {
                                                        // Fallback if not in membersList (e.g., cache not populated yet)
                                                        const memberFromConversation = selectedConversation.members?.find(member => 
                                                            (typeof member === 'object' ? member.user_id : member) === msg.sender_id
                                                        );
                                                        if (typeof memberFromConversation === 'object' && memberFromConversation !== null) {
                                                            senderName = memberFromConversation.user_name || 'User'; 
                                                        } else {
                                                            senderName = 'User'; // Default if no info found
                                                        }
                                                    }
                                                }

                                                const messageProps = {
                                                    message: {
                                                        id: `${msg.con_id}/${msg.createdAt}`,
                                                        text: msg.content || '',
                                                        content: msg.content || '',
                                                        timestamp: msg.createdAt,
                                                        from: msg.sender_id,
                                                        url: msg.url,
                                                        sender_id: msg.sender_id,
                                                        con_id: msg.con_id,
                                                        pending: msg.pending,
                                                        deleted: msg.deletedFor?.includes(userId),
                                                        revoked: msg.revoked,
                                                        type: msg.type || 'text',
                                                        replyTo: msg.replyTo
                                                    },
                                                    isSentByUser: msg.sender_id === userId,
                                                    isGroupChat: selectedConversation?.is_group,
                                                    senderName: senderName, // Using restored senderName
                                                    onDelete: msg.sender_id === userId && !msg.deletedFor?.includes(userId) && !msg.revoked ?
                                                        () => openDeleteModal(msg) : null,
                                                    onRevoke: msg.sender_id === userId && !msg.deletedFor?.includes(userId) && !msg.revoked ?
                                                        () => openRevokeModal(msg) : null,
                                                    onForward: !msg.revoked ?
                                                        () => openForwardModal(msg) : null,
                                                    onReply: !msg.revoked ?
                                                        () => handleReplyMessage(msg) : null,
                                                    allMessages: messages, 
                                                    domId: messageDOMId 
                                                };
                                                switch (msg.type) {
                                                    case 'image':
                                                        return <ImageMessage key={messageKey} {...messageProps} />;
                                                    case 'video':
                                                        return <VideoMessage key={messageKey} {...messageProps} />;
                                                    case 'file':
                                                        return <FileMessage key={messageKey} {...messageProps} />;
                                                    case 'notification':
                                                        return <NotificationMessage key={messageKey} {...messageProps} />;
                                                    default:
                                                        return msg.replyTo ?
                                                            <ReplyMessage key={messageKey} {...messageProps} /> :
                                                            <MessageComponent key={messageKey} {...messageProps} />;
                                                }
                                            }
                                            return null;
                                        })}
                                    </>
                                ) : (
                                    // Empty state for main chat: ONLY depends on isLoadingMessages and messages.length
                                    <div className="flex-1 flex justify-center items-center text-gray-400 h-full">
                                        {isLoadingMessages ? (
                                            <LoadingSpinner />
                                        ) : (
                                            <p>{t('noMessagesYet')}</p> // This is the correct empty state
                                        )}
                                    </div>
                                )}
                            </div>
                            <div ref={messagesEndRef} /> 
                        </div>
                        <div className="border-t bg-white">
                            {replyMessage && (
                                <div className="flex items-center p-2 bg-gray-50 border-b">
                                    <div className="w-1 h-10 bg-blue-500 rounded-full mr-2"></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-blue-600">
                                            {replyMessage.sender_id === userId ? t('you') : otherUserInfo?.fullName || t('otherUser')}
                                        </div>
                                        <div className="text-xs text-gray-600 truncate">
                                            {replyMessage.type === 'image' ? (
                                                <span className="flex items-center">
                                                    <Image size={12} className="mr-1" /> {t('imageType')}
                                                </span>
                                            ) : replyMessage.type === 'video' ? (
                                                <span className="flex items-center">
                                                    <Video size={12} className="mr-1" /> {t('videoType')}
                                                </span>
                                            ) : replyMessage.type === 'file' ? (
                                                <span className="flex items-center">
                                                    <File size={12} className="mr-1" /> {replyMessage.content}
                                                </span>
                                            ) : (
                                                replyMessage.content
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={cancelReply}
                                        className="p-1 hover:bg-gray-200 rounded-full"
                                        title={t('cancelReplyTitle')}
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center flex-col">
                                <div className="flex space-x-2 w-full px-2 py-1 align-center">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="*/*"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                        <button
                                            className={`p-2 hover:bg-gray-200 rounded cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                            disabled={isUploading}
                                            title={t('attachFileTitle')}
                                        >
                                            <Paperclip className="text-gray-500" size={22} />
                                            {isUploading && (
                                                <span className="absolute -top-1 -right-1">
                                                    <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <button
                                            className="p-2 hover:bg-gray-200 rounded cursor-pointer"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            <Smile className="text-gray-500" size={22} />
                                        </button>
                                        {showEmojiPicker && (
                                            <div
                                                className="absolute bottom-12 left-0 z-10"
                                                ref={emojiPickerRef}
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={handleEmojiClick}
                                                    searchDisabled={false}
                                                    width={300}
                                                    height={350}
                                                    previewConfig={{ showPreview: false }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center w-full relative">
                                    <input
                                        type="text"
                                        className="flex-1 p-4 w-full border focus:outline-none"
                                        placeholder={`${t('messageInputPlaceholder')}${selectedContact?.name || 'chat'}`}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <button
                                        className="absolute right-4 p-2 text-blue-500 hover:text-blue-700"
                                        onClick={handleSendMessage}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
                        <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="w-16 h-16 text-indigo-400" />
                        </div>
                        <p className="text-2xl font-medium text-indigo-500 mb-2">{t('welcomeToZalaChat')}</p>
                        <p className="text-gray-500 mb-6">{t('selectConversationToStart')}</p>
                        <button
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-full transition-colors"
                            onClick={() => navigate('/friends')}
                        >
                            <span className="flex items-center">
                                <UserPlus className="mr-2" size={16} />
                                {t('addNewFriend')}
                            </span>
                        </button>
                    </div>
                )}
            </div>
            {showProfile && (
                <UserProfile
                    userId={userId}
                    onClose={handleProfileClose}
                />
            )}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg font-semibold mb-4">{t('deleteMessageTitle')}</h3>
                        <p className="text-gray-600 mb-6">{t('deleteMessageBody')}</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedMessage(null);
                                }}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={confirmDeleteMessage}
                            >
                                {t('deleteForMe')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showRevokeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg font-semibold mb-4">{t('revokeMessageTitle')}</h3>
                        <p className="text-gray-600 mb-6">{t('revokeMessageBody')}</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                onClick={() => {
                                    setShowRevokeModal(false);
                                    setSelectedMessage(null);
                                }}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={confirmRevokeMessage}
                            >
                                {t('revoke')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showForwardModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('forwardMessageTitle')}</h3>
                            <button
                                onClick={() => {
                                    setShowForwardModal(false);
                                    setForwardMessage(null);
                                    setSelectedConversations([]);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">{t('messageLabel')}</span>
                                {getMessagePreview()}
                            </p>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center bg-gray-100 rounded-lg p-2">
                                <Search className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                                <input
                                    className="bg-transparent ml-2 outline-none text-sm flex-1"
                                    placeholder={t('searchConversationsPlaceholder')}
                                    value={searchConversation}
                                    onChange={(e) => setSearchConversation(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4">
                            {renderConversationList()}
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                onClick={() => {
                                    setShowForwardModal(false);
                                    setForwardMessage(null);
                                    setSelectedConversations([]);
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className={`flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg 
                                    ${(selectedConversations.length === 0)
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:from-indigo-600 hover:to-purple-600'}`}
                                onClick={handleSendForwardMessage}
                                disabled={selectedConversations.length === 0}
                            >
                                <span className="flex items-center justify-center">
                                    <Forward size={16} className="mr-2" />
                                    {t('forwardButton')} ({selectedConversations.length})
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showCreateGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('createNewGroupChat')}</h3>
                            <button
                                onClick={() => setShowCreateGroupModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('groupNameLabel')}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder={t('enterGroupNamePlaceholder')}
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('addMembers')}</label>
                            <div className="flex items-center bg-gray-100 rounded-lg p-2 mb-2">
                                <Search className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                                <input
                                    className="bg-transparent ml-2 outline-none text-sm flex-1"
                                    placeholder={t('searchFriendsPlaceholder')}
                                    value={friendSearch}
                                    onChange={(e) => setFriendSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        {selectedFriends.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Đã chọn {selectedFriends.length} người</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedFriends.map(friend => (
                                        <div
                                            key={friend.user_id}
                                            className="flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-xs"
                                        >
                                            <span className="truncate max-w-[120px]">{friend.fullName}</span>
                                            <button
                                                onClick={() => toggleFriendSelection(friend)}
                                                className="ml-1 text-indigo-600 hover:text-indigo-800"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto mb-4">
                            {groupFriendsFiltered.length > 0 ? (
                                groupFriendsFiltered.map(friend => {
                                    const isSelected = selectedFriends.some(f => f.user_id === friend.user_id);
                                    return (
                                        <div
                                            key={friend.user_id}
                                            className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                                            onClick={() => toggleFriendSelection(friend)}
                                        >
                                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white">
                                                {friend.fullName ? friend.fullName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{friend.fullName || 'Người dùng'}</p>
                                                <p className="text-xs text-gray-500 truncate">{friend.email || ''}</p>
                                            </div>
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                                                {isSelected && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center">
                                        <Users className="w-12 h-12 text-gray-300 mb-2" />
                                        <p className="text-gray-500 mb-1">{t('noFriendsFound')}</p>
                                        <p className="text-gray-400 text-sm">{t('addFriendsBeforeCreatingGroup')}</p>
                                        <button
                                            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
                                            onClick={() => {
                                                setShowCreateGroupModal(false);
                                                navigate('/friends');
                                            }}
                                        >
                                            <span className="flex items-center">
                                                <UserPlus className="mr-2" size={16} />
                                                {t('addNewFriend')}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                onClick={() => setShowCreateGroupModal(false)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className={`flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg 
                                    ${(isCreatingGroup || !groupName.trim() || selectedFriends.length < 1 || availableFriends.length === 0)
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:from-indigo-600 hover:to-purple-600'}`}
                                onClick={handleCreateGroup}
                                disabled={isCreatingGroup || !groupName.trim() || selectedFriends.length < 1 || availableFriends.length === 0}
                            >
                                {isCreatingGroup ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('creating')}
                                    </span>
                                ) : (
                                    t('createGroup')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showMembersModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('groupMembersTitle')}</h3>
                            <button
                                onClick={() => setShowMembersModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                {selectedConversation?.name || t('group')} {t('groupMembersSubtitleSuffix1')} {membersList.length} {t('groupMembersSubtitleSuffix2')}
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4">
                            {renderMembers}
                        </div>
                        <div className="pt-4 border-t flex flex-col gap-2">
                            {isAdmin && (
                                <>
                                    <button
                                        className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600"
                                        onClick={handleAddMembersToGroup}
                                    >
                                        <span className="flex items-center justify-center">
                                            <UserPlus size={16} className="mr-2" />
                                            {t('addMembers')}
                                        </span>
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                                        onClick={() => {
                                            setShowMembersModal(false);
                                            handleOpenEditGroupModal();
                                        }}
                                    >
                                        <span className="flex items-center justify-center">
                                            <Edit2 size={16} className="mr-2" />
                                            {t('editGroup')}
                                        </span>
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        onClick={() => {
                                            setShowMembersModal(false);
                                            setShowTransferAdminModal(true);
                                        }}
                                    >
                                        <span className="flex items-center justify-center">
                                            <Users size={16} className="mr-2" />
                                            Chuyển quyền admin
                                        </span>
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        onClick={handleDisbandGroup}
                                    >
                                        <span className="flex items-center justify-center">
                                            <Trash2 size={16} className="mr-2" />
                                            {t('disbandGroup')}
                                        </span>
                                    </button>
                                </>
                            )}
                            {!isAdmin && (
                                <button
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    onClick={handleLeaveGroup}
                                >
                                    <span className="flex items-center justify-center">
                                        <LogOut size={16} className="mr-2" />
                                        {t('leaveGroup')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showChatOptions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg font-semibold mb-4">{t('createNewChatTitle')}</h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleOpenDirectChat}
                                className="w-full px-4 py-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center"
                            >
                                <MessageCircle size={20} className="text-indigo-600 mr-3" />
                                <span className="font-medium">{t('directChatWithFriends')}</span>
                            </button>
                            <button
                                onClick={handleOpenCreateGroup}
                                className="w-full px-4 py-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center"
                            >
                                <Users size={20} className="text-indigo-600 mr-3" />
                                <span className="font-medium">{t('createNewGroupChat')}</span>
                            </button>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                onClick={handleCloseChatOptions}
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDirectChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('directChatTitle')}</h3>
                            <button
                                onClick={handleCloseDirectChat}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center bg-gray-100 rounded-lg p-2">
                                <Search className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                                <input
                                    className="bg-transparent ml-2 outline-none text-sm flex-1"
                                    placeholder="Tìm kiếm bạn bè"
                                    value={friendSearch}
                                    onChange={(e) => setFriendSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4">
                            {isLoadingFriends ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">{t('noFriends')}</p>
                                    <button
                                        className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
                                        onClick={() => navigate('/friends')}
                                    >
                                        {t('addNewFriend')}
                                    </button>
                                </div>
                            ) : directChatFriendsFiltered.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">{t('noFriendsFound')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {directChatFriendsFiltered.map(friend => (
                                        <div
                                            key={friend.user_id}
                                            className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                                            onClick={() => !creatingChat && createDirectChat(friend)}
                                        >
                                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white">
                                                {friend.img ? (
                                                    <img src={friend.img} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    friend.fullName?.charAt(0).toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{friend.fullName || 'Người dùng'}</p>
                                                <p className="text-xs text-gray-500 truncate">{friend.email || ''}</p>
                                            </div>
                                            {creatingChat && friend.user_id === creatingChat && (
                                                <div className="flex-shrink-0">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showAddMembersModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('addMembersToGroupTitle')}</h3>
                            <button
                                onClick={() => setShowAddMembersModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                {t('selectFriendsToAddPrefix')}{selectedConversation?.name || t('group')}{t('selectFriendsToAddSuffix')}
                            </p>
                            <div className="flex items-center bg-gray-100 rounded-lg p-2">
                                <Search className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                                <input
                                    className="bg-transparent ml-2 outline-none text-sm flex-1"
                                    placeholder={t('searchFriendsPlaceholder')}
                                    value={friendSearch}
                                    onChange={(e) => setFriendSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {selectedFriends.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Đã chọn {selectedFriends.length} người</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedFriends.map(friend => (
                                        <div
                                            key={friend.user_id}
                                            className="flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-xs"
                                        >
                                            <span className="truncate max-w-[120px]">{friend.fullName}</span>
                                            <button
                                                onClick={() => toggleFriendSelection(friend)}
                                                className="ml-1 text-indigo-600 hover:text-indigo-800"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto mb-4">
                            {isLoadingFriends ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : availableFriends.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">{t('allFriendsInGroup')}</p>
                                </div>
                            ) : groupFriendsFiltered.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">{t('noMatchingFriendsFound')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {groupFriendsFiltered.map(friend => {
                                        const isSelected = selectedFriends.some(f => f.user_id === friend.user_id);
                                        return (
                                            <div
                                                key={friend.user_id}
                                                className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                                                onClick={() => toggleFriendSelection(friend)}
                                            >
                                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white">
                                                    {friend.img ? (
                                                        <img src={friend.img} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        friend.fullName?.charAt(0).toUpperCase() || 'U'
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{friend.fullName || 'Người dùng'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{friend.email || ''}</p>
                                                </div>
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                                                    {isSelected && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                onClick={() => setShowAddMembersModal(false)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className={`flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg 
                                    ${(isAddingMembers || selectedFriends.length === 0)
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:from-indigo-600 hover:to-purple-600'}`}
                                onClick={confirmAddMembers}
                                disabled={isAddingMembers || selectedFriends.length === 0}
                            >
                                {isAddingMembers ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('adding')}
                                    </span>
                                ) : (
                                    t('addMembers')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chỉnh sửa nhóm */}
            {showEditGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('editGroupTitle')}</h3>
                            <button
                                onClick={() => setShowEditGroupModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Phần upload ảnh nhóm */}
                        <div className="mb-4 flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden mb-2 relative group">
                                {groupImagePreview ? (
                                    <img
                                        src={groupImagePreview}
                                        alt="Ảnh nhóm"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                                        <span className="text-white text-xl font-medium">
                                            {newGroupName.trim() ? newGroupName.charAt(0).toUpperCase() : 'G'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                                    <label className="cursor-pointer p-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <Edit3 size={18} className="text-gray-700" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleGroupImageChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <label className="text-sm font-medium text-indigo-600 cursor-pointer">
                                {t('changeGroupImage')}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleGroupImageChange}
                                />
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('groupNameLabel')}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder={t('enterGroupNamePlaceholder')}
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                onClick={() => setShowEditGroupModal(false)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className={`flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg 
                                    ${(isUpdatingGroup || !newGroupName.trim())
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:from-indigo-600 hover:to-purple-600'}`}
                                onClick={handleUpdateGroupInfo}
                                disabled={isUpdatingGroup || !newGroupName.trim()}
                            >
                                {isUpdatingGroup ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('updating')}
                                    </span>
                                ) : (
                                    t('update')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSearchPanel && selectedConversation && (
                <div className="w-[25rem] bg-white border-l border-gray-200 flex flex-col h-screen">
                    <div className="p-4 border-b">
                        <div className="flex items-center w-full mb-3">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input 
                                type="text"
                                placeholder={t('searchMessagesPlaceholder')}
                                value={messageSearchQuery}
                                onChange={(e) => setMessageSearchQuery(e.target.value)}
                                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                autoFocus
                            />
                             <button 
                                onClick={() => {
                                    setShowSearchPanel(false);
                                    setMessageSearchQuery(''); 
                                }}
                                className="p-2 hover:bg-gray-200 rounded-full ml-2"
                                title={t('closeSearchPanel')}
                            >
                                <XCircle size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {messageSearchQuery && filteredAndSearchedMessages.length > 0 && (
                            filteredAndSearchedMessages.map(msg => {
                                if (msg.revoked || (msg.deletedFor && msg.deletedFor.includes(userId))) {
                                    return null; 
                                }
                                
                                // Define messageDOMId using numericalTimestampForResult for search panel items
                                const numericalTimestampForResult = (typeof msg.timestamp === 'object' && msg.timestamp && typeof msg.timestamp.toMillis === 'function')
                                    ? msg.timestamp.toMillis()
                                    : msg.timestamp;
                                const messageDOMId = `message-${msg.con_id}-${numericalTimestampForResult}`; // This is the one that should be used for the key and onClick

                                const senderDisplayName = msg.sender_id === userId ? 'You' : 
                                                        selectedConversation.is_group ? 
                                                            (membersList.find(m => m.id === msg.sender_id)?.fullName || 'User') :
                                                            (otherUserInfo?.fullName || 'User');

                                return (
                                    <div 
                                        key={messageDOMId} // Use the correctly formatted ID for the key
                                        className="p-2.5 rounded-lg hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                                    >
                                        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                                            <span>{senderDisplayName}</span>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 truncate">
                                            {msg.type === 'text' ? highlightMatch(msg.content, messageSearchQuery) : 
                                             msg.type === 'image' ? '🖼️ Image' : 
                                             msg.type === 'video' ? '🎬 Video' : 
                                             msg.type === 'file' ? `📄 ${msg.content}` : 
                                             'Message'}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                        {messageSearchQuery && filteredAndSearchedMessages.length === 0 && (
                            <p className="text-center text-gray-500 p-4">{t('noMessagesFoundSimple')}</p>
                        )}
                        {!messageSearchQuery && (
                             <p className="text-center text-gray-400 p-4">{t('typeToSearchMessages')}</p>
                        )}
                    </div>
                </div>
            )}
            {showTransferAdminModal && membersList.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Chuyển quyền admin</h3>
                            <button
                                onClick={() => setShowTransferAdminModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Chọn thành viên để chuyển quyền admin. Bạn sẽ không còn là quản trị viên sau khi chuyển quyền.
                        </p>
                        <div className="flex-1 overflow-y-auto mb-4 max-h-[50vh]">
                            {membersList
                                .filter(member => member.id !== userId && member.id !== selectedConversation?.admin)
                                .map(member => (
                                    <div
                                        key={member.id}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer ${
                                            newAdminId === member.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                                        }`}
                                        onClick={() => setNewAdminId(member.id)}
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white">
                                            {member.fullName ? member.fullName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{member.fullName || 'Người dùng'}</p>
                                            <p className="text-xs text-gray-500 truncate">{member.email || ''}</p>
                                        </div>
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                                            {newAdminId === member.id && (
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {membersList.filter(member => member.id !== userId && member.id !== selectedConversation?.admin).length === 0 && (
                                <p className="text-center text-gray-500 py-3">Không có thành viên nào có thể chuyển quyền admin</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTransferAdminModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleTransferAdmin}
                                className={`flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg ${
                                    isTransferringAdmin || !newAdminId 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:bg-blue-600'
                                }`}
                                disabled={isTransferringAdmin || !newAdminId}
                            >
                                {isTransferringAdmin ? 'Đang chuyển...' : 'Xác nhận chuyển quyền'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatPage;