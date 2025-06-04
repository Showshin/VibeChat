import React, { useCallback, useState, useEffect } from 'react';
import { Users, User } from 'lucide-react';
import { userApi } from '../api/firebaseApi';

const ConversationItem = React.memo(({ conversation = {}, onClick, isSelected }) => {
    const [displayName, setDisplayName] = useState('Chat riêng');
    const [avatar, setAvatar] = useState(null);

    const formatTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        try {
            if (typeof timestamp === 'string' && timestamp.includes('at')) {
                const timeStr = timestamp.split('at')[1].split('UTC')[0].trim();
                return timeStr;
            }

            const date = new Date(Number(timestamp));
            if (isNaN(date.getTime())) return '';

            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Lỗi khi format thời gian:', error);
            return '';
        }
    }, []);

    const handleClick = useCallback(() => {
        if (conversation && conversation.con_id) {
            onClick(conversation);
        }
    }, [conversation, onClick]);

    useEffect(() => {
        const getDisplayName = async () => {
            if (conversation.is_group) {
                setDisplayName(conversation.name || 'Nhóm');
                return;
            }
            if (Array.isArray(conversation.members) && conversation.members.length === 2) {
                const otherMember = conversation.members.find(member => {
                    // Kiểm tra nếu member là object có user_id hoặc là string
                    const memberId = typeof member === 'object' ? member.user_id : member;
                    return memberId !== conversation.currentUserId;
                });

                if (otherMember) {
                    try {
                        // Xử lý dựa vào loại của otherMember
                        if (typeof otherMember === 'object' && otherMember.fullName) {
                            setDisplayName(otherMember.fullName || otherMember.user_name || 'Người dùng');
                            // Có thể cập nhật avatar nếu có
                            setAvatar(otherMember.img || null);
                        } else {
                            // Nếu chỉ là user_id hoặc không có thông tin đầy đủ, gọi API
                            const userId = typeof otherMember === 'object' ? otherMember.user_id : otherMember;
                            const userData = await userApi.getUserInfo(userId);
                            if (userData) {
                                setDisplayName(userData.fullName || 'Người dùng');
                                setAvatar(userData.img);
                            } else {
                                setDisplayName('Người dùng');
                            }
                        }
                    } catch (error) {
                        console.error('Lỗi khi lấy thông tin người dùng:', error);
                        setDisplayName('Người dùng');
                    }
                }
            }
        };

        getDisplayName();
    }, [conversation]);

    // Kiểm tra dữ liệu conversation
    if (!conversation || typeof conversation !== 'object' || !conversation.con_id) {
        return null;
    }

    const firstLetter = displayName.charAt(0).toUpperCase();

    return (
        <div
            className={`p-3 flex items-center hover:bg-gray-100 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
            onClick={handleClick}
        >
            {/* Avatar */}
            <div className="relative">
                {conversation.is_group ? (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center">
                        {conversation.img ? (
                            <img
                                src={conversation.img}
                                alt="group avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <Users className="text-blue-500" size={28} />
                        )}
                    </div>
                ) : (
                    <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center">
                                {displayName !== 'Chat riêng' ? (
                                    <span className="text-white text-lg font-medium">
                                        {firstLetter}
                                    </span>
                                ) : (
                                    <User className="text-white" size={24} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <div className="font-medium truncate">
                        {displayName}
                    </div>
                    <div className="ml-2 text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(conversation.last_message_ts)}
                    </div>
                </div>
                <div className="text-sm text-gray-500 truncate">
                    {conversation.last_message || ''}
                </div>
            </div>
        </div>
    );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;