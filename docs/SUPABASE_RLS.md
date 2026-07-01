# Supabase Security & RLS configuration

Tài liệu này hướng dẫn chi tiết cách cấu hình bảo mật dữ liệu Row Level Security (RLS), thiết lập Unique Constraint cho cơ sở dữ liệu Supabase, kiểm tra hoạt động của policy và cách rollback khi gặp sự cố đối với project **english-flashcard-web**.

## 1. Row Level Security (RLS)

Để bảo vệ thông tin cá nhân của người học và tránh rò rỉ dữ liệu giữa các tài khoản, toàn bộ các bảng trong cơ sở dữ liệu đều được kích hoạt RLS và phân quyền như sau:

| Tên bảng | Loại dữ liệu | Quyền SELECT | Quyền INSERT / UPDATE / DELETE |
| :--- | :--- | :--- | :--- |
| `courses` | Công khai | **Mọi người (Public)** | Chỉ Admin ( profiles.role = 'admin' ) |
| `lessons` | Công khai | **Mọi người (Public)** | Chỉ Admin ( profiles.role = 'admin' ) |
| `vocab_items` | Công khai | **Mọi người (Public)** | Chỉ Admin ( profiles.role = 'admin' ) |
| `profiles` | Cá nhân / Admin | **Chủ sở hữu hoặc Admin** | **Chỉ chủ sở hữu** (`auth.uid() = id`) |
| `vocab_import_raw` | Quản trị | **Chỉ Admin** | **Chỉ Admin** |
| `study_sessions` | Cá nhân | **Chỉ chủ sở hữu** (`auth.uid() = user_id`) | **Chỉ chủ sở hữu** (`auth.uid() = user_id`) |
| `study_answers` | Cá nhân | **Chỉ chủ sở hữu & cùng session** | **Chỉ chủ sở hữu & cùng session** |
| `word_progress` | Cá nhân | **Chỉ chủ sở hữu** (`auth.uid() = user_id`) | **Chỉ chủ sở hữu** (`auth.uid() = user_id`) |
| `user_settings` | Cá nhân | **Chỉ chủ sở hữu** (`auth.uid() = user_id`) | **Chỉ chủ sở hữu** (`auth.uid() = user_id`) |
| `study_session_lessons` | Cá nhân (Quan hệ) | **Chỉ chủ sở hữu phiên học** (Check session owner) | **Chỉ chủ sở hữu phiên học** (Check session owner) |

## 2. Thiết lập Unique Constraint cho `word_progress`

Để quá trình đồng bộ (upsert) tiến độ học của từng từ vựng diễn ra chính xác, tránh tạo các dòng trùng lặp cùng một từ cho cùng một người dùng, bảng `word_progress` được ràng buộc duy nhất (Unique Constraint) trên hai cột: `(user_id, vocab_item_id)`.

---

## 3. Quy trình thực thi SQL trên Supabase

Hãy tuân thủ chính xác các bước dưới đây để cập nhật bảo mật cho cơ sở dữ liệu:

### Bước 1: Mở Supabase SQL Editor
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn project **english-flashcard-web** của bạn.
3. Ở thanh menu dọc bên trái màn hình, nhấn chọn biểu tượng **SQL Editor** (hình mảnh giấy có chữ SQL).

### Bước 2: Tạo query mới và dán code
1. Nhấn nút **New Query** ở góc trên hoặc thanh danh sách query.
2. Đổi tên query thành `Enable RLS Policies` để dễ quản lý sau này.
3. Mở file [supabase/rls_policies.sql](../supabase/rls_policies.sql) trong project, sao chép (copy) toàn bộ nội dung.
4. Dán (paste) nội dung vừa copy vào khung soạn thảo của SQL Editor.

### Bước 3: Chạy script
1. Nhấn nút **Run** ở góc dưới bên phải màn hình soạn thảo (hoặc nhấn tổ hợp phím `Ctrl + Enter` / `Cmd + Enter`).
2. Đợi Supabase hiển thị thông báo thành công: `Success. No rows returned`.

---

## 4. Cách kiểm tra Policy hoạt động đúng

Sau khi chạy xong script, bạn cần kiểm tra xem RLS đã thực sự hoạt động hay chưa:

1. **Kiểm tra trên Supabase Dashboard:**
   - Truy cập vào mục **Database** -> **Tables** ở menu bên trái.
   - Nhìn vào cột **RLS Enabled** của các bảng: cả 8 bảng đều phải hiển thị trạng thái **Enabled** (màu xanh).
   - Truy cập mục **Authentication** -> **Policies** để xem danh sách chi tiết các policy đã áp dụng trên từng bảng.
2. **Kiểm tra ở Local Frontend:**
   - Đăng xuất tài khoản trên website (hoặc vào tab ẩn danh ẩn danh).
   - Kiểm tra xem bạn có xem được danh sách từ vựng trong **Vocabulary Review** (vì đây là dữ liệu công khai nên phải hiển thị bình thường).
   - Mở **Progress Dashboard**, trang web phải yêu cầu bạn đăng nhập thay vì hiển thị dữ liệu trống hoặc crash.
   - Sử dụng Developer Console -> Tab Network để đảm bảo không xuất hiện lỗi 403 khi guest học hoặc review.

---

## 5. Phương án khôi phục (Rollback) khi gặp sự cố

Nếu sau khi chạy RLS phát hiện lỗi ứng dụng bị chặn request hoặc lỗi logic và cần rollback tạm thời về trạng thái cũ:

1. Tạo một query mới trong **SQL Editor** đặt tên là `Rollback RLS`.
2. Dán đoạn mã SQL dưới đây và nhấn **Run** để tắt RLS trên toàn bộ các bảng:

```sql
-- Hủy kích hoạt RLS trên tất cả các bảng
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Xóa bỏ tất cả các policy đã tạo
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow public read access to lessons" ON lessons;
DROP POLICY IF EXISTS "Allow public read access to vocab_items" ON vocab_items;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to select their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update their own study sessions" ON study_sessions;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own session lessons" ON study_session_lessons;
DROP POLICY IF EXISTS "Allow authenticated users to select their own session lessons" ON study_session_lessons;
DROP POLICY IF EXISTS "Allow authenticated users to update their own session lessons" ON study_session_lessons;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own study answers" ON study_answers;
DROP POLICY IF EXISTS "Allow authenticated users to select their own study answers" ON study_answers;
DROP POLICY IF EXISTS "Allow authenticated users to update their own study answers" ON study_answers;

DROP POLICY IF EXISTS "Allow authenticated users to select their own word progress" ON word_progress;
DROP POLICY IF EXISTS "Allow authenticated users to insert/update their own word progress" ON word_progress;
DROP POLICY IF EXISTS "Allow authenticated users to update their own word progress" ON word_progress;

DROP POLICY IF EXISTS "Allow authenticated users to select their own settings" ON user_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert/update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update their own settings" ON user_settings;

DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON profiles;
```
