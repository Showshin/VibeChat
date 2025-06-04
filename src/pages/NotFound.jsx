import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-10 max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-indigo-600">404</h1>
          <div className="w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 my-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Trang không tồn tại</h2>
          <p className="text-gray-600">Rất tiếc, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.</p>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
          >
            <Home size={18} className="mr-2" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 