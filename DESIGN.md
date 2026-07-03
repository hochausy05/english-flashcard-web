# DESIGN.md

> Design system và tiêu chuẩn UI/UX cho ứng dụng học từ vựng. File này dùng để AI coding agent đọc trước khi sửa giao diện, nhằm giữ sản phẩm nhất quán, dễ học, dễ dùng và không bị cảm giác “AI-generated UI”.

---

## 1. Mục tiêu sản phẩm

Ứng dụng là một nền tảng học từ vựng có tiến trình, bài học theo ngày, flashcard, trạng thái hoàn thành và bảng xếp hạng giữa các user.

Cảm giác sản phẩm cần đạt:

- rõ ràng như một learning app chuyên nghiệp
- nhẹ, sạch, tập trung vào việc học
- có động lực và phản hồi tích cực sau khi hoàn thành
- không trẻ con quá mức
- không giống dashboard admin khô cứng
- không dùng hiệu ứng màu mè gây mất tập trung

Ba giá trị chính của giao diện:

1. **Clarity** — người dùng luôn hiểu mình đang ở đâu và cần làm gì tiếp theo.
2. **Motivation** — tiến trình, điểm số, hoàn thành ngày học phải được phản hồi trực quan.
3. **Consistency** — màu sắc, khoảng cách, bo góc, component và trạng thái phải đồng bộ toàn app.

---

## 2. Design direction

Phong cách chính:

- Modern learning SaaS
- Clean card-based interface
- Friendly but professional
- Soft contrast, clear hierarchy
- Subtle motion, không phô trương

Không theo hướng:

- dashboard tài chính nặng số liệu
- game UI quá màu mè
- gradient tím/xanh generic kiểu AI
- glassmorphism quá đà
- neumorphism
- brutalist UI
- template landing page rập khuôn

Taste Skill có thể dùng để nâng cấp gu thiết kế, nhưng phải áp dụng theo ngữ cảnh app học từ vựng. Không ép các pattern landing page vào màn hình học tập nếu không phù hợp.

---

## 3. Layout principles

### 3.1 Page structure

Mỗi màn hình chính nên có cấu trúc rõ:

1. Page header
2. Mô tả ngắn hoặc trạng thái hiện tại
3. Hành động chính
4. Nội dung chính
5. Nội dung phụ hoặc metadata

Ví dụ thứ bậc:

- Tiêu đề: “Học từ vựng hôm nay”
- Mô tả: “Hoàn thành 20 từ để đánh dấu ngày học”
- CTA chính: “Bắt đầu học” hoặc “Tiếp tục”
- Nội dung: flashcard/progress/list
- Phụ: streak, leaderboard, lịch sử

### 3.2 Spacing

Dùng spacing nhất quán. Nếu dùng Tailwind, ưu tiên:

- spacing nhỏ: `gap-2`, `p-2`, `py-2`
- spacing chuẩn: `gap-4`, `p-4`, `p-5`, `p-6`
- spacing lớn: `gap-6`, `gap-8`, `py-8`, `py-10`

Không dùng khoảng cách ngẫu nhiên như `mt-[13px]`, `p-[17px]` nếu không thật sự cần.

### 3.3 Container

Gợi ý container:

- nội dung học chính: `max-w-3xl` hoặc `max-w-4xl`
- dashboard/tổng quan: `max-w-6xl`
- form/auth: `max-w-md`
- leaderboard: `max-w-4xl`

Trên mobile, ưu tiên padding ngang `px-4`. Trên desktop có thể dùng `px-6` hoặc `px-8`.

### 3.4 Grid

Không dùng “3 card bằng nhau” nếu mỗi card không có giá trị rõ ràng.

Chỉ dùng grid khi nội dung thật sự cần so sánh hoặc scan nhanh:

- thống kê học tập
- nhóm bài học
- top leaderboard
- danh sách từ vựng

Grid phải collapse tốt trên mobile.

---

## 4. Color system

Màu phải phục vụ trạng thái học tập, không chỉ để trang trí.

### 4.1 Semantic colors

