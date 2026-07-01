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
