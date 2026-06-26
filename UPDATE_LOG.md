# UPDATE_LOG.md

File này ghi lại lịch sử thay đổi của project.

Mỗi lần Antigravity/AI sửa xong code, phải thêm một mục mới ở trên cùng.

## Format ghi log

```md
## YYYY-MM-DD - Tên thay đổi ngắn

### Đã làm
- ...

### File đã sửa
- ...

### Ghi chú
- ...
```

## 2026-06-27 - Thiết kế và Nâng cấp Giao diện Trang chủ (Homepage UI Redesign)

### Đã làm
* Thiết kế lại trang chủ Home thành một learning dashboard chuyên nghiệp, thu hẹp khoảng trống và tận dụng tối đa chiều rộng màn hình (lên đến 1200px).
* Xây dựng phần Hero hiện đại 2 cột trên desktop:
  - Cột trái: badge "ENGLISH LEARNING HUB", tiêu đề lớn, subtitle giới thiệu lộ trình học, và 2 nút hành động nhanh (CTA) "Bắt đầu học", "Ôn từ vựng".
  - Cột phải: Khối mock card flashcard stack xoay nghiêng sinh động bằng HTML/CSS mô phỏng từ vựng ("Afford", IPA, nghĩa và ví dụ thực tế).
* Bổ sung thanh thống kê nhanh (Quick Stats Dashboard) hiển thị số lượng khóa học, tổng số từ vựng (tính toán động từ CSV), tổng số buổi học, và các chế độ học tập.
* Thiết kế lại các thẻ chức năng (Feature Cards) trực quan:
  - Nổi bật các tính năng đang hoạt động (Flashcard Quiz & Vocabulary Review) với màu sắc chủ đạo, hiệu ứng hover, tag trạng thái và nút hành động tương ứng.
  - Tối giản các tính năng sắp ra mắt (Listening, Grammar, Wrong Words, Daily Challenge) với hiệu ứng làm mờ nhẹ và border nét đứt.
* Thêm phần Lộ trình học (Learning Paths) giới thiệu chi tiết 2 khóa học "Nền tảng" và "TOEIC 1", tích hợp nút "Học ngay" và "Ôn từ" có chức năng truyền khóa học được chọn sẵn (`initialCourse`) vào Quiz/Review.
* Bổ sung quy trình học 3 bước trực quan (How to Learn) giúp hướng dẫn người học nhanh chóng làm quen với ứng dụng.
* Cấu hình nâng cấp màu sắc CSS (gradient nền mượt mà cho toàn trang web, accent màu xanh/tím hiện đại) và tối ưu hóa responsive, đảm bảo hiển thị hoàn hảo trên các màn hình mobile (360px - 430px) mà không bị tràn ngang.

### File đã sửa
* `src/App.jsx`
* `src/components/Home.jsx`
* `src/components/FlashcardQuiz.jsx`
* `src/components/VocabularyReview.jsx`
* `src/styles.css`

### Ghi chú
* Đã chạy build thành công bằng `npm run build`.
* Không làm thay đổi logic học, logic load dữ liệu CSV hay cấu trúc dataset cũ.

## 2026-06-27 - Tối ưu hóa UI Chọn Buổi học và Ôn tập Từ vựng trên Mobile

### Đã làm
* Chuyển đổi danh sách chọn buổi học trên mobile (màn hình < 768px) thành dạng button/chip compact:
  - Bố cục lưới 2 cột (hoặc 1 cột cho màn hình cực nhỏ dưới 360px).
  - Chiều cao từ 48px - 60px, căn giữa, ẩn icon lịch và checkbox.
  - Trạng thái active/selected làm nổi bật rõ ràng qua màu nền và viền.
* Bổ sung thanh sticky action bar `.mobile-sticky-action-bar` ở dưới cùng màn hình Selecting của Flashcard Quiz trên mobile:
  - Hiển thị số lượng buổi đã chọn (Đã chọn x/n buổi).
  - Nút "Bắt đầu học" luôn xuất hiện cố định, tự động disabled khi chưa chọn buổi.
* Phát triển cơ chế thu gọn/mở rộng (collapse/expand) danh sách buổi học ở cả Flashcard Quiz và Vocabulary Review trên mobile:
  - Tự động hiển thị summary (Khóa học/Buổi đã chọn) kèm nút "Đổi buổi" khi đã chọn buổi học.
  - Hỗ trợ nút "Thu gọn" ở phần control khi đang mở rộng danh sách.
