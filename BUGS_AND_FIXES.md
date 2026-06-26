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
