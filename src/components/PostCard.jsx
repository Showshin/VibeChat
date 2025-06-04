import React from 'react';
import { Calendar, User, Heart, Trash2 } from 'lucide-react';

const PostCard = ({ post, onLike, formatDate, t, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Post header */}
      <div className="p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden mr-3">
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="text-indigo-500" size={20} />
          )}
        </div>
        <div className="flex-1">
        <h3 className="font-semibold text-gray-800">
          {post.authorName || t('user')}{' '}
          <span className="text-gray-500 text-xs italic">- {post.authorEmail}</span>
        </h3>
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={12} className="mr-1" />
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>

        
        {/* Add delete button if user is the author */}
        {post.isAuthor && (
          <button 
            onClick={() => onDelete(post)}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title={t('deletePost')}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      
      {/* Post title and content - moved above media */}
      <div className="px-4 pb-3">
        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
        <p className="text-gray-700 mb-4">{post.content}</p>
      </div>
      
      {/* Post media (if any) */}
      {post.mediaUrl && (
        <div className="w-full bg-gray-100">
          {post.mediaType === 'image' ? (
            <img 
              src={post.mediaUrl} 
              alt="Post" 
              className="w-full max-h-[500px] object-contain"
            />
          ) : post.mediaType === 'video' ? (
            <video 
              src={post.mediaUrl} 
              controls 
              className="w-full max-h-[500px]"
            />
          ) : null}
        </div>
      )}
      
      {/* Post actions */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <button 
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              post.likedByCurrentUser 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onLike(post.id, post.likedByCurrentUser)}
          >
            <Heart 
              size={18} 
              fill={post.likedByCurrentUser ? "#ef4444" : "none"} 
            />
            <span>
              {post.likedByCurrentUser ? t('unlike') : t('like')}
            </span>
          </button>
          
          <div className="text-sm text-gray-500">
            {post.likes} {t('likes')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard; 