* Tối ưu hiển thị Vocabulary Review trên mobile giúp hiển thị danh sách từ vựng ngay dưới phần summary mà không cần scroll qua các card lớn.
* Tích hợp tính năng auto-scroll mượt mà xuống danh sách từ vựng trên mobile khi người dùng chọn buổi đầu tiên hoặc nhấn "Thu gọn" bộ chọn.

### File đã sửa
* `src/components/FlashcardQuiz.jsx`
* `src/components/VocabularyReview.jsx`
* `src/styles.css`

### Ghi chú
* Bản build production thành công bằng `npm run build`.
* Không làm thay đổi logic học, logic load dữ liệu, hay thiết kế desktop.

## 2026-06-27 - Thêm tính năng Vocabulary Review ôn tập từ vựng

### Đã làm
* Kích hoạt thẻ "Vocabulary Review" trên trang chủ Home, đổi tiêu đề mô tả thành "Xem lại từ vựng theo khóa học và buổi học" và chuyển nút hành động thành "Ôn từ vựng".
* Thêm mới component `VocabularyReview.jsx` quản lý toàn bộ logic màn hình ôn tập:
  - Cho phép người dùng chuyển đổi qua lại giữa hai khóa học "Nền tảng" (`foundation`) và "TOEIC 1" (`toeic1`).
  - Hỗ trợ chọn buổi học (1 buổi, nhiều buổi, hoặc chọn tất cả thông qua nút chọn nhanh).
  - Tự động hiển thị danh sách từ vựng dưới dạng card trực quan trên cả desktop và mobile (không dùng bảng).
  - Tích hợp ô tìm kiếm realtime không phân biệt hoa thường theo từ (`word`), nghĩa tiếng Việt (`answer`) và ví dụ tiếng Anh (`example`).
  - Bổ sung bộ lọc nhanh theo loại từ (`pos`): Tất cả, Noun / n, Verb / v, Adjective / adj, Adverb / adv, Phrase / phrase.
  - Hiển thị bộ đếm số lượng từ đang xem và tổng số từ trong buổi học đã chọn.
  - Tích hợp nút phát âm, ưu tiên chạy file audio và fallback bằng Web Speech API thông qua helper `speakWord`.
* Bổ sung styles CSS chi tiết cho ô search, bộ lọc nhanh, danh sách grid card từ vựng và thiết lập responsive tối ưu cho kích thước mobile 360px - 430px.
* Cập nhật `App.jsx` để quản lý state điều hướng giữa Trang chủ, Flashcard Quiz và Vocabulary Review.

### File đã sửa
* `src/App.jsx`
* `src/components/Home.jsx`
* `src/components/VocabularyReview.jsx` [NEW]
* `src/styles.css`

### Ghi chú
* Bản build production thành công bằng `npm run build`.
* Không làm ảnh hưởng đến logic và giao diện hiện có của màn Flashcard Quiz.

## 2026-06-27 - Tối ưu hóa UI Web Flashcard cho Mobile

### Đã làm
* Tối ưu hóa layout và căn chỉnh padding trên thiết bị di động (màn hình 360px - 430px) để không bị tràn ngang, không cần zoom.
* Chuyển đổi grid danh sách tính năng trên trang chủ (`features-grid`) thành 1 cột dọc trực quan, giúp các vùng chạm lớn và dễ bấm hơn.
* Tối ưu hóa màn hình chọn khóa học và buổi học:
  - Bộ chọn khóa học (`course-selector`) chuyển sang dạng xếp dọc 1 cột trên màn hình nhỏ.
  - Danh sách các buổi học (`days-grid`) tự động co giãn về 1 cột trên mobile.
  - Vùng bấm của thẻ buổi học rộng rãi, tích hợp checkbox và click toàn bộ thẻ rất dễ dùng.
  - Nút "Bắt đầu học" mở rộng thành full-width trên mobile, tạo điểm nhấn hành động.
* Cải tiến màn hình Quiz:
  - Cấu trúc lại header tiến độ học/số câu đúng/buổi học thành thanh dashboard 3 cột cân xứng, gọn gàng ở đầu trang.
  - Tối ưu kích thước chữ từ vựng tiếng Anh chính, loại từ (`pos`) và phiên âm (`ipa`) hiển thị liền mạch bên dưới từ vựng.
  - Căn chỉnh câu ví dụ thoáng đãng, dễ đọc.
  - Chuyển đổi 4 đáp án trắc nghiệm sang dạng 1 cột full-width với chiều cao nút tối thiểu là 52px, khoảng cách giữa các nút là 10px để tránh bấm nhầm.
