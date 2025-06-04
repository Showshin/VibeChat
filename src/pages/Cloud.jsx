import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Search, Image, Video, FileText, Trash2, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Trang lưu trữ đám mây cho người dùng
 */
const Cloud = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Lấy danh sách tệp tin của người dùng từ Firestore
   */
  useEffect(() => {
    if (!currentUser) return;

    const filesQuery = query(
      collection(db, 'CloudFiles'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(filesQuery, (snapshot) => {
      const filesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt)
        };
      });
      // Sắp xếp tệp tin theo ngày tải lên
      filesData.sort((a, b) => b.uploadedAt - a.uploadedAt);
      setFiles(filesData);
    }, (error) => {
      console.error('Error loading files:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  /**
   * Xử lý chọn tệp tin để tải lên
   * @param {Event} e - Sự kiện chọn tệp
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước tệp tin (giới hạn 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File không được vượt quá 10MB');
      return;
    }

    setSelectedFile(file);
  };

  /**
   * Xử lý tải tệp tin lên đám mây
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Tải lên Firebase Storage
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const fileName = `cloud/${currentUser.uid}/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            alert(t('uploadError'));
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Lưu thông tin tệp tin vào Firestore
              const fileData = {
                userId: currentUser.uid,
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                fileSize: selectedFile.size,
                downloadUrl,
                storagePath: fileName,
                uploadedAt: serverTimestamp()
              };
              
              await addDoc(collection(db, 'CloudFiles'), fileData);
              
              resolve();
            } catch (error) {
              console.error('Error saving file data:', error);
              reject(error);
            }
          }
        );
      });

      // Đặt lại biểu mẫu
      setSelectedFile(null);
      setShowUploadModal(false);
      setUploadProgress(0);
      alert(t('uploadSuccess'));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Xử lý xóa tệp tin
   */
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      // Xóa từ Storage
      const storageRef = ref(storage, fileToDelete.storagePath);
      await deleteObject(storageRef);

      // Xóa từ Firestore
      await deleteDoc(doc(db, 'CloudFiles', fileToDelete.id));

      setShowDeleteModal(false);
      setFileToDelete(null);
      alert(t('deleteSuccess'));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(t('deleteFileError'));
    }
  };

  /**
   * Xử lý tải xuống tệp tin
   * @param {Object} file - Thông tin tệp tin cần tải xuống
   */
  const handleDownload = async (file) => {
    try {
      // Lấy URL tải xuống mới
      const storageRef = ref(storage, file.storagePath);
      const freshUrl = await getDownloadURL(storageRef);
      
      // Tạo phần tử liên kết tạm thời
      const link = document.createElement('a');
      link.href = freshUrl;
      link.download = file.fileName;
      link.target = '_blank'; // Mở trong tab mới nếu tải xuống thất bại
      
      // Thêm vào body, click, và xóa
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error.code === 'storage/object-not-found') {
        alert(t('fileNotFound'));
      } else if (error.code === 'storage/unauthorized') {
        alert(t('unauthorizedAccess'));
      } else {
        alert(t('downloadError'));
      }
    }
  };

  /**
   * Định dạng kích thước tệp tin
   * @param {number} bytes - Kích thước tệp tin tính bằng byte
   * @returns {string} Kích thước đã định dạng
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Định dạng ngày tháng để hiển thị
   * @param {Date} date - Ngày cần định dạng
   * @returns {string} Ngày đã định dạng
   */
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Lọc tệp tin dựa trên loại và truy vấn tìm kiếm
   */
  const filteredFiles = files.filter(file => {
    const matchesType = fileType === 'all' || 
      (fileType === 'images' && file.fileType.startsWith('image/')) ||
      (fileType === 'videos' && file.fileType.startsWith('video/')) ||
      (fileType === 'documents' && !file.fileType.startsWith('image/') && !file.fileType.startsWith('video/'));
    
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <Navbar activePage="cloud" />
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">
              {t('myCloud')}
            </h1>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
            >
              <Upload size={18} className="mr-2" />
              {t('uploadToCloud')}
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchFiles')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFileType('all')}
                  className={`px-4 py-2 rounded-lg border ${
                    fileType === 'all' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('allFiles')}
                </button>
                <button
                  onClick={() => setFileType('images')}
                  className={`px-4 py-2 rounded-lg border ${
                    fileType === 'images' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Image size={18} className="inline-block mr-2" />
                  {t('images')}
                </button>
                <button
                  onClick={() => setFileType('videos')}
                  className={`px-4 py-2 rounded-lg border ${
                    fileType === 'videos' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Video size={18} className="inline-block mr-2" />
                  {t('videos')}
                </button>
                <button
                  onClick={() => setFileType('documents')}
                  className={`px-4 py-2 rounded-lg border ${
                    fileType === 'documents' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} className="inline-block mr-2" />
                  {t('documents')}
                </button>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">{t('noFiles')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map(file => (
                <div key={file.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {file.fileType.startsWith('image/') ? (
                    <img 
                      src={file.downloadUrl} 
                      alt={file.fileName}
                      className="w-full h-48 object-cover"
                    />
                  ) : file.fileType.startsWith('video/') ? (
                    <video 
                      src={file.downloadUrl}
                      className="w-full h-48 object-cover"
                      controls
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <FileText size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 truncate">{file.fileName}</h3>
                    <div className="mt-2 text-sm text-gray-500 space-y-1">
                      <p>{t('fileSize')}: {formatFileSize(file.fileSize)}</p>
                      <p>{t('uploadDate')}: {formatDate(file.uploadedAt)}</p>
                      <p>{t('fileType')}: {file.fileType}</p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => handleDownload(file)}
                        className="text-indigo-500 hover:text-indigo-600"
                        title={t('download')}
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setFileToDelete(file);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-500 hover:text-red-600"
                        title={t('deleteFile')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">{t('uploadToCloudTitle')}</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {selectedFile ? selectedFile.name : t('dropMediaHere')}
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isUploading}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? t('uploading') : t('upload')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">{t('deleteFile')}</h2>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600">
                {t('deleteFileConfirm')}
              </p>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeleteFile}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cloud; 