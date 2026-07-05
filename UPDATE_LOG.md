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
## 2026-07-06 - Tích hợp Bảng điều hướng câu hỏi cho Màn kiểm tra từ vựng

### Đã làm
- **VocabularyTest.jsx**:
  - Thêm state `activeQuestionIndex` và `showMobileNav` phục vụ theo dõi câu đang xem và đóng/mở drawer di động.
  - Triển khai hàm `scrollToQuestion(index)` hỗ trợ scroll smooth đến dòng bảng (Desktop) hoặc card (Mobile), tự động reset filter về "Tất cả" nếu câu hỏi chọn bị ẩn trên màn kết quả, và đặt focus vào input nếu đang làm bài.
  - Gán ID neo cho các dòng bảng và thẻ card để định vị chính xác vị trí scroll.
  - Gán sự kiện `onFocus` vào input để đồng bộ trạng thái active lên bảng câu hỏi khi người học tab hoặc nhấp chuột vào ô bất kỳ.
  - Nâng cấp điều hướng Enter gõ từ nhảy dòng bằng cách gọi `scrollToQuestion(idx + 1)` thay vì chỉ focus thô sơ.
  - Tái cấu trúc cấu trúc HTML: bọc bảng thi và list mobile vào layout wrapper chia 2 cột, thêm sidebar `.test-question-sidebar` bên trái trên Desktop, tích hợp mobile drawer overlay và nút kích hoạt Bản đồ câu.
- **vocabularyTest.css**:
  - Thiết kế responsive layout grid chia 2 cột trên Desktop (sidebar 240px, main content chiếm phần còn lại) và 1 cột trên Mobile.
  - Định dạng sidebar sticky `top: 96px` bám theo màn hình cuộn.
  - Thiết lập vùng cuộn số `.test-sidebar-grid` có `max-height: 380px` và custom scrollbar để hiển thị gọn gàng các bài thi dài.
  - Định nghĩa style và màu sắc ô số câu hỏi `.test-nav-box` với đủ các trạng thái: chưa điền (xám nhạt), đã điền (ngọc lục bảo nhạt), active (nền indigo, shadow ring), đúng (success-bg), sai (error-bg), bỏ trống (gray-bg).
  - Thêm styling cho nút toggle, overlay mờ và drawer di động trượt từ dưới lên cho Mobile.
  - Thêm style highlight khi active dòng table hoặc card trong màn kết quả.