* Nâng cấp màn hình kết quả:
  - Phát triển thêm giao diện danh sách card (`review-cards-list`) cho các từ làm sai trên thiết bị di động thay thế cho dạng bảng.
  - Sử dụng CSS media queries để tự động ẩn bảng và hiển thị danh sách card trên mobile, đảm bảo không bị vỡ bảng hay tràn ngang, trong khi vẫn giữ nguyên giao diện bảng đẹp mắt trên desktop.
  - Cân đối lại kích thước font chữ và biểu tượng phần thưởng trên màn hình nhỏ.

### File đã sửa
* `src/components/FlashcardQuiz.jsx`
* `src/styles.css`

### Ghi chú
* Đã chạy build production thành công bằng `npm run build`.
* Không thay đổi bất kỳ logic học, logic load dữ liệu CSV hay cấu trúc dataset nào.

## 2026-06-27 - Hỗ trợ nhiều bộ học (Nền tảng & TOEIC 1)

### Đã làm
* Nâng cấp cấu trúc file CSV `flashcards.csv` bằng cách chèn cột `course` vào vị trí thứ 2. Tự động gán `course = foundation` cho toàn bộ các từ vựng hiện có và bổ sung thêm các từ vựng mẫu cho bộ `toeic1` ở cuối file CSV.
* Cập nhật hàm load CSV trong `loadFlashcards.js` để đọc cột `course`, hỗ trợ fallback gán giá trị mặc định là `"foundation"` nếu cột này rỗng hoặc không tồn tại.
* Cập nhật logic tạo câu hỏi trong `createQuestion.js` hỗ trợ 3 tầng lọc đáp án sai (wrong answers) theo mức độ ưu tiên: trong cùng bộ đang học (cùng course, cùng days chọn) -> trong cùng bộ học (cùng course) -> từ toàn bộ CSV.
* Cải tiến giao diện chọn buổi học trong `FlashcardQuiz.jsx` với sự xuất hiện của Bộ chọn khóa học (Course Selector) gồm hai tùy chọn: "Nền tảng" (`foundation`) và "TOEIC 1" (`toeic1`).
* Thiết lập logic tự động reset danh sách các ngày học đã chọn (`selectedDays`) về rỗng `[]` khi thay đổi bộ học để tránh bị lẫn ngày học giữa các bộ khác nhau (Buổi 1 của Nền tảng không bị lẫn với Buổi 1 của TOEIC 1).
* Bổ sung style CSS cho bộ chọn khóa học trong `styles.css` tạo hiệu ứng hover mượt mà và active gradient đẹp mắt, hỗ trợ hiển thị responsive trên thiết bị di động.

### File đã sửa
* `public/data/flashcards.csv`
* `src/utils/loadFlashcards.js`
* `src/utils/createQuestion.js`
* `src/components/FlashcardQuiz.jsx`
* `src/styles.css`

### Ghi chú
* Đã chạy build production thành công với Vite (`npm run build`).

---

## 2026-06-27 - Hỗ trợ cột pos (Loại từ) trong CSV

### Đã làm
* Cập nhật hàm load CSV trong `loadFlashcards.js` để đọc cột `pos`.
* Cập nhật hàm `handleSelect` trong `FlashcardQuiz.jsx` để lưu lại `pos` vào kết quả bài học (`answersLog`).
* Bổ sung hiển thị loại từ (`pos`) bên cạnh phiên âm (IPA) ở màn chơi quiz. Định dạng hiển thị là `pos · ipa` (ví dụ `v · /diˈspleɪ/`). Không hiển thị dấu chấm thừa nếu `pos` bị trống.
* Thêm cột "Loại từ" vào bảng kết quả ôn tập từ vựng làm sai ở màn hình kết thúc quiz.
* Thêm class CSS `.review-pos` trong `styles.css` để định dạng hiển thị loại từ trong bảng kết quả.

### File đã sửa
* `src/utils/loadFlashcards.js`
* `src/components/FlashcardQuiz.jsx`
* `src/styles.css`

### Ghi chú
* Đã build kiểm tra thành công với Vite (`npm run build`). Không chạy dev server.

---

## 2026-06-26 - Nâng cấp Flashcard Quiz: chia buổi học, chống lặp câu, bảng kết quả thang 10

