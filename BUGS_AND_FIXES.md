# BUGS_AND_FIXES.md

File này ghi lại các lỗi đã gặp và cách xử lý.

Mỗi khi sửa lỗi xong, phải thêm vào file này.

## Format ghi lỗi

```md
## Lỗi: Tên lỗi ngắn

### Hiện tượng
- ...

### Nguyên nhân
- ...

### Cách fix
- ...

### Không được lặp lại
- ...
```

## Lỗi: Màn chọn chế độ kiểm tra "Ôn tập Từ hay sai" bị ẩn nút "Bắt đầu ôn tập" trên thiết bị di động (mobile)

### Hiện tượng
- Người dùng truy cập màn "Ôn tập Từ hay sai" trên mobile, chọn kiểu kiểm tra xong nhưng không tìm thấy nút hành động để bắt đầu học.

### Nguyên nhân
- Trong `styles.css`, lớp `.selection-screen .action-box` bị thiết lập `display: none !important` trên mobile (max-width: 768px). Do màn "Ôn tập Từ hay sai" không có phần chọn ngày học và không sử dụng `.mobile-sticky-action-bar` giống màn Quiz chính, nút bắt đầu nằm trong `.action-box` bị ẩn hoàn toàn.

### Cách fix
- Thêm lớp `wrong-words-selection-screen` riêng cho container của Wrong Words và thêm CSS ghi đè `@media (max-width: 768px)` để giữ `.action-box` luôn hiển thị dưới dạng full-width, chiều cao tối thiểu 48px cho nút CTA bấm dễ dàng.

### Không được lặp lại
- Tránh ẩn các hộp hành động `.action-box` của màn hình chọn chế độ trên di động mà không cung cấp thanh hành động sticky thay thế ở cuối trang.

---

## Lỗi: Nhãn đáp án A/B/C/D bị đè/overlap lên nội dung đáp án trắc nghiệm trên thiết bị di động (mobile)

### Hiện tượng
- Trong các bài kiểm tra trắc nghiệm, các chữ cái A/B/C/D nằm đè lên văn bản của đáp án, làm che chữ hoặc vỡ bố cục khi xem trên mobile.

### Nguyên nhân
- Lớp `.option-label` được thiết lập `position: absolute; left: 16px; top: 50%; transform: translateY(-50%)` và `.option` có `padding-left: 64px` trên desktop. Khi ở trên mobile (max-width: 768px), `.option` bị reset padding về `12px 14px` nhưng nhãn `.option-label` vẫn giữ absolute positioning khiến nó bị kéo vào đè lên chữ đáp án.

### Cách fix
- Chuyển đổi `.option` thành bố cục Flexbox hoàn toàn (`display: flex; align-items: center; gap: 12px; padding: 16px 20px;`) và loại bỏ thuộc tính absolute positioning của `.option-label`.
- Thiết lập `.option-label` có thuộc tính `flex: 0 0 32px;` và `.option-text` có `flex: 1; min-width: 0; word-break: break-word` để text đáp án tự động xuống dòng đẹp mắt khi quá dài mà không bao giờ va chạm với nhãn chữ cái.
- Đồng bộ lớp CSS này trên cả 4 màn trắc nghiệm (Flashcard Quiz, Due Review, Wrong Words, Listening Practice).

### Không được lặp lại
- Tuyệt đối không dùng absolute positioning cho nhãn đáp án A/B/C/D. Hãy luôn dùng Flexbox với thuộc tính `flex-shrink` hoặc fixed flex-basis cho nhãn và `min-width: 0` cho phần text để đảm bảo tính responsive tự nhiên.

---

## Lỗi: Profile của Admin bị ghi đè thành role user hoặc bị reset isAdmin do fallback local khi fetch profiles gặp lỗi hoặc khi dùng cache cũ

### Hiện tượng
- Đã xác nhận trên database tài khoản `admin@gmail.com` có role = `admin` và `profiles.id = auth.users.id`, nhưng trên UI nút "Quản trị" không hiện. Khi query, nếu profiles bị lỗi fetch hoặc cache không được xóa đúng cách lúc đăng xuất/đổi tài khoản, role của admin bị local fallback ép về `"user"` và `isAdmin` bị đặt thành `false`.

