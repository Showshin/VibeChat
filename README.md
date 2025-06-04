<div align="center">

# VibeChat - Ứng dụng Mạng Xã hội và Trò chuyện

VibeChat là một ứng dụng web hiện đại kết hợp giữa mạng xã hội, trò chuyện trực tuyến và lưu trữ đám mây. Ứng dụng được xây dựng với React, Firebase và nhiều công nghệ hiện đại khác để mang đến trải nghiệm người dùng mượt mà và đầy đủ tính năng.

</div>

<div align="center">

## Tính năng chính

</div>

### 1. Đăng nhập và Xác thực
- Đăng nhập bằng email và mật khẩu
- Đăng ký tài khoản mới
- Xác thực email để bảo mật tài khoản

### 2. Trò chuyện
- Chat 1-1 với bạn bè
- Tạo và quản lý nhóm chat
- Gửi tin nhắn văn bản, hình ảnh và tệp đính kèm
- Trả lời và chuyển tiếp tin nhắn

### 3. Kết bạn
- Tìm kiếm người dùng qua email
- Gửi và nhận lời mời kết bạn
- Quản lý danh sách bạn bè

### 4. Mạng xã hội (Social)
- Đăng bài viết với nội dung văn bản và hình ảnh
- Tương tác với bài viết (thích, bình luận)
- Xem bài viết nổi bật
- Tạo hình ảnh bằng AI thông qua nhập prompt

### 5. Lưu trữ đám mây (Cloud)
- Tải lên và lưu trữ tệp cá nhân
- Hỗ trợ nhiều loại tệp (hình ảnh, video, tài liệu)
- Quản lý và tải xuống tệp đã lưu trữ

### 6. Tính năng bổ sung
- Hồ sơ người dùng có thể tùy chỉnh
- Chuyển đổi ngôn ngữ (Tiếng Việt và Tiếng Anh)
- Giao diện người dùng hiện đại và phản hồi nhanh

<div align="center">

## Công nghệ sử dụng

</div>

<div align="center">

- **Frontend**: React, TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Ngôn ngữ**: JavaScript
- **Build tool**: Vite
- **Thư viện khác**: React Router, Lucide React (icons)

</div>

<div align="center">

## Cài đặt và Chạy

</div>

### Yêu cầu hệ thống
- Node.js (phiên bản 14.x hoặc cao hơn)
- NPM hoặc Yarn

### Các bước cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/vibechat.git
cd vibechat
```

2. Cài đặt các dependencies:
```bash
npm install
# hoặc
yarn install
```

3. Tạo file `.env` trong thư mục gốc và thêm các thông tin cấu hình Firebase:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Khởi chạy ứng dụng ở môi trường phát triển:
```bash
npm run dev
# hoặc
yarn dev
```

5. Truy cập ứng dụng tại `http://localhost:5173`

<div align="center">

## Triển khai

</div>

Ứng dụng có thể được triển khai lên Firebase Hosting hoặc bất kỳ dịch vụ hosting tĩnh nào khác:

```bash
npm run build
# hoặc
yarn build

# Triển khai lên Firebase Hosting
firebase deploy
```

<div align="center">

## Hình ảnh minh họa

</div>

<div align="center">

### 1. Đăng nhập
![Đăng nhập](https://github.com/user-attachments/assets/da769c90-8a57-4f1f-86fa-639af0949337)

### 2. Đăng Ký
![Đăng Ký](https://github.com/user-attachments/assets/f759b884-1faf-4c91-99f2-d3663202cc0f)

### 3. Xác thực Email
![Xác thực Email](https://github.com/user-attachments/assets/4ee25925-fed1-42ab-9904-0b0e0a2be486)

### 4. Trò chuyện
![Trò chuyện](https://github.com/user-attachments/assets/f73929cd-1554-4b52-a4ef-bc50c59f40a1)

### 5. Kết bạn
![Kết bạn](https://github.com/user-attachments/assets/ab5419f9-419d-47fd-a550-e26ee4b3ac17)

### 6. Đăng bài viết
![Đăng bài viết](https://github.com/user-attachments/assets/78bdc19c-b75b-4ecf-8761-9b52fe042502)

### 7. Lưu trữ tài liệu
![Lưu trữ tài liệu](https://github.com/user-attachments/assets/b483319c-eb30-481f-b70d-9ede0f9bb803)

### 8. Các thông tin liên hệ thêm
![Thông tin liên hệ](https://github.com/user-attachments/assets/61f03981-efd0-4b19-baa2-5029a855732a)

</div>

<div align="center">

## Tác giả

VibeChat được phát triển bởi Mingon.

</div>