- Primary: xanh emerald/green — hành động học tập, hoàn thành, tiến bộ
- Secondary: slate/neutral — text, border, background
- Accent: blue/indigo nhẹ — link, highlight phụ, thông tin
- Success: green/emerald — đúng, hoàn thành, dấu tích
- Warning: amber/orange — nhắc nhở, chưa hoàn tất, cần chú ý
- Danger: red/rose — sai, lỗi, xoá, nguy hiểm

### 4.2 Gợi ý Tailwind token

Primary:

- `emerald-600` cho CTA chính
- `emerald-50` cho background nhẹ
- `emerald-100` cho badge nhẹ
- `emerald-700` cho hover/active

Neutral:

- `slate-950` cho text chính
- `slate-700` cho text phụ quan trọng
- `slate-500` cho helper text
- `slate-200` cho border
- `slate-50` hoặc `white` cho background

Error:

- `rose-600` hoặc `red-600`
- background lỗi nhẹ: `rose-50`

Warning:

- `amber-500`, `amber-600`
- background nhẹ: `amber-50`

### 4.3 Color rules

Không dùng quá 1 màu primary chính trong một flow.

Không dùng màu chỉ để trang trí nếu không truyền tải ý nghĩa.

Không truyền tải trạng thái chỉ bằng màu. Phải có icon/text đi kèm, ví dụ:

- “Đã hoàn thành” + icon check
- “Chưa học” + label
- “Lỗi tải dữ liệu” + message

---

## 5. Typography

### 5.1 Tone

Chữ trong app phải ngắn gọn, rõ, khuyến khích học tiếp.

Tránh:

- câu quá dài
- thuật ngữ kỹ thuật không cần thiết
- thông báo lỗi chung chung như “Something went wrong”

### 5.2 Font size gợi ý

- Page title: `text-2xl` đến `text-3xl`, `font-bold`
- Section title: `text-lg` đến `text-xl`, `font-semibold`
- Body: `text-sm` hoặc `text-base`
- Helper text: `text-sm`, màu `slate-500` hoặc `slate-600`
- Badge/meta: `text-xs` hoặc `text-sm`, `font-medium`

### 5.3 Hierarchy

Mỗi màn hình chỉ nên có một heading chính nổi bật.

Không để tất cả text cùng size/weight.

Text phụ phải phụ thật: nhỏ hơn, nhạt hơn, không tranh với tiêu đề.

---

## 6. Component standards

### 6.1 Button

Button phải có đủ trạng thái:

- default
- hover
- active nếu có
- focus-visible
- disabled
- loading nếu action async

CTA chính:

- màu emerald
- text rõ hành động
- không dùng text mơ hồ như “OK” nếu có thể viết “Bắt đầu học”, “Lưu tiến trình”, “Xem bảng xếp hạng”

Button phụ:

- neutral/outline/ghost
- không tranh màu với CTA chính

Không để nhiều CTA chính cùng lúc trên một màn hình.

### 6.2 Card

Card dùng để gom thông tin có liên quan.

Gợi ý style:

- background trắng hoặc rất nhẹ
- border `slate-200`
- radius đồng bộ, ưu tiên `rounded-2xl`
- shadow nhẹ, không quá đậm
- padding `p-4`, `p-5` hoặc `p-6`

Card phải có hierarchy bên trong:

- title
- description/meta
- content
- action nếu cần

### 6.3 Badge

Badge dùng cho trạng thái:

- Đã hoàn thành
- Đang học
- Chưa học
- Top 1/2/3
- Admin nếu cần hiển thị ở khu vực quản trị, nhưng admin không được xuất hiện ở leaderboard user nếu logic yêu cầu loại admin

Badge phải nhỏ, rõ, không làm rối layout.

### 6.4 Form

Form phải có:

- label rõ
- placeholder nếu cần
- validation message
- disabled/loading khi submit
- error message dễ hiểu

Không chỉ đổi border đỏ mà không có text lỗi.

### 6.5 Toast/feedback

Sau action thành công nên có feedback nhẹ:

- lưu thành công
- hoàn thành bài học
- cập nhật điểm
- tải lại leaderboard

Toast không thay thế trạng thái chính trên UI. Ví dụ: học xong ngày vẫn phải có dấu tích hoặc trạng thái completed trên màn hình.

---

## 7. Learning flow UI

### 7.1 Progress

Progress phải rõ:

- đã học bao nhiêu từ
- còn bao nhiêu từ
- phần trăm nếu phù hợp
- trạng thái ngày học