### Nguyên nhân
- Trong `AuthContext.jsx`, hàm `fetchUserProfile` có các khối catch error và insert error thực hiện set profile thành `fallback` có hardcode `role: "user"` và set `setIsAdmin(false)`. Khi supabase query trả ra lỗi (do RLS hoặc kết nối mạng tạm thời), state `profile` lập tức bị ghi đè bởi fallback này khiến admin mất vai trò trên client.
- Bộ nhớ cache (`fetchPromise` và `lastFetchedId`) không được dọn dẹp đầy đủ khi đăng xuất (`SIGNED_OUT` hoặc gọi `signOut`) hoặc khi user ID thay đổi, dẫn tới client sử dụng lại cache vai trò `user` cũ cho tài khoản `admin` mới đăng nhập.
- `App.jsx` thực hiện check loading chung, chặn hiển thị trang admin hoặc gây redirect sớm khi auth loading chưa hoàn tất.

### Cách fix
- Loại bỏ hoàn toàn mọi khối local fallback tự động gán `role: "user"` khi query database lỗi trong `AuthContext.jsx`.
- Đảm bảo xóa sạch `fetchPromise.current` và `lastFetchedId.current` khi đăng xuất hoặc khi ID của user hiện tại thay đổi so với lần query gần nhất.
- Bổ sung `AuthDebugProbe` để so sánh trực tiếp kết quả lấy được từ database (raw profile) và kết quả được lưu trữ trong context, giúp khoanh vùng lỗi nhanh chóng.
- Điều chỉnh logic loading tại `App.jsx` để trang admin tự quản lý trạng thái chờ của mình thay vì bị block bởi loader toàn cục.

### Không được lặp lại
- Tuyệt đối không tự ý fallback vai trò (role) của người dùng về `"user"` khi xảy ra lỗi truy vấn cơ sở dữ liệu. Hãy giữ nguyên hoặc báo lỗi cụ thể để tránh việc ghi đè thông tin xác thực chính xác của admin.
- Phải giải phóng tất cả cache, promise, và session refs khi người dùng thực hiện đăng xuất hoặc đổi tài khoản.

## Lỗi: Đăng nhập admin@gmail.com nhưng nút "Quản trị" không hiển thị do lỗi truyền prop và race condition chuyển hướng

### Hiện tượng
- Đăng nhập tài khoản admin (`admin@gmail.com` với role = admin trong `public.profiles`) thành công nhưng trên giao diện trang chủ Home hoàn toàn không hiển thị nút "Quản trị". Khi cố gắng truy cập trực tiếp route admin thì bị chuyển hướng ngược trở lại trang chủ.

### Nguyên nhân
- Giao diện Home lấy thông tin `isAdmin` qua prop truyền từ `App.jsx`, dẫn đến việc bị trễ hoặc lệch pha render khi AuthContext cập nhật không đồng bộ.
- `isAdmin` trong `AuthContext` là biến derived đơn giản, đôi khi không kích hoạt re-render hoặc bị reset trạng thái trong các sự kiện vòng đời đăng nhập/refresh token.
- `App.jsx` chứa hook `useEffect` chuyển hướng admin về `home` nếu `!isAdmin`, tạo ra race condition: khi profile đang tải hoặc vừa tải xong, `useEffect` chạy sớm và reset trang hiện tại về `home` trước khi component con kịp cập nhật.

