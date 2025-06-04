import React, { useState, useCallback, useRef, useEffect } from 'react';
import { File, Trash2, CornerUpRight, RotateCcw, Download, Reply, MoreVertical } from 'lucide-react';

/**
 * Component hiển thị tin nhắn file trong ứng dụng chat
 */
const FileMessage = React.memo(({ message, isSentByUser, onDelete, onForward, onRevoke, onReply, isGroupChat, senderName }) => {
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

    const fileUrl = message.url;
    const fileName = message.content;

    const truncateFileName = (name, maxLength = 20) => {
        if (name.length <= maxLength) return name;

        const extension = name.lastIndexOf('.') !== -1
            ? name.slice(name.lastIndexOf('.'))
            : '';

        const nameWithoutExt = name.slice(0, name.length - extension.length);

        return nameWithoutExt.slice(0, maxLength - extension.length - 3) + '...' + extension;
    };

    const handleDownload = useCallback(() => {
        window.open(fileUrl, '_blank');
    }, [fileUrl]);

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
                <div className="bg-gray-200 px-4 py-3 rounded-lg flex items-center">
                    <span className="text-gray-500 italic">Tin nhắn đã bị thu hồi</span>
                </div>
            );
        } else if (message.deleted) {
            return (
                <div className="bg-gray-200 px-4 py-3 rounded-lg flex items-center">
                    <span className="text-gray-500 italic">Tin nhắn đã bị xóa</span>
                </div>
            );
        } else {
            return (
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${isSentByUser ? 'bg-blue-100' : 'bg-white'}`}>
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <File className={`${isSentByUser ? 'text-indigo-500' : 'text-gray-500'}`} size={24} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{truncateFileName(fileName)}</p>
                        <p className="text-xs text-gray-500">File đính kèm</p>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex-shrink-0 ml-2 p-2 bg-white rounded-full hover:bg-gray-100"
                        title="Tải xuống"
                    >
                        <Download size={16} className="text-indigo-500" />
                    </button>
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

FileMessage.displayName = 'FileMessage';

export default FileMessage; 