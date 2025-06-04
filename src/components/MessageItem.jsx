import React, { useCallback, useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, CornerUpRight, RotateCcw, Reply } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const MessageComponent = React.memo(({ message, isSentByUser, onDelete, onForward, onRevoke, onReply, isGroupChat, senderName }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const interactionZoneRef = useRef(null);
    const { t } = useLanguage(); // Get translation function

    const hideTimeoutRef = useRef(null);
    const HIDE_DELAY = 150; // ms

    const clearHideTimeout = useCallback(() => {
        clearTimeout(hideTimeoutRef.current);
    }, []);

    const startHideTimeout = useCallback(() => {
        clearHideTimeout();
        hideTimeoutRef.current = setTimeout(() => {
            setShowOptions(false);
            setShowMenu(false);
        }, HIDE_DELAY);
    }, [clearHideTimeout, HIDE_DELAY]);

    const handleInteractionEnter = useCallback(() => {
        clearHideTimeout();
        setShowOptions(true);
    }, [clearHideTimeout]);

    const handleInteractionLeave = useCallback(() => {
        startHideTimeout();
    }, [startHideTimeout]);

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

    // Đóng menu khi nhấp ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showMenu && // Only run if menu is shown
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                clearHideTimeout();
                setShowMenu(false);
                setShowOptions(false); // Also hide options
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu, clearHideTimeout]); // Rerun if showMenu changes, include clearHideTimeout

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            clearHideTimeout();
        };
    }, [clearHideTimeout]);

    const handleReply = useCallback((e) => {
        e.stopPropagation();
        clearHideTimeout();
        setShowMenu(false);
        setShowOptions(false);
        if (onReply) onReply(message);
    }, [message, onReply, clearHideTimeout]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        clearHideTimeout();
        setShowMenu(false);
        setShowOptions(false);
        if (onDelete) onDelete(message.id);
    }, [message.id, onDelete, clearHideTimeout]);

    const handleForward = useCallback((e) => {
        e.stopPropagation();
        clearHideTimeout();
        setShowMenu(false);
        setShowOptions(false);
        if (onForward) onForward(message);
    }, [message, onForward, clearHideTimeout]);

    const handleRevoke = useCallback((e) => {
        e.stopPropagation();
        clearHideTimeout();
        setShowMenu(false);
        setShowOptions(false);
        if (onRevoke) onRevoke(message.id);
    }, [message.id, onRevoke, clearHideTimeout]);

    const toggleMenu = useCallback((e) => {
        e.stopPropagation();
        clearHideTimeout(); // Clear any pending hide when interacting with menu
        setShowMenu(prevShowMenu => {
            const newShowMenu = !prevShowMenu;
            if (newShowMenu) {
                setShowOptions(true); // Ensure options are visible when menu opens
            } else {
                // If menu is being closed by toggle, start hide timeout for options
                // This case handles clicking the ... button again to close the menu.
                // If it's desired that options also hide immediately, then call setShowOptions(false)
                // For now, let the general mouse leave logic handle options.
                // Or, to be more explicit:
                // startHideTimeout(); // If mouse is not over interaction zone after this, it will hide.
            }
            return newShowMenu;
        });
    }, [clearHideTimeout]);

    // Xử lý hiển thị của tin nhắn dựa trên trạng thái
    const messageDisplay = () => {
        if (message.revoked) {
            return <span className="italic text-gray-500">{t('messageRevoked')}</span>;
        } else if (message.deleted) {
            // Assuming 'deleted' means deleted for the current user but visible to others.
            // If it means truly gone, the styling might differ or message not rendered.
            return <span className="italic text-gray-500">{t('messageDeleted')}</span>;
        } else {
            return message.text;
        }
    };

    return (
        <div
            className={`flex flex-col m-4 ${isSentByUser ? 'items-end' : 'items-start'}`}
        >
            <div
                ref={interactionZoneRef}
                className="relative group"
                onMouseEnter={handleInteractionEnter}
                onMouseLeave={handleInteractionLeave}
            >
                {/* Hiển thị tên người gửi nếu là nhóm chat và không phải người dùng hiện tại */}
                {isGroupChat && !isSentByUser && senderName && (
                    <div className="text-xs text-gray-600 mb-1 ml-1 font-medium">
                        {senderName}
                    </div>
                )}

                <div
                    className={`px-4 py-2 rounded-lg text-sm break-words shadow-md max-w-[250px] md:max-w-[550px] lg:max-w-[450px] overflow-hidden ${message.revoked || message.deleted
                        ? 'bg-gray-100 text-gray-500' // Consistent styling for revoked/deleted
                        : isSentByUser
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none'
                        }`}
                >
                    <p className={message.revoked || message.deleted ? 'italic' : 'break-words whitespace-pre-wrap'}>
                        {messageDisplay()}
                    </p>
                </div>

                {/* Hiển thị các nút tùy chọn khi hover - vị trí ngang mức tin nhắn */}
                {showOptions && !message.revoked && !message.deleted && (
                    <div className={`absolute top-1/2 transform -translate-y-1/2 ${isSentByUser ? 'right-full mr-2' : 'left-full ml-2'} flex items-center space-x-1`}>
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

                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={toggleMenu}
                                className="p-1.5 bg-white shadow-md rounded-full hover:bg-gray-100"
                                title={t('moreOptions')}
                            >
                                <MoreVertical size={16} className="text-gray-600" />
                            </button>

                            {showMenu && (
                                <div
                                    ref={menuRef}
                                    className="absolute bottom-full mb-2 bg-white shadow-lg rounded-lg p-1 z-10 min-w-[140px]"
                                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                                    onMouseEnter={handleInteractionEnter} // Allow mouse to enter menu
                                    onMouseLeave={handleInteractionLeave} // Handle mouse leaving menu
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

MessageComponent.displayName = 'MessageComponent';

export default MessageComponent;