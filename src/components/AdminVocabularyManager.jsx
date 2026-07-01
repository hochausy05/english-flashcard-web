import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, Filter, Plus, Edit2, Trash2, Eye, EyeOff, Upload, 
  CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, X, FileSpreadsheet, 
  HelpCircle, MoreVertical, Play, Volume2
} from "lucide-react";
import Papa from "papaparse";
import { 
  fetchAdminVocabList, fetchCoursesAndLessons, 
  createVocabItem, updateVocabItem, deleteVocabItem, importCSVVocab 
} from "../utils/adminVocabService";
import { speakWord } from "../utils/speech";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminVocabularyManager({ onBackHome, isAdmin: propIsAdmin }) {
  const { isAdmin: authIsAdmin } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;

  // Vocabulary List State
  const [vocabList, setVocabList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedPos, setSelectedPos] = useState("");

  // Modal / Form States
  const [formMode, setFormMode] = useState("closed"); // "closed" | "add" | "edit" | "import"
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    word: "",
    answer: "",
    ipa: "",
    pos: "",
    example: "",
    audio: "",
    courseCode: "foundation",
    day: "1",
    is_active: true
  });
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null); // { type: "success" | "error", message: "..." }

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // CSV Import States
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState(null); // { validRows: [], errorRows: [], allRows: [] }
  const [importStatus, setImportStatus] = useState({ type: "", text: "" }); // type: "success" | "error" | "info"
  const fileInputRef = useRef(null);

  // Fetch initial data
  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const vocab = await fetchAdminVocabList();
      const meta = await fetchCoursesAndLessons();
      setVocabList(vocab);
      setCourses(meta.courses);
      // Group lessons or sort
      setLessons(meta.lessons);
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError(err.message || "Không thể tải dữ liệu quản trị từ Supabase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Filter lists based on courseCode
  const filteredLessonsByCourse = useMemo(() => {
    if (!formData.courseCode) return [];
    const course = courses.find(c => c.code === formData.courseCode);
    if (!course) return [];
    return lessons
      .filter(l => l.course_id === course.id)
      .sort((a, b) => Number(a.day) - Number(b.day));
  }, [formData.courseCode, courses, lessons]);

  // General Filtered Vocab List
  const filteredVocab = useMemo(() => {
    return vocabList.filter(item => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.word?.toLowerCase().includes(q) ||
        item.answer?.toLowerCase().includes(q) ||
        item.example?.toLowerCase().includes(q);

      // 2. Course Filter
      const matchCourse = !selectedCourse || item.courses?.code === selectedCourse;

      // 3. Lesson Day Filter
      const matchLesson = !selectedLesson || String(item.lessons?.day) === selectedLesson;

      // 4. Pos Filter
      const matchPos = !selectedPos || item.pos?.toLowerCase() === selectedPos.toLowerCase();

      return matchSearch && matchCourse && matchLesson && matchPos;
    });
  }, [vocabList, searchQuery, selectedCourse, selectedLesson, selectedPos]);

  // Unique lists for filters
  const filterDaysList = useMemo(() => {
    if (!selectedCourse) {
      // All unique days across lessons
      return [...new Set(lessons.map(l => String(l.day)))].sort((a, b) => Number(a) - Number(b));
    }
    const course = courses.find(c => c.code === selectedCourse);
    if (!course) return [];
    return lessons
      .filter(l => l.course_id === course.id)
      .map(l => String(l.day))
      .sort((a, b) => Number(a) - Number(b));
  }, [selectedCourse, courses, lessons]);

  const uniquePosList = useMemo(() => {
    return [...new Set(vocabList.map(item => item.pos).filter(Boolean))];
  }, [vocabList]);

  // Form Operations
  const handleOpenAdd = () => {
    setFormData({
      word: "",
      answer: "",
      ipa: "",
      pos: "n",
      example: "",
      audio: "",
      courseCode: courses[0]?.code || "foundation",
      day: "1",
      is_active: true
    });
    setFormError("");
    setFormMode("add");
  };

  const handleOpenEdit = (item) => {
    setCurrentId(item.id);
    setFormData({
      word: item.word || "",
      answer: item.answer || "",
      ipa: item.ipa || "",
      pos: item.pos || "n",
      example: item.example || "",
      audio: item.audio || "",
      courseCode: item.courses?.code || "foundation",
      day: String(item.lessons?.day || "1"),
      is_active: item.is_active !== false
    });
    setFormError("");
    setFormMode("edit");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.word.trim()) {
      setFormError("Từ vựng (English word) không được bỏ trống.");
      return;
    }
    if (!formData.answer.trim()) {
      setFormError("Nghĩa (Translation) không được bỏ trống.");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (formMode === "add") {
        res = await createVocabItem(formData);
      } else {
        res = await updateVocabItem(currentId, formData);
      }

      if (res.success) {
        showToast("success", formMode === "add" ? `Đã thêm từ "${formData.word}" thành công!` : `Đã lưu thay đổi từ "${formData.word}" thành công!`);
        setFormMode("closed");
        loadData();
      } else {
        setFormError(res.error?.message || "Đã xảy ra lỗi khi lưu từ vựng.");
      }
    } catch (err) {
      setFormError(err.message || "Lỗi lưu dữ liệu.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle active status (Soft delete / Restore)
  const handleToggleActive = async (item) => {
    setActionLoading(true);
    try {
      const nextActive = !item.is_active;
      const res = await updateVocabItem(item.id, {
        courseCode: item.courses?.code,
        day: String(item.lessons?.day),
        word: item.word,
        pos: item.pos,
        answer: item.answer,
        ipa: item.ipa,
        example: item.example,
        audio: item.audio,
        is_active: nextActive
      });

      if (res.success) {
        showToast("success", `Đã ${nextActive ? "mở" : "ẩn"} từ vựng "${item.word}" thành công!`);
        loadData();
      } else {
        showToast("error", res.error?.message || "Không thể cập nhật trạng thái từ.");
      }
    } catch (err) {
      showToast("error", "Lỗi: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete vocab (Hard or soft delete depending on data presence)
  const handleDeleteItem = async (item) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn từ "${item.word}"? Nếu từ này đã có kết quả học tập liên quan, hệ thống sẽ tự động chuyển sang Ẩn (Soft Delete).`)) {
      setActionLoading(true);
      try {
        const res = await deleteVocabItem(item.id, false); // Try hard delete
        if (res.success) {
          showToast("success", res.mode === "hard" ? `Đã xóa vĩnh viễn từ "${item.word}" thành công!` : `Đã chuyển từ "${item.word}" sang trạng thái Ẩn vì có dữ liệu học tập liên quan.`);
          loadData();
        } else {
          // If hard delete fails, ask to soft delete
          if (confirm(`${res.error?.message || "Không thể xóa cứng."} Bạn có muốn chuyển sang trạng thái Ẩn (Soft Delete) từ này không?`)) {
            const softRes = await deleteVocabItem(item.id, true);
            if (softRes.success) {
              showToast("success", `Đã chuyển từ "${item.word}" sang trạng thái Ẩn thành công!`);
              loadData();
            } else {
              showToast("error", "Lỗi soft delete: " + softRes.error?.message);
            }
          }
        }
      } catch (err) {
        showToast("error", "Lỗi: " + err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // --- CSV Import Features ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
      setImportStatus({ type: "info", text: `Đã chọn tệp: ${file.name}` });
    };
    reader.readAsText(file, "UTF-8");
  };

  const handlePreviewCSV = () => {
    setImportStatus({ type: "", text: "" });
    if (!csvText.trim()) {
      setImportStatus({ type: "error", text: "Vui lòng nhập nội dung CSV hoặc chọn file tải lên." });
      return;
    }

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const validRows = [];
        const errorRows = [];

        result.data.forEach((row, index) => {
          const word = String(row.word || "").trim();
          const answer = String(row.answer || "").trim();
          const course = String(row.course || "").trim();
          const day = String(row.day || "").trim();

          const errorReasons = [];
          if (!word) errorReasons.push("Thiếu 'word'");
          if (!answer) errorReasons.push("Thiếu 'answer'");
          if (!course) errorReasons.push("Thiếu 'course'");
          if (!day) errorReasons.push("Thiếu 'day'");

          if (errorReasons.length > 0) {
            errorRows.push({
              index: index + 1,
              row,
              reason: errorReasons.join(", ")
            });
          } else {
            validRows.push({
              id: row.id,
              course: course.toLowerCase(),
              day: day,
              word: word,
              pos: String(row.pos || "").trim(),
              answer: answer,
              ipa: String(row.ipa || "").trim(),
              example: String(row.example || "").trim(),
              audio: String(row.audio || "").trim()
            });
          }
        });

        setCsvPreview({
          validRows,
          errorRows,
          allRows: result.data
        });
      },
      error: (err) => {
        setImportStatus({ type: "error", text: "Lỗi phân tích cú pháp CSV: " + err.message });
      }
    });
  };

  const handleConfirmImport = async () => {
    if (!csvPreview || csvPreview.validRows.length === 0) return;

    setActionLoading(true);
    setImportStatus({ type: "info", text: "Đang import dữ liệu lên Supabase..." });
    try {
      const res = await importCSVVocab(csvPreview.validRows, csvText);
      if (res.success) {
        setImportStatus({
          type: "success",
          text: `Nhập CSV thành công! Đã thêm/cập nhật ${res.importedCount} từ. Bị lỗi ${res.failedCount} từ.`
        });
        if (res.errors && res.errors.length > 0) {
          console.warn("Import warning errors:", res.errors);
        }
        setCsvPreview(null);
        setCsvText("");
        loadData();
      } else {
        setImportStatus({ type: "error", text: res.error?.message || "Lỗi khi import." });
      }
    } catch (err) {
      setImportStatus({ type: "error", text: err.message || "Lỗi bất ngờ." });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-vocab-container card error" style={{ padding: "32px", textAlign: "center", margin: "40px auto", maxWidth: "500px" }}>
        <AlertTriangle size={48} style={{ color: "#d92d20", marginBottom: "16px", display: "inline-block" }} />
        <h3>Bạn không có quyền truy cập</h3>
        <p style={{ margin: "8px 0 24px", color: "#667085" }}>Trang này chỉ dành cho quản trị viên.</p>
        <button className="primary-button" onClick={onBackHome}>
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="admin-vocab-container">
      {/* 1. Header */}
      <header className="admin-header">
        <div className="header-left">
          <button className="ghost-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Về trang chủ
          </button>
          <h2>Quản trị Từ vựng (Supabase)</h2>
        </div>
        <div className="header-actions">
          <button className="action-btn secondary" onClick={loadData} title="Tải lại dữ liệu">
            <RefreshCw size={16} /> Tải lại
          </button>
          <button className="action-btn secondary" onClick={() => setFormMode("import")}>
            <FileSpreadsheet size={16} /> Import CSV
          </button>
          <button className="action-btn primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Thêm từ mới
          </button>
        </div>
      </header>

      {/* Loading state */}
      {loading ? (
        <div className="admin-loading card">
          <div className="progress-loading-spinner" style={{ margin: "0 auto 16px" }}></div>
          <p>Đang tải danh sách từ vựng từ database...</p>
        </div>
      ) : error ? (
        <div className="admin-error card error">
          <AlertTriangle size={32} />
          <p>{error}</p>
          <button className="primary-button" onClick={loadData} style={{ marginTop: "16px" }}>
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* 2. Filters section */}
          <section className="admin-filters-card card">
            <div className="filters-grid">
              <div className="filter-input-group search">
                <label>Tìm kiếm</label>
                <div className="input-wrapper">
                  <Search size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo từ, nghĩa, ví dụ..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-input-group">
                <label>Khóa học</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedLesson(""); // Reset lesson
                  }}
                >
                  <option value="">Tất cả khóa học</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-input-group">
                <label>Buổi học / Day</label>
                <select 
                  value={selectedLesson} 
                  onChange={(e) => setSelectedLesson(e.target.value)}
                >
                  <option value="">Tất cả buổi</option>
                  {filterDaysList.map(d => (
                    <option key={d} value={d}>Buổi {d}</option>
                  ))}
                </select>
              </div>

              <div className="filter-input-group">
                <label>Loại từ / POS</label>
                <select 
                  value={selectedPos} 
                  onChange={(e) => setSelectedPos(e.target.value)}
                >
                  <option value="">Tất cả loại từ</option>
                  {uniquePosList.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filters-footer">
              <span>Đang hiển thị <strong>{filteredVocab.length}</strong> / {vocabList.length} từ</span>
              {(searchQuery || selectedCourse || selectedLesson || selectedPos) && (
                <button className="clear-filters-btn" onClick={() => {
                  setSearchQuery("");
                  setSelectedCourse("");
                  setSelectedLesson("");
                  setSelectedPos("");
                }}>
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </section>

          {/* 3. Table / Data List */}
          <section className="vocab-list-table-card card">
            {filteredVocab.length === 0 ? (
              <div className="empty-state">
                <HelpCircle size={48} />
                <h3>Không tìm thấy từ vựng nào</h3>
                <p>Không có kết quả nào khớp với bộ lọc tìm kiếm hiện tại.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-vocab-table">
                    <thead>
                      <tr>
                        <th>Từ vựng</th>
                        <th>Phiên âm (IPA)</th>
                        <th>Loại từ</th>
                        <th>Nghĩa dịch</th>
                        <th>Ví dụ</th>
                        <th>Khóa học</th>
                        <th>Buổi</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVocab.map((item) => (
                        <tr key={item.id} className={!item.is_active ? "inactive-row" : ""}>
                          <td className="word-cell">
                            <div className="word-text-wrapper">
                              <strong>{item.word}</strong>
                              <button 
                                className="speaker-mini-btn" 
                                onClick={() => speakWord(item.word, item.audio)}
                                title="Nghe phát âm"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                          </td>
                          <td><code className="ipa-code">{item.ipa || "—"}</code></td>
                          <td><span className="badge-pos">{item.pos || "—"}</span></td>
                          <td>{item.answer}</td>
                          <td className="example-cell" title={item.example}>{item.example || "—"}</td>
                          <td><span className="badge-course">{item.courses?.name || "—"}</span></td>
                          <td>Buổi {item.lessons?.day || "—"}</td>
                          <td>
                            <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                              {item.is_active ? "Đang mở" : "Đang ẩn"}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <div className="actions-group">
                              <button 
                                className="admin-action-btn edit" 
                                onClick={() => handleOpenEdit(item)}
                                title="Sửa từ vựng"
                                disabled={actionLoading}
                              >
                                <Edit2 size={14} />
                                <span>Sửa</span>
                              </button>
                              <button 
                                className={`admin-action-btn ${item.is_active ? "hide" : "show"}`} 
                                onClick={() => handleToggleActive(item)}
                                title={item.is_active ? "Ẩn từ vựng" : "Mở từ vựng"}
                                disabled={actionLoading}
                              >
                                {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                                <span>{item.is_active ? "Ẩn" : "Mở"}</span>
                              </button>
                              <button 
                                className="admin-action-btn delete" 
                                onClick={() => handleDeleteItem(item)}
                                title="Xóa vĩnh viễn"
                                disabled={actionLoading}
                              >
                                <Trash2 size={14} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-mobile-cards-list">
                  {filteredVocab.map((item) => (
                    <div key={item.id} className={`admin-vocab-mobile-card ${!item.is_active ? "inactive-row" : ""}`}>
                      <div className="card-header-row">
                        <div className="word-title-group">
                          <strong className="card-word-title">{item.word}</strong>
                          <button 
                            className="speaker-mini-btn" 
                            onClick={() => speakWord(item.word, item.audio)}
                            title="Nghe phát âm"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                        <span className="badge-pos">{item.pos || "—"}</span>
                      </div>
                      
                      {item.ipa && (
                        <div className="card-ipa-row">
                          <code className="ipa-code">{item.ipa}</code>
                        </div>
                      )}
                      
                      <div className="card-meaning-row">
                        <span className="card-label">Nghĩa:</span>
                        <span className="card-val">{item.answer}</span>
                      </div>
                      
                      {item.example && (
                        <div className="card-example-row">
                          <span className="card-label">Ví dụ:</span>
                          <p className="card-example-text">{item.example}</p>
                        </div>
                      )}
                      
                      <div className="card-meta-row">
                        <span className="badge-course">{item.courses?.name || "—"}</span>
                        <span className="badge-day">Buổi {item.lessons?.day || "—"}</span>
                        <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                          {item.is_active ? "Đang mở" : "Đang ẩn"}
                        </span>
                      </div>
                      
                      <div className="card-actions-row">
                        <button 
                          className="admin-action-btn edit" 
                          onClick={() => handleOpenEdit(item)}
                          title="Sửa từ vựng"
                          disabled={actionLoading}
                        >
                          <Edit2 size={14} />
                          <span>Sửa</span>
                        </button>
                        <button 
                          className={`admin-action-btn ${item.is_active ? "hide" : "show"}`} 
                          onClick={() => handleToggleActive(item)}
                          title={item.is_active ? "Ẩn từ vựng" : "Mở từ vựng"}
                          disabled={actionLoading}
                        >
                          {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span>{item.is_active ? "Ẩn" : "Mở"}</span>
                        </button>
                        <button 
                          className="admin-action-btn delete" 
                          onClick={() => handleDeleteItem(item)}
                          title="Xóa vĩnh viễn"
                          disabled={actionLoading}
                        >
                          <Trash2 size={14} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* 4. MODAL: Add / Edit Form */}
      {(formMode === "add" || formMode === "edit") && (
        <div className="admin-modal-overlay">
          <div className="admin-modal card">
            <header className="modal-header">
              <h3>{formMode === "add" ? "Thêm từ vựng mới" : "Chỉnh sửa từ vựng"}</h3>
              <button className="close-btn" onClick={() => setFormMode("closed")}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="modal-form">
              {formError && (
                <div className="modal-error-box error">
                  <AlertTriangle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-row grid-2">
                <div className="form-group">
                  <label htmlFor="word">Từ tiếng Anh (word) <span className="req">*</span></label>
                  <input 
                    type="text" 
                    id="word"
                    value={formData.word}
                    onChange={(e) => setFormData({...formData, word: e.target.value})}
                    placeholder="E.g. Afford"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="answer">Nghĩa tiếng Việt (answer) <span className="req">*</span></label>
                  <input 
                    type="text" 
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    placeholder="E.g. Có đủ khả năng chi trả"
                    required
                  />
                </div>
              </div>

              <div className="form-row grid-3">
                <div className="form-group">
                  <label htmlFor="ipa">Phiên âm (ipa)</label>
                  <input 
                    type="text" 
                    id="ipa"
                    value={formData.ipa}
                    onChange={(e) => setFormData({...formData, ipa: e.target.value})}
                    placeholder="E.g. /əˈfɔːd/"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pos">Loại từ (pos)</label>
                  <select 
                    id="pos"
                    value={formData.pos}
                    onChange={(e) => setFormData({...formData, pos: e.target.value})}
                  >
                    <option value="n">Danh từ (n)</option>
                    <option value="v">Động từ (v)</option>
                    <option value="adj">Tính từ (adj)</option>
                    <option value="adv">Trạng từ (adv)</option>
                    <option value="phrase">Cụm từ (phrase)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="audio">Link âm thanh (audio URL)</label>
                  <input 
                    type="text" 
                    id="audio"
                    value={formData.audio}
                    onChange={(e) => setFormData({...formData, audio: e.target.value})}
                    placeholder="Url file MP3 (nếu có)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="example">Câu ví dụ (example)</label>
                <textarea 
                  id="example"
                  value={formData.example}
                  onChange={(e) => setFormData({...formData, example: e.target.value})}
                  placeholder="Ví dụ tiếng Anh có chứa từ vựng..."
                  rows={2}
                />
              </div>

              <div className="form-row grid-2">
                <div className="form-group">
                  <label htmlFor="course">Khóa học</label>
                  <select 
                    id="course"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="day">Buổi học (Day / Lesson)</label>
                  <input 
                    type="number" 
                    id="day"
                    min="1"
                    max="100"
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span>Cho phép người học xem từ vựng này (Kích hoạt)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn secondary"
                  onClick={() => setFormMode("closed")}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="modal-btn primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? (formMode === "add" ? "Đang thêm..." : "Đang lưu...") : (formMode === "add" ? "Thêm từ mới" : "Lưu thay đổi")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: CSV Import Tool */}
      {formMode === "import" && (
        <div className="admin-modal-overlay">
          <div className="admin-modal large card">
            <header className="modal-header">
              <h3>Nhập từ vựng hàng loạt bằng file CSV</h3>
              <button className="close-btn" onClick={() => {
                setFormMode("closed");
                setCsvPreview(null);
                setImportStatus({ type: "", text: "" });
              }}>
                <X size={20} />
              </button>
            </header>

            <div className="modal-import-content">
              {importStatus.text && (
                <div className={`import-message-box ${importStatus.type}`}>
                  {importStatus.type === "success" && <CheckCircle2 size={18} />}
                  {importStatus.type === "error" && <AlertTriangle size={18} />}
                  <span>{importStatus.text}</span>
                </div>
              )}

              <p className="import-info-desc">
                Cột CSV bắt buộc: <code>course</code>, <code>day</code>, <code>word</code>, <code>answer</code>.<br />
                Cột tùy chọn: <code>id</code>, <code>ipa</code>, <code>pos</code>, <code>example</code>, <code>audio</code>.
              </p>

              <div className="import-editor-split">
                <div className="csv-textarea-box">
                  <label>Dán nội dung CSV vào đây</label>
                  <textarea 
                    placeholder="id,course,day,word,pos,answer,ipa,example,audio&#10;1,foundation,1,Draw,v,vẽ,/drɔː/,He draws a circle in the sand..."
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="csv-upload-box">
                  <div 
                    className="drag-drop-area"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={32} />
                    <p>Click hoặc Kéo thả file CSV vào đây</p>
                    <span className="sub-text">Chỉ chấp nhận file .csv (UTF-8)</span>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      style={{ display: "none" }} 
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className="csv-actions-bar">
                <button 
                  className="primary-button preview-btn" 
                  onClick={handlePreviewCSV}
                  disabled={actionLoading}
                >
                  Xem trước dữ liệu
                </button>
              </div>

              {/* Preview results */}
              {csvPreview && (
                <div className="csv-preview-results card">
                  <div className="preview-summary">
                    <span className="badge-result valid">Hợp lệ: <strong>{csvPreview.validRows.length}</strong> dòng</span>
                    <span className="badge-result error">Bị lỗi: <strong>{csvPreview.errorRows.length}</strong> dòng</span>
                  </div>

                  {csvPreview.errorRows.length > 0 && (
                    <div className="csv-errors-list">
                      <h4>Danh sách dòng bị lỗi</h4>
                      <ul>
                        {csvPreview.errorRows.map((err, idx) => (
                          <li key={idx} className="err-li">
                            Dòng {err.index}: {err.reason} (Dữ liệu thô: <code>{JSON.stringify(err.row)}</code>)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {csvPreview.validRows.length > 0 && (
                    <div className="csv-preview-table-wrapper">
                      <h4>Danh sách từ sẽ được Import / Upsert ({csvPreview.validRows.length} từ)</h4>
                      <div className="table-responsive">
                        <table className="csv-table">
                          <thead>
                            <tr>
                              <th>Khóa</th>
                              <th>Buổi</th>
                              <th>Từ vựng</th>
                              <th>Phiên âm</th>
                              <th>Loại</th>
                              <th>Nghĩa chuẩn</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.validRows.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td>{row.course}</td>
                                <td>Buổi {row.day}</td>
                                <td><strong>{row.word}</strong></td>
                                <td>{row.ipa}</td>
                                <td>{row.pos}</td>
                                <td>{row.answer}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {csvPreview.validRows.length > 10 && (
                          <p className="preview-more-label">...và {csvPreview.validRows.length - 10} dòng khác</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="preview-confirm-actions">
                    <button 
                      className="primary-button confirm-btn"
                      onClick={handleConfirmImport}
                      disabled={csvPreview.validRows.length === 0 || actionLoading}
                    >
                      {actionLoading ? "Đang import..." : "Xác nhận Import lên Supabase"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} style={{ color: "#12b76a" }} /> : <AlertTriangle size={18} style={{ color: "#f04438" }} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
