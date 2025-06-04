import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Calendar, User, X, Heart, Image, Film, Trash2, ThumbsUp, TrendingUp, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  where, 
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useLanguage } from '../contexts/LanguageContext';
import PostCard from '../components/PostCard';

const Social = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaType, setMediaType] = useState('');
  const fileInputRef = useRef(null);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [mediaSource, setMediaSource] = useState('upload'); // 'upload' or 'ai'
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Fetch posts from Firestore
  useEffect(() => {
    const postsQuery = query(
      collection(db, 'Posts'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        likedByCurrentUser: doc.data().likedBy?.includes(currentUser.uid) || false,
        isAuthor: doc.data().authorId === currentUser.uid
      }));
      setPosts(postsData);
    });
    
    return () => unsubscribe();
  }, [currentUser.uid]);
  
  // Fetch trending posts (most liked)
  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const trendingQuery = query(
          collection(db, 'Posts'),
          orderBy('likes', 'desc'),
          limit(3)
        );
        
        const snapshot = await getDocs(trendingQuery);
        const trendingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTrendingPosts(trendingData);
      } catch (error) {
        console.error("Error fetching trending posts:", error);
      }
    };
    
    fetchTrendingPosts();
  }, []);
  
  // Fetch current user info
  useEffect(() => {
    if (currentUser) {
      const userRef = collection(db, 'Users');
      const q = query(userRef, where('user_id', '==', currentUser.uid));
      
      getDocs(q).then(snapshot => {
        if (!snapshot.empty) {
          setUserInfo(snapshot.docs[0].data());
        }
      }).catch(error => {
        console.error("Error fetching user info:", error);
      });
    }
  }, [currentUser]);
  
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert(t('enterTitleAndContent'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare post data
      const postData = {
        title: newPostTitle,
        content: newPostContent,
        authorId: currentUser.uid,
        authorName: userInfo.fullName,
        authorEmail: userInfo.email,
        authorAvatar: userInfo.img || '',
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        mediaUrl: '',
        mediaType: ''
      };
      
      // If there's a media file, upload it first
      if (mediaFile) {
        const fileExtension = mediaFile.name.split('.').pop().toLowerCase();
        const fileName = `posts/${currentUser.uid}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        const uploadTask = uploadBytesResumable(storageRef, mediaFile);
        
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              alert(t('mediaUploadError'));
              reject(error);
            },
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              postData.mediaUrl = downloadUrl;
              postData.mediaType = mediaType;
              resolve();
            }
          );
        });
      }
      
      // Create the post
      await addDoc(collection(db, 'Posts'), postData);
      
      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setMediaFile(null);
      setMediaPreview('');
      setMediaType('');
      setUploadProgress(0);
      setShowCreateModal(false);
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert(t('postCreateError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('mediaFileSizeLimit'));
      return;
    }
    
    // Check file type
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      setMediaType('image');
    } else if (fileType.startsWith('video/')) {
      setMediaType('video');
    } else {
      alert(t('mediaTypeNotSupported'));
      return;
    }
    
    // Set file and create preview
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setMediaType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleLikePost = async (postId, isLiked) => {
    try {
      const postRef = doc(db, 'Posts', postId);
      
      if (isLiked) {
        // Unlike the post
        await updateDoc(postRef, {
          likes: posts.find(p => p.id === postId).likes - 1,
          likedBy: arrayRemove(currentUser.uid)
        });
      } else {
        // Like the post
        await updateDoc(postRef, {
          likes: posts.find(p => p.id === postId).likes + 1,
          likedBy: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };
  
  const handleDeletePost = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };
  
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      // Check if the current user is the author
      if (postToDelete.authorId !== currentUser.uid) {
        alert(t('notAuthorized'));
        return;
      }
      
      // Delete the post
      await deleteDoc(doc(db, 'Posts', postToDelete.id));
      
      // Close the modal
      setShowDeleteModal(false);
      setPostToDelete(null);
      
      // Note: No need to update the posts state as the onSnapshot listener will do that
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(t('deleteError'));
    }
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render trending posts sidebar
  const SidebarContent = () => {
    return (
      <div className="md:w-80 w-full md:ml-4">
        {/* Trending Posts - Now fixed/sticky */}
        <div className="bg-white rounded-lg shadow p-4 sticky top-4">
          <div className="flex items-center mb-3">
            <TrendingUp size={18} className="text-pink-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-800">Bài viết nổi bật</h2>
          </div>
          
          {trendingPosts.length > 0 ? (
            <div className="space-y-3">
              {trendingPosts.map(post => (
                <div key={post.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <h3 className="font-medium text-gray-800 line-clamp-1">{post.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">Bởi: {post.authorName || 'Người dùng'}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Heart size={12} className="mr-1 text-red-500" /> 
                      {post.likes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">Chưa có bài viết nổi bật</p>
          )}
        </div>
      </div>
    );
  };
  
  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      alert(t('enterPrompt'));
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-VCN2RWFacbJYcbzT879FuQJVQRfhCXu7H9fLEzUpzu4MP51A',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: aiPrompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
          style_preset: "photographic"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.artifacts && result.artifacts.length > 0) {
        // Get the base64 string
        const base64Data = result.artifacts[0].base64;
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'image/png' });
        const file = new File([blob], 'ai-generated-image.png', { type: 'image/png' });
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);
        
        setMediaPreview(previewUrl);
        setMediaType('image');
        setMediaFile(file);
        
        // Switch back to upload view to show preview
        setMediaSource('upload');
      } else {
        throw new Error('No image data received');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert(t('imageGenerationError'));
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Navbar activePage="social" />
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-5xl mx-auto md:flex">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">VibeChat</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
              >
                <PlusCircle size={18} className="mr-2" />
                {t('createPost')}
              </button>
            </div>
            
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">{t('noPosts')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLikePost}
                    onDelete={handleDeletePost}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="md:block mt-6 md:mt-0">
            <SidebarContent />
          </div>
        </div>
      </div>
      
      {/* Create Post Modal - Enhanced for media upload */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">{t('newPost')}</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('postTitle')}</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('enterPostTitle')}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('postContent')}</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                  placeholder={t('enterPostContent')}
                  required
                ></textarea>
              </div>
              
              {/* Media upload section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('media')}</label>
                
                <div className="mb-3">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setMediaSource('upload')}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        mediaSource === 'upload' 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Image size={18} className="inline-block mr-2" />
                      {t('uploadMedia')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaSource('ai')}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        mediaSource === 'ai' 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Wand2 size={18} className="inline-block mr-2" />
                      {t('generateWithAI')}
                    </button>
                  </div>
                </div>

                {mediaSource === 'upload' ? (
                  !mediaPreview ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-3">
                          <Image size={24} className="text-gray-400" />
                          <Film size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">{t('dropMediaHere')}</p>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleMediaChange}
                        accept="image/*,video/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      {mediaType === 'image' ? (
                        <img 
                          src={mediaPreview} 
                          alt="Preview" 
                          className="w-full h-64 object-contain rounded-lg border border-gray-300" 
                        />
                      ) : (
                        <video 
                          src={mediaPreview} 
                          controls 
                          className="w-full h-64 object-contain rounded-lg border border-gray-300" 
                        />
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {!mediaPreview ? (
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('enterImagePrompt')}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                      />
                    ) : (
                      <div className="relative">
                        <img 
                          src={mediaPreview} 
                          alt="Generated preview" 
                          className="w-full h-64 object-contain rounded-lg border border-gray-300" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMediaPreview('');
                            setMediaFile(null);
                            setMediaType('');
                          }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    )}
                    {!mediaPreview && (
                      <button
                        type="button"
                        onClick={generateAIImage}
                        disabled={isGeneratingImage || !aiPrompt.trim()}
                        className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingImage ? t('generating') : t('generateImage')}
                      </button>
                    )}
                    {isGeneratingImage && (
                      <div className="text-center text-sm text-gray-500">
                        {t('generatingImage')}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upload progress indicator */}
                {isSubmitting && mediaFile && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(uploadProgress)}%</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('publishing') : t('publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">{t('confirmDelete')}</h2>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600">
                {t('deletePostConfirmation')}
              </p>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDeletePost}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">{t('previewGeneratedImage')}</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative aspect-square w-full max-h-[80vh]">
                <img 
                  src={previewImage} 
                  alt="Generated preview" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
                >
                  {t('useInPost')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social; 