import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { auth, db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, UserPlus, UserCheck, AlertCircle, Mail, CheckCircle, XCircle, Users, Phone, AtSign } from 'lucide-react';
import Navbar from '../components/Navbar';
import UserProfile from '../components/UserProfile';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { friendApi, userApi } from '../api/firebaseApi';
import './Friends.css';

// Moved getInitial outside the component
const getInitial = (user) => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.name) return user.name.charAt(0).toUpperCase(); // Keep for backward compatibility
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?'; 
};

function Friends() {
    const [currentActionView, setCurrentActionView] = useState('idle'); // 'idle', 'addFriend', 'viewRequests'
    const [email, setEmail] = useState('');
    const [requests, setRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // For friends list search
    const [sendingRequest, setSendingRequest] = useState(false); // For "Add Friend" action
    const [processingRequest, setProcessingRequest] = useState(null); // For specific request buttons
    const [hoveredFriend, setHoveredFriend] = useState(null); // For tooltip
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Position for tooltip
    const [isTooltipHovered, setIsTooltipHovered] = useState(false);
    const tooltipTimeoutRef = useRef(null); // Reference for tooltip timeout

    const { currentUser, updateUserInfo } = useAuth();
    const { currentLanguage } = useLanguage();

    const navigate = useNavigate();
    // Create a translations object
    const translations = {
        vi: {
            friends: "Bạn bè",
            manageList: "Quản lý danh sách bạn bè và lời mời.",
            addFriend: "Thêm bạn",
            requests: "Lời mời",
            searchFriends: "Tìm bạn bè...",
            noFriends: "Chưa có bạn bè nào.",
            noFriendsFound: "Không tìm thấy bạn bè.",
            user: "Người dùng",
            welcomeTitle: "Chào mừng đến Khu vực Bạn bè!",
            welcomeMessage: "Sử dụng các tùy chọn ở bảng điều khiển bên trái để thêm bạn mới hoặc xem lời mời đang chờ.",
            addNewFriend: "Thêm bạn mới",
            enterEmail: "Nhập email của bạn bè",
            sendRequest: "Gửi lời mời",
            note: "Lưu ý",
            noteItem1: "Chỉ thêm bạn từ người dùng đã đăng ký VibeChat.",
            noteItem2: "Email phải chính xác.",
            noteItem3: "Nếu cả hai cùng gửi lời mời, sẽ tự động kết nối.",
            friendRequests: "Lời mời kết bạn",
            loadingRequests: "Đang tải lời mời...",
            noRequests: "Không có lời mời kết bạn nào.",
            accept: "Chấp nhận",
            reject: "Từ chối",
            admin: "Admin",
            you: "Bạn",
            invalidEmail: "Vui lòng nhập đúng định dạng email.",
            emailNotRegistered: "Email chưa được đăng ký VibeChat.",
            cannotAddSelf: "Không thể kết bạn với chính mình.",
            alreadyFriends: "Người này đã là bạn bè của bạn.",
            requestAlreadySent: "Bạn đã gửi lời mời đến người này rồi.",
            requestSent: "Lời mời kết bạn đã được gửi!",
            becameFriends: "đã trở thành bạn bè!",
            errorSendingRequest: "Đã xảy ra lỗi khi gửi lời mời.",
            acceptedRequest: "Đã chấp nhận lời mời từ",
            errorAcceptingRequest: "Không thể chấp nhận lời mời.",
            rejectedRequest: "Đã từ chối lời mời từ",
            errorRejectingRequest: "Không thể từ chối lời mời.",
            loading: "Đang tải...",
            friendDetails: "Thông tin bạn bè",
            email: "Email",
            phoneNumber: "Số điện thoại",
            notAvailable: "Không có"
        },
        en: {
            friends: "Friends",
            manageList: "Manage your friends list and invitations.",
            addFriend: "Add Friend",
            requests: "Requests",
            searchFriends: "Search friends...",
            noFriends: "No friends yet.",
            noFriendsFound: "No friends found.",
            user: "User",
            welcomeTitle: "Welcome to the Friends Area!",
            welcomeMessage: "Use the options in the left panel to add new friends or view pending invitations.",
            addNewFriend: "Add New Friend",
            enterEmail: "Enter friend's email",
            sendRequest: "Send Request",
            note: "Note",
            noteItem1: "Only add users who have registered to VibeChat.",
            noteItem2: "Email must be correct.",
            noteItem3: "If both send invitations, connection will be automatic.",
            friendRequests: "Friend Requests",
            loadingRequests: "Loading requests...",
            noRequests: "No friend requests.",
            accept: "Accept",
            reject: "Reject",
            admin: "Admin",
            you: "You",
            invalidEmail: "Please enter a valid email format.",
            emailNotRegistered: "Email is not registered with VibeChat.",
            cannotAddSelf: "You cannot add yourself as a friend.",
            alreadyFriends: "This person is already your friend.",
            requestAlreadySent: "You have already sent a request to this person.",
            requestSent: "Friend request sent!",
            becameFriends: "are now friends!",
            errorSendingRequest: "An error occurred while sending the request.",
            acceptedRequest: "Accepted request from",
            errorAcceptingRequest: "Could not accept the request.",
            rejectedRequest: "Rejected request from",
            errorRejectingRequest: "Could not reject the request.",
            loading: "Loading...",
            friendDetails: "Friend Details",
            email: "Email",
            phoneNumber: "Phone Number",
            notAvailable: "Not available"
        }
    };
    
    // Helper function to get translation
    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.vi[key];
    };
    
    const [userInfo, setUserInfo] = useState({ phoneNumber: '', fullName: '', img: '' });
    const [showProfile, setShowProfile] = useState(false);
    const [errorMessages, setErrorMessages] = useState({ addFriend: '', acceptRequest: '', rejectRequest: '' });
    const [successMessages, setSuccessMessages] = useState({ addFriend: '', acceptRequest: '', rejectRequest: '' });

    useEffect(() => {
        if (!currentUser) return;
        fetchUserInfo();

        setFriendsLoading(true);
        const unsubscribeFriends = friendApi.listenForFriends(currentUser.uid, (friendsList) => {
            setFriends(friendsList);
            setFriendsLoading(false);
        });

        setRequestsLoading(true);
        const unsubscribeRequests = friendApi.getFriendRequests(currentUser.uid, (requestsList) => {
            setRequests(requestsList);
            setRequestsLoading(false);
        });

        return () => {
            unsubscribeFriends();
            unsubscribeRequests();
        };
    }, [currentUser]);

    const fetchUserInfo = async () => {
        try {
            const userData = await userApi.getUserInfo(currentUser.uid);
            if (userData) setUserInfo(userData);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
        }
    };

    const clearMessages = (type) => {
        setErrorMessages(prev => ({ ...prev, [type]: '' }));
        setSuccessMessages(prev => ({ ...prev, [type]: '' }));
        setTimeout(() => {
            setErrorMessages(prev => ({ ...prev, [type]: '' }));
            setSuccessMessages(prev => ({ ...prev, [type]: '' }));
        }, 5000); // Clear messages after 5 seconds
    };
    
    const handleAddFriend = async () => {
        clearMessages('addFriend');
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setErrorMessages(prev => ({ ...prev, addFriend: t('invalidEmail') }));
            return;
        }
        setSendingRequest(true);
        try {
            const targetUser = await userApi.findUserByEmail(email);
            if (!targetUser) {
                setErrorMessages(prev => ({ ...prev, addFriend: t('emailNotRegistered') }));
                return;
            }
            if (targetUser.user_id === currentUser.uid) {
                setErrorMessages(prev => ({ ...prev, addFriend: t('cannotAddSelf') }));
                return;
            }
            const alreadyFriends = await friendApi.checkIfAlreadyFriends(currentUser.uid, targetUser.user_id);
            if (alreadyFriends) {
                setErrorMessages(prev => ({ ...prev, addFriend: t('alreadyFriends') }));
                return;
            }
            const requestSent = await friendApi.checkIfRequestSent(currentUser.uid, targetUser.user_id);
            if (requestSent) {
                setErrorMessages(prev => ({ ...prev, addFriend: t('requestAlreadySent') }));
                return;
            }
            const requestReceived = await friendApi.checkIfRequestReceived(currentUser.uid, targetUser.user_id);
            if (requestReceived.exists) {
                await friendApi.acceptFriendRequest(requestReceived.requestId);
                setSuccessMessages(prev => ({ ...prev, addFriend: `${t('you')} ${t('and')} ${targetUser.fullName || targetUser.email} ${t('becameFriends')}` }));
                setEmail('');
            } else {
                await friendApi.sendFriendRequest(currentUser.uid, targetUser.user_id);
                setSuccessMessages(prev => ({ ...prev, addFriend: t('requestSent') }));
                setEmail('');
            }
        } catch (error) {
            console.error(error);
            setErrorMessages(prev => ({ ...prev, addFriend: t('errorSendingRequest') }));
        } finally {
            setSendingRequest(false);
        }
    };

    /**
     * Xử lý chấp nhận lời mời kết bạn
     * @param {Object} request - Thông tin lời mời kết bạn
     */
    const handleAcceptRequest = async (request) => {
        clearMessages('acceptRequest');
        setProcessingRequest(request.id);
        try {
            await friendApi.acceptFriendRequest(request.id);
            setSuccessMessages(prev => ({ ...prev, acceptRequest: `${t('acceptedRequest')} ${request.userData?.fullName || t('user')}.` }));
        } catch (error) {
            setErrorMessages(prev => ({ ...prev, acceptRequest: t('errorAcceptingRequest') }));
        } finally {
            setProcessingRequest(null);
        }
    };

    /**
     * Xử lý từ chối lời mời kết bạn
     * @param {Object} request - Thông tin lời mời kết bạn
     */
    const handleRejectRequest = async (request) => {
        clearMessages('rejectRequest');
        setProcessingRequest(request.id);
        try {
            await friendApi.rejectFriendRequest(request.id);
            setSuccessMessages(prev => ({ ...prev, rejectRequest: `${t('rejectedRequest')} ${request.userData?.fullName || t('user')}.` }));
        } catch (error) {
            setErrorMessages(prev => ({ ...prev, rejectRequest: t('errorRejectingRequest') }));
        } finally {
            setProcessingRequest(null);
        }
    };

    /**
     * Lọc danh sách bạn bè theo từ khóa tìm kiếm
     */
    const filteredFriends = useMemo(() => {
        return friends.filter(friend =>
            (friend.fullName && friend.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (friend.name && friend.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Giữ .name cho tương thích ngược
            (friend.email && friend.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [friends, searchTerm]);

    /**
     * Xử lý khi click vào avatar
     */
    const handleAvatarClick = useCallback(() => setShowProfile(true), []);
    
    /**
     * Xử lý khi đóng profile
     */
    const handleProfileClose = useCallback(() => {
        setShowProfile(false);
    }, []);

    /**
     * Hiển thị trạng thái đang tải
     * @param {string} text - Văn bản hiển thị khi đang tải
     * @returns {JSX.Element} Component hiển thị
     */
    const renderLoading = (text = t('loading')) => (
        <div className="flex flex-col items-center justify-center h-full py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-gray-500 text-sm">{text}</p>
        </div>
    );

    /**
     * Hiển thị trạng thái trống
     * @param {string} message - Thông báo chính
     * @param {JSX.Element} icon - Icon hiển thị
     * @param {string} subMessage - Thông báo phụ
     * @returns {JSX.Element} Component hiển thị
     */
    const renderEmptyState = (message, icon, subMessage = null) => (
        <div className="flex flex-col items-center justify-center h-full text-center p-10 text-gray-500">
            {icon && React.cloneElement(icon, { size: 64, className: "mb-6 text-indigo-300" })}
            <p className="text-xl font-semibold text-gray-700 mb-2">{message}</p>
            {subMessage && <p className="text-gray-500">{subMessage}</p>}
        </div>
    );
    
    /**
     * Xử lý khi di chuột vào bạn bè để hiển thị tooltip
     * @param {Event} event - Sự kiện di chuột
     * @param {Object} friend - Thông tin người bạn
     */
    const handleMouseEnter = (event, friend) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({ 
            x: rect.right + 20, 
            y: rect.top - 70 
        });
        setHoveredFriend(friend);
    };
    
    /**
     * Xử lý khi di chuột ra khỏi vùng bạn bè
     */
    const handleMouseLeave = () => {
        if (!isTooltipHovered) {
            tooltipTimeoutRef.current = setTimeout(() => {
                if (!isTooltipHovered) {
                    setHoveredFriend(null);
                }
                tooltipTimeoutRef.current = null;
            }, 200);
        }
    };
    
    /**
     * Xử lý khi di chuột vào tooltip
     */
    const handleTooltipMouseEnter = () => {
        setIsTooltipHovered(true);
    };
    
    /**
     * Xử lý khi di chuột ra khỏi tooltip
     */
    const handleTooltipMouseLeave = () => {
        setIsTooltipHovered(false);
        setHoveredFriend(null);
    };
    
    return (
        <div className="flex h-screen bg-gray-100">
            <Navbar activePage="friends" onAvatarClick={handleAvatarClick} />

            {/* Middle Column: Friends List Panel */}
            <div className="w-[21rem] bg-white border-r border-gray-200 flex flex-col h-screen">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">{t('friends')}</h2>
                     <p className="text-xs text-gray-500 mb-3">{t('manageList')}</p>
                    <div className="flex space-x-2 mb-3">
                        <button
                            onClick={() => setCurrentActionView('addFriend')}
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-colors
                                        ${currentActionView === 'addFriend' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            <UserPlus size={16} className="mr-1.5" /> {t('addFriend')}
                        </button>
                        <button
                            onClick={() => setCurrentActionView('viewRequests')}
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-colors relative
                                        ${currentActionView === 'viewRequests' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            <Mail size={16} className="mr-1.5" /> {t('requests')}
                            {requests.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                                    {requests.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('searchFriends')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-9 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 relative">
                    {friendsLoading ? renderLoading(t('loading')) :
                        friends.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">{t('noFriends')}</div>
                        ) : filteredFriends.length === 0 ? (
                             <div className="p-4 text-center text-gray-400 text-sm">{t('noFriendsFound')}</div>
                        ) : (
                            filteredFriends.map(friend => (
                                <div
                                    key={friend.user_id || friend.id}
                                    className="flex items-center p-2.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                    onMouseEnter={(e) => handleMouseEnter(e, friend)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium overflow-hidden mr-3 flex-shrink-0">
                                        {friend.img ? (
                                            <img src={friend.img} alt={friend.fullName || 'Avatar'} className="w-full h-full object-cover" />
                                        ) : (
                                            getInitial(friend)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{friend.fullName || friend.name || t('user')}</p>
                                        <p className="text-xs text-gray-500 truncate">{friend.email || ''}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        
                    {/* Friend Info Tooltip */}
                    {hoveredFriend && (
                        <div 
                            className="fixed z-50 bg-white rounded-lg shadow-lg p-4 w-64 animate-fade-in"
                            style={{ 
                                top: tooltipPosition.y, 
                                left: tooltipPosition.x,
                            }}
                            onMouseEnter={handleTooltipMouseEnter}
                            onMouseLeave={handleTooltipMouseLeave}
                        >
                            <div className="flex flex-col items-center mb-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-medium overflow-hidden mb-2">
                                    {hoveredFriend.img ? (
                                        <img src={hoveredFriend.img} alt={hoveredFriend.fullName || 'Avatar'} className="w-full h-full object-cover" />
                                    ) : (
                                        getInitial(hoveredFriend)
                                    )}
                                </div>
                                <h2 className="text-md font-semibold text-gray-800">{hoveredFriend.fullName || hoveredFriend.name || t('user')}</h2>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                    <AtSign size={14} className="text-indigo-500 mr-2" />
                                    <div>
                                        <p className="text-xs text-gray-500">{t('email')}</p>
                                        <p className="text-xs text-gray-700">{hoveredFriend.email || t('notAvailable')}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                    <Phone size={14} className="text-indigo-500 mr-2" />
                                    <div>
                                        <p className="text-xs text-gray-500">{t('phoneNumber')}</p>
                                        <p className="text-xs text-gray-700">{hoveredFriend.phoneNumber || t('notAvailable')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Action Panel */}
            <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto p-4">
                {currentActionView === 'idle' && (
                    <div className="flex flex-col items-center justify-center h-full p-6">
                        {renderEmptyState(
                            t('welcomeTitle'),
                            <Users />,
                            t('welcomeMessage')
                        )}
                    </div>
                )}

                {currentActionView === 'addFriend' && (
                    <div className="p-4 md:p-6 w-full">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-5">{t('addNewFriend')}</h2>
                            {errorMessages.addFriend && <p className="mb-3 text-xs text-red-600 bg-red-100 p-2.5 rounded-md">{errorMessages.addFriend}</p>}
                            {successMessages.addFriend && <p className="mb-3 text-xs text-green-600 bg-green-100 p-2.5 rounded-md">{successMessages.addFriend}</p>}
                            <div className="flex items-center space-x-2 mb-4">
                                <input
                                    type="email"
                                    placeholder={t('enterEmail')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={sendingRequest}
                                    className="flex-grow p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                                <button
                                    onClick={handleAddFriend}
                                    disabled={sendingRequest}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-sm font-medium disabled:opacity-60"
                                >
                                    {sendingRequest ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : t('sendRequest')}
                                </button>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-700">
                                <h3 className="text-sm font-semibold flex items-center mb-1.5">
                                    <AlertCircle size={16} className="mr-1.5" /> {t('note')}
                                </h3>
                                <ul className="list-disc list-inside pl-1 text-xs space-y-0.5">
                                    <li>{t('noteItem1')}</li>
                                    <li>{t('noteItem2')}</li>
                                    <li>{t('noteItem3')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {currentActionView === 'viewRequests' && (
                    <div className="p-4 md:p-6 w-full">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-5">{t('friendRequests')} ({requests.length})</h2>
                            {requestsLoading ? renderLoading(t('loadingRequests')) :
                                requests.length === 0 ? renderEmptyState(t('noRequests'), <Mail />) :
                                (
                                    <div className="space-y-3">
                                        {errorMessages.acceptRequest && <p className="mb-2 text-xs text-red-600 bg-red-100 p-2 rounded-md">{errorMessages.acceptRequest}</p>}
                                        {successMessages.acceptRequest && <p className="mb-2 text-xs text-green-600 bg-green-100 p-2 rounded-md">{successMessages.acceptRequest}</p>}
                                        {errorMessages.rejectRequest && <p className="mb-2 text-xs text-red-600 bg-red-100 p-2 rounded-md">{errorMessages.rejectRequest}</p>}
                                        {successMessages.rejectRequest && <p className="mb-2 text-xs text-green-600 bg-green-100 p-2 rounded-md">{successMessages.rejectRequest}</p>}
                                        {requests.map(request => (
                                            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0">
                                                        {request.userData?.img ? (
                                                            <img src={request.userData.img} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : getInitial(request.userData)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-semibold text-gray-800 truncate">{request.userData?.fullName || t('user')}</h3>
                                                        <p className="text-xs text-gray-500 truncate">{request.userData?.email || ''}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request)}
                                                        disabled={processingRequest === request.id}
                                                        className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60"
                                                        title={t('accept')}
                                                    >
                                                        {processingRequest === request.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600"></div> : <CheckCircle size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request)}
                                                        disabled={processingRequest === request.id}
                                                        className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-60"
                                                        title={t('reject')}
                                                    >
                                                        {processingRequest === request.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div> : <XCircle size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )}
            </div>

            {showProfile && currentUser && (
                <UserProfile 
                    userId={currentUser.uid} 
                    onClose={handleProfileClose}
                />
            )}
            
            {/* Add a CSS animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-in-out;
                }
            `}</style>
        </div>
    );
}

/**
 * Component quản lý bạn bè và kết bạn trong ứng dụng
 */
export default Friends; 