/* Local-first runtime. Presentation JSON is the source of truth; DOM is renderer only. */
var STORAGE_KEY = 'narrative-studio.presentation.v2';
var $ = function (selector) { return document.querySelector(selector); };
var $$ = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };
var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
var now = function () { return new Date().toISOString(); };
var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]; }); };

var DEMO_SLIDES = [
  { id: 'slide_01', intent: 'cover', layoutId: 'cover.v1', kicker: 'Q4 / CÂU CHUYỆN TĂNG TRƯỞNG', title: 'Retention là động cơ tăng trưởng tiếp theo.', titleEn: 'Retention is our next growth engine.', subtitle: 'Một câu chuyện tập trung để biến giá trị sản phẩm thành tăng trưởng bền vững.', subtitleEn: 'A focused story for turning product value into durable growth.', dark: true, speakerNotes: 'Mở đầu bằng quyết định cần được thống nhất: ưu tiên retention trong Q4.', sourceRefs: ['src_market_notes'] },
  { id: 'slide_02', intent: 'data_cards', layoutId: 'data.big_number.cards.v1', kicker: '01 / TÍN HIỆU', title: 'Tín hiệu mạnh nhất đã nằm trong sản phẩm.', titleEn: 'The strongest signal is already in the product.', subtitle: 'Các team duy trì sử dụng đang mở rộng nhanh hơn nhóm khách hàng mới.', subtitleEn: 'Retained teams are expanding faster than new logo acquisition.', dark: false, speakerNotes: 'Nêu rõ các số liệu cần kiểm chứng trước khi thuyết trình.', sourceRefs: ['src_product_metrics'] },
  { id: 'slide_03', intent: 'insight', layoutId: 'quote.insight.v1', kicker: '02 / ĐIỂM CĂNG', title: 'Tăng trưởng không phải là bài toán số lượng.', titleEn: 'Growth is not a volume problem.', subtitle: 'Đó là bài toán niềm tin: team cần lý do để ở lại, mở rộng và giới thiệu.', subtitleEn: 'It is a confidence problem: teams need a reason to stay, expand and advocate.', dark: false, speakerNotes: 'Không suy diễn nguyên nhân vượt quá dữ liệu nguồn.', sourceRefs: ['src_market_notes', 'src_product_metrics'] },
  { id: 'slide_04', intent: 'chart', layoutId: 'chart.bar.v1', kicker: '03 / BẰNG CHỨNG', title: 'Retention tăng khi team hình thành thói quen.', titleEn: 'Retention compounds where teams build a habit.', subtitle: 'Nhóm có từ ba workflow mỗi tuần cho thấy ý định mở rộng rõ rệt hơn.', subtitleEn: 'Cohorts with three or more weekly workflows show stronger expansion intent.', dark: false, speakerNotes: 'Biểu đồ minh họa xu hướng; số gốc nằm trong product_metrics.csv.', sourceRefs: ['src_product_metrics'] },
  { id: 'slide_05', intent: 'process', layoutId: 'process.three_steps.v1', kicker: '04 / HƯỚNG ĐI', title: 'Ba chuyển động biến chiến lược thành hành động.', titleEn: 'Three moves make the strategy tangible.', subtitle: 'Một hệ điều hành Q4 tập trung vào retention-led growth.', subtitleEn: 'A focused Q4 operating system for retention-led growth.', dark: true, speakerNotes: 'Đây là đề xuất; cần chủ dự án xác nhận trước khi publish.', sourceRefs: ['src_leadership_brief'] },
  { id: 'slide_06', intent: 'closing', layoutId: 'closing.decision.v1', kicker: '05 / QUYẾT ĐỊNH', title: 'Đầu tư vào thói quen, tăng trưởng sẽ đi theo.', titleEn: 'Invest in the habit, and growth follows.', subtitle: 'Phê duyệt vòng lặp Q4: đo lường → hướng dẫn → mở rộng.', subtitleEn: 'Approve the Q4 loop: instrument → guide → expand.', dark: true, speakerNotes: 'Kết thúc bằng một quyết định rõ ràng và chủ sở hữu hành động.', sourceRefs: ['src_leadership_brief', 'src_product_metrics'] }
];
var DEFAULT_SOURCES = [
  { id: 'src_market_notes', name: 'Q4_market_notes.pdf', type: 'PDF', size: '12 trang', status: 'analyzed', excerpt: 'Retention là đòn bẩy tăng trưởng cần được làm rõ hơn.' },
  { id: 'src_product_metrics', name: 'product_metrics.csv', type: 'CSV', size: '2.840 dòng', status: 'analyzed', excerpt: 'Nhóm có workflow lặp lại có xu hướng mở rộng tốt hơn.' },
  { id: 'src_leadership_brief', name: 'leadership_brief.docx', type: 'DOC', size: '6 trang', status: 'analyzed', excerpt: 'Q4 cần một câu chuyện ngắn, có quyết định và chủ sở hữu.' }
];

