# Dự Án Khảo Sát Ý Kiến Trực Tuyến (Online Survey App)

Ứng dụng khảo sát ý kiến xây dựng bằng **HTML, CSS và JavaScript thuần (Vanilla)**, tự động đọc danh sách câu hỏi từ file **CSV** và hỗ trợ gửi kết quả bài làm về **email cá nhân** sau khi người tham gia bấm Submit.

---

## 🌟 Tính Năng Nổi Bật

1. **Đọc câu hỏi linh hoạt từ CSV**:
   - Tự động nạp file `questions.csv` có sẵn khi mở trang web.
   - Hỗ trợ nút **"Tải file CSV mới"** trực tiếp trên giao diện để đổi bộ câu hỏi tức thì mà không cần sửa code.
   - Định dạng CSV chuẩn gồm 6 cột: `id, question, option_a, option_b, option_c, option_d`.

2. **Giao diện hiện đại & cao cấp (Rich Aesthetics)**:
   - Phong cách Glassmorphism, hiệu ứng đổ bóng mượt mà, màu sắc chuẩn UI/UX hiện đại (Indigo/Cyan).
   - Thanh tiến độ (Progress Bar) bám dính (sticky) thông báo thời gian thực số câu đã hoàn thành và % tiến độ.
   - Các nút chọn đáp án A, B, C, D thiết kế dạng thẻ tương tác trực quan (Card Radio).
   - Tự động cuộn mượt và highlight rung cảnh báo nếu người dùng bỏ sót câu hỏi.
   - Hiệu ứng pháo hoa chúc mừng (Confetti) khi nộp bài thành công.

3. **Gửi kết quả về Email cá nhân**:
   - Hỗ trợ dịch vụ **Web3Forms API** (Miễn phí 100%, không cần viết backend server, nhận thư trực tiếp vào hòm thư Gmail/Outlook).
   - Hỗ trợ **Formspree** (Endpoint webhook).
   - Hỗ trợ chế độ mở trực tiếp ứng dụng mail (**mailto:**) làm phương án dự phòng.
   - Nút **"Xuất file kết quả"** (JSON) để lưu trữ nội bộ hoặc phân tích offline bất cứ lúc nào.

---

## 📁 Cấu Trúc Dự Án

```text
survey-app/
├── index.html        # Giao diện chính của form khảo sát
├── style.css         # Hệ thống thiết kế CSS, hoạt ảnh & responsive
├── app.js            # Logic đọc CSV, tính tiến độ, xác thực & gửi email
├── questions.csv     # File dữ liệu 10 câu hỏi mẫu (tiếng Việt có dấu UTF-8)
└── README.md         # Hướng dẫn chi tiết
```

---

## 🚀 Cách Chạy Ứng Dụng

### Cách 1: Chạy bằng máy chủ cục bộ (Khuyên dùng để fetch file CSV tự động)
Bạn có thể mở terminal trong thư mục này và dùng bất kỳ HTTP server đơn giản nào:

```powershell
# Sử dụng Python có sẵn:
python -m http.server 8000

# Hoặc dùng Node.js npx serve / live-server:
npx serve .
```
Sau đó truy cập: `http://localhost:8000` trên trình duyệt.

### Cách 2: Mở trực tiếp file `index.html`
- Nhấp đúp chuột vào file `index.html` để mở trong trình duyệt Chrome, Edge, Firefox...
- Nếu trình duyệt chặn fetch cục bộ qua giao thức `file://`, hệ thống sẽ tự động dùng 10 câu hỏi tích hợp sẵn, đồng thời bạn có thể bấm nút **"Tải file CSV mới"** ở góc phải trên cùng để chọn tệp `questions.csv` bất kỳ từ máy tính.

---

## ⚙️ Cấu Hình Gửi Email Về Hòm Thư Cá Nhân

1. Nhấp vào nút **"Cài đặt Email"** ở góc trên bên phải thanh tiêu đề.
2. Nhập địa chỉ email của bạn (Ví dụ: `your_email@gmail.com`).
3. Chọn dịch vụ:
   - **Web3Forms (Khuyên dùng)**: 
     - Truy cập nhanh [web3forms.com](https://web3forms.com), nhập email của bạn để nhận 1 **Access Key** miễn phí qua mail trong vòng 10 giây.
     - Dán Access Key đó vào ô cấu hình trong ứng dụng và bấm **Lưu Cấu Hình**.
     - Khi bất kỳ ai hoàn thành khảo sát, nội dung chi tiết bài khảo sát sẽ được gửi thẳng vào hộp thư đến của bạn!
   - **Formspree**: Dán Form ID / Endpoint Formspree nếu bạn đang dùng Formspree.
   - **Ứng dụng Mail mặc định (mailto:)**: Khi người làm khảo sát nhấn nộp, trình duyệt sẽ tự mở Gmail/Outlook với nội dung được soạn sẵn đầy đủ.