### Đã làm
* Cập nhật file CSV để bổ sung cột `day` phân nhóm các từ vựng theo ngày/buổi học.
* Cấu hình logic parser trong `loadFlashcards.js` để đọc cột `day` mới, gán giá trị mặc định `"1"` nếu file CSV cũ không có cột `day`.
* Sửa đổi `createQuestion.js` để tối ưu hóa việc tạo 4 phương án cho câu hỏi: ưu tiên lấy từ các đáp án sai trong buổi học hiện tại (nếu đủ), tự động fallback lấy từ toàn bộ CSV (nếu thiếu), bảo đảm không trùng lặp các đáp án và dùng Fisher-Yates để trộn đáp án.
* Thiết kế và phát triển màn hình chọn buổi học (`selecting` state) trong `FlashcardQuiz.jsx`, hỗ trợ học đơn buổi hoặc tích chọn kết hợp nhiều buổi học cùng lúc.
* Thay thế thuật toán random cũ bằng hàng đợi câu hỏi (`questionQueue`) được xáo trộn duy nhất một lần khi bắt đầu buổi học, loại bỏ hoàn toàn lỗi lặp lại từ trong cùng một lượt học.
* Phát triển màn hình hiển thị kết quả bài học (`finished` state) tính điểm theo thang 10 làm tròn 1 chữ số thập phân (loại bỏ số 0 thừa nếu là số nguyên).
* Thiết kế bảng ôn tập từ vựng làm sai trong giao diện kết quả kèm nút nghe phát âm trực quan.
* Thêm các nút điều hướng tương tác: "Học lại buổi này", "Chọn buổi khác", "Về trang chủ".
* Cập nhật và tối ưu hóa CSS trong `styles.css` tạo hiệu ứng chuyển tiếp mượt mà, thiết kế card chọn buổi học hiện đại và bảng kết quả premium.

### File đã sửa
* `public/data/flashcards.csv`
* `src/utils/loadFlashcards.js`
* `src/utils/createQuestion.js`
* `src/components/FlashcardQuiz.jsx`
* `src/styles.css`

### Ghi chú
* Đã build kiểm tra thành công với Vite (`npm run build`).
* Toàn bộ chức năng hoạt động chính xác theo yêu cầu, không phát sinh lỗi mã hóa hay render.

---

## 2026-06-26 - Nâng cấp trang chủ, sửa lỗi font tiếng Việt và tích hợp điều hướng

### Đã làm
* Sửa lỗi mã hóa tiếng Việt trong `public/data/flashcards.csv` bằng cách chuyển về mã hóa UTF-8 chuẩn.
* Thêm Google Font `Be Vietnam Pro` để hiển thị tiếng Việt chuẩn và thiết kế style mới cho trang chủ.
* Tạo trang chủ `Home.jsx` với danh sách 6 tính năng (Flashcard Quiz hoạt động, các tính năng khác hiển thị "Sắp ra mắt").
* Thêm state quản lý điều hướng và chuyển đổi màn hình trong `App.jsx`.
* Thêm nút quay về trang chủ từ màn hình Flashcard Quiz (`FlashcardQuiz.jsx`).

### File đã sửa
* `public/data/flashcards.csv`
* `src/styles.css`
* `src/App.jsx`
* `src/components/Home.jsx` (NEW)
* `src/components/FlashcardQuiz.jsx`

### Ghi chú
* Đã chạy build production thành công bằng `npm run build`.
* Kiểm tra trên browser hiển thị tiếng Việt hoàn hảo, điều hướng qua lại mượt mà.

---

## 2026-06-26 - Khởi tạo project flashcard

### Đã làm

* Tạo web flashcard học tiếng Anh bằng React.
* Load dữ liệu từ file CSV.
* Random 1 từ tiếng Anh.
* Tạo 1 đáp án đúng và 3 đáp án sai.
* Thêm nút loa phát âm.
* Hiển thị phiên âm và câu ví dụ.

### File đã sửa

* `public/data/flashcards.csv`
* `src/components/FlashcardQuiz.jsx`
* `src/utils/loadFlashcards.js`
* `src/utils/createQuestion.js`
* `src/utils/speech.js`
* `src/App.jsx`
* `src/styles.css`

### Ghi chú

* Project hiện dùng CSV, chưa dùng database.
* Cột CSV chuẩn là `id,word,answer,ipa,example,audio`.