function createProjectData(name, objective, audience) {
  var slides = clone(DEMO_SLIDES);
  return {
    schemaVersion: 'presentation-project.v1', id: 'project_' + Date.now(), name: name || 'Q4 Growth Narrative', language: 'vi', stage: 'sources_analyzed',
    brief: { objective: objective || 'Phê duyệt chiến lược retention-led growth cho Q4.', audience: audience || 'Ban lãnh đạo', desiredOutcome: 'Phê duyệt một vòng lặp tăng trưởng có thể đo lường.', constraints: 'Không được nói quá số liệu; giữ provenance.', slideCount: slides.length, visualDirection: 'Editorial dark / high contrast', sourcePolicy: 'files_only', locked: false, answers: [] },
    sources: clone(DEFAULT_SOURCES), sourceMap: { status: 'analyzed', facts: 8, conflicts: 0, missing: ['Ngưỡng ngân sách Q4'], insights: ['Retention là đòn bẩy mạnh nhất.', 'Thói quen sử dụng liên quan tới ý định mở rộng.', 'Cần chốt quyết định và owner.'] },
    theme: { id: 'theme_midnight_lilac', name: 'Midnight Lilac', colors: { background: '#11182a', accent: '#8b7cf6', positive: '#5be1aa' }, typography: { heading: 'System Sans', body: 'System Sans' } },
    slides: slides, qa: { status: 'passed', issues: [], lastRunAt: now() }, versions: [], currentVersionId: null, audit: [], createdAt: now(), updatedAt: now()
  };
}

function loadProject() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.schemaVersion === 'presentation-project.v1' && Array.isArray(parsed.slides)) return parsed;
    }
  } catch (error) { console.warn('Cannot load local project', error); }
  return createProjectData();
}

var state = { project: loadProject(), selectedSlide: 0, pendingPatch: null, future: [], currentView: 'editor', currentPanel: 'agent' };
function currentSlide() { return state.project.slides[state.selectedSlide] || state.project.slides[0]; }
function displayText(slide, field) { return state.project.language === 'en' && slide[field + 'En'] ? slide[field + 'En'] : slide[field]; }
function save() { state.project.updatedAt = now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project)); if ($('#saveStatus')) $('#saveStatus').textContent = 'Đã lưu cục bộ'; }
function snapshot() { return { slides: clone(state.project.slides), brief: clone(state.project.brief), language: state.project.language, theme: clone(state.project.theme), qa: clone(state.project.qa), stage: state.project.stage }; }
function applySnapshot(data) { state.project.slides = clone(data.slides); state.project.brief = clone(data.brief); state.project.language = data.language; state.project.theme = clone(data.theme); state.project.qa = clone(data.qa); state.project.stage = data.stage; }
function addAudit(action, detail) { state.project.audit.unshift({ id: 'audit_' + Date.now(), action: action, detail: detail, at: now() }); }