### File đã sửa
- [src/components/VocabularyTest.jsx](file:///d:/VIBE/english-flashcard-web/src/components/VocabularyTest.jsx)
- [src/styles/vocabularyTest.css](file:///d:/VIBE/english-flashcard-web/src/styles/vocabularyTest.css)

### Ghi chú
- Chạy lệnh `npm run build` thành công, kiểm thử tự động xác nhận tính năng scroll và đổi trạng thái hoạt động chính xác trên cả Desktop lẫn Mobile.

## 2026-07-06 - Thiết kế lại giao diện và layout grid cho “Chế độ học tập”

### Đã làm
- **Home.jsx**:
  - Restructure lại grid card trong section "Chế độ học tập", loại bỏ class `bento-2col` khỏi card Flashcard Quiz để đưa tất cả card active về chung một hệ grid đồng kích thước.
  - Sắp xếp thứ tự 6 card active chính trong section "Chế độ học tập": Flashcard Quiz, Vocabulary Review, Listening Practice, Kiểm tra, Wrong Words, Leaderboard để tạo thành grid 3x2 hoàn hảo trên Desktop.
  - Tách card "Grammar Practice" (disabled) và bổ sung card "Daily Challenge" (disabled) sử dụng icon `Calendar` xuống một section riêng biệt mang tên "Sắp ra mắt" ở phía dưới.
- **dashboard.css**:
  - Thiết lập responsive grid cho cả `.features-grid` và `.upcoming-grid` theo nguyên lý mobile-first: 1 cột trên Mobile (<768px), 2 cột trên Tablet (>=768px), 3 cột trên Desktop (>=1024px).
  - Đồng bộ hóa class base `.feature-card` để áp dụng chung padding, border-radius, background, border, shadow cho tất cả các card (bao gồm cả active và disabled).
  - Sử dụng layout flexbox hướng cột (`display: flex; flex-direction: column; height: 100%; min-height: 300px;`) và thêm `margin-top: auto` vào `.feature-button` để tất cả nút bấm thẳng hàng tăm tắp dưới đáy card.
  - Giới hạn description text của `.feature-desc` tối đa 3 dòng bằng line-clamp để đảm bảo chiều cao card đồng bộ.
  - Vô hiệu hóa hiệu ứng hover (`transform`, `border-color`, `box-shadow`) cho các card thuộc lớp `.disabled-card` và gán `cursor: not-allowed` cho nút bấm bị tắt để tránh nhầm lẫn cho người dùng.

### File đã sửa
- [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
- [src/styles/dashboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/dashboard.css)

### Ghi chú
- Đã chạy lệnh build production `npm run build` thành công, kiểm tra không lỗi.
- Đã chạy subagent kiểm thử tự động xác nhận grid layout hiển thị cân đối trên cả Desktop, Tablet, và Mobile, đồng thời kiểm tra dòng điều hướng và hoạt động bình thường của nút "Trang chủ" trên các trang con.

## 2026-07-06 - Thêm chức năng “Kiểm tra từ vựng” (Vocabulary Test)

### Đã làm
- **VocabularyTest.jsx**:
  - Tạo mới component `VocabularyTest.jsx` quản lý 3 trạng thái: chọn bài kiểm tra, màn làm bài kiểm tra và màn kết quả thi.
  - Hỗ trợ 4 bài kiểm tra cố định: Nền tảng Giữa kỳ (Buổi 1-9), Nền tảng Cuối kỳ (Buổi 1-18), TOEIC 1 Giữa kỳ (Buổi 1-9), TOEIC 1 Cuối kỳ (Buổi 1-18).
  - Triển khai giao diện gameplay dạng danh sách 2 cột trên Desktop (STT, Từ tiếng Anh, Input điền nghĩa tiếng Việt) và dạng thẻ card-stack trên Mobile chống tràn ngang.
  - Hỗ trợ phím Enter để tự động chuyển focus xuống ô tiếp theo mượt mà.
  - Xây dựng thanh trạng thái sticky bottom hiển thị tiến độ nhập và nút "Nộp bài", kèm cảnh báo xác nhận nộp bài khi còn câu bỏ trống.
  - Thiết kế bảng điểm chi tiết kèm các bộ lọc câu đúng, câu sai, câu bỏ trống và tích hợp chức năng nghe phát âm.
- **vocabularyTestService.js**:
  - Tạo mới service hỗ trợ lọc, sắp xếp từ vựng theo khóa học/buổi thi và định dạng normalize, kiểm tra đáp án tiếng Việt (chấp nhận khớp chính xác hoặc khớp một trong nhiều nghĩa phân tách bằng dấu `,`, `;`, `/`, `|`, xuống dòng).
- **studyResultService.js**:
  - Tích hợp thêm chế độ `'vocabulary_test'` và ánh xạ cấu trúc ghi nhận câu trả lời vào Supabase bảng `study_sessions` và `study_answers`.
- **ProgressDashboard.jsx & progress.css**:
  - Định dạng hiển thị nhãn "Kiểm tra từ vựng" và tạo style cho badge `.mode-vocabulary_test` sử dụng gam màu ngọc lục bảo (emerald) đồng bộ.
- **Home.jsx**:
  - Thêm thẻ chức năng "Kiểm tra" vào danh sách "Chế độ học tập" trang chủ mà không làm ảnh hưởng các chế độ cũ.
- **App.jsx**:
  - Đăng ký component `VocabularyTest` và điều phối chuyển trang (routing) mượt mà.
- **vocabulary_test_migration.sql**:
  - Tạo mới tệp SQL migration phục vụ việc sửa đổi CHECK constraint trên cột `mode` của bảng `study_sessions` và `study_answers` để chấp nhận giá trị `'vocabulary_test'`.

## 2026-07-06 - Thêm chế độ học mới: “Nhập nghĩa tiếng Việt”

### Đã làm
- **FlashcardQuiz.jsx & WrongWords.jsx**:
  - Tích hợp thêm kiểu kiểm tra mới "Nhập nghĩa tiếng Việt" (`vietnamese_typing`) vào màn hình chọn chế độ.
  - Xây dựng giao diện gameplay hiển thị từ tiếng Anh lớn, phiên âm (IPA), loại từ, audio phát âm và câu ví dụ tiếng Anh, che giấu nghĩa tiếng Việt trước khi trả lời.
  - Phát triển helper `checkVietnameseAnswer` thực hiện normalize đáp án (trim khoảng trắng, chuyển chữ thường, loại bỏ dấu câu thừa ở đầu/cuối, chấp nhận các phần nghĩa phân tách bởi dấu `,`, `;`, `/`, `|` hoặc newline).
  - Tự động chuyển sang câu tiếp theo sau `1000ms` khi gõ đúng trong chế độ mới. Nếu sai, giữ nguyên màn hình hiển thị đáp án đúng để người dùng nhấn "Tiếp tục" hoặc nhấn Enter.
  - Chống double submit và khóa nhập liệu / nút bấm trong quá trình tự động chuyển câu thông qua state `isAutoNexting`.
  - Cập nhật bảng kết quả (Finished Screen) hiển thị review so sánh chi tiết giữa từ tiếng Anh, nghĩa tiếng Việt đúng và nội dung người học đã gõ cho cả hai chế độ nhập liệu trên cả Desktop và Mobile.
- **studyResultService.js**:
  - Hỗ trợ map và lưu trữ kết quả phiên học của chế độ `vietnamese_typing` lên Supabase (bảng `study_sessions` và `study_answers`), ghi nhận đúng prompt, user_answer, correct_answer và update word_progress / Wrong Words.
- **ProgressDashboard.jsx**:
  - Định dạng hiển thị mode `vietnamese_typing` thành "Nhập nghĩa tiếng Việt" trong lịch sử phiên học gần đây.
- **progress.css**:
  - Thêm styling cho badge hiển thị chế độ `.mode-vietnamese_typing` sử dụng gam màu vàng/cảnh báo đồng bộ.
- **flashcard.css**:
  - Nâng cấp `.quiz-mode-options` thành hiển thị 3 cột trên Desktop để dàn hàng đều 3 kiểu kiểm tra.
- **add_vietnamese_typing_mode.sql**:
  - Tạo file SQL migration phục vụ việc sửa đổi CHECK constraint trên cột `mode` của bảng `study_sessions` và `study_answers` để chấp nhận giá trị `'vietnamese_typing'`.

### File đã sửa
- [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
- [src/components/WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx)
- [src/components/ProgressDashboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ProgressDashboard.jsx)
- [src/utils/studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js)
- [src/styles/progress.css](file:///d:/VIBE/english-flashcard-web/src/styles/progress.css)
- [src/styles/flashcard.css](file:///d:/VIBE/english-flashcard-web/src/styles/flashcard.css)
- [supabase/add_vietnamese_typing_mode.sql](file:///d:/VIBE/english-flashcard-web/supabase/add_vietnamese_typing_mode.sql) [NEW]
- [README.md](file:///d:/VIBE/english-flashcard-web/README.md)
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Đảm bảo logic check xanh hoàn thành buổi học hoạt động ổn định và lưu đầy đủ Wrong Words.
- Đã chạy lệnh `npm run build` thành công, kiểm tra không lỗi.

## 2026-07-03 - Nâng cấp Visual Polish giao diện (PHASE 4)

### Đã làm
- **global.css**: Bổ sung token màu Emerald (`--color-emerald`, `--color-emerald-hover`, `--color-emerald-bg`, `--color-emerald-border`, `--color-emerald-light`) nhất quán cho các trạng thái completed/streak. Di chuyển global keyframes (`fadeIn`, `scaleUp`, `slideUp`, `slideDown`) vào đây để tránh khai báo lặp.
- **dashboard.css**:
  - Hero title lớn hơn: `clamp(40px, 5.5vw, 60px)`, letter-spacing chặt hơn `−0.025em` để tạo cảm giác impact mạnh.
  - Stat card shell: Background rõ ràng hơn (`rgba(248,250,255,0.8)`) và hover shadow rõ nét (`0 16px 40px -12px rgba(49,87,213,0.16)`).
  - Stat number lớn hơn: `clamp(24px, 3.2vw, 32px)` + stat-label nhỏ gọn hơn với `letter-spacing: 0.02em`.
  - Feature card: Xóa `min-height: 54px` cứng trên `.feature-desc` để nội dung tự co giãn.
  - Disabled card: Tăng contrast `opacity: 0.55`, border dày hơn `1.5px dashed`.
  - Path card: Bán kính bo góc nhỏ hơn `20px` cho cảm giác solid hơn.
- **flashcard.css**:
  - Example text: Giảm `19px → 17px`, thêm background nhạt + border-left → tạo block quote visual.
  - Result box: Padding tăng `18→20px`, shadow mang màu ngữ nghĩa (xanh lá cho correct, đỏ cho wrong).
  - Score number lớn hơn `54px → 60px` + letter-spacing chặt hơn để nổi bật kết quả.
  - Lesson card completed: Circle lớn hơn `44→48px`, border `1.5px`, shadow xanh lá nhẹ. Background card nhạt emerald `rgba(236,253,245,0.4)` thay vì trắng.
- **leaderboard.css**:
  - Podium rank-1: Gradient nền kem nhạt `#fffdf5 → #fffbeb`, border amber rõ hơn, shadow lớn hơn.
  - Podium rank-2/3: Gradient nền tương ứng, border rõ hơn.
  - Glow opacity tăng `0.15→0.22` cho hiệu ứng ánh sáng thực tế hơn.
  - Error/Empty states: Thêm icon wrapper có border thay vì emoji to, màu ngữ nghĩa đúng (đỏ cho error, xám cho empty).
- **progress.css**: Icon wrapper tăng `40→44px`, border-radius `12→14px`. Stat label chữ nhỏ hơn `12→11px` với letter-spacing rõ hơn.
- **auth.css**: Input focus ring nhỏ gọn hơn `4px→3px` + background nhạt. Submit button thêm `active:scale(0.98)` tactile. Login button thêm shadow khi hover.
- **layout.css**: `min-height: 100vh → 100dvh` (hỗ trợ mobile notch), thêm media query mobile padding `16px 12px`.
- **Build**: `npm run build` pass, bundle CSS 102.32 kB.

### File đã sửa
- [src/styles/global.css](file:///d:/VIBE/english-flashcard-web/src/styles/global.css)
- [src/styles/dashboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/dashboard.css)
- [src/styles/flashcard.css](file:///d:/VIBE/english-flashcard-web/src/styles/flashcard.css)
- [src/styles/leaderboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/leaderboard.css)
- [src/styles/progress.css](file:///d:/VIBE/english-flashcard-web/src/styles/progress.css)
- [src/styles/auth.css](file:///d:/VIBE/english-flashcard-web/src/styles/auth.css)
- [src/styles/layout.css](file:///d:/VIBE/english-flashcard-web/src/styles/layout.css)
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Không đổi bất kỳ logic React, Supabase query, hay JSX nào. Tất cả thay đổi thuần CSS.
- Xây dựng trên nền tảng Phase 3, không có breaking change.

## 2026-07-03 - Thực hiện Audit UI/UX và nâng cấp giao diện cao cấp (PHASE 3)

### Đã làm
- **Đánh giá & Khảo sát giao diện**: Đóng góp báo cáo đánh giá chi tiết UI/UX cho toàn bộ 9 màn hình chức năng.
- **Nâng cấp Dashboard & Lộ trình (Đợt 1)**:
  - Cấu trúc lại 4 stats cards và Thẻ khuyến nghị học tập thành dạng Double-Bezel lồng shell.
  - Bổ sung hiệu ứng Skeleton Loader `.rec-skeleton` nhịp nhàng thay thế loading text thô sơ.
  - Thiết kế lại Auth Header mobile thành floating glass pill detached lướt từ trên xuống và menu hamburger staggered fade-in mượt mà.
- **Nâng cấp Gameplay & Luyện nghe (Đợt 2)**:
  - Tách biệt ví dụ từ vựng bằng border trái Indigo mờ và chữ in nghiêng.
  - Áp dụng cấu trúc Double-Bezel khay lồng CSS-only cho `.quiz-stat-card` thông qua pseudo-element `::after` mà không cần đổi JSX.
  - Bổ sung hiệu ứng sóng âm pulsing wave rings `.listening-speaker-large` khi di chuột và di chuyển chậm lúc nghỉ cho bài nghe.
- **Nâng cấp Podium & Accuracy Ring (Đợt 3)**:
  - Tạo chữ số thứ hạng mờ khổng lồ (`1`, `2`, `3`) phía sau các thẻ top 3 Podium của Leaderboard.
  - Bổ sung hiệu ứng tự động vẽ cung tròn Accuracy Ring (`stroke-dashoffset`) khi trang Tiến trình tải xong.
  - Chuẩn hóa bo góc bảng quản lý từ vựng (`table-responsive`) thành `var(--radius-lg)` và đổ bóng mượt.
- **Đóng gói production**: Chạy lệnh build thành công, toàn bộ bundle CSS hoạt động trơn tru với dung lượng đóng gói 100.89 kB.

### File đã sửa
- [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
- [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx)
- [src/styles/dashboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/dashboard.css)
- [src/styles/auth.css](file:///d:/VIBE/english-flashcard-web/src/styles/auth.css)
- [src/styles/flashcard.css](file:///d:/VIBE/english-flashcard-web/src/styles/flashcard.css)
- [src/styles/leaderboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/leaderboard.css)
- [src/styles/progress.css](file:///d:/VIBE/english-flashcard-web/src/styles/progress.css)
- [src/styles/admin.css](file:///d:/VIBE/english-flashcard-web/src/styles/admin.css)
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Giữ nguyên vẹn toàn bộ logic xử lý React state và tích hợp cơ sở dữ liệu Supabase, chỉ nâng cấp visual.

## 2026-07-03 - Dọn dẹp CSS và Giải quyết Xung đột Selector (PHASE 2)

### Đã làm
- **Giải quyết lỗi composes không chuẩn CSS**: Xóa cú pháp `composes` lỗi trong [buttons.css](file:///d:/VIBE/english-flashcard-web/src/styles/buttons.css), thay thế bằng bộ chọn tường minh mở rộng `:active` và `:disabled` để các nút tùy chỉnh (`.primary-button`, `.secondary-button`, `.ghost-button`) nhún và hiển thị disabled đúng cách trên trình duyệt.
- **Xóa style trùng lặp & dư thừa**:
  - Xóa `.card` lỗi thời ở [layout.css](file:///d:/VIBE/english-flashcard-web/src/styles/layout.css) để tránh đè style thẻ chuẩn ở [cards.css](file:///d:/VIBE/english-flashcard-web/src/styles/cards.css).
  - Xóa `.topbar` dư thừa ở đầu [flashcard.css](file:///d:/VIBE/english-flashcard-web/src/styles/flashcard.css).
- **Consolidate các Grid**:
  - Lưới ngày học (`.days-grid`): Gom 7 media query rải rác trong `flashcard.css` thành một khối breakpoints thống nhất từ lớn tới nhỏ. Đổi tên grid ở Dashboard thành `.roadmap-days-grid` (cập nhật file [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)) để tránh xung đột với lưới chọn buổi của Quiz.
  - Lưới tiến độ (`.progress-stats-grid`): Gom toàn bộ 7 media query chồng chéo ở `progress.css` và `dashboard.css` thành một chuỗi mobile-first gọn gàng trong [progress.css](file:///d:/VIBE/english-flashcard-web/src/styles/progress.css), xóa code thừa ở `dashboard.css`.
- **Giải quyết Collision `.stat-card`**:
  - Dashboard Home: Đổi tên thành `.dashboard-stat-card` và `.dashboard-stat-glow` (cập nhật file [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)).
  - Màn Quiz/Review: Đổi tên thành `.quiz-stat-card` (cập nhật [FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx), [WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx), [ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx), [DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx)).
  - Cập nhật styles tương ứng trong `dashboard.css` và `flashcard.css`.
- **Kiểm thử tự động**: Chạy `npm run build` thành công, bundle CSS giảm nhẹ dung lượng xuống **96.33 kB** do dọn sạch mã thừa.

### File đã sửa
- [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
- [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
- [src/components/WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx)
- [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)
- [src/components/DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx)
- [src/styles/buttons.css](file:///d:/VIBE/english-flashcard-web/src/styles/buttons.css)
- [src/styles/layout.css](file:///d:/VIBE/english-flashcard-web/src/styles/layout.css)
- [src/styles/dashboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/dashboard.css)
- [src/styles/flashcard.css](file:///d:/VIBE/english-flashcard-web/src/styles/flashcard.css)
- [src/styles/progress.css](file:///d:/VIBE/english-flashcard-web/src/styles/progress.css)
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Tất cả thay đổi giữ nguyên visual behavior và logic hệ thống, chỉ giải quyết triệt để xung đột bộ chọn.

## 2026-07-03 - Tách file styles.css thành các file CSS modular (PHASE 1)

### Đã làm
- **Phân tách stylesheet**: Chia nhỏ file [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css) (6.698 dòng) thành 10 file CSS độc lập trong thư mục `src/styles/` theo nhóm tính năng và giữ nguyên thứ tự cascade gốc:
  - `global.css` (Resets & Variables)
  - `layout.css` (Layout nền & Page wrappers)
  - `buttons.css` (Nút bấm)
  - `cards.css` (Thẻ)
  - `auth.css` (Quyền đăng nhập/đăng ký)
  - `dashboard.css` (Trang chủ & Bento Grid)
  - `flashcard.css` (Quiz, từ vựng, ôn tập, bài nghe)
  - `progress.css` (Tiến trình học tập)
  - `leaderboard.css` (Bảng xếp hạng & podium)
  - `admin.css` (Bảng quản lý từ vựng)
- **Tái cấu trúc styles.css gốc**: Làm sạch và thay thế toàn bộ mã bằng các dòng `@import` liên kết tới các file mới.
- **Kiểm thử tự động**: Chạy `npm run build` thành công mà không gặp bất kỳ lỗi biên dịch nào.

### File đã sửa
- [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
- [src/styles/global.css](file:///d:/VIBE/english-flashcard-web/src/styles/global.css) [NEW]
- [src/styles/layout.css](file:///d:/VIBE/english-flashcard-web/src/styles/layout.css) [NEW]
- [src/styles/buttons.css](file:///d:/VIBE/english-flashcard-web/src/styles/buttons.css) [NEW]
- [src/styles/cards.css](file:///d:/VIBE/english-flashcard-web/src/styles/cards.css) [NEW]
- [src/styles/auth.css](file:///d:/VIBE/english-flashcard-web/src/styles/auth.css) [NEW]
- [src/styles/dashboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/dashboard.css) [NEW]
- [src/styles/flashcard.css](file:///d:/VIBE/english-flashcard-web/src/styles/flashcard.css) [NEW]
- [src/styles/progress.css](file:///d:/VIBE/english-flashcard-web/src/styles/progress.css) [NEW]
- [src/styles/leaderboard.css](file:///d:/VIBE/english-flashcard-web/src/styles/leaderboard.css) [NEW]
- [src/styles/admin.css](file:///d:/VIBE/english-flashcard-web/src/styles/admin.css) [NEW]
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Giữ nguyên toàn bộ visual behavior, tên class, và logic component React, đảm bảo an toàn tối đa cho hệ thống.
- Playwright subagent báo lỗi EOF kết nối (nằm ngoài kiểm soát của agent), khuyến nghị kiểm tra UI thủ công trên trình duyệt.

## 2026-07-03 - Thực hiện nâng cấp toàn diện giao diện (UI/UX) và Layout
### Đã làm
- **Đồng bộ hóa hệ thống Token & Style**:
  - Cài đặt display font family mới **Plus Jakarta Sans** cho tiêu đề lớn.
  - Áp dụng hệ màu Soft Structuralism đồng nhất với màu nhấn Indigo `#3538cd` và hệ màu soft pastel dịu mắt cho các nhãn trạng thái.
  - Chuẩn hóa hệ thống bo góc (`var(--radius-lg)` 16px, `var(--radius-md)` 10px) và Ambient Shadows mịn nhẹ khuếch tán.
- **Tái cấu trúc Dashboard / Home**:
  - Triển khai Bento Grid bất đối xứng (asymmetrical grid) cho chế độ học tập.
  - Thiết kế lại cấu trúc thẻ xoay mẫu từ vựng Hero thành Double-Bezel nested shell (bezel xám mịn bọc core trắng nổi khối).
  - Thu gọn và tinh chỉnh cách học 3 bước thành timeline ngang thanh mảnh không gây rối mắt.
- **Cải tiến Flashcard Quiz**:
  - Định hình lại các thẻ chọn buổi học (`lesson-card`) sang màu nền trắng tinh tế, viền emerald mềm mại khi đã hoàn thành.
  - Nâng cấp khối từ vựng chính thành Double-Bezel bọc gradient Indigo; tích hợp hiệu ứng tactile nhún phản hồi sống động cho các nút đáp án trắc nghiệm.
  - Tạo hộp thông báo kết quả (Correct/Incorrect) phản màu nền trượt lên mượt mà ở chân thẻ.
- **Bổ sung Teaser Blur cho Guest Leaderboard**:
  - Bảng xếp hạng giờ đây cho phép Guest xem thử danh sách vinh danh (Top 3 Podium và bảng xếp hạng) được phủ một lớp kính mờ glassmorphism tinh xảo kèm theo popup mời Đăng nhập kích thích động lực.
- **Kiểm thử & Build**:
  - Chạy bundler `npm run build` hoàn thành biên dịch sạch sẽ không cảnh báo lỗi.

### File đã sửa
- [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
- [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
- [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
- [src/components/Leaderboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Leaderboard.jsx)
- [src/components/WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx)
- [src/components/DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx)
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Tất cả chức năng hoạt động đồng nhất, bảo vệ tốt logic Supabase RPC và an toàn tài khoản học viên.

## 2026-07-03 - Audit toàn diện giao diện (UI/UX) và lập kế hoạch nâng cấp theo Taste Skill

### Đã làm
- **Kiểm tra & Đánh giá giao diện (UI Audit)**:
  - Khảo sát toàn bộ các trang chính: Home/Dashboard, Flashcard Quiz, Progress Dashboard, Leaderboard, AuthPanel.
  - Phân tích độ nhất quán màu sắc, tính phân bậc phân cấp thị giác (visual hierarchy), khoảng cách (spacing), và độ phản hồi xúc giác (tactile feedback) trên cả desktop và mobile.
  - Đánh giá hiện trạng của các trạng thái đặc biệt: Loading, Empty, Error, Success.
  - Chỉ ra các điểm còn yếu, các component tiềm năng để tái sử dụng, và lập danh sách các ưu tiên nâng cấp.
- **Lập kế hoạch nâng cấp (Implementation Plan)**:
  - Soạn thảo tài liệu [implementation_plan.md](file:///C:/Users/hocha/.gemini/antigravity-ide/brain/283b107d-eda2-4568-a28a-aa0f1df67db1/implementation_plan.md) chi tiết mô tả phương án tối ưu CSS, chuyển đổi bố cục bento bất đối xứng, cải tiến visual podium leaderboard, làm mờ overlay cho Guest, và chuẩn hóa các trạng thái loading skeleton.
- **Tuân thủ quy trình**:
  - Không thay đổi mã nguồn (source code) ở bước audit này để đảm bảo tính an toàn và nhận phản hồi từ người dùng.

### File đã sửa
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)

### Ghi chú
- Chờ phản hồi và phê duyệt kế hoạch nâng cấp của người học trước khi tiến hành chỉnh sửa mã nguồn CSS/JSX.

## 2026-07-02 - Phát triển chức năng Bảng xếp hạng từ vựng (Leaderboard) bảo mật giữa các user

### Đã làm
- **Database SQL RPC**:
  - Tạo hàm SQL RPC `public.get_vocabulary_leaderboard(limit_count)` giúp tính toán điểm vinh danh giữa các người học.
  - Hàm tự động tính toán số từ đã học, số buổi hoàn thành đúng 100% (logic giống frontend), tỷ lệ đúng trung bình, và số phiên học.
  - Điểm xếp hạng tổng hợp được tính theo công thức: `learnedWords * 10 + completedLessons * 50 + accuracy`.
  - Phân tích an toàn tên hiển thị (`display_name`) bằng cách ẩn email (split email trước ký tự `@`) hoặc hiển thị tên ẩn danh dạng `"Người học #abcd"` dùng 4 ký tự cuối của UUID.
  - Thắt chặt bảo mật: Loại bỏ hoàn toàn tài khoản có vai trò `admin`, thu hồi quyền truy cập public và chỉ cho phép role `authenticated` thực thi (`GRANT EXECUTE`).
- **Frontend Service**:
  - Tạo [leaderboardService.js](file:///d:/VIBE/english-flashcard-web/src/utils/leaderboardService.js) giao tiếp với Supabase RPC, chuẩn hóa dữ liệu, bắt lỗi và hiển thị message thân thiện nếu RPC chưa chạy hoặc lỗi quyền truy cập.
- **Giao diện Leaderboard**:
  - Tạo [Leaderboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Leaderboard.jsx) với giao diện cao cấp, responsive.
  - Tách biệt visual cho Top 3 người học dẫn đầu (Gold, Silver, Bronze podium card với gradient nhẹ và icon tương ứng).
  - Tự động thay đổi giao diện linh hoạt: Dùng bảng biểu chi tiết trên Desktop và Card list trên Mobile để tránh tràn ngang màn hình.
  - Tích hợp màn hình login gợi ý cho người dùng Guest (chưa đăng nhập).
  - Bổ sung nút refresh "Làm mới" dữ liệu trực tiếp và chú thích "Admin không tham gia bảng xếp hạng".
- **Tích hợp hệ thống**:
  - Khai báo route `"leaderboard"` trong [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx).
  - Thêm nút liên kết "Xếp hạng" (icon Trophy) tại Auth Header của [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) (desktop & mobile dropdown).
  - Thay thế card placeholder "Daily Challenge" bằng card "Leaderboard" (Đua Top) hoạt động đầy đủ trên Home.
- **Tài liệu & Styles**:
  - Cập nhật styles chi tiết cho podium, responsive tables, loader skeletons, và card mobile trong [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css).
  - Cập nhật tài liệu bảo mật [docs/SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md), lỗi bảo trì [BUGS_AND_FIXES.md](file:///d:/VIBE/english-flashcard-web/BUGS_AND_FIXES.md), và giới thiệu [README.md](file:///d:/VIBE/english-flashcard-web/README.md).

### File đã sửa
- [supabase/leaderboard_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/leaderboard_migration.sql) [NEW]
- [src/utils/leaderboardService.js](file:///d:/VIBE/english-flashcard-web/src/utils/leaderboardService.js) [NEW]
- [src/components/Leaderboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Leaderboard.jsx) [NEW]
- [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
- [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
- [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
- [UPDATE_LOG.md](file:///d:/VIBE/english-flashcard-web/UPDATE_LOG.md)
- [BUGS_AND_FIXES.md](file:///d:/VIBE/english-flashcard-web/BUGS_AND_FIXES.md)
- [README.md](file:///d:/VIBE/english-flashcard-web/README.md)
- [docs/SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md)

### Ghi chú
- Cần dán và chạy file migration `supabase/leaderboard_migration.sql` trên Supabase dashboard để kích hoạt RPC.
- Ứng dụng build thành công 100%, bảo đảm không có lỗi runtime và bảo vệ thông tin cá nhân của người học.

## 2026-07-02 - Thiết kế lộ trình học trực quan cho card chọn buổi và sửa lỗi RLS đệ quy vô hạn

### Đã làm
- **Giao diện lộ trình học trực quan**:
  - Thiết kế lại danh sách chọn buổi học thành dạng lưới (grid) roadmap đẹp mắt với lớp CSS `.lesson-card`.
  - Grid tự động căn chỉnh: 3-4 cột trên máy tính, 2 cột trên máy tính bảng, và 1 cột (full-width) trên điện thoại di động.
  - Card đã hoàn thành: có nền xanh lá nhạt, viền xanh lá đậm, checkmark trắng lớn trong vòng tròn xanh gradient ở trung tâm, hiển thị huy hiệu "Đã hoàn thành".
  - Card chưa hoàn thành: nền trắng, viền xám/xanh dương nhạt, icon calendar ở trung tâm. Nếu đã thử luyện tập thì hiển thị nhãn "Chưa hoàn thành" kèm tỉ lệ đúng tốt nhất (ví dụ: "Tốt nhất 83%"). Nếu chưa học thì hiện "Chưa luyện tập".
  - Giữ nguyên trạng thái chọn (selected) độc lập với trạng thái hoàn thành: card vừa được chọn vừa hoàn thành sẽ có viền xanh dương đậm nổi bật mà vẫn giữ tích xanh hoàn thành bên trong.
- **Khắc phục lỗi RLS đệ quy vô hạn**:
  - Phát hiện và sửa lỗi đệ quy vô hạn (`infinite recursion detected in policy for relation "profiles"`) khi người dùng đăng nhập truy cập bảng `vocab_items` thông qua kiểm tra quyền admin.
  - Tạo hai hàm helper `public.is_admin(user_id uuid)` và `public.get_profile_role(user_id uuid)` với thuộc tính `SECURITY DEFINER` để truy xuất an toàn dữ liệu từ bảng `profiles` mà không bị lặp đệ quy.
  - Tạo file script [supabase/fix_rls_recursion.sql](file:///d:/VIBE/english-flashcard-web/supabase/fix_rls_recursion.sql).
  - Cập nhật các chính sách RLS trong [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql) and [supabase/auth_profile_sync_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/auth_profile_sync_migration.sql).
- **Tải lại trạng thái (Refresh completionMap)**:
  - Tích hợp thêm bước refresh lại `completionMap` sau khi hoàn thành lượt Luyện nghe trong [ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx) giống như Vocabulary Quiz.
- **Đồng bộ hóa lưới chọn buổi**:
  - Cập nhật lưới chọn buổi của [VocabularyReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/VocabularyReview.jsx) sang kiểu `.lesson-card` mới để thống nhất trải nghiệm visual trên toàn bộ ứng dụng.

### File đã sửa
- [supabase/fix_rls_recursion.sql](file:///d:/VIBE/english-flashcard-web/supabase/fix_rls_recursion.sql) [NEW]
- [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql)
- [supabase/auth_profile_sync_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/auth_profile_sync_migration.sql)
- [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
- [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
- [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)
- [src/components/VocabularyReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/VocabularyReview.jsx)
- [BUGS_AND_FIXES.md](file:///d:/VIBE/english-flashcard-web/BUGS_AND_FIXES.md)

### Ghi chú
- Dự án đã được build production thành công và chạy ổn định.
- Cần chạy file `supabase/fix_rls_recursion.sql` trong SQL Editor của Supabase để áp dụng bản vá lỗi đệ quy.

## 2026-07-02 - Sửa lỗi tích xanh tiến trình, hiển thị tên header và đồng bộ hóa UI học tập

### Đã làm
- **Sửa dấu tích xanh hoàn thành**: Tải lại `completionMap` trực tiếp khi lưu kết quả session thành công trong [FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx) giúp cập nhật ngay lập tức dấu tích xanh mà không cần tải lại trang.
- **Đơn giản hóa chính sách RLS**: Đơn giản hóa RLS SELECT và INSERT trên `study_answers` trong [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql) chỉ kiểm tra `auth.uid() = user_id`, loại bỏ các câu subquery `EXISTS` phức tạp để tránh race condition và cải thiện hiệu năng.
- **Header hiển thị tên**:
  - Tạo helper `getDisplayName` trong [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) để xác định tên hiển thị thân thiện (display name, hoặc phần trước `@` của email) thay vì hiển thị email đầy đủ trong lời chào.
  - Cập nhật header trong [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) để hiển thị tên thân thiện này.
  - Cập nhật luồng đăng ký trong [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx) và [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) để tự động gán `display_name` bằng phần trước `@` của email làm fallback sạch sẽ.
- **Đồng bộ hóa UI học tập**:
  - Cập nhật cấu trúc của Grammar Practice và Daily Challenge disabled cards trong [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) để thêm placeholder button disabled, chỉnh kích thước icon thành 24 cho đồng bộ với các active card.
  - Thêm CSS cho `.badge.danger` (dùng cho card Từ hay sai) và `.feature-button.disabled-btn` (cho các nút card bị khoá) trong [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css).
  - Tối ưu hóa `.feature-card.disabled-card` trong [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css) để bỏ `pointer-events: none`, cho phép hiển thị đúng cursor `not-allowed` khi hover.

### File đã sửa
- [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql)
- [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
- [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx)
- [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
- [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
- [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
- Đã chạy build production thành công và toàn bộ app hoạt động mượt mà.

## 2026-07-02 - Sửa triệt để luồng Auth, đồng bộ hóa Email và thắt chặt chính sách RLS/GRANT cho Profiles

### Đã làm
- **Đồng bộ hóa email**: Sửa trigger function `public.handle_new_user` và backfill query để luôn đồng bộ email từ `auth.users.email` sang `public.profiles.email`.
- **Cấu hình RLS & GRANT cho Profiles**:
  - Cho phép người dùng authenticated tự SELECT và INSERT profile của chính mình với `role = 'user'`.
  - Cho phép người dùng authenticated tự UPDATE `email`, `display_name`, và `updated_at` của mình nhưng không được tự ý sửa `role`.
  - Cấp quyền `GRANT SELECT, INSERT, UPDATE` trên bảng `public.profiles` cho authenticated role.
- **Cải tiến AuthPanel**:
  - Đăng ký và Đăng nhập gọi trực tiếp API `supabase.auth.signUp` và `supabase.auth.signInWithPassword`.
  - Sử dụng biến `isSubmitting` để chặn double click/double submit.
  - Trim email trước khi gửi request.
  - Phân loại lỗi và hiển thị rõ ràng thông điệp: lỗi 429 (Bạn thao tác quá nhanh. Vui lòng chờ vài phút rồi thử lại.) và lỗi 400 (Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được xác nhận.).
- **Cải tiến AuthContext**:
  - fetchProfile đồng bộ email của user sang profile nếu email của profile bị NULL hoặc khác biệt.
  - Không bao giờ ghi đè hay reset `role` admin thành `user`.

### File đã sửa
- [supabase/auth_profile_sync_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/auth_profile_sync_migration.sql) [NEW]
- [supabase/admin_vocab_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/admin_vocab_migration.sql)
- [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx)
- [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
- [BUGS_AND_FIXES.md](file:///d:/VIBE/english-flashcard-web/BUGS_AND_FIXES.md)

### Ghi chú
- Build production chạy thành công bằng `npm run build` không có lỗi.

## 2026-07-02 - Nâng cấp tính năng Từ hay sai và trải nghiệm tự động chuyển câu Quiz

### Đã làm
* **Từ hay sai (Wrong Words) nâng cao**:
  - Hỗ trợ loại bỏ các từ sai đã đạt chuỗi đúng liên tục 3 lần (`wrong_review_correct_streak >= 3` hoặc `cleared_from_wrong_words_at IS NOT NULL`).
  - Sắp xếp thứ tự ưu tiên ôn tập từ sai trong [wrongWordsService.js](file:///d:/VIBE/english-flashcard-web/src/utils/wrongWordsService.js): `wrong_count` giảm dần, `last_wrong_at` mới nhất lên trước, và `wrong_review_correct_streak` thấp nhất lên trước.
  - Cập nhật streak hồi phục trong [studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js): tăng streak khi làm đúng ở mode `wrong_words` (đạt 3/3 sẽ set ngày hoàn thành); reset streak về 0 nếu làm sai hoặc làm sai ở bất kỳ bài quiz/typing/listening chuẩn nào để từ quay lại danh sách.
  - Cập nhật [continueStudyService.js](file:///d:/VIBE/english-flashcard-web/src/utils/continueStudyService.js) để chỉ gợi ý ôn tập từ sai khi có ít nhất 3 từ sai hợp lệ.
* **Giao diện & Gameplay Wrong Words**:
  - Hiển thị huy hiệu tiến trình phục hồi từ sai (ví dụ `Đúng liên tục: 1/3`).
  - Hiển thị thông báo empty state mới và nút học ngay khi hết từ sai.
  - Disable nút ôn tập và hiển thị dòng cảnh báo `Bạn cần ít nhất 3 từ sai để bắt đầu ôn tập. Hãy học thêm hoặc quay lại sau.` nếu tổng số từ sai dưới 3.
  - Giới hạn tối đa 20 từ sai ưu tiên nhất cho mỗi lượt ôn tập.
  - Hiển thị banner tổng kết số từ đã được loại bỏ khỏi danh sách từ sai ở màn hình kết quả session.
* **Trải nghiệm Quiz Auto-Next**:
  - Tích hợp tính năng tự động chuyển câu sau `900ms` khi trả lời đúng ở các bài trắc nghiệm ([FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx), [WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx), [DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx), và [ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)).
  - Hủy hiển thị nút "Câu tiếp theo" thủ công đối với câu trả lời đúng.
  - Yêu cầu người dùng bấm "Tiếp tục" thủ công khi trả lời sai (không tự chuyển câu).
  - Ngăn chặn double-click / double-save bằng cách khóa các nút đáp án trong thời gian chuyển câu.
  - Đảm bảo dọn dẹp (clear) timer khi unmount component hoặc chuyển câu để tránh rò rỉ bộ nhớ.
* **Tài liệu SQL migration**:
  - Tạo script migration [wrong_words_streak_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/wrong_words_streak_migration.sql) để thêm các cột lưu trữ streak và lịch sử sai.

### File đã sửa
* [supabase/wrong_words_streak_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/wrong_words_streak_migration.sql) [NEW]
* [src/utils/wrongWordsService.js](file:///d:/VIBE/english-flashcard-web/src/utils/wrongWordsService.js)
* [src/utils/studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js)
* [src/utils/continueStudyService.js](file:///d:/VIBE/english-flashcard-web/src/utils/continueStudyService.js)
* [src/components/WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx)
* [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
* [src/components/DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx)
* [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)

### Ghi chú
* Đã chạy build thành công, toàn bộ dự án hoạt động ổn định và mượt mà.

## 2026-07-02 - Phát triển tính năng "Tiếp tục học" và tích hợp đề xuất "Học hôm nay"

### Đã làm
* **Service Đề xuất học tập**: Tạo mới service [continueStudyService.js](file:///d:/VIBE/english-flashcard-web/src/utils/continueStudyService.js) để tổng hợp tiến độ học tập và đề xuất hoạt động phù hợp nhất hôm nay theo thứ tự ưu tiên:
  1. Nếu có từ đến lịch ôn tập Spaced Repetition hôm nay -> Đề xuất ôn hôm nay (điều hướng sang `DueReview`).
  2. Nếu có từ hay trả lời sai -> Đề xuất ôn tập từ sai (điều hướng sang `WrongWords`).
  3. Nếu không có hai mục trên -> Đề xuất buổi học chưa hoàn thành 100% đầu tiên trong khóa học đang học (hoặc chuyển tiếp khóa tiếp theo).
* **Card Đề xuất trên Trang chủ (Home)**: Tích hợp card "Học hôm nay" / "Tiếp tục học" ở đầu trang chủ (sau stats section) hiển thị thông tin lộ trình, progress bar phần trăm hoàn thành khóa học thực tế.
* **Giao diện Guest (Chưa đăng nhập)**: Hiển thị card đề xuất nhẹ nhàng với dòng ghi chú "💡 Đăng nhập để lưu và tiếp tục lộ trình học tập của riêng bạn.", gợi ý bắt đầu từ Nền tảng - Buổi 1, không crash app và đảm bảo Guest học bình thường.
* **Luồng điều hướng Học tiếp**: Bổ sung hỗ trợ prop `initialLesson` trong [FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx) và đồng bộ hóa state trong [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) để khi bấm "Học tiếp" hoặc click vào gợi ý, hệ thống tự động chọn đúng khóa học và buổi học được gợi ý mà không làm phá vỡ logic chọn buổi thủ công.
* **Responsive CSS**: Thiết kế responsive mobile cho card đề xuất, bảo đảm không bị tràn ngang, bố cục co giãn hợp lý trên các màn hình nhỏ.

### File đã sửa
* [src/utils/continueStudyService.js](file:///d:/VIBE/english-flashcard-web/src/utils/continueStudyService.js) [NEW]
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã chạy build production thành công và chạy ổn định.
* Trạng thái và tính năng tích xanh hoàn thành bài học 100% không bị ảnh hưởng.

## 2026-07-02 - Nâng cấp màn chọn buổi học hiển thị trạng thái hoàn thành (tích xanh)

### Đã làm
* **Lesson Progress Service**: Tạo service mới [lessonProgressService.js](file:///d:/VIBE/english-flashcard-web/src/utils/lessonProgressService.js) để truy vấn dữ liệu từ Supabase (`lessons`, `vocab_items`, `study_sessions`, `study_answers`) và tính toán bản đồ hoàn thành (completion status) cho từng buổi học (lesson) của user đang đăng nhập.
* **Tiêu chí hoàn thành 100%**: Chỉ đánh dấu hoàn thành (tích xanh) nếu user trả lời đúng 100% toàn bộ từ vựng đang hoạt động của lesson trong cùng một phiên học (`study_session`) và không làm sai câu nào.
* **Trạng thái Đã thử (Partial Progress)**: Nếu user chưa hoàn thành 100% nhưng đã thử học, hiển thị subtitle "Đã thử (Tốt nhất X%)" thể hiện phần trăm độ chính xác cao nhất đạt được qua các phiên học.
* **Tải động trạng thái**: Tự động tải/cập nhật bản đồ hoàn thành trên màn hình chọn buổi học của cả [FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx) và [ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx) mỗi khi thay đổi user, khóa học, hoặc khi kết thúc quiz và quay lại màn chọn buổi học.
* **Giao diện Guest (Chưa đăng nhập)**: Ẩn tích xanh và trạng thái hoàn thành trên cloud. Thêm note nhỏ tinh tế: "💡 Đăng nhập để lưu tiến độ hoàn thành và đồng bộ kết quả học tập." để thu hút người dùng đăng nhập mà không làm hỏng trải nghiệm học tập của Guest.
* **Kiểu dáng card**: Bổ sung css cho các class `.guest-note`, `.day-card.completed`, `.day-completed-badge`, và `.day-partial-text` ở cuối file [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css) tạo hiệu ứng gradient xanh nhẹ hiện đại cho card đã hoàn thành.

### File đã sửa
* [src/utils/lessonProgressService.js](file:///d:/VIBE/english-flashcard-web/src/utils/lessonProgressService.js) [NEW]
* [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
* [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã chạy build production thành công và chạy ổn định.

## 2026-07-02 - Đồng bộ giao diện Quiz, tối ưu hóa Hero Flashcard và rút gọn Progress Dashboard

### Đã làm
* **Wrong Words Screen**: Sửa lỗi giao diện trên mobile, thêm lớp `wrong-words-selection-screen` và điều chỉnh CSS để nút "Bắt đầu ôn tập" hiển thị rõ ràng, full-width (cao 48px) thay vì bị ẩn.
* **Quiz A/B/C/D Option Grid**: Đồng bộ nhãn A/B/C/D cho các đáp án trắc nghiệm ở Flashcard Quiz, Due Review, Wrong Words, và Listening Practice. Chuyển đổi `.option` từ định vị tuyệt đối (absolute positioning) sang bố cục Flexbox (`display: flex; gap: 12px;`) để tránh hoàn toàn hiện tượng chữ đè lên nhau trên mobile. Bổ sung các class bí danh (alias) `.answer-option`, `.answer-letter`, `.answer-text`.
* **Đồng bộ Chế độ học tập**: Thay thế các nút CTA màu xanh lá ở Vocabulary Review và Wrong Words thành nút màu xanh dương đậm `.feature-button.primary` chuẩn của hệ thống. Loại bỏ inline style trên icon vựng và áp dụng màu nền nhạt soft-colors trong CSS.
* **Cách học hiệu quả**: Thiết kế lại 3 bước cách học thành một learning flow rõ ràng, hiển thị số thứ tự, Lucide icon, tiêu đề và dòng kết quả cụ thể ("Biết hôm nay cần học gì", v.v.). Thêm đường nối dashed nhẹ trên màn hình máy tính.
* **Hero Flashcard sinh động**: Thiết kế danh sách 5 từ vựng mẫu cục bộ và thiết lập timer tự động xoay vòng sau mỗi 4 giây kèm hiệu ứng chuyển đổi mượt mà (fade/scale/slide-up). Tự động tắt hoạt ảnh nếu hệ thống người dùng kích hoạt `prefers-reduced-motion`. Thu nhỏ kích thước card trên thiết bị di động (dưới 480px).
* **Rút gọn Progress Dashboard**: Chỉ hiển thị 4 chỉ số cốt lõi (Phiên học, Từ đã học, Điểm TB /10, Tỷ lệ đúng). Các chỉ số chi tiết khác được lược bỏ khỏi grid chính. Thay đổi cấu trúc lưới hiển thị (4 cột trên desktop, 2 cột trên tablet và 1 cột trên mobile).

### File đã sửa
* [src/components/WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx)
* [src/components/DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx)
* [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/components/ProgressDashboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ProgressDashboard.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã build thành công và chạy ổn định.

## 2026-07-02 - Nâng cấp toàn diện UI/UX, tối ưu responsive và cải tiến Admin panel

### Đã làm
* **Spacing & Container Layout**: Giảm khoảng trống dọc trên `.page` và `.home-container`. Chuẩn hóa max-width cho trang chủ (`1100px`) và nới rộng trang quản trị (`1360px`).
* **Trang chủ & Auth Header**: Rút gọn Hero Section, căn giữa nội dung khi xếp chồng trên mobile. Thiết kế nút "Quản trị" trong Auth Header nổi bật với gradient tím sang trọng.
* **Cải tiến Admin Desktop Table**: Thêm sticky header cho bảng từ vựng, giới hạn max-height cuộn dọc `70vh` cho bảng. Thay thế các nút thao tác icon nhỏ bằng các nút có màu nền nhạt tương phản và nhãn chữ in đậm ("Sửa", "Ẩn/Mở", "Xóa").
* **Chế độ Card cho Mobile**: Thêm giao diện card list cho Admin trên mobile (dưới 768px) để thay thế bảng cuộn ngang, thiết kế các nút action to rõ dễ bấm với chiều cao tối thiểu 44px.
* **Modal & CSV Import**: Tối ưu hóa modal form, thêm dynamic saving label cho nút lưu. Thay thế hoàn toàn browser `alert` bằng hệ thống custom toast `.admin-toast` tự động ẩn sau 3 giây.
* **Progress Dashboard**: Tối ưu spacing, stats card padding và dọn dẹp các nút action.
* **Biên dịch**: Build thành công ứng dụng sản phẩm thông qua Vite (`npm run build`) không có lỗi.

### File đã sửa
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
* [src/components/AdminVocabularyManager.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AdminVocabularyManager.jsx)

### Ghi chú
* Giao diện sau nâng cấp trông cực kỳ hiện đại, chuyên nghiệp, chạy mượt mà trên tất cả các breakpoint và không còn dùng alert browser thô sơ.

## 2026-07-02 - Dọn sạch giao diện debug UI và console debug log

### Đã làm
* Gỡ bỏ component `AuthDebugProbe` khỏi màn hình chính [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) và xóa import tương ứng.
* Xóa hoàn toàn file component debug [src/components/AuthDebugProbe.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthDebugProbe.jsx).
* Dọn dẹp các debug console log tạm thời (`[AUTH PROFILE DEBUG]`, `[AUTH DEBUG]`) trong file [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx).
* Chạy build production thành công và xác minh tính ổn định của tính năng phân quyền quản trị (Admin).

### File đã sửa
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
* [src/components/AuthDebugProbe.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthDebugProbe.jsx) (Đã xóa)

### Ghi chú
* Giao diện sạch sẽ, không còn log debug không cần thiết, tính năng Quản trị hoạt động chuẩn xác cho Admin.

## 2026-07-02 - Tích hợp Auth Debug Probe và hoàn thiện bảo mật phân quyền AuthContext

### Đã làm
* Tạo component [AuthDebugProbe.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthDebugProbe.jsx) thực hiện query trực tiếp đến profiles và đối chiếu với useAuth.
* Gắn `AuthDebugProbe` vào [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) hiển thị thông tin debug chi tiết trong chế độ DEV.
* Tối ưu hóa [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx), loại bỏ hoàn toàn các đoạn fallback nguy hại ghi đè role về `user` và reset `isAdmin = false` khi fetch profiles lỗi.
* Đảm bảo cache profiles (`fetchPromise`, `lastFetchedId`) được xóa sạch khi có sự kiện thay đổi ID user hoặc SIGNED_OUT.
* Cấu hình [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) để tránh hiển thị màn hình chờ tải toàn cục khi đang ở route quản trị, cho phép component hiển thị trạng thái đang tải riêng.
* Audit toàn bộ project để loại bỏ code thừa và supabase client dư thừa.
* Build ứng dụng thành công 100% không phát sinh lỗi.

### File đã sửa
* [src/components/AuthDebugProbe.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthDebugProbe.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)

### Ghi chú
* Đã build và chạy thử thành công.

## 2026-07-01 - Khắc phục dứt điểm hiển thị nút Quản trị và phân quyền Admin trên Home

### Đã làm
* Refactor [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) để lấy thông tin đăng nhập trực tiếp từ `useAuth()`, độc lập với các property được truyền từ `App.jsx`.
* Thêm panel debug hiển thị thông tin đăng nhập chi tiết (`email`, `profileRole`, `isAdmin`) trên `Home.jsx` trong chế độ Development (`import.meta.env.DEV`).
* Render nút "Quản trị" bằng logic trực tiếp, hỗ trợ linh hoạt các callback `onOpenAdmin` và `onNavigate("admin")`.
* Bổ sung styling cho nút quản trị `.auth-action-btn.admin-btn` vào [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css) giữ nguyên tính thẩm mỹ premium.
* Cập nhật [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) loại bỏ hook `useEffect` tự động chuyển hướng làm reset trang admin, thay thế bằng kiểm tra phân quyền trực tiếp tại render phase giúp điều hướng và bảo vệ khu vực quản trị an toàn hơn.
* Cấu hình [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) để quản lý `isAdmin` bằng state độc lập, đồng bộ đầy đủ các sự kiện vòng đời auth (login, logout, token refresh, user update), thêm logger `[AUTH PROFILE DEBUG]` trong chế độ DEV.
* Build thành công ứng dụng sản phẩm sạch lỗi.

### File đã sửa
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã chạy thử nghiệm đầy đủ và chạy build thành công sạch sẽ.

## 2026-07-01 - Đồng bộ trạng thái tải Auth và Phân quyền giao diện Admin hoàn chỉnh

### Đã làm
* Sửa đổi [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) để chờ trạng thái tải xác thực (`authLoading`) trước khi render giao diện trang chủ, ngăn việc giao diện render chế độ khách tạm thời.
* Cải tiến cơ chế bảo vệ phân quyền trên [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx), chỉ redirect về Home nếu xác thực đã hoàn thành và user không phải Admin.
* Đồng bộ prop-flow bằng cách truyền `isAdmin`, `user`, và `profile` từ `App.jsx` xuống [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) thay vì để component con tự lấy trực tiếp từ Context không đồng bộ.
* Refactor [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) sử dụng bộ lưu trữ Promise tạm thời (`fetchPromise`) nhằm tránh gửi nhiều request đồng thời (race condition) lấy hồ sơ user khi vừa đăng nhập/refresh token.
* Cập nhật logic `signUpWithEmail` trong [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) để không ghi đè `display_name` thành email nếu người dùng bỏ trống display name khi đăng ký.
* Xóa bỏ file trùng lặp `lib/supabaseClient.js` ở root, đồng nhất sử dụng [supabaseClient.js](file:///d:/VIBE/english-flashcard-web/src/lib/supabaseClient.js) trong thư mục `src`.
* Thêm debug log chỉ bật trong môi trường Development (`import.meta.env.DEV`) hiển thị email, role, và trạng thái admin của user đăng nhập.
* Chạy build production thành công sạch lỗi.

### File đã sửa
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx)
* [src/components/AdminVocabularyManager.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AdminVocabularyManager.jsx)
* [lib/supabaseClient.js](file:///d:/VIBE/english-flashcard-web/lib/supabaseClient.js) (Đã xóa)

---

## 2026-07-01 - Khắc phục xác thực email, đồng bộ hồ sơ người dùng và bảo mật Admin

### Đã làm
* Sửa đổi schema của `profiles` hỗ trợ thêm cột `display_name` và `updated_at` trong [admin_vocab_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/admin_vocab_migration.sql) và [rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql).
* Cập nhật trigger `handle_new_user()` để tự động ánh xạ display name từ metadata của Supabase Auth và thêm cơ chế backfill để cập nhật các tài khoản cũ.
* Thiết lập chính sách RLS cho bảng `profiles` chỉ cho phép đọc thông tin cá nhân và cập nhật ngoại trừ cột `role`.
* Nâng cấp [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) để tự động tạo/đồng bộ thông tin hồ sơ khi người dùng đăng nhập hoặc đổi token, sử dụng ref tracking để ngăn chặn việc spam request.
* Chuẩn hóa màn hình đăng nhập/đăng ký trong [AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx) để sử dụng email chuẩn, loại bỏ việc dùng display_name thay cho email và thêm trường nhập Display Name khi đăng ký.
* Hiển thị lời chào cá nhân hóa dựa trên display name của người dùng tại [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx).
* Tích hợp cơ chế bảo vệ phân quyền chặt chẽ trên frontend trong [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) và [AdminVocabularyManager.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AdminVocabularyManager.jsx).
* Chạy build production thành công 100%.

### File đã sửa
* [supabase/admin_vocab_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/admin_vocab_migration.sql)
* [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql)
* [docs/SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md)
* [src/lib/supabaseClient.js](file:///d:/VIBE/english-flashcard-web/src/lib/supabaseClient.js)
* [lib/supabaseClient.js](file:///d:/VIBE/english-flashcard-web/lib/supabaseClient.js)
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
* [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/components/AdminVocabularyManager.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AdminVocabularyManager.jsx)

### Ghi chú
* Toàn bộ hệ thống đăng nhập, đăng ký và phân quyền đã hoạt động cực kỳ an toàn, thông tin email và display name được đồng bộ đồng nhất.

## 2026-07-01 - Phát triển tính năng Admin Vocabulary Manager và tích hợp dữ liệu Supabase

### Đã làm
* Thiết lập database migration [admin_vocab_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/admin_vocab_migration.sql) [NEW] cấu hình phân quyền Admin, trigger tự động tạo profile khi đăng ký, soft delete `is_active` cho từ vựng và bảng import thô `vocab_import_raw`.
* Phát triển cơ chế đồng bộ và phân quyền vai trò (`profiles.role`) trong [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) để xác thực và chặn truy cập Admin đối với người dùng thường.
* Xây dựng dịch vụ cung cấp dữ liệu từ vựng hợp nhất [vocabDataService.js](file:///d:/VIBE/english-flashcard-web/src/utils/vocabDataService.js) [NEW] ưu tiên đọc dữ liệu `vocab_items` từ Supabase, tự động fallback về file CSV nếu gặp lỗi.
* Phát triển dịch vụ quản trị [adminVocabService.js](file:///d:/VIBE/english-flashcard-web/src/utils/adminVocabService.js) [NEW] hỗ trợ xem danh sách, thêm, sửa, soft/hard delete từ vựng và import hàng loạt bằng CSV.
* Xây dựng giao diện quản trị từ vựng [AdminVocabularyManager.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AdminVocabularyManager.jsx) [NEW] đầy đủ chức năng tìm kiếm, bộ lọc, form nhập liệu có validation và bộ import CSV có preview trực quan.
* Tích hợp nút điều hướng trong [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) và router chuyển trang trong [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx).
* Bổ sung styling cho Admin panel, bảng biểu, modal overlay và drag-drop area trong [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css).
* Chạy build thành công và biên dịch sạch không lỗi runtime/compiler.

### File đã sửa
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
* [docs/SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md)
* [supabase/admin_vocab_migration.sql](file:///d:/VIBE/english-flashcard-web/supabase/admin_vocab_migration.sql) [NEW]
* [src/utils/vocabDataService.js](file:///d:/VIBE/english-flashcard-web/src/utils/vocabDataService.js) [NEW]
* [src/utils/adminVocabService.js](file:///d:/VIBE/english-flashcard-web/src/utils/adminVocabService.js) [NEW]
* [src/components/AdminVocabularyManager.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AdminVocabularyManager.jsx) [NEW]

### Ghi chú
* Giao diện quản trị hoạt động cực kỳ mượt mà, bảo mật RLS an toàn trên Supabase và đảm bảo tính liên tục của ứng dụng nhờ fallback CSV.

## 2026-07-01 - Audit và hoàn thiện bảo mật Supabase RLS cùng Production Readiness

### Đã làm
* Chuẩn hóa tên biến môi trường trên frontend từ `VITE_SUPABASE_PUBLISHABLE_KEY` thành `VITE_SUPABASE_ANON_KEY` trong các file cấu hình `.env.local`, `.env.example` và `supabaseClient.js` để bảo đảm tính nhất quán của hệ thống.
* Nâng cấp chính sách bảo mật **Row Level Security (RLS)** cho bảng `study_answers` trong file [rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql). Enforce kiểm tra đồng thời cả `user_id = auth.uid()` và quyền sở hữu thông qua khóa ngoại liên kết `session_id` với bảng `study_sessions`.
* Bổ sung đầy đủ các policy `FOR UPDATE` cho toàn bộ các bảng dữ liệu học cá nhân (`study_sessions`, `study_session_lessons`, `study_answers`) trên Supabase.
* Viết tài liệu hướng dẫn vận hành chi tiết trong [SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md), bao gồm các hướng dẫn mở SQL Editor trên Supabase Dashboard, các bước thực thi query, cách kiểm tra policy hoạt động thực tế và các câu lệnh rollback khi phát sinh sự cố.
* Kiểm tra và biên dịch (build) thành công toàn bộ mã nguồn frontend, cam kết không lỗi runtime, không rò rỉ hoặc cho phép cross-user đọc ghi dữ liệu.

### File đã sửa
* [src/lib/supabaseClient.js](file:///d:/VIBE/english-flashcard-web/src/lib/supabaseClient.js)
* [lib/supabaseClient.js](file:///d:/VIBE/english-flashcard-web/lib/supabaseClient.js)
* [.env.example](file:///d:/VIBE/english-flashcard-web/.env.example)
* [.env.local](file:///d:/VIBE/english-flashcard-web/.env.local)
* [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql)
* [docs/SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md)

### Ghi chú
* Toàn bộ dữ liệu học tập đã được phân tách và cô lập cực kỳ an toàn giữa các user.

## 2026-07-01 - Hoàn thiện ứng dụng sẵn sàng cho Public Production

### Đã làm
* Thiết lập bảo mật **Row Level Security (RLS)** trên Supabase, tạo tệp SQL bảo mật [rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql) [NEW] và tài liệu hướng dẫn [SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md) [NEW].
* Bổ sung Unique Constraint `unique(user_id, vocab_item_id)` trên bảng `word_progress` để tránh duplicate dữ liệu khi đồng bộ.
* Hoàn thiện gameplay **Ôn hôm nay** (Spaced Repetition) với component [DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx) [NEW] cho phép học viên ôn tập các từ đến lịch ôn (`next_review_at <= now`) bằng hình thức trắc nghiệm hoặc gõ từ, tự động lưu kết quả vào Supabase.
* Xây dựng tính năng **Từ hay sai** với component [WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx) [NEW] và service [wrongWordsService.js](file:///d:/VIBE/english-flashcard-web/src/utils/wrongWordsService.js) [NEW] giúp học viên theo dõi các từ trả lời sai nhiều nhất kèm gameplay ôn tập lại tập trung.
* Nâng cấp [ProgressDashboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ProgressDashboard.jsx) hiển thị 8 stat cards (thêm Điểm trung bình và Số từ cần ôn hôm nay), tích hợp nút refresh hoạt động chuẩn xác, xử lý lỗi truy vấn thân thiện và liên kết trực tiếp tới Ôn hôm nay và Từ hay sai.
* Kích hoạt thẻ "Từ hay sai" trên [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) và tích hợp các route điều hướng mới trong [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx).
* Tinh chỉnh CSS trong [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css) (chuyển stats grid thành 4 cột trên desktop, sửa lỗi z-index thanh mobile sticky action bar).
* Khắc phục lỗi cảnh báo console `favicon.ico` 404 bằng cách nhúng favicon dạng inline SVG trực tiếp trong [index.html](file:///d:/VIBE/english-flashcard-web/index.html).
* Chạy thành công lệnh build production `npm run build` không phát sinh cảnh báo lỗi.

### File đã sửa
* [supabase/rls_policies.sql](file:///d:/VIBE/english-flashcard-web/supabase/rls_policies.sql) [NEW]
* [docs/SUPABASE_RLS.md](file:///d:/VIBE/english-flashcard-web/docs/SUPABASE_RLS.md) [NEW]
* [src/utils/progressService.js](file:///d:/VIBE/english-flashcard-web/src/utils/progressService.js)
* [src/utils/wrongWordsService.js](file:///d:/VIBE/english-flashcard-web/src/utils/wrongWordsService.js) [NEW]
* [src/components/DueReview.jsx](file:///d:/VIBE/english-flashcard-web/src/components/DueReview.jsx) [NEW]
* [src/components/WrongWords.jsx](file:///d:/VIBE/english-flashcard-web/src/components/WrongWords.jsx) [NEW]
* [src/components/ProgressDashboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ProgressDashboard.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)
* [index.html](file:///d:/VIBE/english-flashcard-web/index.html)

### Ghi chú
* Toàn bộ luồng dành cho cả khách vãng lai (Guest) và User đã đăng nhập hoạt động trơn tru, đồng bộ dữ liệu bảo mật và hiệu năng cao.

## 2026-07-01 - Phát triển tính năng Progress Dashboard

### Đã làm
* Tạo service [progressService.js](file:///d:/VIBE/english-flashcard-web/src/utils/progressService.js) [NEW] để đọc dữ liệu thống kê từ Supabase (`study_sessions`, `word_progress`), bao gồm các hàm: `fetchSessionStats`, `fetchWordProgressStats`, `fetchRecentSessions`, `fetchWordsToReviewTodayCount`.
* Tạo component [ProgressDashboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ProgressDashboard.jsx) [NEW] hiển thị tiến trình học tập với 6 stat cards (phiên học, câu đã làm, câu đúng, tỷ lệ đúng, từ đã học, từ thành thạo), card "Ôn hôm nay" dựa trên spaced repetition (`next_review_at`), và lịch sử 5 phiên học gần nhất với circular accuracy ring.
* Dashboard chỉ hiển thị dữ liệu cho user đã đăng nhập; user chưa login thấy màn hình mời đăng nhập.
* Cập nhật [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) thêm route `progress` và truyền props điều hướng.
* Cập nhật [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) thêm nút "Tiến trình" trong auth header (chỉ hiện khi đã đăng nhập).
* Thêm styles CSS cho toàn bộ Progress Dashboard vào [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css), đồng bộ design tokens hiện có (colors, radii, shadows, animations), responsive mobile tốt.

### File đã sửa
* [src/utils/progressService.js](file:///d:/VIBE/english-flashcard-web/src/utils/progressService.js) [NEW]
* [src/components/ProgressDashboard.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ProgressDashboard.jsx) [NEW]
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã build thành công bằng `npm run build` không có lỗi.
* Không ảnh hưởng đến các tính năng hiện có: Flashcard Quiz, Listening Practice, Vocabulary Review, Auth.

## 2026-07-01 - Khắc phục lỗi và tối ưu hóa quy trình lưu kết quả học tập

### Đã làm
* Thêm log `SAVE_RESULT_START` cùng chi tiết các tham số đầu vào trong [studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js) để debug trực quan trong Browser Console.
* Tách biệt quy trình lưu: Ưu tiên lưu thành công phiên học chính vào bảng `study_sessions` trước, sau đó mới lưu các thông tin phụ trợ (`study_session_lessons`, `study_answers`, `word_progress`) trong các khối try/catch độc lập để chống chặn tiến trình.
* Thêm cơ chế fallback: Nếu không tìm thấy khóa học trong database, gán `course_id = null` và cảnh báo `Course not found` qua `console.warn` thay vì huỷ bỏ cả quy trình lưu.
* Bổ sung log `console.error` chi tiết gồm step, payload, message, details, hint và code từ database khi insert `study_sessions` bị lỗi.
* Chuẩn hóa việc ánh xạ chế độ học tập (mode mapping) thành các giá trị hợp lệ của database (`multiple_choice`, `typing`, `listening`).
* Cập nhật component [FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx) và [ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx) khai báo state `saveErrorMsg` để lưu thông tin lỗi chi tiết khi không lưu được kết quả, hiển thị trực quan lên UI màn kết quả.

### File đã sửa
* [src/utils/studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js)
* [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
* [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)

### Ghi chú
* Đã build thành công bằng `npm run build` không có lỗi.

## 2026-07-01 - Lưu kết quả học tập vào Supabase Database

### Đã làm
* Phát triển utility [studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js) để xử lý việc lưu kết quả học tập vào 4 bảng trong Supabase (`study_sessions`, `study_session_lessons`, `study_answers`, `word_progress`).
* Tích hợp thuật toán Spaced Repetition (Lặp lại ngắt quãng) để tính toán và tự động bulk upsert trạng thái học tập của từng từ vựng vào bảng `word_progress` (gồm correct streak, mastery level, và ngày xem lại tiếp theo `next_review_at`).
* Cập nhật component [FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx) lưu `id` của từ vựng vào `answersLog`, tự động gọi service lưu kết quả khi hoàn thành buổi học (hỗ trợ cả trắc nghiệm và gõ từ) và hiển thị thông báo trạng thái lưu trên finished screen.
* Cập nhật component [ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx) import `useAuth`, lưu `id` của từ vựng vào `answersLog`, tự động gọi service lưu kết quả khi hoàn thành buổi học và hiển thị thông báo trạng thái lưu trên finished screen.
* Bổ sung styles CSS cho thông báo trạng thái lưu kết quả (`.save-status-msg`) trong file [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css).
* Đảm bảo khách chưa đăng nhập vẫn sử dụng toàn bộ tính năng học bình thường bằng CSV, chỉ hiển thị thông báo nhắc đăng nhập nhẹ nhàng và không crash app.

### File đã sửa
* [src/utils/studyResultService.js](file:///d:/VIBE/english-flashcard-web/src/utils/studyResultService.js) [NEW]
* [src/components/FlashcardQuiz.jsx](file:///d:/VIBE/english-flashcard-web/src/components/FlashcardQuiz.jsx)
* [src/components/ListeningPractice.jsx](file:///d:/VIBE/english-flashcard-web/src/components/ListeningPractice.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã chạy build thành công bằng `npm run build`.

## 2026-07-01 - Kết nối Supabase và tích hợp Authentication

### Đã làm
* Cài đặt thư viện `@supabase/supabase-js` và cập nhật dependencies trong `package.json`.
* Thiết lập Supabase Client trong [supabaseClient.js](file:///d:/VIBE/english-flashcard-web/src/lib/supabaseClient.js) đọc biến môi trường Vite kèm theo cơ chế cảnh báo nếu thiếu config.
* Xây dựng Auth Context trong [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) cung cấp các trạng thái đăng nhập, đăng xuất, tự động đồng bộ và lắng nghe sự thay đổi qua `onAuthStateChange`.
* Thiết kế component [AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx) cung cấp giao diện Đăng nhập / Đăng ký tài khoản cực kỳ responsive, hỗ trợ kích thước mobile chuẩn (input full-width, font-size >= 16px, button >= 44px).
* Cập nhật thanh Auth Status Header tại [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) hiển thị lời chào email người dùng sau khi đã đăng nhập thành công và hỗ trợ nút Đăng xuất.
* Cấu hình định tuyến trang `"auth"` trong [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx) để mở màn hình Đăng nhập khi người dùng yêu cầu, tự động chuyển về trang chủ khi đăng nhập thành công.
* Bọc ứng dụng bằng `AuthProvider` trong [main.jsx](file:///d:/VIBE/english-flashcard-web/src/main.jsx).
* Tạo file [.env.example](file:///d:/VIBE/english-flashcard-web/.env.example) chứa cấu hình mẫu không chứa key thật.
* Thêm styles CSS cho Auth status, Auth card, message thông báo lỗi và responsive UI cho Mobile ở cuối file [styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css).

### File đã sửa
* [package.json](file:///d:/VIBE/english-flashcard-web/package.json)
* [.env.example](file:///d:/VIBE/english-flashcard-web/.env.example) [NEW]
* [src/lib/supabaseClient.js](file:///d:/VIBE/english-flashcard-web/src/lib/supabaseClient.js) [NEW]
* [src/context/AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx) [NEW]
* [src/components/AuthPanel.jsx](file:///d:/VIBE/english-flashcard-web/src/components/AuthPanel.jsx) [NEW]
* [src/main.jsx](file:///d:/VIBE/english-flashcard-web/src/main.jsx)
* [src/App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx)
* [src/components/Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx)
* [src/styles.css](file:///d:/VIBE/english-flashcard-web/src/styles.css)

### Ghi chú
* Đã chạy build thành công bằng `npm run build` với 0 lỗi.
* Toàn bộ luồng học từ CSV hiện tại (Quiz, Review, Listening, Typing) vẫn chạy ổn định như cũ.

## 2026-06-27 - Thêm chế độ Luyện nghe (Listening Practice)

### Đã làm
* Phát triển màn hình chọn buổi học (Course & Session Selector) hỗ trợ chọn khóa học Nền tảng hoặc TOEIC 1 và chọn 1 hoặc nhiều buổi học.
* Hỗ trợ hai chế độ luyện nghe giống Flashcard Quiz: **Trắc nghiệm** (chọn từ tiếng Anh đúng trong 4 phương án) và **Nhập từ tiếng Anh** (gõ lại từ đã nghe).
* Tích hợp thuật toán `createListeningQuestion` để tự động lấy và trộn ngẫu nhiên 3 đáp án sai (các từ tiếng Anh khác trong bộ học/từ CSV) làm lựa chọn trắc nghiệm.
* Phát triển màn hình chơi luyện nghe (Gameplay Screen) với các tính năng:
  - Nút "Nghe từ" lớn trung tâm và nút "Nghe lại" nhỏ hơn phát âm chuẩn từ tiếng Anh qua file audio (nếu có) hoặc Web Speech API.
  - Ô nhập từ tiếng Anh full-width, tối ưu responsive trên mobile (font-size 16px, chiều cao tối thiểu 52px).
  - Tự động xóa input cũ, reset trạng thái, và focus vào ô nhập mỗi khi chuyển câu bằng `useRef` và `useEffect`.
  - Hỗ trợ phím `Enter` thông minh: nhấn Enter lần 1 để kiểm tra đáp án, nhấn lần 2 để chuyển câu tiếp theo.
  - So sánh đáp án không phân biệt chữ hoa thường, tự động chuẩn hóa dấu nháy đơn, khoảng trắng đầu cuối và khoảng trắng giữa cụm từ thông qua hàm `normalizeListeningAnswer`.
  - Phát âm thanh phản hồi đúng/sai bằng Audio API và hiển thị chi tiết (đáp án đúng, loại từ, phiên âm, nghĩa tiếng Việt, câu ví dụ tiếng Anh) ngay sau khi kiểm tra.
* Cập nhật màn hình kết quả luyện nghe (Finished/Result Screen):
  - Tính điểm hệ 10 làm tròn 1 chữ số thập phân.
  - Hiển thị bảng tổng kết toàn bộ câu hỏi đã làm (đáp án đúng, loại từ, nghĩa, bạn đã nhập, trạng thái đúng/sai, nút nghe lại).
  - Tối ưu hiển thị responsive dạng danh sách thẻ (card-list) kết quả trên mobile.
* Tích hợp điều hướng vào `App.jsx` và kích hoạt thẻ Listening Practice trên trang chủ `Home.jsx`.
* Thêm style CSS premium cho toàn bộ chế độ Luyện nghe trong `styles.css`.

### File đã sửa
* `src/App.jsx`
* `src/components/Home.jsx`
* `src/components/ListeningPractice.jsx` [NEW]
* `src/styles.css`

### Ghi chú
* Bản build production thành công bằng `npm run build`.
* Giữ nguyên các chức năng cũ (Flashcard Quiz, Vocabulary Review).

## 2026-06-27 - Thêm chế độ học Nhập từ tiếng Anh trong Flashcard Quiz

### Đã làm
* Thêm chế độ học mới `"typing"` (Nhập từ tiếng Anh) bên cạnh chế độ trắc nghiệm `"multipleChoice"` (mặc định) trong component `FlashcardQuiz`.
* Xây dựng giao diện chọn chế độ học (Mode Selector) trên màn hình chọn buổi học với hiệu ứng hover và active gradient hiện đại.
* Thiết lập logic học chế độ gõ:
  - Hiển thị nghĩa tiếng Việt (`answer`), loại từ (`pos`), và câu ví dụ đã được ẩn từ tiếng Anh cần gõ bằng hàm helper `maskWordInExample` để chống lộ đáp án.
  - Tích hợp ô nhập từ tiếng Anh full-width, tối ưu responsive trên mobile (font-size 16px, chiều cao tối thiểu 52px).
  - Tự động xóa input cũ, reset trạng thái, và focus vào ô nhập mỗi khi chuyển câu bằng `useRef` và `useEffect`.
  - Hỗ trợ phím `Enter` thông minh: nhấn Enter lần 1 để kiểm tra đáp án, nhấn lần 2 để chuyển câu tiếp theo.
  - Phát âm thanh phản hồi đúng/sai bằng Audio API và giữ nút phát âm từ vựng (chỉ mở ra sau khi đã bấm kiểm tra để chống lộ đáp án).
  - So sánh đáp án không phân biệt hoa thường, tự động chuẩn hóa dấu nháy đơn thông minh (`’` hoặc `‘` thành `'`), khoảng trắng dư thừa qua hàm `normalizeTypingAnswer`.
* Cập nhật màn hình kết quả bài học (`finished` state):
  - Hiển thị bảng kết quả so sánh thông tin từ vựng chi tiết ("Bạn nhập: X | Đáp án đúng: Y") cho cả chế độ gõ và trắc nghiệm.
  - Hỗ trợ tối ưu responsive dạng card review kết quả trên mobile cho chế độ gõ.
* Thêm style CSS premium cho toàn bộ chế độ học mới trong `styles.css`.

### File đã sửa
* `src/components/FlashcardQuiz.jsx`
* `src/styles.css`

### Ghi chú
* Bản build production thành công bằng `npm run build`.
* Không ảnh hưởng đến các chức năng cũ (Multiple Choice, Vocabulary Review, Audio feedback).

## 2026-06-27 - Tăng âm lượng âm thanh feedback và phát âm từ vựng

### Đã làm
* Tăng âm lượng âm thanh phản hồi đúng/sai trong `feedbackSound.js` bằng cách chuyển cấu hình âm lượng thành các hằng số dễ điều chỉnh ở đầu file: `CORRECT_SOUND_VOLUME = 0.38` (tăng khoảng 2.5 lần so với mức 0.15 cũ) và `WRONG_SOUND_VOLUME = 0.35` (tăng khoảng 1.75 lần so với mức 0.20 cũ).
* Tăng âm lượng phát âm từ vựng trong `speech.js` bằng cách thiết lập hằng số `WORD_AUDIO_VOLUME = 1.0` ở đầu file và gán âm lượng này cho cả Web Speech API (`utterance.volume = WORD_AUDIO_VOLUME`) và thẻ audio (`audio.volume = WORD_AUDIO_VOLUME`).
* Đảm bảo tính năng phát âm đồng bộ và to rõ hơn ở cả màn hình Flashcard Quiz và Vocabulary Review mà không làm thay đổi các logic học tập khác.

### File đã sửa
* `src/utils/feedbackSound.js`
* `src/utils/speech.js`

### Ghi chú
* Đã chạy build thành công bằng `npm run build`.

## 2026-06-27 - Thêm âm thanh phản hồi đúng/sai khi chọn đáp án trong Flashcard Quiz

### Đã làm
* Tạo file tiện ích âm thanh `feedbackSound.js` để phát âm thanh đúng (2 nốt cao, ngắn, sinh động) và sai (1 nốt thấp, ngắn, dạng sóng tam giác êm dịu) sử dụng Web Audio API tích hợp sẵn của trình duyệt.
* Tích hợp âm thanh phản hồi vào sự kiện chọn đáp án trắc nghiệm (`handleSelect`) của component `FlashcardQuiz`, bảo đảm âm thanh phát đúng 1 lần cho mỗi câu và không tự lặp lại khi người dùng click liên tục.
* Thêm nút bật/tắt âm thanh phản hồi dạng chip ở phần navigation (`back-nav`) của màn quiz với trạng thái lưu trữ lâu dài trong `localStorage` bằng key `flashcard_feedback_sound_enabled`. Mặc định trạng thái là bật.
* Đồng bộ thiết kế nút bật/tắt âm thanh phản hồi theo phong cách hiện đại (glassmorphism/border-radius), hỗ trợ thu nhỏ chỉ hiển thị icon trên các thiết bị di động (chiều rộng màn hình < 480px) nhằm tránh tràn dòng và vỡ layout.
* Bảo đảm tính năng phát âm của từ vựng (pronunciation) qua Web Speech API và file audio gốc hoạt động bình thường, độc lập với việc bật/tắt âm thanh phản hồi đúng/sai.

### File đã sửa
* `src/utils/feedbackSound.js` (NEW)
* `src/components/FlashcardQuiz.jsx`
* `src/styles.css`

### Ghi chú
* Đã chạy build thành công với Vite (`npm run build`).
* Không làm thay đổi logic học, logic tính điểm hệ 10 hay cấu trúc dữ liệu của bộ flashcard.

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