Gợi ý:

- progress bar đơn giản
- label “12/20 từ”
- badge “Đang học” hoặc “Đã hoàn thành”

### 7.2 Completed day

Khi user hoàn thành ngày học, UI phải hiển thị rõ:

- icon check màu xanh
- badge “Đã hoàn thành”
- ngày học có visual state khác ngày chưa học
- có thể thêm microcopy: “Tốt lắm, bạn đã hoàn thành hôm nay.”

Không được chỉ lưu database mà không hiển thị tick/completed state.

### 7.3 Flashcard

Flashcard cần tập trung vào từ vựng:

- từ chính lớn, dễ đọc
- nghĩa/phiên âm/ví dụ có hierarchy rõ
- action đúng/sai/tiếp theo dễ bấm
- mobile phải dễ thao tác bằng một tay

Không nhồi quá nhiều thông tin trong một card.

### 7.4 Quiz/result

Kết quả đúng/sai phải rõ ràng:

- đúng: green + check + giải thích ngắn nếu có
- sai: red/rose + đáp án đúng + giải thích ngắn
- sau khi hoàn thành: summary rõ điểm, số câu đúng, CTA tiếp theo

---

## 8. Leaderboard UI

Leaderboard là tính năng tạo động lực, không phải bảng dữ liệu khô cứng.

Yêu cầu:

- admin không xuất hiện nếu đây là bảng xếp hạng user
- top 1/2/3 phải nổi bật hơn phần còn lại
- user hiện tại nên được highlight nhẹ nếu có thể xác định
- rank, tên user, điểm/progress phải dễ scan
- loading/empty/error rõ ràng
- mobile không bị vỡ cột

Gợi ý layout:

- top 3 dùng card hoặc row nổi bật
- phần còn lại dùng list/table responsive
- điểm số đặt bên phải để dễ so sánh
- rank đặt bên trái, icon nhỏ vừa đủ

Không dùng quá nhiều hiệu ứng huy chương/lấp lánh làm mất sự chuyên nghiệp.

---

## 9. Navigation

Navigation phải giúp user biết:

- đang ở màn hình nào
- có thể đi đâu tiếp
- task chính hôm nay là gì

Active nav state phải rõ.

Không giấu action quan trọng trong menu nếu user cần dùng thường xuyên.

Mobile navigation phải dễ bấm, không quá nhỏ.

---

## 10. Empty, loading, error states

### 10.1 Loading

Loading phải nói rõ đang tải gì:

- “Đang tải từ vựng…”
- “Đang tải bảng xếp hạng…”
- “Đang lưu tiến trình…”

Không dùng spinner trống nếu có thể dùng skeleton hoặc text.

### 10.2 Empty

Empty state phải có hướng dẫn tiếp theo:

- “Chưa có dữ liệu bảng xếp hạng. Hãy hoàn thành bài học đầu tiên để xuất hiện tại đây.”
- “Bạn chưa có từ vựng nào trong ngày này.”

### 10.3 Error

Error phải có:

- thông báo dễ hiểu
- action thử lại nếu phù hợp
- không expose lỗi kỹ thuật dài cho user thường

Ví dụ:

- “Không tải được bảng xếp hạng. Vui lòng thử lại.”
- Button: “Tải lại”

---

## 11. Responsive rules

Mobile first.

Tối thiểu kiểm tra:

- 360px mobile
- 768px tablet nếu layout nhiều cột
- 1024px+ desktop

Trên mobile:

- không dùng table rộng nếu không có responsive treatment
- button phải đủ cao để bấm
- card/list không bị tràn ngang
- text dài phải wrap hợp lý

Trên desktop:

- không kéo nội dung quá rộng
- không để màn hình trống quá nhiều nếu nội dung ít

---

## 12. Accessibility

Yêu cầu tối thiểu:

- text đủ tương phản
- button/link có focus-visible
- icon quan trọng phải có label hoặc text đi kèm
- form input có label
- không dùng màu là tín hiệu duy nhất
- vùng bấm đủ lớn

Nếu có animation, không quá mạnh và không gây khó chịu.

---

## 13. Motion

Motion nên nhẹ và có mục đích:

