import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Image, Trash2, CornerUpRight, RotateCcw, Reply, MoreVertical } from 'lucide-react';

/**
 * Component hiển thị tin nhắn hình ảnh trong ứng dụng chat
 */
const ImageMessage = React.memo(({ message, isSentByUser, onDelete, onForward, onRevoke, onReply, isGroupChat, senderName }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleMouseLeave = () => {
        setShowOptions(false);
        setTimeout(() => {
            if (!menuRef.current?.contains(document.activeElement)) {
                setShowMenu(false);
            }
        }, 200);
    };

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
    const imageUrl = message.url;

    const handleImageLoaded = () => {
        setIsLoaded(true);
    };

    const handleImageError = (e) => {
        console.error('Lỗi khi tải ảnh:', e);
        setHasError(true);
    };

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
        setShowMenu(false);
        if (onReply) onReply(message);
    }, [message, onReply]);

    const toggleMenu = useCallback((e) => {
        e.stopPropagation();
        setShowMenu(prev => !prev);
    }, []);

    const renderContent = () => {
        if (message.revoked) {
            return (
                <div className="bg-gray-200 w-64 h-64 flex items-center justify-center">
                    <span className="text-gray-500 italic">Tin nhắn đã bị thu hồi</span>
                </div>
            );
        } else if (message.deleted) {
            return (
                <div className="bg-gray-200 w-64 h-64 flex items-center justify-center">
                    <span className="text-gray-500 italic">Tin nhắn đã bị xóa</span>
                </div>
            );
        } else {
            return (
                <div className="relative">
                    {!isLoaded && !hasError && (
                        <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
                                </div>
                                <p className="text-gray-400 text-sm">Đang tải ảnh...</p>
                            </div>
                        </div>
                    )}
                    {hasError && (
                        <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                            <div className="text-center">
                                <div className="bg-red-100 p-2 rounded-full mb-2 mx-auto w-10 h-10 flex items-center justify-center">
                                    <Image className="text-red-500" size={24} />
                                </div>
                                <span className="text-gray-500">Không thể tải ảnh</span>
                            </div>
                        </div>
                    )}
                    <img
                        src={imageUrl}
                        alt="Tin nhắn hình ảnh"
                        className={`w-full max-h-[200px] rounded-lg object-cover ${!isLoaded ? 'hidden' : ''}`}
                        onLoad={handleImageLoaded}
                        onError={handleImageError}
                    />
                </div>
            );
        }
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
                <div className="relative">
                    {renderContent()}
                </div>

                {showOptions && !message.revoked && !message.deleted && (
                    <div className={`absolute top-1/2 transform -translate-y-1/2 ${isSentByUser ? 'right-full mr-2' : 'left-full ml-2'} flex items-center space-x-1`}>
                        <button
                            onClick={handleReply}
                            className={`p-2 shadow-md rounded-full hover:bg-gray-100 ${!isSentByUser
                                ? 'bg-white text-indigo-500'
                                : 'bg-white text-indigo-500'
                                }`}
                            title="Trả lời tin nhắn"
                        >
                            <Reply size={18} className={!isSentByUser ? 'text-indigo-600' : 'text-indigo-500'} />
                        </button>

                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={toggleMenu}
                                className="p-1.5 bg-white shadow-md rounded-full hover:bg-gray-100"
                                title="Tùy chọn thêm"
                            >
                                <MoreVertical size={16} className="text-gray-600" />
                            </button>

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
                                            title="Thu hồi tin nhắn"
                                        >
                                            <RotateCcw size={16} className="text-gray-600 mr-2" />
                                            <span>Thu hồi</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleForward}
                                        className="p-2 flex items-center text-sm w-full hover:bg-gray-100 rounded whitespace-nowrap"
                                        title="Chuyển tiếp tin nhắn"
                                    >
                                        <CornerUpRight size={16} className="text-gray-600 mr-2" />
                                        <span>Chuyển tiếp</span>
                                    </button>

                                    <button
                                        onClick={handleDelete}
                                        className="p-2 flex items-center text-sm w-full hover:bg-gray-100 rounded whitespace-nowrap"
                                        title="Xóa tin nhắn"
                                    >
                                        <Trash2 size={16} className="text-red-500 mr-2" />
                                        <span>Xóa với tôi</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="text-right mt-1">
                <span className="text-xs text-gray-500">
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

ImageMessage.displayName = 'ImageMessage';

export default ImageMessage;
