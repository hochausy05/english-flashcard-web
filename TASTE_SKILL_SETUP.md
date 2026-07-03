# Hướng dẫn lấy và dùng Taste Skill

> Taste Skill là bộ skill/prompt giúp AI coding agent làm frontend bớt generic, có tiêu chuẩn hơn về layout, hierarchy, typography, spacing, motion và anti-slop UI.

---

## 1. Link chính thức

- GitHub: `https://github.com/Leonxlnx/taste-skill`
- Docs: `https://www.tasteskill.dev/docs`
- Prompt guide: `https://www.tasteskill.dev/guide`

---

## 2. Cài skill mặc định

Chạy trong thư mục gốc của project:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Lệnh này thêm skill `design-taste-frontend` vào project/agent. Theo docs hiện tại, install name này đang trỏ tới bản v2 experimental.

---

## 3. Cài full bundle

Nếu muốn lấy toàn bộ skill trong repo:

```bash
npx skills add Leonxlnx/taste-skill
```

Chỉ nên dùng full bundle khi đã quen cách agent đọc skill. Với project học từ vựng, cài riêng `design-taste-frontend` trước là hợp lý hơn.

---

## 4. Cài bản v1 legacy

Nếu muốn bản v1 ổn định cũ:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend-v1"
```

---

## 5. Skill nên dùng cho project học từ vựng

Khuyến nghị:

1. `design-taste-frontend` — tiêu chuẩn UI/UX chung.
2. `redesign-existing-projects` — dùng khi muốn audit và nâng cấp UI hiện có.

Không khuyến nghị dùng brutalist style cho app học từ vựng vì dễ lệch mục tiêu: app cần rõ, dễ học, thân thiện và có động lực.

---

## 6. Cách dùng với AI/dev agent

Sau khi cài, mỗi prompt UI nên bắt đầu như sau:

```txt
Đọc RULES.md, DESIGN.md và Taste Skill/SKILL.md trước khi làm.
```

Và kết thúc như sau:

```txt
Sau khi làm xong, cập nhật UPDATE_LOG.md và các file .md cần thiết như BUGS_AND_FIXES.md, DESIGN.md hoặc README.md nếu có thay đổi liên quan.
```

---

## 7. Prompt mẫu: audit UI hiện tại

```txt
Đọc RULES.md, DESIGN.md và Taste Skill/SKILL.md trước khi làm.

Hãy audit UI hiện tại của ứng dụng học từ vựng.

Yêu cầu:
- Không sửa code trước khi audit xong.
- Chỉ đọc các file liên quan đến UI hiện tại, không quét lan man.
- Xác định các vấn đề về hierarchy, spacing, typography, màu sắc, component consistency, responsive và state feedback.
- Ưu tiên các màn hình: học từ vựng, flashcard, progress/completed day, leaderboard, auth nếu có.
- Không thay đổi logic Supabase, auth, progress tracking hoặc leaderboard.
- Đề xuất kế hoạch sửa theo từng nhóm nhỏ.

Sau khi làm xong, cập nhật UPDATE_LOG.md và các file .md cần thiết như BUGS_AND_FIXES.md, DESIGN.md hoặc README.md nếu có thay đổi liên quan.
```

---

## 8. Prompt mẫu: nâng cấp leaderboard

```txt
Đọc RULES.md, DESIGN.md và Taste Skill/SKILL.md trước khi làm.

Nâng cấp UI bảng xếp hạng từ vựng giữa các user.

Yêu cầu:
- Giữ nguyên logic dữ liệu đang hoạt động.
- Admin không được xuất hiện trên leaderboard.
- Top 1/2/3 phải nổi bật hơn nhưng vẫn chuyên nghiệp.
- User hiện tại nên được highlight nhẹ nếu có thể xác định.
- Có đủ loading, empty, error và success state.
- Mobile responsive tốt, không vỡ layout.
- Không dùng gradient tím/xanh generic, không dùng decorative status dots vô nghĩa.
- Reuse component/style hiện có nếu có.
- Sửa ít file nhất có thể.

Sau khi làm xong, cập nhật UPDATE_LOG.md và các file .md cần thiết như BUGS_AND_FIXES.md, DESIGN.md hoặc README.md nếu có thay đổi liên quan.
```

---

## 9. Prompt mẫu: sửa completed day tick

```txt
Đọc RULES.md, DESIGN.md và Taste Skill/SKILL.md trước khi làm.

Sửa lỗi user làm đúng 100% và progress đã được lưu nhưng ngày học không hiện dấu tích xanh/completed state trên UI.

Yêu cầu:
- Xác định nguyên nhân trước khi sửa.
- Kiểm tra flow lưu progress/completed day từ Supabase về UI.
- Không thay đổi cách tính điểm nếu không cần.
- Không reset dữ liệu người dùng.
- Sau khi hoàn thành ngày học, UI phải hiển thị rõ: icon check xanh, badge/text “Đã hoàn thành” hoặc state tương đương.
- State phải cập nhật ngay sau khi mutation thành công, không bắt user refresh thủ công.
- Có loading/error state khi lưu tiến trình.
- Sửa ít file nhất có thể.

Sau khi làm xong, cập nhật UPDATE_LOG.md và BUGS_AND_FIXES.md.
```
