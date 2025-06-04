import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CornerUpRight, RotateCcw, Trash2, Reply, MoreVertical } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Component hiển thị tin nhắn trả lời trong ứng dụng chat
 */
const ReplyMessage = React.memo(({ message, isSentByUser, onDelete, onForward, onRevoke, onReply, onClickReply, isGroupChat, senderName, allMessages }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const { t } = useLanguage();

    // Đóng menu khi nhấp ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Kiểm tra xem có click vào menu hoặc button không
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        // Kiểm tra nếu menu đang mở thì thêm event listener
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    // Now, after all hooks have been called, we can safely return early if needed
    // If this message is systemRevoked (automatically revoked because it's a reply to a revoked message),
    // or if the message is directly revoked, or if it's deleted for the current user, we don't display it at all
    if (message.systemRevoked || message.revoked || message.deleted) {
        return null;
    }

    // Check if the message being replied to is revoked
    const replyTo = message.replyTo;
    if (replyTo && replyTo.id && allMessages) {
        const [originalConId, originalTimestampStr] = replyTo.id.split('/');
        const originalTimestamp = Number(originalTimestampStr);
        const originalMsg = allMessages.find(
            (m) => m.con_id === originalConId && m.createdAt === originalTimestamp
        );
        if (originalMsg && originalMsg.revoked) {
            // This is a reply to a revoked message, don't display it
            return null;
        }
    }

    // Đóng menu khi mouse leave
    const handleMouseLeave = () => {
        setShowOptions(false);
        // Đợi một chút để tránh đóng menu quá nhanh khi di chuyển chuột
        setTimeout(() => {
            if (!menuRef.current?.contains(document.activeElement)) {
                setShowMenu(false);
            }
        }, 200);
    };

    // Chuyển đổi timestamp sang định dạng giờ:phút
    const formatTime = (timestamp) => {
        try {
            const date = new Date(Number(timestamp));
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (error) {
            return '';
        }
    };

    const messageTime = formatTime(message.timestamp);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onDelete) onDelete(message.id);
    }, [message.id, onDelete]);

    const handleForward = useCallback((e) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onForward) onForward(message);
    }, [message, onForward]);

    const handleRevoke = useCallback((e) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onRevoke) onRevoke(message.id);
    }, [message.id, onRevoke]);

    const handleReply = useCallback((e) => {
        e.stopPropagation();
        if (onReply) onReply(message);
    }, [message, onReply]);

    const toggleMenu = useCallback((e) => {
        e.stopPropagation();
        setShowMenu(prev => !prev);
    }, []);

    const handleClickReply = useCallback((e) => {
        e.stopPropagation();
        if (onClickReply) onClickReply();
    }, [onClickReply]);

    // Xử lý hiển thị của tin nhắn dựa trên trạng thái
    const messageDisplay = () => {
        if (message.revoked) {
            return <span className="italic text-gray-500">{t('messageRevoked')}</span>;
        } else if (message.deleted) {
            return <span className="italic text-gray-500">{t('messageDeleted')}</span>;
        } else {
            return message.text;
        }
    };

    // Lấy nội dung tin nhắn được trả lời
    const getReplyPreview = () => {
        const replyTo = message.replyTo;

        if (!replyTo) return null;

        let originalMessageRevoked = false;
        if (replyTo.id && allMessages) {
            const [originalConId, originalTimestampStr] = replyTo.id.split('/');
            const originalTimestamp = Number(originalTimestampStr);
            // Ensure messages in allMessages have a comparable timestamp (e.g., msg.createdAt)
            const originalMsg = allMessages.find(
                (m) => m.con_id === originalConId && m.createdAt === originalTimestamp
            );
            if (originalMsg && originalMsg.revoked) {
                originalMessageRevoked = true;
            }
        }

        // Thêm class đặc biệt cho tin nhắn của đối phương
        const replyBoxClass = isSentByUser
            ? 'bg-indigo-100 text-indigo-800'
            : 'bg-blue-100 text-blue-800 shadow-md';

        if (originalMessageRevoked) {
            return (
                <div
                    className={`text-xs p-2 rounded-lg mt-0 mb-1 ${replyBoxClass}
                        cursor-pointer hover:bg-opacity-80 transition-all`}
                    onClick={handleClickReply} // Keep original click behavior if needed, or adjust
                    title={t('originalMessageRevoked')}
                >
                    <div className="flex items-center mb-1">
                        <Reply size={12} className={isSentByUser ? 'text-indigo-500 mr-1' : 'text-blue-500 mr-1'} />
                        <span className="font-medium">{replyTo.senderName || t('user')}</span>
                    </div>
                    <div className="line-clamp-1 italic text-gray-500">{t('originalMessageRevoked')}</div>
                </div>
            );
        }

        // Rút gọn nội dung tin nhắn được trả lời nếu quá dài
        const truncateContent = (content, maxLength = 25) => {
            if (!content || content.length <= maxLength) return content || '';
            return content.substring(0, maxLength) + '...';
        };

        const replyContent = truncateContent(replyTo.content);
        const replyType = replyTo.type || 'text';

        let previewText = '';

        switch (replyType) {
            case 'image':
                previewText = t('imagePreview');
                break;
            case 'video':
                previewText = t('videoPreview');
                break;
            case 'file':
                previewText = t('filePreviewPrefix') + replyContent + ']';
                break;
            default:
                previewText = replyContent;
        }

        return (
            <div
                className={`text-xs p-2 rounded-lg mt-0 mb-1 ${replyBoxClass}
                    cursor-pointer hover:bg-opacity-80 transition-all`}
                onClick={handleClickReply}
                title={t('clickToViewOriginal')}
            >
                <div className="flex items-center mb-1">
                    <Reply size={12} className={isSentByUser ? 'text-indigo-500 mr-1' : 'text-blue-500 mr-1'} />
                    <span className="font-medium">{replyTo.senderName || t('user')}</span>
                </div>
                <div className="line-clamp-1">{previewText}</div>
            </div>
        );
    };

    return (
        <div
            className={`flex flex-col m-4 ${isSentByUser ? 'items-end' : 'items-start'}`}
            onMouseEnter={() => setShowOptions(true)}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative group">
                {/* Hiển thị tên người gửi nếu là nhóm chat và không phải người dùng hiện tại */}
                {isGroupChat && !isSentByUser && senderName && (
                    <div className="text-xs text-gray-600 mb-1 ml-1 font-medium">
                        {senderName}
                    </div>
                )}
                <div className="space-y-1">
                    {getReplyPreview()}
                    <div
                        className={`px-4 py-2 rounded-lg text-sm break-words shadow-md max-w-[250px] md:max-w-[550px] lg:max-w-[450px] overflow-hidden ${message.revoked || message.deleted
                            ? 'bg-gray-100 text-gray-500'
                            : isSentByUser
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 rounded-tl-none'
                            }`}
                    >
                        <p className={message.revoked || message.deleted ? 'italic' : 'break-words whitespace-pre-wrap'}>
                            {messageDisplay()}
                        </p>
                    </div>
                </div>

                {/* Hiển thị các nút tùy chọn khi hover - vị trí ngang mức tin nhắn */}
                {showOptions && !message.revoked && !message.deleted && (
                    <div className={`absolute top-1/2 transform -translate-y-1/2 ${isSentByUser ? 'right-full mr-2' : 'left-full ml-2'} flex items-center space-x-1`}>
                        {/* Nút Reply luôn hiển thị */}
                        <button
                            onClick={handleReply}
                            className={`p-2 shadow-md rounded-full hover:bg-gray-100 ${!isSentByUser
                                ? 'bg-white text-indigo-500'
                                : 'bg-white text-indigo-500'
                                }`}
                                                                title={t('replyToMessage')}
                        >
                            <Reply size={18} className={!isSentByUser ? 'text-indigo-600' : 'text-indigo-500'} />
                        </button>

                        {/* Nút 3 chấm để mở menu */}
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={toggleMenu}
                                className="p-1.5 bg-white shadow-md rounded-full hover:bg-gray-100"
                                title={t('moreOptions')}
                            >
                                <MoreVertical size={16} className="text-gray-600" />
                            </button>

                            {/* Menu tùy chọn khi nhấp vào nút 3 chấm - hiển thị phía trên nút */}
                            {showMenu && (
                                <div
                                    ref={menuRef}
                                    className="absolute bottom-full mb-2 bg-white shadow-md rounded-lg p-1 z-10"
                                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                                >
                                    {isSentByUser && (
                                        <button
                                            onClick={handleRevoke}
                                            className="p-2 flex items-center text-sm w-full hover:bg-gray-100 rounded whitespace-nowrap"
                                            title={t('revokeMessage')}
                                        >
                                            <RotateCcw size={16} className="text-gray-600 mr-2" />
                                            <span>{t('revoke')}</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleForward}
                                        className="p-2 flex items-center text-sm w-full hover:bg-gray-100 rounded whitespace-nowrap"
                                        title={t('forwardMessage')}
                                    >
                                        <CornerUpRight size={16} className="text-gray-600 mr-2" />
                                        <span>{t('forwardButton')}</span>
                                    </button>

                                    <button
                                        onClick={handleDelete}
                                        className="p-2 flex items-center text-sm w-full hover:bg-gray-100 rounded whitespace-nowrap"
                                        title={t('deleteMessage')}
                                    >
                                        <Trash2 size={16} className="text-red-500 mr-2" />
                                        <span>{t('deleteForMe')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Thời gian tin nhắn */}
            <div className="text-right mt-1">
                <span className={`text-xs ${isSentByUser ? 'text-gray-500' : 'text-gray-500'}`}>
                    {messageTime}
                    {message.pending && (
                        <span className="ml-1 inline-flex">
                            <div className="animate-pulse flex space-x-[2px]">
                                <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-purple-400 rounded-full animation-delay-200"></div>
                                <div className="w-1 h-1 bg-indigo-400 rounded-full animation-delay-400"></div>
                            </div>
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
});

// Đặt tên cho component để dễ debug
ReplyMessage.displayName = 'ReplyMessage';

export default ReplyMessage; 