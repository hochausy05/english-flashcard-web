# RULES.md

> Bộ luật làm việc cho AI coding agent trong project. Mục tiêu: sửa đúng yêu cầu, không phá logic cũ, tiết kiệm quota, giữ UI nhất quán và luôn để lại tài liệu rõ ràng sau mỗi lần thay đổi.

---

## 0. Nguyên tắc bắt buộc

Trước khi làm bất kỳ task nào, AI phải đọc file này trước.

Nếu task liên quan đến giao diện, trải nghiệm người dùng, layout, responsive, component hoặc style, phải đọc thêm `DESIGN.md` trước khi sửa code.

Nếu project đã cài Taste Skill và có `SKILL.md`, `.agents/skills/.../SKILL.md` hoặc skill tương đương, phải đọc skill liên quan trước khi làm UI.

Luôn ưu tiên:

- sửa đúng vấn đề được yêu cầu
- thay đổi ít file nhất có thể
- giữ nguyên logic đang chạy ổn
- không refactor lan man
- không tạo thêm kiến trúc phức tạp nếu chưa cần
- không phá dữ liệu người dùng
- không làm mất trạng thái học tập, tiến trình, leaderboard hoặc quyền admin/user

---

## 1. File cần đọc trước khi sửa

Đọc theo thứ tự ưu tiên, chỉ đọc file liên quan trực tiếp đến yêu cầu:

1. `RULES.md`
2. `DESIGN.md` nếu task có UI/UX/style/responsive/component
3. `UPDATE_LOG.md` để biết thay đổi gần nhất
4. `BUGS_AND_FIXES.md` nếu task là sửa lỗi hoặc lỗi có thể từng xảy ra
5. `README.md` nếu task liên quan setup, chạy project, build, deploy
6. `package.json` nếu cần biết script, thư viện, framework hoặc version
7. File source liên quan trực tiếp đến màn hình/tính năng đang sửa

Không quét toàn bộ project nếu chưa có lý do rõ ràng.

---

## 2. Không đọc file tốn quota

Mặc định không đọc các thư mục sau:

- `node_modules/`
- `dist/`
- `build/`
- `.vite/`
- `.next/`
- `.nuxt/`
- `.git/`
- `coverage/`
- `.cache/`
- `.turbo/`
- `.vercel/`
- `.netlify/`

Mặc định không đọc các file sau:

- `package-lock.json`
- `yarn.lock`
- `pnpm-lock.yaml`
- `bun.lockb`
- `*.min.js`
- `*.bundle.js`
- `*.map`
- file ảnh/video/font nặng nếu không cần

Chỉ đọc lock file khi lỗi liên quan đến dependency, install, version, build hoặc package manager.

---

## 3. Nguyên tắc sửa code

Chỉ sửa đúng yêu cầu hiện tại.

Không được:

- sửa lan man ngoài phạm vi
- refactor toàn project nếu user không yêu cầu
- đổi framework
- đổi kiến trúc app
- đổi database schema khi chưa được yêu cầu rõ
- thêm backend/server/api mới nếu chưa cần
- thêm thư viện nặng nếu có thể xử lý bằng code hiện có
- xóa chức năng đang chạy ổn
- tạo file trùng chức năng với file đang có
- đổi tên route/component/database field nếu không có lý do bắt buộc
- hard-code dữ liệu giả thay cho dữ liệu thật đang dùng

Được phép chỉnh nhỏ để tăng độ ổn định nếu liên quan trực tiếp đến yêu cầu, nhưng phải giải thích rõ trong log.

---

## 4. Nguyên tắc logic và dữ liệu

Khi sửa tính năng có dữ liệu người dùng, phải bảo vệ các phần sau:

- đăng nhập/đăng xuất
- phân quyền admin/user
- tiến trình học tập
- trạng thái hoàn thành bài/ngày học
- điểm số/kết quả làm bài
- bảng xếp hạng
- dữ liệu từ vựng
- dữ liệu Supabase

Không được tự ý:

- xóa dữ liệu
- reset progress
- bỏ qua RLS/policy
- expose API key/private key
- ghi đè bảng production
- thay đổi rule admin exclusion nếu task không liên quan
- đổi cách tính điểm, streak, completed day hoặc leaderboard nếu chưa được yêu cầu

Nếu cần sửa truy vấn Supabase, phải kiểm tra:

- query có đúng bảng/cột không
- filter có đúng user hiện tại không
- admin có bị loại khỏi leaderboard nếu yêu cầu hiện tại cần loại admin không
- state UI có cập nhật sau khi mutation thành công không
- lỗi có được hiển thị rõ cho người dùng không

---

## 5. Nguyên tắc UI/UX

Mọi task UI phải đọc `DESIGN.md` trước.

Nếu có Taste Skill, dùng nó như tiêu chuẩn thẩm mỹ bổ sung, nhưng `DESIGN.md` là chuẩn thiết kế riêng của project.

Khi sửa UI, phải kiểm tra đủ các trạng thái:

- loading
- empty
- success
- error
- disabled
- completed
- locked nếu có
- mobile layout
- desktop layout

Không để trạng thái thành công chỉ nằm trong database mà không phản ánh trên giao diện. Ví dụ: nếu user học xong ngày/bài, UI phải có dấu tích, badge, toast, trạng thái completed hoặc feedback tương đương.

Không dùng UI generic kiểu AI nếu không phù hợp:

- 3 card bằng nhau vô nghĩa
- gradient tím/xanh mặc định không có lý do
- shadow quá mạnh
- border dày rối mắt
- icon trang trí không truyền tải thông tin
- màu sắc mỗi màn hình một kiểu
- spacing tùy tiện
- button không có hover/focus/disabled state

Ưu tiên:

- hierarchy rõ ràng
- typography dễ đọc
- spacing đều
- màu nhất quán
- component tái sử dụng
- responsive sạch
- feedback rõ sau hành động
- accessibility cơ bản

---

## 6. Khi gặp lỗi

Phải xác định nguyên nhân trước khi sửa.

Quy trình bắt buộc:

1. Đọc lỗi, log, ảnh chụp hoặc mô tả của user.
2. Xác định màn hình/tính năng liên quan.
3. Đọc file liên quan gần nhất, không quét lan man.
4. Kiểm tra lỗi đã từng có trong `BUGS_AND_FIXES.md` chưa.
5. Nêu nguyên nhân gốc trong phần báo cáo hoặc log.
6. Sửa nhỏ nhất có thể.
7. Kiểm tra lại bằng cách chạy test/build/lint hoặc mô tả bước kiểm tra thủ công.

Không được đoán mò rồi sửa nhiều file cùng lúc.

Nếu chưa đủ thông tin, vẫn phải cố gắng khoanh vùng nguyên nhân bằng code hiện có trước. Chỉ hỏi lại user khi thật sự bị thiếu thông tin không thể suy luận.

---

## 7. Khi thêm tính năng mới

Trước khi code, phải xác định:

- tính năng nằm ở màn hình nào
- dữ liệu lấy từ đâu
- user thường và admin khác nhau thế nào
- cần database/schema/policy mới không
- có ảnh hưởng đến tính năng cũ không
- UI cần những trạng thái nào

Không được thêm tính năng bằng dữ liệu giả nếu project đã có dữ liệu thật.

Không được tạo route/component mới nếu có thể mở rộng component hiện tại một cách sạch sẽ.

---

## 8. Khi làm việc với component

Ưu tiên reuse component/style hiện có.

Nếu phải tạo component mới:

- tên rõ nghĩa
- props đơn giản
- không phụ thuộc dữ liệu global nếu không cần
- có loading/empty/error nếu component hiển thị dữ liệu async
- không chứa logic database phức tạp nếu có thể tách ra hook/service

Không tạo component chỉ để dùng một lần nếu đoạn UI rất nhỏ và không có khả năng tái sử dụng.

---

## 9. Khi làm việc với CSS/Tailwind

Không viết class tùy tiện làm lệch design system.

Ưu tiên dùng token/style đã thống nhất trong `DESIGN.md`.

Không dùng quá nhiều màu trên một màn hình.

Không lạm dụng:

- `!important`
- inline style
- magic number
- z-index quá cao
- animation nặng
- backdrop blur nhiều lớp

Responsive phải kiểm tra tối thiểu:

- mobile nhỏ
- tablet nếu layout có nhiều cột
- desktop

---

## 10. Kiểm tra sau khi sửa

Sau khi sửa, phải chạy hoặc hướng dẫn chạy các bước phù hợp:

- `npm run lint` nếu project có lint
- `npm run build` nếu cần kiểm tra build
- `npm run test` nếu project có test
- kiểm tra thủ công màn hình liên quan

Nếu không chạy được do thiếu môi trường, phải nói rõ lý do và ghi lại cách kiểm tra thủ công.

---

## 11. Cập nhật tài liệu sau khi làm xong

Bắt buộc cập nhật `UPDATE_LOG.md` sau mọi thay đổi code.

Nếu sửa lỗi, bắt buộc cập nhật `BUGS_AND_FIXES.md` với:

- mô tả lỗi
- nguyên nhân
- file đã sửa
- cách kiểm tra
- ngày sửa

Nếu thay đổi UI rule, component convention, màu sắc, spacing hoặc pattern thiết kế, cập nhật `DESIGN.md`.

Nếu thay đổi cách setup/chạy/deploy, cập nhật `README.md` hoặc file hướng dẫn liên quan.

---

## 12. Báo cáo kết quả cho user

Sau khi hoàn tất, báo cáo ngắn gọn bằng tiếng Việt:

- đã sửa gì
- sửa file nào
- nguyên nhân nếu là bug
- cách kiểm tra
- có cập nhật `.md` nào không

Không viết báo cáo quá dài nếu task nhỏ.

Không nói chung chung kiểu “đã tối ưu” nếu không nêu rõ tối ưu gì.

---

## 13. Quy chuẩn viết prompt cho AI/dev agent

Mọi prompt giao việc cho AI/dev agent nên bắt đầu bằng:

```txt
Đọc RULES.md, DESIGN.md và các file .md liên quan trước khi làm.
```

Nếu task không liên quan UI, vẫn phải đọc `RULES.md`; `DESIGN.md` chỉ cần đọc khi có UI/UX/style/component.

Mọi prompt nên kết thúc bằng:

```txt
Sau khi làm xong, cập nhật UPDATE_LOG.md và các file .md cần thiết như BUGS_AND_FIXES.md, DESIGN.md hoặc README.md nếu có thay đổi liên quan.
```

---

## 14. Nguyên tắc cuối

Làm đúng yêu cầu.

Không làm quá.

Không đọc lan man.

Không phá chức năng cũ.

Không tự ý mở rộng ngoài phạm vi.

Không hy sinh logic để làm UI đẹp hơn.

Không hy sinh UX để code nhanh hơn.

Luôn tiết kiệm quota.