function commitVersion(kind, label, detail, options) {
  options = options || {};
  var version = { id: 'v' + (state.project.versions.length + 1), kind: kind, label: label, detail: detail, parentVersionId: state.project.currentVersionId, createdAt: now(), branchKey: options.branchKey || 'main', snapshot: snapshot() };
  state.project.versions.unshift(version); state.project.currentVersionId = version.id;
  if (!options.preserveFuture) state.future = [];
  addAudit(label, detail); save(); renderAll();
}
function ensureInitialVersion() {
  if (!state.project.versions.length) {
    var initial = { id: 'v1', kind: 'project_created', label: 'Dự án được tạo', detail: 'Presentation JSON v1', parentVersionId: null, createdAt: state.project.createdAt, branchKey: 'main', snapshot: snapshot() };
    state.project.versions.push(initial); state.project.currentVersionId = initial.id; save();
  }
}
function runQA() {
  var issues = [];
  state.project.slides.forEach(function (slide, index) {
    if ((slide.title || '').length > 72) issues.push('Slide ' + (index + 1) + ': tiêu đề dài, cần rút gọn.');
    if ((slide.subtitle || '').length > 180) issues.push('Slide ' + (index + 1) + ': phụ đề có nguy cơ tràn.');
    if (!slide.sourceRefs || !slide.sourceRefs.length) issues.push('Slide ' + (index + 1) + ': thiếu provenance.');
  });
  state.project.qa = { status: issues.length ? 'warning' : 'passed', issues: issues, lastRunAt: now() }; save();
}
function showToast(message, tone) {
  var toast = $('#toast'); toast.textContent = message; toast.className = 'toast ' + (tone || ''); clearTimeout(showToast.timer); showToast.timer = setTimeout(function () { toast.classList.add('hidden'); }, 3000);
}

function renderSources() {
  $('#sourceList').innerHTML = state.project.sources.map(function (source) {
    return '<div class="source-item"><div class="file-icon ' + esc(source.type.toLowerCase()) + '">' + esc(source.type) + '</div><div><strong>' + esc(source.name) + '</strong><span>' + esc(source.size) + ' · ' + (source.status === 'analyzed' ? 'đã phân tích' : 'chờ phân tích') + '</span></div><span class="check">' + (source.status === 'analyzed' ? '✓' : '…') + '</span></div>';
  }).join('');
  $('#sourceSummary').textContent = state.project.sources.length + ' nguồn · ' + state.project.sourceMap.facts + ' insight · ' + state.project.sourceMap.conflicts + ' xung đột';
  $('#sourceInsight').textContent = '“' + (state.project.sourceMap.insights[0] || 'Chưa có insight; hãy phân tích nguồn trước.') + '”';
}

function renderSlideBody(slide) {
  if (slide.intent === 'data_cards') return '<div class="stat-row"><div class="stat-card"><span class="label">Net retention</span><div class="value">118%</div><span class="delta">↑ 12 điểm YoY</span></div><div class="stat-card"><span class="label">Team hoạt động tuần</span><div class="value">+46%</div><span class="delta">↑ so với Q3</span></div><div class="stat-card"><span class="label">Ý định mở rộng</span><div class="value">3,4×</div><span class="delta">↑ ở nhóm có thói quen</span></div></div>';
  if (slide.intent === 'insight') return '<div class="insight-quote"><span class="quote-mark">“</span> Team ở lại không phải vì dùng nhiều tính năng hơn. Họ quay lại vì một kết quả đáng tin cậy.</div>';
  if (slide.intent === 'chart') return '<div class="bar-chart"><div class="bar" style="height:36%"><span>1×</span></div><div class="bar" style="height:51%"><span>2×</span></div><div class="bar" style="height:68%"><span>3×</span></div><div class="bar" style="height:91%"><span>4×</span></div><div class="bar" style="height:100%"><span>5×</span></div></div>';
  if (slide.intent === 'process') return '<div class="process-row"><div class="process-step"><div class="process-number">01</div><strong>Đo lường</strong><span>Nhìn thấy thói quen</span></div><div class="process-arrow">→</div><div class="process-step"><div class="process-number">02</div><strong>Hướng dẫn</strong><span>Làm rõ giá trị</span></div><div class="process-arrow">→</div><div class="process-step"><div class="process-number">03</div><strong>Mở rộng</strong><span>Biến proof thành growth</span></div></div>';
  if (slide.intent === 'closing') return '<div class="closing-mark">↗</div>';
  return '<div class="stat-row"><div class="stat-card"><span class="label">Trọng tâm Q4</span><div class="value">1 vòng lặp</div><span class="delta">một cược rõ ràng</span></div><div class="stat-card"><span class="label">Khán giả</span><div class="value">' + esc(state.project.brief.audience.split(' ')[0]) + '</div><span class="delta">một quyết định chung</span></div><div class="stat-card"><span class="label">Trạng thái</span><div class="value">Sẵn sàng</div><span class="delta">brief có nguồn</span></div></div>';
}

