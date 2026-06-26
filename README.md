# English Flashcard Web

Web flashcard học tiếng Anh đơn giản:

- Dữ liệu lấy từ file CSV.
- Mỗi câu hiển thị 1 từ tiếng Anh.
- Có 1 đáp án đúng và 3 đáp án sai random từ kho nghĩa.
- Có phiên âm IPA, câu ví dụ.
- Nút loa dùng Web Speech API để đọc từ tiếng Anh.
- Nếu cột `audio` có link mp3, app sẽ ưu tiên phát file audio đó.

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