### Cách fix
- Tách biệt `isAdmin` thành một state React riêng biệt `[isAdmin, setIsAdmin] = useState(false)` trong [AuthContext.jsx](file:///d:/VIBE/english-flashcard-web/src/context/AuthContext.jsx), cập nhật đồng thời mỗi khi `profile` được cập nhật hoặc reset.
- Sửa [Home.jsx](file:///d:/VIBE/english-flashcard-web/src/components/Home.jsx) lấy `user`, `profile` và `isAdmin` trực tiếp từ `useAuth()` để loại bỏ việc truyền qua prop từ App.
- Xóa hook `useEffect` chuyển hướng tự động ở `App.jsx`. Thay thế bằng inline check tại render phase đối với route `"admin"`: hiển thị màn hình chờ khi đang loading, hiển thị card access denied khi không đủ quyền, và render `AdminVocabularyManager` khi đã xác thực admin thành công.

### Không được lặp lại
- Tránh sử dụng hook `useEffect` để tự động chuyển hướng các trang bảo mật dựa trên state không đồng bộ. Hãy thực hiện kiểm tra phân quyền trực tiếp tại pha render (inline rendering check) để đảm bảo an toàn và không bị race condition.

## Lỗi: Trạng thái tải xác thực (Auth Loading) không đồng bộ gây ẩn nút Quản trị và đá Admin về Home

### Hiện tượng
- Đăng nhập tài khoản admin thành công nhưng nút "Quản trị" trên trang chủ Home không xuất hiện ngay lập tức, hoặc khi refresh trang khi đang ở màn hình quản trị thì bị tự động chuyển hướng (redirect) về trang chủ Home.

### Nguyên nhân
- Khi ứng dụng tải hoặc thay đổi trạng thái đăng nhập, dữ liệu từ vựng (CSV) được load trước và hoàn thành, kích hoạt render giao diện trang chủ Home trong khi AuthContext vẫn đang fetch profile người dùng (trạng thái `authLoading` từ `useAuth()` chưa được xử lý đồng bộ trong `App.jsx`).
- State `isAdmin` lúc này mang giá trị mặc định là `false` nên giao diện Home không hiển thị nút "Quản trị".
- Đồng thời, hook kiểm tra route Admin trong `App.jsx` thấy `currentPage === "admin"` và `!isAdmin` (do chưa load xong profile) đã kích hoạt redirect đưa trang hiện tại về `"home"` trước khi profile được load đầy đủ.

### Cách fix
- Tích hợp `authLoading` từ `useAuth()` vào luồng kiểm tra hiển thị chung của ứng dụng tại [App.jsx](file:///d:/VIBE/english-flashcard-web/src/App.jsx): `if (loading || authLoading) return <Loading />`.
- Đảm bảo hook kiểm tra route Admin chỉ thực hiện redirect khi trạng thái tải xác thực đã hoàn thành: `if (!authLoading && currentPage === "admin" && !isAdmin)`.
- Chuẩn hóa prop-flow: truyền `isAdmin`, `user` và `profile` từ `App.jsx` xuống `Home.jsx` dưới dạng prop để đồng bộ vòng đời re-render của component cha-con.

### Không được lặp lại
- Luôn luôn kiểm tra trạng thái đang tải (`loading`) của auth service trước khi đưa ra quyết định phân quyền hoặc chuyển hướng người dùng trên giao diện.

---

## Lỗi: Tài khoản admin không hiện nút "Quản trị" và email trong profiles bị NULL

### Hiện tượng
- Tài khoản admin đã có role = admin trong bảng profiles nhưng giao diện web không hiển thị nút "Quản trị".
- Trường email của profiles bị NULL, và email của user bị lưu nhầm vào trường display_name.

### Nguyên nhân
- AuthContext chỉ select cột `role` thay vì fetch đầy đủ thông tin hồ sơ.
- Trigger `handle_new_user` trên cơ sở dữ liệu chỉ insert `id`, `email`, `role` với `ON CONFLICT (id) DO NOTHING`, dẫn tới việc khi cập nhật metadata từ phía Auth, thông tin không được đồng bộ sang profile.
- AuthPanel và AuthContext dùng sai trường khi đăng nhập/đăng ký.

### Cách fix
- Cập nhật trigger `handle_new_user()` sử dụng `ON CONFLICT (id) DO UPDATE` để đồng bộ đúng `email` và `display_name` từ metadata mà không làm ghi đè cột `role` của Admin.
- Viết query backfill tự động sync dữ liệu email và display_name bị NULL cho các user cũ.
- Tách biệt rõ ràng các trường `email`, `password`, và `displayName` trong `AuthPanel` và `AuthContext`.
- Bổ sung kiểm tra `isAdmin` thông qua fetch đầy đủ `profiles` (`id, email, display_name, role`) để render nút Quản trị và bảo vệ route Admin.

### Không được lặp lại
- Luôn đồng bộ hồ sơ `profiles` với metadata chính của `auth.users` một cách an toàn và sử dụng các cơ chế chống loop query (ref-deduplication) trên client-side.

## Lỗi: Trình duyệt báo lỗi GET /favicon.ico 404 (Not Found)

### Hiện tượng
- Trong Developer Console của trình duyệt xuất hiện cảnh báo đỏ `GET http://localhost:5173/favicon.ico 404 (Not Found)`.

### Nguyên nhân
- Dự án không chứa tệp `favicon.ico` trong thư mục `public/` và thẻ `<head>` của `index.html` chưa khai báo thẻ link favicon, khiến trình duyệt tự động gửi yêu cầu lấy `favicon.ico` mặc định và nhận về phản hồi 404 từ Vite dev server.

### Cách fix
- Bổ sung một thẻ `<link rel="icon" type="image/svg+xml" href="...">` nhúng trực tiếp Data-URI dạng Inline SVG biểu tượng tia sét `⚡` trong phần `<head>` của `index.html`. Cách này vừa nhẹ vừa tránh phải duy trì tệp icon vật lý.

### Không được lặp lại
- Khi xây dựng các dự án web mới, cần luôn khai báo favicon (bằng tệp vật lý hoặc inline SVG) để tối ưu trải nghiệm và tránh các lỗi 404 không đáng có trong log console.

## Lỗi: Trắng màn hình sau khi bấm "Xem kết quả" ở câu cuối cùng

### Hiện tượng
- Người dùng hoàn thành toàn bộ câu hỏi trong lượt học, bấm nút "Xem kết quả" để chuyển sang bảng điểm thì trang web bị trắng xóa hoàn toàn.

### Nguyên nhân
- Khi thay đổi trạng thái sang `"finished"` để hiển thị màn hình kết quả, React render giao diện kết quả.
- Giao diện kết quả chứa nút "Học lại buổi này" gắn sự kiện `onClick={handleReset}`.
- Tuy nhiên, trong quá trình nâng cấp và tái cấu trúc code của component `FlashcardQuiz`, hàm `handleReset` đã được loại bỏ và thay thế bằng `handleStartQuiz`, dẫn đến việc biến `handleReset` không còn tồn tại trong phạm vi (scope).
- React gặp lỗi `ReferenceError: handleReset is not defined` trong quá trình render, khiến toàn bộ ứng dụng bị crash và hiển thị trang trắng.

### Cách fix
- Đổi thuộc tính sự kiện `onClick` của nút "Học lại buổi này" tại màn hình kết quả từ `onClick={handleReset}` thành `onClick={handleStartQuiz}`.
- Hàm `handleStartQuiz` đã chứa sẵn logic reset tiến trình học, xáo trộn lại câu hỏi và chuyển trạng thái về `"playing"`.

### Không được lặp lại
- Trước khi release hoặc build sản phẩm, phải luôn kiểm tra toàn bộ các tham chiếu sự kiện (như hàm xử lý click) trong code JSX để đảm bảo mọi biến và hàm được gọi đều đang tồn tại và hoạt động chính xác trong phạm vi của component.

---

## Lỗi: Câu hỏi trong quiz bị lặp ngẫu nhiên và hiển thị lại từ vừa học xong

### Hiện tượng
- Trong quá trình học, một từ vựng có thể xuất hiện nhiều lần liên tục hoặc lặp lại khi chưa đi qua hết danh sách từ của bộ câu hỏi.
- Không có sự tiến triển tuần tự rõ ràng khiến người dùng không biết khi nào lượt học kết thúc.

### Nguyên nhân
- Component `FlashcardQuiz` sử dụng state `questionIndex` và hook `useMemo` để tính toán câu hỏi hiện tại bằng cách gọi hàm `createQuestion(cards)`.
- Bên trong `createQuestion`, câu hỏi chính được chọn bằng cách random chỉ số ngẫu nhiên từ toàn bộ danh sách `cards`: `randomItem(cards)`.
- Việc chọn câu hỏi chính ngẫu nhiên sau mỗi lần chuyển câu (`handleNext`) dẫn đến trùng lặp (trùng lặp ngay lập tức hoặc xuất hiện lại nhanh chóng do xác suất độc lập) và không kiểm soát được tiến độ.

### Cách fix
- Thay thế hoàn toàn cơ chế lấy câu hỏi ngẫu nhiên trực tiếp bằng hàng đợi `questionQueue`.
- Khi người dùng nhấn bắt đầu học từ màn hình chọn buổi:
  1. Lọc các từ thuộc các buổi đã chọn (`selectedDays`).
  2. Xáo trộn danh sách từ này bằng thuật toán Fisher-Yates một lần duy nhất.
  3. Gán danh sách đã xáo trộn này vào state `questionQueue`.
  4. Tạo các phương án lựa chọn (1 đúng, 3 sai) và gán sẵn vào từng phần tử trong hàng đợi để cố định phương án, tránh việc trộn lại khi component re-render.
- Quản lý vị trí câu hỏi bằng `currentIndex`. Mỗi lần qua câu mới, chỉ cần tăng `currentIndex` lên 1 đơn vị (`currentIndex + 1`).
- Khi `currentIndex` đạt đến tổng số câu trong hàng đợi (`questionQueue.length`), hệ thống sẽ tự động kết thúc lượt học và hiển thị màn hình kết quả.

### Không được lặp lại
- Không sử dụng các phép chọn phần tử ngẫu nhiên trực tiếp từ mảng cho câu hỏi chính ở mỗi lượt chuyển tiếp.
- Phải dùng cơ chế hàng đợi (`queue`) đã được xáo trộn sẵn trước khi bắt đầu và duyệt tuần tự theo chỉ số (`index`) để đảm bảo mỗi từ chỉ xuất hiện đúng một lần trong một lượt học.

---

## Lỗi: File CSV bị lỗi mã hóa tiếng Việt hiển thị dấu hỏi chấm ()

### Hiện tượng
- Các từ tiếng Việt có dấu trong CSV hiển thị dạng `? kh? n?ng`, `m?ng l??i`, `b?ng ch?ng` trên trình duyệt và bị lỗi hiển thị.

### Nguyên nhân
- File `public/data/flashcards.csv` được lưu với bảng mã không phải UTF-8 chuẩn (như ANSI hoặc Windows-1258 cũ), dẫn đến việc giải mã sai các ký tự tiếng Việt đặc biệt. Các ký tự này đã bị chuyển hóa thành các ký tự dấu hỏi chấm thực tế `?` (0x3F) trong file.

### Cách fix
- Viết lại file `public/data/flashcards.csv` sử dụng định dạng UTF-8 chuẩn. Các từ tiếng Việt được điền đúng dấu chuẩn tiếng Việt: "cảnh báo", "đủ khả năng", "hàng hóa dự trữ", "lỗi thời", "thực hành", "mạng lưới", "quá trình", "thay thế", "cửa hàng", "xem lại", "bằng chứng".
- Cấu hình CSS import và sử dụng Google Font `Be Vietnam Pro` để hiển thị tiếng Việt chuẩn đẹp.

### Không được lặp lại
- Khi chỉnh sửa file CSV, luôn dùng công cụ hỗ trợ UTF-8 để lưu.
- Nếu câu ví dụ có chứa dấu phẩy, bắt buộc phải bọc toàn bộ câu ví dụ bằng dấu nháy kép `""` để PapaParse không bị chia cột sai.

---

## Lỗi: Đáp án sai bị trùng đáp án đúng

### Hiện tượng

* Trong 4 đáp án, có đáp án sai trùng với đáp án đúng.

### Nguyên nhân

* Logic random lấy từ toàn bộ danh sách mà không loại đáp án đúng.
* Không kiểm tra trùng nhau giữa các đáp án sai.

### Cách fix

* Khi tạo wrong answers, phải filter bỏ card có `answer` trùng với đáp án đúng.
* Dùng Set hoặc kiểm tra unique để tránh đáp án bị trùng.

### Không được lặp lại

* Không được random options trực tiếp từ toàn bộ danh sách nếu chưa filter.

---

## Lỗi: Nút loa không phát âm

### Hiện tượng

* Bấm nút loa nhưng không nghe âm thanh.

### Nguyên nhân có thể

* Trình duyệt chưa cho phép phát âm thanh.
* `audio` rỗng nhưng không fallback sang Web Speech API.
* Gọi `speechSynthesis.speak()` sai thời điểm hoặc truyền word rỗng.

### Cách fix

* Nếu `audio` có dữ liệu thì phát file audio.
* Nếu `audio` rỗng thì dùng Web Speech API.
* Kiểm tra `word` trước khi đọc.

### Không được lặp lại

* Không được chỉ phụ thuộc vào cột `audio`.
* Phải có fallback đọc bằng `word`.

---

## Lỗi: CSV load không đúng dữ liệu

### Hiện tượng

* Web trắng màn hình.
* Flashcard không hiển thị.
* Các field như `word`, `answer`, `ipa`, `example` bị undefined.

### Nguyên nhân có thể

* Sai đường dẫn CSV.
* Sai tên cột CSV.
* CSV có dòng trống.
* Có dấu phẩy trong câu ví dụ nhưng không bọc bằng dấu ngoặc kép.

### Cách fix

* CSV phải đặt tại `public/data/flashcards.csv`.
* Header bắt buộc:
  `id,word,answer,ipa,example,audio`
* Nếu câu ví dụ có dấu phẩy, phải viết:
  `"I accept your offer, but I need time."`

### Không được lặp lại

* Không đổi tên cột CSV nếu không sửa toàn bộ logic load dữ liệu.

---

## Lỗi: Đồng bộ email người dùng từ auth.users sang public.profiles bị lỗi hoặc email mang giá trị NULL, lỗi rate limit 429 và login 400 trong AuthPanel

### Hiện tượng
- Khi đăng ký, email trong bảng `public.profiles` của một số tài khoản bị NULL hoặc không đồng bộ đúng.
- Đôi khi khi đăng ký/đăng nhập, giao diện báo lỗi chung chung, không rõ lỗi Rate Limit (429) hoặc sai thông tin đăng nhập/chưa xác nhận email (400).
- Xảy ra race condition / double submit do click nhiều lần liên tục vào nút đăng nhập/đăng ký.

### Nguyên nhân
- Trigger `handle_new_user()` trước đó chỉ insert và update không triệt để trường `email` từ `auth.users`, dẫn đến việc bị NULL.
- Client-side `AuthContext.jsx` khi đăng nhập chưa fetch hoặc sync triệt để trường `email` của profile và không có fallback hiển thị displayName chính xác.
- `AuthPanel.jsx` không bắt chính xác mã lỗi `400` và `429` của Supabase và chưa chặn click đúp khi đang submit.

### Cách fix
- Sửa hàm trigger `public.handle_new_user` luôn insert `NEW.email` và `ON CONFLICT (id) DO UPDATE` cập nhật `email = EXCLUDED.email`.
- Thêm query backfill để sửa toàn bộ email bị NULL/thiếu của `public.profiles` cũ từ `auth.users.email`.
- Tạo mới file migration `supabase/auth_profile_sync_migration.sql` cấu hình đầy đủ RLS cho `profiles`:
  - `authenticated` được `SELECT` và `INSERT` profile chính mình (với role `user`).
  - `authenticated` được `UPDATE` email, display_name và updated_at của chính mình nhưng không được tự đổi role.
  - Cung cấp quyền `GRANT SELECT, INSERT, UPDATE` cho `authenticated` role.
- Sửa `AuthPanel.jsx`:
  - Gọi trực tiếp `supabase.auth.signUp(...)` và `supabase.auth.signInWithPassword(...)`.
  - Trim email trước khi gửi đi.
  - Kiểm tra trạng thái `isSubmitting` trước khi thực thi để chống spam click đúp.
  - Nhận diện lỗi status `429` (rate limit) hiển thị: `"Bạn thao tác quá nhanh. Vui lòng chờ vài phút rồi thử lại."`
  - Nhận diện lỗi status `400` hiển thị: `"Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được xác nhận."`
- Sửa `AuthContext.jsx`:
  - `fetchUserProfile` fetch profile và sync `email` (update nếu NULL hoặc khác `user.email`).
  - Tạo profile mới: `display_name = user.user_metadata?.display_name || user.email`.
  - Không bao giờ ghi đè hoặc reset `role` admin thành `user`.

### Không được lặp lại
- Luôn trim email đầu vào trước khi xác thực.
- Sử dụng biến trạng thái `isSubmitting` để disable và dừng xử lý form khi đang gửi request.
- Tuyệt đối không tự ý cập nhật hay reset role của người dùng trong các hàm update client-side.