- hover card nhẹ
- button transition nhanh
- completed state có animation rất nhẹ nếu phù hợp
- leaderboard rank highlight có thể fade/slide nhẹ

Không dùng:

- animation liên tục gây phân tâm
- bounce quá nhiều
- parallax không cần thiết
- delay làm chậm thao tác học

Gợi ý duration:

- hover/focus: 150–200ms
- modal/section transition: 200–300ms
- success feedback: 300–500ms

---

## 14. Icon rules

Icon phải hỗ trợ ý nghĩa, không chỉ trang trí.

Gợi ý:

- check: completed/success
- trophy/medal: leaderboard/top rank
- book/cards: vocabulary/lesson
- alert: warning/error
- refresh: retry

Không dùng quá nhiều icon trong một card.

Icon và text phải căn chỉnh đều.

---

## 15. Copywriting rules

Tone tiếng Việt:

- thân thiện
- rõ ràng
- ngắn
- khuyến khích học tiếp

Ví dụ tốt:

- “Tiếp tục học”
- “Đã hoàn thành hôm nay”
- “Bạn còn 5 từ để hoàn thành ngày học”
- “Không tải được dữ liệu. Thử lại nhé.”

Tránh:

- “Submit”
- “Error occurred”
- “Data saved successfully” nếu app đang dùng tiếng Việt
- câu quá máy móc

---

## 16. Taste Skill usage trong project này

Taste Skill dùng để nâng cấp thẩm mỹ, nhưng không được ghi đè logic app.

Khi dùng Taste Skill cho project này, chọn hướng:

- `design-taste-frontend` cho tiêu chuẩn UI chung
- `redesign-existing-projects` nếu đang nâng cấp UI hiện có
- tránh style quá phá cách nếu làm màn hình học chính

Thiết lập tinh thần:

- layout variance: trung bình, không template nhưng vẫn dễ dùng
- motion intensity: thấp đến trung bình
- visual density: trung bình, đủ thông tin nhưng không rối

Không áp dụng blindly các pattern landing page vào app học tập.

---

## 17. Pre-flight checklist cho task UI

Trước khi sửa UI, AI phải tự kiểm tra:

- Màn hình này phục vụ hành động chính nào?
- User cần biết thông tin gì đầu tiên?
- State hiện tại là gì: loading, empty, success, error, completed?
- Component nào đang có thể reuse?
- Có ảnh hưởng logic Supabase/progress/leaderboard không?
- Mobile có ổn không?
- Có rule nào trong DESIGN.md đang bị vi phạm không?

Sau khi sửa UI, AI phải kiểm tra:

- có hierarchy rõ chưa
- màu có nhất quán không
- spacing có đều không
- trạng thái completed/success/error có hiển thị rõ không
- user có biết cần làm gì tiếp theo không
- có cập nhật `UPDATE_LOG.md` không

---

## 18. Anti-patterns cần tránh

Không tạo UI kiểu:

- đẹp ảnh chụp nhưng khó dùng thật
- quá nhiều gradient
- quá nhiều shadow
- border/radius mỗi component một kiểu
- title to nhưng nội dung không có hierarchy
- mọi thứ đều nằm trong card giống nhau
- dashboard giả nhiều số liệu nhưng không giúp học tốt hơn
- loading spinner không có context
- error chỉ console log, không hiển thị cho user
- completed state chỉ lưu DB, không update UI

---

## 19. Khi nào được thay đổi DESIGN.md

Chỉ cập nhật `DESIGN.md` khi:

- thêm component convention mới
- đổi màu chủ đạo
- đổi spacing/radius/shadow pattern
- thêm rule UI quan trọng
- phát hiện bug UX lặp lại cần ghi thành quy chuẩn

Không sửa `DESIGN.md` cho những thay đổi nhỏ không mang tính quy chuẩn.

---

## 20. Tóm tắt cho AI agent

Khi làm UI cho project này:

1. Đọc `RULES.md`.
2. Đọc `DESIGN.md`.
3. Đọc Taste Skill nếu đã cài.
4. Audit màn hình trước khi sửa.
5. Sửa ít file nhất có thể.
6. Không phá logic cũ.
7. Luôn có loading/empty/error/success/completed state.
8. Mobile phải ổn.
9. Cập nhật `.md` liên quan sau khi làm xong.
