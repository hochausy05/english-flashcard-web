# English Flashcard Web

Hệ thống Web học từ vựng tiếng Anh thông minh tích hợp Supabase backend:

- **Học hôm nay / Tiếp tục học**: Tự động gợi ý lộ trình học tập cá nhân hóa dựa trên lịch ôn Spaced Repetition, danh sách từ hay trả lời sai, và buổi học chưa hoàn thành tiếp theo.
- **Flashcard Quiz**: Học từ vựng trắc nghiệm phản xạ hoặc gõ từ tiếng Anh theo từng buổi học chống lặp câu hỏi.
- **Listening Practice**: Luyện nghe phát âm từ vựng và chọn đáp án trắc nghiệm hoặc nhập từ để kiểm tra.
- **Vocabulary Review**: Xem lại từ vựng, tìm kiếm realtime, lọc theo loại từ (n, v, adj, adv) và nghe phát âm.
- **Progress Dashboard**: Thống kê số phiên học, số từ đã học, tỷ lệ chính xác trung bình và lịch sử phiên học.
- **Bảng xếp hạng từ vựng (Leaderboard)**: Đua top vinh danh tiến độ học tập lành mạnh giữa các người học (điểm tính dựa trên số từ đã học, số buổi hoàn thành 100% và độ chính xác). Lọc bỏ tài khoản admin và bảo mật email/UUID cá nhân.
- **Wrong Words & Due Review**: Chuyên trang ôn luyện tập trung các từ hay trả lời sai và ôn tập Spaced Repetition đến lịch.
- **Tích xanh hoàn thành**: Chỉ đánh dấu tích xanh hoàn thành buổi học nếu trả lời đúng 100% không làm sai câu nào trong phiên.
- **Quản trị viên (Admin Panel)**: Giao diện quản lý thêm, sửa, xóa mềm từ vựng và import/preview tệp CSV dữ liệu trực quan.
- **Đồng bộ hóa Cloud**: Lưu trữ dữ liệu từ vựng, phiên học và đồng bộ tiến độ học tập qua Supabase. Hỗ trợ Guest học offline fallback CSV.

## Cài đặt

```bash
npm install
npm run dev
```

Mở link Vite hiển thị trên terminal, thường là:

```bash
http://localhost:5173
```

## File dữ liệu

Sửa file:

```txt
public/data/flashcards.csv
```

Format CSV:

```csv
id,word,answer,ipa,example,audio
1,abandon,từ bỏ,/əˈbændən/,He abandoned the plan.,
```

Ý nghĩa cột:

- `id`: mã dòng, dễ quản lý.
- `word`: từ tiếng Anh.
- `answer`: đáp án đúng, thường là nghĩa tiếng Việt.
- `ipa`: phiên âm.
- `example`: câu ví dụ.
- `audio`: có thể để trống. Nếu có file mp3, nhập dạng `/audio/word.mp3`.

## Gợi ý phát triển tiếp

1. Thêm chọn level A1, A2, B1.
2. Thêm topic: business, daily, travel.
3. Thêm localStorage để lưu điểm và từ sai.
4. Thêm trang quản lý CSV hoặc import CSV.
5. Sau này chuyển sang Supabase/Firebase nếu cần nhiều người dùng.
