# RULES.md

## 1. Trước khi làm

Trước khi sửa code, phải đọc 3 file này nếu có:

* `RULES.md`
* `UPDATE_LOG.md`
* `BUGS_AND_FIXES.md`

Chỉ đọc file liên quan trực tiếp đến yêu cầu hiện tại.

Không quét toàn bộ project nếu không cần.

---

## 2. Không đọc file tốn quota

Mặc định không đọc:

* `node_modules/`
* `dist/`
* `build/`
* `.vite/`
* `.git/`
* `coverage/`

Mặc định không đọc:

* `package-lock.json`
* `yarn.lock`
* `pnpm-lock.yaml`
* `*.min.js`
* `*.bundle.js`
* `*.map`

Chỉ đọc `package.json` khi cần biết thư viện đang dùng.

Chỉ đọc lock file khi lỗi liên quan dependency, install, package version hoặc build.

---

## 3. Nguyên tắc sửa code

Chỉ sửa đúng yêu cầu.

Không được:

* sửa lan man
* refactor toàn project
* đổi kiến trúc
* đổi framework
* thêm backend nếu chưa được yêu cầu
* thêm database nếu chưa được yêu cầu
* thêm thư viện nặng nếu có cách đơn giản hơn
* xóa chức năng đang chạy ổn
* tạo file trùng chức năng

Ưu tiên:

* sửa nhỏ
* rõ nguyên nhân
* ít file nhất có thể
* dễ hiểu
* dễ bảo trì

---

## 4. Khi gặp lỗi

Phải xác định nguyên nhân trước khi sửa.

Không đoán mò.

Không sửa nhiều file cùng lúc nếu chưa biết lỗi nằm ở đâu.

Nếu lỗi đã từng có trong `BUGS_AND_FIXES.md`, phải đọc cách fix cũ trước.

Không được lặp lại lỗi đã ghi nhận.

---

## 5. Sau khi làm xong

Bắt buộc cập nhật `UPDATE_LOG.md`.

Nếu có lỗi mới hoặc lỗi đã sửa, bắt buộc cập nhật `BUGS_AND_FIXES.md`.

Báo cáo ngắn gọn:

* đã sửa gì
* sửa file nào
* cách kiểm tra

---

## 6. Nguyên tắc cuối

Làm đúng yêu cầu.

Không làm quá.

Không đọc lan man.

Không phá chức năng cũ.

Không tự ý mở rộng ngoài phạm vi.

Luôn tiết kiệm quota.