function renderEditor() {
  var slide = currentSlide(); var title = displayText(slide, 'title'); var subtitle = displayText(slide, 'subtitle');
  $('#slideCanvas').innerHTML = '<div class="slide ' + (slide.dark ? 'dark' : '') + '"><div class="slide-kicker">' + esc(slide.kicker) + '</div><h2 class="slide-title editable" data-edit="title" contenteditable="true" spellcheck="false">' + esc(title) + '</h2><p class="slide-subtitle editable" data-edit="subtitle" contenteditable="true" spellcheck="false">' + esc(subtitle) + '</p>' + renderSlideBody(slide) + '<div class="slide-footer"><span>ACME / GROWTH LAB</span><span>' + String(state.selectedSlide + 1).padStart(2, '0') + '</span></div></div>';
  $('#slideCounter').textContent = String(state.selectedSlide + 1).padStart(2, '0') + ' / ' + String(state.project.slides.length).padStart(2, '0');
  $('#titleInput').value = state.project.language === 'en' ? (slide.titleEn || slide.title) : slide.title; $('#subtitleInput').value = state.project.language === 'en' ? (slide.subtitleEn || slide.subtitle) : slide.subtitle;
  $$('.editable').forEach(function (element) { element.addEventListener('focus', function () { element.classList.add('selected'); }); element.addEventListener('blur', function () { var field = element.dataset.edit; var value = element.textContent.trim(); slide[state.project.language === 'en' ? field + 'En' : field] = value; runQA(); commitVersion('manual_edit', 'Chỉnh sửa trực tiếp', 'Slide ' + (state.selectedSlide + 1)); }); });
}
function renderThumbnails() {
  $('#slideStrip').innerHTML = state.project.slides.map(function (slide, index) { return '<button class="thumb ' + (index === state.selectedSlide ? 'active' : '') + '" data-slide="' + index + '" aria-label="Slide ' + (index + 1) + '"><div class="thumb-bar"></div><div class="thumb-line"></div><div class="thumb-line two"></div><div class="thumb-card"></div><div class="thumb-card two"></div><div class="thumb-card three"></div><span>' + String(index + 1).padStart(2, '0') + '</span></button>'; }).join('');
  $$('.thumb').forEach(function (button) { button.addEventListener('click', function () { state.selectedSlide = Number(button.dataset.slide); renderEditor(); renderThumbnails(); }); });
}
function renderVersions() {
  $('#versionBadge').textContent = state.project.versions.length;
  $('#versionList').innerHTML = state.project.versions.map(function (version, index) { return '<div class="version-item ' + (index === 0 ? 'current' : '') + '"><span class="version-dot"></span><span class="version-copy"><strong>' + esc(version.id) + ' · ' + esc(version.label) + '</strong><span>' + new Date(version.createdAt).toLocaleString('vi-VN') + ' · ' + esc(version.detail) + '</span></span><button class="restore-version" data-version="' + esc(version.id) + '">Khôi phục</button></div>'; }).join('');
  $$('.restore-version').forEach(function (button) { button.addEventListener('click', function () { restoreVersion(button.dataset.version); }); });
}
function renderActivity() {
  var entries = state.project.audit.length ? state.project.audit.slice(0, 12) : [{ action: 'Dự án được tạo', detail: 'Presentation JSON v1', at: state.project.createdAt }];
  $('#activityList').innerHTML = entries.map(function (entry, index) { return '<div><span class="activity-icon ' + (index % 3 === 0 ? 'green' : index % 3 === 1 ? 'purple' : 'blue') + '">' + (index % 3 === 0 ? '✓' : index % 3 === 1 ? '✦' : '↗') + '</span><div><strong>' + esc(entry.action) + '</strong><p>' + esc(entry.detail) + '</p></div><time>' + new Date(entry.at).toLocaleString('vi-VN') + '</time></div>'; }).join('');
}
function renderHeader() {
  $('#sidebarProjectName').textContent = state.project.name; $('#breadcrumbProjectName').textContent = state.project.name; $('#editorProjectName').textContent = state.project.name;
  $('#sidebarProjectMeta').textContent = 'Đã cập nhật ' + new Date(state.project.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  $('#stagePill').textContent = ({ draft: 'BẢN NHÁP', sources_analyzed: 'ĐÃ PHÂN TÍCH', source_ingested: 'CHỜ PHÂN TÍCH', brief_locked: 'ĐÃ KHÓA BRIEF', generated: 'ĐÃ SINH DECK' })[state.project.stage] || 'BẢN NHÁP';
  $('#languageSelect').value = state.project.language; var qa = $('#qaStatus'); qa.textContent = state.project.qa.status === 'passed' ? 'QA OK' : state.project.qa.issues.length + ' cảnh báo'; qa.className = 'qa-chip ' + (state.project.qa.status === 'passed' ? 'passed' : 'warning');
}
function renderAll() { renderHeader(); renderSources(); renderEditor(); renderThumbnails(); renderVersions(); renderActivity(); renderIntegrations(); }
function renderIntegrations() {
  var integrations = [
    ['Microsoft Designer', 'D', 'blue', 'Chưa kết nối', 'Dùng để khám phá hướng hình ảnh sau khi export brief.', 'Cần tài khoản bên ngoài'],
    ['Figma', 'F', 'purple', 'Cần OAuth', 'Adapter handoff thiết kế đã có ranh giới dữ liệu.', 'Connector hiện trả về unauthorized'],
    ['Lovable', 'L', 'orange', 'Workflow trình duyệt', 'Dùng brief + component contract để build giao diện.', 'Không có connector trực tiếp trong phiên'],
    ['v0', 'v0', 'dark', 'Workflow trình duyệt', 'Dùng UI spec và contract component.', 'Không có connector trực tiếp trong phiên'],
    ['Make', 'M', 'green', 'Chưa kết nối', 'Event contract đã tách riêng để nối webhook sau này.', 'Không có connector trực tiếp trong phiên'],
    ['Zapier', 'Z', 'pink', 'Chưa kết nối', 'Có thể dùng cùng event contract khi user kết nối.', 'Không có connector trực tiếp trong phiên']
  ];
  $('#integrationGrid').innerHTML = integrations.map(function (item) { return '<article class="integration-card"><div class="integration-top"><div class="tool-logo ' + item[2] + '">' + item[1] + '</div><span class="status-badge ' + (item[3] === 'Workflow trình duyệt' ? 'local' : '') + '">' + item[3] + '</span></div><h3>' + item[0] + '</h3><p>' + item[4] + '</p><small>' + item[5] + '</small></article>'; }).join('');
}

function openModal(id) { $('#' + id).classList.remove('hidden'); }
function closeModal(id) { $('#' + id).classList.add('hidden'); }
function restoreVersion(versionId) {
  var target = state.project.versions.find(function (version) { return version.id === versionId; }); if (!target) return;
  state.future.push({ snapshot: snapshot() }); applySnapshot(target.snapshot); runQA(); commitVersion('restore', 'Khôi phục ' + target.id, 'Tạo version mới, không xóa lịch sử', { preserveFuture: true }); showToast('Đã khôi phục ' + target.id + '; lịch sử cũ vẫn được giữ.');
}
function undo() {
  var current = state.project.versions.find(function (version) { return version.id === state.project.currentVersionId; }); var parent = current && state.project.versions.find(function (version) { return version.id === current.parentVersionId; });
  if (!parent) return showToast('Đã ở version gốc của nhánh này.'); state.future.push({ snapshot: snapshot() }); applySnapshot(parent.snapshot); runQA(); commitVersion('undo', 'Hoàn tác thay đổi', 'Về snapshot ' + parent.id, { preserveFuture: true }); showToast('Đã hoàn tác; có thể làm lại bằng nút ↷.');
}
function redo() {
  var next = state.future.pop(); if (!next) return showToast('Không còn thay đổi để làm lại.'); applySnapshot(next.snapshot); runQA(); commitVersion('redo', 'Làm lại thay đổi', 'Khôi phục snapshot gần nhất', { preserveFuture: true }); showToast('Đã làm lại thay đổi.');
}
function analyzeSources() {
  state.project.sources.forEach(function (source) { source.status = 'analyzed'; }); state.project.sourceMap.status = 'analyzed'; state.project.sourceMap.facts = Math.max(8, state.project.sources.length * 3); state.project.stage = 'sources_analyzed'; runQA(); commitVersion('source_analysis', 'Phân tích nguồn hoàn tất', state.project.sources.length + ' nguồn → ' + state.project.sourceMap.facts + ' insight'); showToast('Source map đã được cập nhật từ các file local.');
}
function lockBrief() {
  state.project.brief.audience = $('#audienceSelect').value; state.project.brief.desiredOutcome = $('#outcomeSelect').value; state.project.brief.constraints = 'Không được nói quá: ' + $('#riskSelect').value; state.project.brief.answers = [$('#audienceSelect').value, $('#outcomeSelect').value, $('#riskSelect').value]; state.project.brief.locked = true; state.project.stage = 'brief_locked'; closeModal('interviewModal'); commitVersion('brief_locked', 'Master brief đã khóa', '3 câu trả lời thích ứng · tiếng Việt mặc định'); showToast('Master brief đã khóa. Có thể sinh deck.');
}
function generateDeck() { state.project.stage = 'generated'; runQA(); commitVersion('generation', 'Deck đã được sinh', state.project.slides.length + ' slide · renderer từ Presentation JSON'); showToast('Deck đã được sinh bằng renderer local có kiểm soát.'); }
function makePatch(command) {
  var normalized = command.toLowerCase(); var slide = currentSlide(); var operations = [];
  if (normalized.includes('tiêu đề') || normalized.includes('title') || normalized.includes('rút gọn') || normalized.includes('concise')) operations.push({ op: 'update_text', target: slide.id + '.title', value: state.project.language === 'en' ? 'Retention compounds into growth.' : 'Retention tạo đà cho tăng trưởng.' });
  if (normalized.includes('tương phản') || normalized.includes('contrast')) operations.push({ op: 'update_style', target: slide.id + '.theme', value: 'Tăng tương phản nhưng giữ khả năng đọc' });
  if (normalized.includes('nguồn') || normalized.includes('source')) operations.push({ op: 'add_element', target: slide.id + '.speakerNotes', value: 'Nguồn: source map của workspace' });
  if (!operations.length) operations.push({ op: 'update_text', target: slide.id + '.subtitle', value: state.project.language === 'en' ? 'A sharper, source-grounded story for the next decision.' : 'Một câu chuyện sắc hơn, có nguồn, phục vụ quyết định tiếp theo.' });
  return { schemaVersion: 'presentation-patch.v1', baseVersionId: state.project.currentVersionId, scope: { type: 'slide', id: slide.id }, operations: operations, explanation: 'Thay đổi có phạm vi trên “' + displayText(slide, 'title') + '”', requiresConfirmation: true };
}
function previewPatch(command) {
  state.pendingPatch = makePatch(command || 'Rút gọn tiêu đề'); var patch = state.pendingPatch; $('#patchPreview').classList.remove('hidden');
  $('#patchPreview').innerHTML = '<h3>Xem trước patch · ' + esc(patch.scope.id) + '</h3>' + patch.operations.map(function (operation) { return '<div class="patch-op"><b>' + esc(operation.op) + '</b><span>' + esc(operation.target) + ' → ' + esc(operation.value) + '</span></div>'; }).join('') + '<div class="patch-actions"><button class="cancel-patch" id="cancelPatchBtn">Hủy</button><button class="apply-patch" id="applyPatchBtn">Áp dụng patch</button></div>';
  $('#cancelPatchBtn').addEventListener('click', function () { state.pendingPatch = null; $('#patchPreview').classList.add('hidden'); }); $('#applyPatchBtn').addEventListener('click', applyPatch);
}
function applyPatch() {
  if (!state.pendingPatch || state.pendingPatch.baseVersionId !== state.project.currentVersionId) { state.pendingPatch = null; $('#patchPreview').classList.add('hidden'); return showToast('Patch đã cũ; hãy tạo preview mới để tránh ghi đè im lặng.', 'warning'); }
  var patch = state.pendingPatch; var slide = currentSlide();
  patch.operations.forEach(function (operation) { if (operation.op === 'update_text' && operation.target.endsWith('.title')) slide[state.project.language === 'en' ? 'titleEn' : 'title'] = operation.value; if (operation.op === 'update_text' && operation.target.endsWith('.subtitle')) slide[state.project.language === 'en' ? 'subtitleEn' : 'subtitle'] = operation.value; if (operation.op === 'add_element') slide.speakerNotes += '\n' + operation.value; });
  state.project.stage = 'generated'; state.pendingPatch = null; $('#patchPreview').classList.add('hidden'); runQA(); commitVersion('ai_patch', 'AI patch đã áp dụng', patch.operations.length + ' structured operation'); showToast('Patch đã áp dụng và tạo snapshot mới.');
}
function createProject() {
  var name = $('#newProjectName').value.trim() || 'Bài trình bày mới'; var objective = $('#newProjectObjective').value.trim(); var audience = $('#newProjectAudience').value;
  state.project = createProjectData(name, objective, audience); state.selectedSlide = 0; ensureInitialVersion(); closeModal('projectModal'); renderAll(); switchView('editor'); showToast('Dự án mới đã được tạo trong workspace local.');
}
async function ingestFile(file) {
  if (!file) return; var ext = file.name.split('.').pop().toUpperCase(); var source = { id: 'src_' + Date.now(), name: file.name, type: ext.slice(0, 3), size: Math.max(1, Math.round(file.size / 1024)) + ' KB', status: 'queued', excerpt: '' };
  if (['TXT', 'CSV'].includes(ext)) { try { source.excerpt = (await file.text()).slice(0, 500); } catch (error) { source.excerpt = 'Không đọc được preview local.'; } }
  state.project.sources.push(source); state.project.stage = 'source_ingested'; save(); renderAll(); closeModal('sourceModal'); showToast(file.name + ' đã vào hàng đợi local; bấm “Phân tích lại nguồn” để tạo source map.');
}
function toPresentationJSON() {
  return { schemaVersion: 'presentation-json.v1', deckId: state.project.id, language: state.project.language, brief: clone(state.project.brief), theme: clone(state.project.theme), slides: state.project.slides.map(function (slide, index) { return { id: slide.id, order: index + 1, intent: slide.intent, layoutId: slide.layoutId, elements: [{ id: slide.id + '_title', type: 'text', frame: { x: 80, y: 80, w: 1300, h: 160 }, content: { text: displayText(slide, 'title') }, style: { fontSize: 42 }, sourceRefs: clone(slide.sourceRefs || []) }, { id: slide.id + '_subtitle', type: 'text', frame: { x: 80, y: 260, w: 1000, h: 100 }, content: { text: displayText(slide, 'subtitle') }, style: { fontSize: 15 }, sourceRefs: clone(slide.sourceRefs || []) }], speakerNotes: slide.speakerNotes, sourceRefs: clone(slide.sourceRefs || []) }; }), version: state.project.versions.length, currentVersionId: state.project.currentVersionId, qa: clone(state.project.qa) };
}
function exportProject() {
  var payload = toPresentationJSON(); var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); link.download = state.project.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-') + '.presentation.json'; link.click(); URL.revokeObjectURL(link.href); addAudit('Export JSON', 'Snapshot Presentation JSON được tải về local'); save(); renderActivity(); showToast('Đã xuất Presentation JSON; không gửi dữ liệu ra ngoài.');
}
function switchView(view) { state.currentView = view; $$('.nav-item').forEach(function (item) { item.classList.toggle('active', item.dataset.view === view); }); $$('.view').forEach(function (item) { item.classList.toggle('active-view', item.id === 'view-' + view); }); }

