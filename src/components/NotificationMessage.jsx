import React, { useMemo } from 'react';
import { LogOut, UserPlus, Users, MessageCircle, Trash2, User, UserX, UserCheck, AlertTriangle, Clock, Edit } from 'lucide-react';

const NotificationMessage = React.memo(({ message }) => {
    const { content, timestamp, createdAt } = message;

    // Sử dụng useMemo để tránh tính toán lại icon khi component render lại
    const icon = useMemo(() => {
        if (content.includes('đã rời khỏi nhóm')) {
            return <LogOut size={16} className="text-red-500 mr-2" />;
        } else if (content.includes('đã bị xóa khỏi nhóm')) {
            return <UserX size={16} className="text-red-500 mr-2" />;
        } else if (content.includes('đã được thêm vào nhóm')) {
            return <UserPlus size={16} className="text-green-500 mr-2" />;
        } else if (content.includes('Nhóm sẽ bị giải tán')) {
            return <AlertTriangle size={16} className="text-red-500 mr-2" />;
        } else if (content.includes('Nhóm chat đã được tạo')) {
            return <Users size={16} className="text-green-500 mr-2" />;
        } else if (content.includes('đã trở thành quản trị viên')) {
            return <UserCheck size={16} className="text-blue-500 mr-2" />;
        } else if (content.includes('đã đổi tên nhóm thành')) {
            return <Edit size={16} className="text-blue-500 mr-2" />;
        } else if (content.includes('đã xóa tin nhắn')) {
            return <Trash2 size={16} className="text-gray-500 mr-2" />;
        } else if (content.includes('đã được mời vào nhóm') || content.includes('tham gia nhóm')) {
            return <User size={16} className="text-indigo-500 mr-2" />;
        } else if (content.includes('tới hẹn')) {
            return <Clock size={16} className="text-yellow-500 mr-2" />;
        } else {
            return <MessageCircle size={16} className="text-blue-500 mr-2" />;
        }
    }, [content]);

    // Định dạng thời gian
    const formattedTime = useMemo(() => {
        const timeValue = timestamp || createdAt;
        if (!timeValue) return '';

        try {
            const date = new Date(typeof timeValue === 'number' ? timeValue : Number(timeValue));

            // Kiểm tra nếu là hôm nay
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

            if (isToday) {
                return date.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Lỗi khi định dạng thời gian:', error);
            return '';
        }
    }, [timestamp, createdAt]);

    // Định dạng nội dung tin nhắn thông báo
    const formattedContent = useMemo(() => {
        // Có thể bổ sung thêm xử lý đặc biệt cho một số loại thông báo
        return content;
    }, [content]);

    return (
        <div className="flex justify-center my-4 w-full">
            <div className="flex items-center bg-white text-gray-700 px-4 py-2 rounded-full text-sm shadow-sm max-w-[80%]">
                {icon}
                <span className="text-center">{formattedContent}</span>

                {formattedTime && (
                    <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                        {formattedTime}
                    </span>
                )}
            </div>
        </div>
    );
});

// Đặt tên cho component để dễ debug
NotificationMessage.displayName = 'NotificationMessage';

export default NotificationMessage; 