function bindEvents() {
  $$('.nav-item').forEach(function (item) { item.addEventListener('click', function () { switchView(item.dataset.view); }); });
  $$('.inspector-tab').forEach(function (tab) { tab.addEventListener('click', function () { state.currentPanel = tab.dataset.panel; $$('.inspector-tab').forEach(function (button) { button.classList.toggle('active', button === tab); }); ['agent', 'inspector', 'versions'].forEach(function (name) { $('#' + name + 'Panel').classList.toggle('hidden', name !== state.currentPanel); }); }); });
  $('#interviewBtn').addEventListener('click', function () { openModal('interviewModal'); }); $('#lockBriefBtn').addEventListener('click', lockBrief); $('#generateBtn').addEventListener('click', generateDeck);
  $('#previewPatchBtn').addEventListener('click', function () { previewPatch($('#commandInput').value); }); $('#commandInput').addEventListener('keydown', function (event) { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') previewPatch(event.target.value); }); $$('.quick-commands button').forEach(function (button) { button.addEventListener('click', function () { $('#commandInput').value = button.dataset.command; previewPatch(button.dataset.command); }); });
  $('#applyInspectorBtn').addEventListener('click', function () { var slide = currentSlide(); slide[state.project.language === 'en' ? 'titleEn' : 'title'] = $('#titleInput').value.trim(); slide[state.project.language === 'en' ? 'subtitleEn' : 'subtitle'] = $('#subtitleInput').value.trim(); runQA(); commitVersion('manual_edit', 'Chỉnh sửa thuộc tính slide', 'Slide ' + (state.selectedSlide + 1)); showToast('Chỉnh sửa đã lưu thành version mới.'); });
  $('#branchBtn').addEventListener('click', function () { commitVersion('branch', 'Tạo nhánh khám phá', 'Không thay đổi main branch', { branchKey: 'branch_' + Date.now() }); showToast('Đã tạo branch; snapshot main vẫn được giữ nguyên.'); });
  $('#undoBtn').addEventListener('click', undo); $('#redoBtn').addEventListener('click', redo); $('#exportBtn').addEventListener('click', exportProject); $('#previewBtn').addEventListener('click', function () { showToast('Preview dùng cùng renderer JSON, không dùng ảnh làm source of truth.'); }); $('#shareBtn').addEventListener('click', function () { showToast('Share chưa bật trong local-only mode; không có dữ liệu nào được gửi đi.'); });
  $('#languageSelect').addEventListener('change', function (event) { state.project.language = event.target.value; save(); renderAll(); showToast(event.target.value === 'vi' ? 'Đã đặt tiếng Việt làm ngôn ngữ của deck.' : 'Đã chuyển deck sang English; UI vẫn giữ tiếng Việt để vận hành.'); });
  $('#fullscreenBtn').addEventListener('click', function () { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }); $('#addSourceBtn').addEventListener('click', function () { openModal('sourceModal'); }); $('#addSourceBtn2').addEventListener('click', function () { openModal('sourceModal'); }); $('#analyzeSourcesBtn').addEventListener('click', analyzeSources); $('#fileInput').addEventListener('change', function (event) { $('#fileName').textContent = event.target.files[0] ? event.target.files[0].name : 'Chưa chọn file'; ingestFile(event.target.files[0]); }); $('#insightBtn').addEventListener('click', function () { showToast('Source trail: ' + state.project.sources.map(function (source) { return source.name; }).join(' → ')); }); $('#newProjectBtn').addEventListener('click', function () { openModal('projectModal'); }); $('#createProjectBtn').addEventListener('click', createProject);
  $$('.tool-button[data-tool]').forEach(function (button) { button.addEventListener('click', function () { $$('.tool-button[data-tool]').forEach(function (item) { item.classList.toggle('active', item === button); }); showToast(button.dataset.tool === 'select' ? 'Công cụ chọn đang bật.' : 'Công cụ này đang ở safe mode local; chỉnh text qua canvas/thuộc tính.'); }); });
  $$('[data-close]').forEach(function (button) { button.addEventListener('click', function () { closeModal(button.dataset.close); }); }); $$('.modal-backdrop').forEach(function (backdrop) { backdrop.addEventListener('click', function (event) { if (event.target === backdrop) closeModal(backdrop.id); }); }); document.addEventListener('keydown', function (event) { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); } });
}

ensureInitialVersion(); runQA(); bindEvents(); renderAll();
