/* Local-first runtime. Presentation JSON is the source of truth; DOM is renderer only. */
var STORAGE_KEY = 'narrative-studio.presentation.v2';
var FOUNDATION = window.NarrativeFoundation || { storage: window.localStorage, storageAvailable: true };
var DOMAIN = window.NarrativePresentationDomain;
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
var SUPPORTED_SOURCE_TYPES = {
  PDF: ['application/pdf'], DOC: ['application/msword'], DOCX: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], PPT: ['application/vnd.ms-powerpoint'], PPTX: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], XLS: ['application/vnd.ms-excel'], XLSX: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], CSV: ['text/csv', 'application/csv'], TXT: ['text/plain'], PNG: ['image/png'], JPG: ['image/jpeg'], JPEG: ['image/jpeg']
};

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
    var saved = FOUNDATION.storage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.schemaVersion === 'presentation-project.v1' && Array.isArray(parsed.slides)) return parsed;
    }
  } catch (error) { console.warn('Cannot load local project', error); }
  return createProjectData();
}

var state = { project: loadProject(), selectedSlide: 0, previewSlide: 0, zoom: 0.84, pendingPatch: null, future: [], currentView: 'editor', currentPanel: 'agent' };
function currentSlide() { return state.project.slides[state.selectedSlide] || state.project.slides[0]; }
function displayText(slide, field) { return state.project.language === 'en' && slide[field + 'En'] ? slide[field + 'En'] : slide[field]; }
function save() { state.project.updatedAt = now(); FOUNDATION.storage.setItem(STORAGE_KEY, JSON.stringify(state.project)); var persistent = FOUNDATION.storage && FOUNDATION.storage.available !== false && FOUNDATION.storageAvailable !== false; if ($('#saveStatus')) $('#saveStatus').textContent = persistent ? 'Đã lưu cục bộ' : 'Đã giữ trong phiên này'; }
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
function shorten(value, limit) {
  var text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? text.slice(0, limit - 1).trim() + '…' : text;
}
function uniqueStrings(values) {
  var seen = {}; return values.filter(function (value) { var key = String(value || '').trim(); if (!key || seen[key]) return false; seen[key] = true; return true; });
}
function deriveLocalSourceMap() {
  var factItems = [];
  state.project.sources.forEach(function (source) {
    var text = String(source.excerpt || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    text.split(/[.!?。！？]+/).map(function (sentence) { return sentence.trim(); }).filter(function (sentence) { return sentence.length > 18; }).slice(0, 4).forEach(function (sentence, index) {
      factItems.push({ id: source.id + '_fact_' + index, text: shorten(sentence, 180), sourceRef: source.id });
    });
  });
  var fallbackInsights = state.project.sources.filter(function (source) { return source.status === 'analyzed'; }).map(function (source) { return source.excerpt || source.name + ' đã được nạp cục bộ.'; });
  var insights = uniqueStrings(factItems.map(function (fact) { return fact.text; }).concat(fallbackInsights)).slice(0, 8);
  var pending = state.project.sources.some(function (source) { return source.status !== 'analyzed'; });
  state.project.sourceMap = { status: pending ? 'partial' : 'analyzed', facts: factItems.length || state.project.sources.length, conflicts: 0, missing: state.project.sources.length ? ['Mục tiêu định lượng cần người dùng xác nhận'] : ['Chưa có nguồn để phân tích'], insights: insights, factItems: factItems, generatedBy: 'local-composer.v1' };
}
function composeLocalSlides() {
  var brief = state.project.brief; var map = state.project.sourceMap; var refs = state.project.sources.map(function (source) { return source.id; });
  var insight = map.insights[0] || 'Chưa có insight đủ rõ từ nguồn hiện tại.';
  var evidence = map.insights[1] || 'Bổ sung dữ liệu hoặc ví dụ để làm rõ luận điểm.';
  var outcome = brief.desiredOutcome || 'Chốt quyết định tiếp theo.';
  var objective = brief.objective || 'Tạo một câu chuyện rõ ràng từ tài liệu nguồn.';
  return [
    { id: 'slide_local_01', intent: 'cover', layoutId: 'cover.v1', kicker: 'LOCAL COMPOSER / MASTER BRIEF', title: shorten(objective, 82), titleEn: shorten(objective, 82), subtitle: 'Bản nháp có provenance từ ' + refs.length + ' nguồn cục bộ.', subtitleEn: 'A provenance-aware draft from ' + refs.length + ' local sources.', dark: true, speakerNotes: 'Deck được tạo bởi local composer; cần người dùng duyệt trước khi chia sẻ.', sourceRefs: refs },
    { id: 'slide_local_02', intent: 'data_cards', layoutId: 'data.big_number.cards.v1', kicker: '01 / SOURCE MAP', title: 'Nguồn đã được gom thành các điểm có thể kiểm tra.', titleEn: 'Sources are organized into checkable points.', subtitle: map.facts + ' fact candidate · ' + map.conflicts + ' conflict · ' + map.missing.length + ' điểm cần xác nhận.', subtitleEn: map.facts + ' fact candidates · ' + map.conflicts + ' conflicts · ' + map.missing.length + ' open points.', dark: false, speakerNotes: 'Fact candidate không đồng nghĩa fact đã được xác minh độc lập.', sourceRefs: refs },
    { id: 'slide_local_03', intent: 'insight', layoutId: 'quote.insight.v1', kicker: '02 / INSIGHT', title: shorten(insight, 82), titleEn: shorten(insight, 82), subtitle: 'Luận điểm được lấy từ preview cục bộ và giữ lại source reference.', subtitleEn: 'The point comes from local previews and keeps its source reference.', dark: false, speakerNotes: 'Kiểm tra câu chữ với file gốc trước khi publish.', sourceRefs: refs.slice(0, 2) },
    { id: 'slide_local_04', intent: 'chart', layoutId: 'chart.bar.v1', kicker: '03 / EVIDENCE', title: 'Bằng chứng cần được trình bày theo đúng dữ liệu.', titleEn: 'Evidence should follow the data.', subtitle: shorten(evidence, 180), subtitleEn: shorten(evidence, 180), dark: false, speakerNotes: 'Local composer không tự suy ra số liệu mới; hãy thay chart minh họa bằng dữ liệu đã kiểm.', sourceRefs: refs },
    { id: 'slide_local_05', intent: 'process', layoutId: 'process.three_steps.v1', kicker: '04 / NEXT STEP', title: 'Đọc nguồn → xác nhận brief → hoàn thiện deck.', titleEn: 'Read sources → confirm the brief → finish the deck.', subtitle: 'Quy trình giữ con người trong vòng kiểm soát nội dung.', subtitleEn: 'The workflow keeps a person in control of the content.', dark: true, speakerNotes: 'Đây là workflow đề xuất, không phải kết luận từ nguồn.', sourceRefs: refs },
    { id: 'slide_local_06', intent: 'closing', layoutId: 'closing.decision.v1', kicker: '05 / DECISION', title: shorten(outcome, 82), titleEn: shorten(outcome, 82), subtitle: 'Duyệt nội dung, sửa trực tiếp hoặc yêu cầu AI patch có phạm vi.', subtitleEn: 'Review, edit directly or request a scoped AI patch.', dark: true, speakerNotes: 'Không export hoặc publish trước khi provenance và facts trọng yếu được kiểm.', sourceRefs: refs }
  ];
}
function showToast(message, tone) {
  var toast = $('#toast'); toast.textContent = message; toast.className = 'toast ' + (tone || ''); clearTimeout(showToast.timer); showToast.timer = setTimeout(function () { toast.classList.add('hidden'); }, 3000);
}
function validatePresentationJSON(payload) { return DOMAIN.validatePresentationJSON(payload); }

function renderSources() {
  $('#sourceList').innerHTML = state.project.sources.map(function (source) {
    var status = source.status === 'analyzed' ? 'đã phân tích' : 'đã đính kèm · chờ parse';
    return '<div class="source-item"><div class="file-icon ' + esc(source.type.toLowerCase()) + '">' + esc(source.type) + '</div><div><strong>' + esc(source.name) + '</strong><span>' + esc(source.size) + ' · ' + status + '</span></div><span class="check">' + (source.status === 'analyzed' ? '✓' : '…') + '</span></div>';
  }).join('');
  var pending = state.project.sources.filter(function (source) { return source.status !== 'analyzed'; }).length;
  $('#sourceSummary').textContent = state.project.sources.length + ' nguồn · ' + state.project.sourceMap.facts + ' fact candidate · ' + state.project.sourceMap.conflicts + ' xung đột' + (pending ? ' · ' + pending + ' chờ parse' : '');
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

function renderSlideMarkup(slide, editable) {
  var title = displayText(slide, 'title'); var subtitle = displayText(slide, 'subtitle');
  var titleClass = editable ? ' editable' : ''; var subtitleClass = editable ? ' editable' : '';
  var titleAttrs = editable ? ' data-edit="title" contenteditable="true" spellcheck="false"' : '';
  var subtitleAttrs = editable ? ' data-edit="subtitle" contenteditable="true" spellcheck="false"' : '';
  var slideNumber = editable ? state.selectedSlide : state.previewSlide;
  return '<div class="slide ' + (slide.dark ? 'dark' : '') + '"><div class="slide-kicker">' + esc(slide.kicker) + '</div><h2 class="slide-title' + titleClass + '"' + titleAttrs + '>' + esc(title) + '</h2><p class="slide-subtitle' + subtitleClass + '"' + subtitleAttrs + '>' + esc(subtitle) + '</p>' + renderSlideBody(slide) + '<div class="slide-footer"><span>ACME / GROWTH LAB</span><span>' + String(slideNumber + 1).padStart(2, '0') + '</span></div></div>';
}

function renderEditor() {
  var slide = currentSlide();
  $('#slideCanvas').innerHTML = renderSlideMarkup(slide, true); $('#slideCanvas').style.setProperty('--slide-zoom', state.zoom); $('#zoomValue').textContent = Math.round(state.zoom * 100) + '%';
  $('#slideCounter').textContent = String(state.selectedSlide + 1).padStart(2, '0') + ' / ' + String(state.project.slides.length).padStart(2, '0');
  $('#titleInput').value = state.project.language === 'en' ? (slide.titleEn || slide.title) : slide.title; $('#subtitleInput').value = state.project.language === 'en' ? (slide.subtitleEn || slide.subtitle) : slide.subtitle;
  $$('.editable').forEach(function (element) { element.addEventListener('focus', function () { element.classList.add('selected'); }); element.addEventListener('blur', function () { var field = element.dataset.edit; var value = element.textContent.trim(); slide[state.project.language === 'en' ? field + 'En' : field] = value; runQA(); commitVersion('manual_edit', 'Chỉnh sửa trực tiếp', 'Slide ' + (state.selectedSlide + 1)); }); });
}
function renderPreview() {
  var slide = state.project.slides[state.previewSlide] || state.project.slides[0];
  if (!slide) return;
  $('#previewCanvas').innerHTML = renderSlideMarkup(slide, false); $('#previewCounter').textContent = String(state.previewSlide + 1).padStart(2, '0') + ' / ' + String(state.project.slides.length).padStart(2, '0');
  $('#previewPrevBtn').disabled = state.previewSlide === 0; $('#previewNextBtn').disabled = state.previewSlide === state.project.slides.length - 1;
}
function openPreview() { state.previewSlide = state.selectedSlide; renderPreview(); openModal('previewModal'); }
function movePreview(direction) { state.previewSlide = Math.max(0, Math.min(state.project.slides.length - 1, state.previewSlide + direction)); renderPreview(); }
function setZoom(delta) { state.zoom = Math.max(0.6, Math.min(1.2, Number((state.zoom + delta).toFixed(2)))); $('#slideCanvas').style.setProperty('--slide-zoom', state.zoom); $('#zoomValue').textContent = Math.round(state.zoom * 100) + '%'; }
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
  var workflowIndex = state.project.stage === 'generated' ? 2 : state.project.stage === 'brief_locked' ? 1 : 0;
  $$('#workflowSteps [data-step]').forEach(function (step) { var stepIndex = Number(step.dataset.step); step.classList.toggle('active', stepIndex === workflowIndex); step.classList.toggle('done', stepIndex < workflowIndex); });
  $('#languageSelect').value = state.project.language; var qa = $('#qaStatus'); qa.textContent = state.project.qa.status === 'passed' ? 'QA OK' : state.project.qa.issues.length + ' cảnh báo'; qa.className = 'qa-chip ' + (state.project.qa.status === 'passed' ? 'passed' : 'warning');
}
var renderFrame = 0;
function renderAllNow() { renderHeader(); renderSources(); renderEditor(); renderThumbnails(); renderVersions(); renderActivity(); renderIntegrations(); }
function renderAll() {
  if (renderFrame) return;
  var schedule = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 0); };
  renderFrame = schedule(function () { renderFrame = 0; renderAllNow(); });
}
function renderIntegrations() {
  var flags = FOUNDATION.flags || {};
  var storageReady = FOUNDATION.storage && FOUNDATION.storage.available !== false;
  var storageDetail = !storageReady ? 'localStorage không khả dụng; dữ liệu chỉ giữ trong tab hiện tại.' : (flags.fileMode ? 'Đang mở bằng file://; browser có thể giới hạn persistence, fallback sẽ tự bật nếu cần.' : 'Autosave qua localStorage; vẫn có fallback memory.');
  var storageLabel = !storageReady ? 'Session fallback' : (flags.fileMode ? 'File mode' : 'Persistent local');
  var core = [
    ['Local composer', '✦', 'purple', 'Sẵn sàng', 'Tạo draft deterministic từ source map và brief; không gọi model trả phí.', 'Đường local/free đang hoạt động', 'ready'],
    ['Presentation JSON', '{}', 'green', 'Đã kiểm', 'Export chạy qua contract validation trước khi tải file.', 'Source of truth của deck', 'ready'],
    ['Lưu trữ trình duyệt', '▣', 'blue', storageReady ? 'Sẵn sàng' : 'Trong phiên', storageDetail, storageLabel, storageReady ? 'ready' : 'pending'],
    ['Supabase Auth + RLS', 'S', 'dark', flags.serverAuth ? 'Đã cấu hình' : 'Chờ cấu hình', 'Migration Phase 1 đã chuẩn bị trong repo; auth và tenant isolation chưa live.', 'Cần development project + db push + test db', flags.serverAuth ? 'ready' : 'pending'],
    ['Gemini / AI provider', 'AI', 'orange', flags.aiProvider ? 'Đã cấu hình' : 'Chưa bật', 'Local-only flag đang chặn API call; không có provider key trong browser.', 'Cần server adapter và structured-output validation', flags.aiProvider ? 'ready' : 'pending'],
    ['Canva / publish', '↗', 'pink', flags.canva && flags.externalPublish ? 'Đã cấu hình' : 'Chưa bật', 'Không có OAuth hoặc publish ngầm; chỉ mở sau khi adapter và quyền được kiểm chứng.', 'Cần OAuth/explicit action', flags.canva && flags.externalPublish ? 'ready' : 'pending']
  ];
  var integrations = [
    ['Microsoft Designer', 'D', 'blue', 'Chưa kết nối', 'Dùng để khám phá hướng hình ảnh sau khi export brief.', 'Cần tài khoản bên ngoài', 'pending'],
    ['Figma', 'F', 'purple', 'Cần OAuth', 'Adapter handoff thiết kế đã có ranh giới dữ liệu.', 'Connector hiện trả về unauthorized', 'pending'],
    ['Lovable', 'L', 'orange', 'Workflow trình duyệt', 'Dùng brief + component contract để build giao diện.', 'Không có connector trực tiếp trong phiên', 'local'],
    ['v0', 'v0', 'dark', 'Workflow trình duyệt', 'Dùng UI spec và contract component.', 'Không có connector trực tiếp trong phiên', 'local'],
    ['Make', 'M', 'green', 'Chưa kết nối', 'Event contract đã tách riêng để nối webhook sau này.', 'Không có connector trực tiếp trong phiên', 'pending'],
    ['Zapier', 'Z', 'pink', 'Chưa kết nối', 'Có thể dùng cùng event contract khi user kết nối.', 'Không có connector trực tiếp trong phiên', 'pending']
  ];
  var cards = core.concat(integrations);
  var readyCount = core.filter(function (item) { return item[6] === 'ready'; }).length;
  $('#integrationReadiness').innerHTML = '<div class="readiness-copy"><span class="readiness-dot"></span><div><strong>Local readiness: ' + readyCount + '/' + core.length + ' capability đang dùng được</strong><p>Production gate vẫn mở cho Auth/RLS, AI provider và publish ngoài hệ thống.</p></div></div><span class="readiness-label">' + (flags.localOnly ? 'LOCAL-ONLY' : 'INTEGRATION MODE') + '</span>';
  $('#integrationGrid').innerHTML = cards.map(function (item) { return '<article class="integration-card ' + (core.indexOf(item) !== -1 ? 'core-card' : '') + '"><div class="integration-top"><div class="tool-logo ' + item[2] + '">' + item[1] + '</div><span class="status-badge ' + item[6] + '">' + item[3] + '</span></div><h3>' + item[0] + '</h3><p>' + item[4] + '</p><small>' + item[5] + '</small></article>'; }).join('');
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
  state.project.sources.forEach(function (source) { if (source.excerpt || source.status === 'analyzed') source.status = 'analyzed'; }); deriveLocalSourceMap(); state.project.stage = state.project.sources.every(function (source) { return source.status === 'analyzed'; }) ? 'sources_analyzed' : 'source_ingested'; runQA(); commitVersion('source_analysis', 'Phân tích nguồn hoàn tất', state.project.sources.length + ' nguồn · ' + state.project.sourceMap.facts + ' fact candidate · file chưa parse giữ ở queue'); showToast('Source map đã được cập nhật bằng local composer; file chưa parse vẫn giữ trạng thái chờ.');
}
function lockBrief() {
  state.project.brief.audience = $('#audienceSelect').value; state.project.brief.desiredOutcome = $('#outcomeSelect').value; state.project.brief.constraints = 'Không được nói quá: ' + $('#riskSelect').value; state.project.brief.answers = [$('#audienceSelect').value, $('#outcomeSelect').value, $('#riskSelect').value]; state.project.brief.locked = true; state.project.stage = 'brief_locked'; closeModal('interviewModal'); commitVersion('brief_locked', 'Master brief đã khóa', '3 câu trả lời thích ứng · tiếng Việt mặc định'); showToast('Master brief đã khóa. Có thể sinh deck.');
}
function generateDeck() {
  if (!state.project.brief.locked) return showToast('Hãy khóa master brief trước khi sinh deck.', 'warning');
  commitVersion('generation_prepare', 'Snapshot trước khi sinh deck', 'Giữ nguyên version trước mutation của local composer.');
  state.project.slides = composeLocalSlides(); state.selectedSlide = 0; state.project.stage = 'generated'; runQA(); commitVersion('generation', 'Deck đã được sinh', state.project.slides.length + ' slide · local composer → Presentation JSON'); showToast('Deck đã được sinh từ source map local; bạn có thể chỉnh và hoàn tác.');
}
function quickCreateDeck() {
  var command = $('#quickCommandInput').value.trim();
  if (!command) return showToast('Hãy viết một câu lệnh mô tả deck bạn muốn tạo.', 'warning');
  state.project.brief.objective = command;
  state.project.brief.locked = true;
  state.project.brief.answers = state.project.brief.answers.length ? state.project.brief.answers : ['Ban lãnh đạo', 'Tạo bản trình bày để ra quyết định', 'Không được nói quá dữ liệu'];
  state.project.stage = 'brief_locked';
  deriveLocalSourceMap();
  commitVersion('command_received', 'Đã nhận lệnh tạo slide', shorten(command, 120));
  state.project.slides = composeLocalSlides();
  state.selectedSlide = 0;
  state.project.stage = 'generated';
  runQA();
  commitVersion('generation', 'Đã tạo slide từ câu lệnh', state.project.slides.length + ' slide · ' + state.project.sources.length + ' nguồn tham chiếu');
  $('#quickCommandInput').value = '';
  switchView('editor');
  showToast('Đã tạo deck từ câu lệnh. Bạn có thể sửa trực tiếp trên slide hoặc dùng Trợ lý AI.');
}
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
  if (!file) return; var ext = file.name.split('.').pop().toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(SUPPORTED_SOURCE_TYPES, ext)) return showToast('Định dạng này chưa được hỗ trợ trong local fallback.', 'warning');
  if (file.type && SUPPORTED_SOURCE_TYPES[ext].indexOf(file.type) === -1 && file.type !== 'application/octet-stream') return showToast('MIME type không khớp với phần mở rộng của file.', 'warning');
  var source = { id: 'src_' + Date.now(), name: file.name, type: ext.slice(0, 4), size: Math.max(1, Math.round(file.size / 1024)) + ' KB', status: 'queued', excerpt: '', metadata: { extension: ext, mime: file.type || 'unknown', bytes: file.size } };
  if (['TXT', 'CSV'].includes(ext)) { try { source.excerpt = (await file.text()).slice(0, 500); } catch (error) { source.excerpt = 'Không đọc được preview local.'; } }
  state.project.sources.push(source); state.project.stage = 'source_ingested'; save(); renderAll(); if ($('#quickAttachmentSummary')) $('#quickAttachmentSummary').textContent = 'Đã đính kèm: ' + file.name + ' · chỉ đọc trong trình duyệt'; closeModal('sourceModal'); showToast(file.name + ' đã được đính kèm local; câu lệnh có thể tạo deck ngay.');
}

function bindDropZone() {
  var dropZone = document.querySelector('.drop-zone');
  if (!dropZone) return;
  ['dragenter', 'dragover'].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) { event.preventDefault(); event.stopPropagation(); dropZone.classList.add('is-dragging'); });
  });
  ['dragleave', 'drop'].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) { event.preventDefault(); event.stopPropagation(); dropZone.classList.remove('is-dragging'); });
  });
  dropZone.addEventListener('drop', function (event) {
    var files = event.dataTransfer && event.dataTransfer.files;
    if (!files || !files.length) return;
    if (files.length > 1) showToast('Bản local xử lý một file mỗi lần; file đầu tiên được chọn.', 'warning');
    $('#fileName').textContent = files[0].name;
    ingestFile(files[0]);
  });
}
function toPresentationJSON() { return DOMAIN.toPresentationJSON(state.project); }
function exportProject() {
  var payload = toPresentationJSON(); var validation = validatePresentationJSON(payload); if (!validation.ok) return showToast('Không thể export: ' + validation.errors[0], 'warning'); var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); link.download = state.project.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-') + '.presentation.json'; link.click(); URL.revokeObjectURL(link.href); addAudit('Export JSON', 'Snapshot Presentation JSON đã qua contract validation và được tải về local'); save(); renderActivity(); showToast('Đã xuất Presentation JSON hợp lệ; không gửi dữ liệu ra ngoài.');
}
function switchView(view) {
  if (view === 'admin' && !(window.NarrativeAuth && window.NarrativeAuth.isAdmin())) {
    showToast('Khu vực quản trị chỉ dành cho tài khoản admin đã xác thực.', 'warning');
    return;
  }
  state.currentView = view;
  $$('.nav-item').forEach(function (item) { item.classList.toggle('active', item.dataset.view === view); });
  $$('.view').forEach(function (item) { item.classList.toggle('active-view', item.id === 'view-' + view); });
}

function bindEvents() {
  $$('.nav-item').forEach(function (item) { item.addEventListener('click', function () { switchView(item.dataset.view); }); });
  $$('.inspector-tab').forEach(function (tab) { tab.addEventListener('click', function () { state.currentPanel = tab.dataset.panel; $$('.inspector-tab').forEach(function (button) { button.classList.toggle('active', button === tab); }); ['agent', 'inspector', 'versions'].forEach(function (name) { $('#' + name + 'Panel').classList.toggle('hidden', name !== state.currentPanel); }); }); });
  $('#interviewBtn').addEventListener('click', function () { openModal('interviewModal'); }); $('#lockBriefBtn').addEventListener('click', lockBrief); $('#generateBtn').addEventListener('click', generateDeck);
  $('#previewPatchBtn').addEventListener('click', function () { previewPatch($('#commandInput').value); }); $('#commandInput').addEventListener('keydown', function (event) { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') previewPatch(event.target.value); }); $$('.quick-commands button').forEach(function (button) { button.addEventListener('click', function () { $('#commandInput').value = button.dataset.command; previewPatch(button.dataset.command); }); });
  $('#applyInspectorBtn').addEventListener('click', function () { var slide = currentSlide(); slide[state.project.language === 'en' ? 'titleEn' : 'title'] = $('#titleInput').value.trim(); slide[state.project.language === 'en' ? 'subtitleEn' : 'subtitle'] = $('#subtitleInput').value.trim(); runQA(); commitVersion('manual_edit', 'Chỉnh sửa thuộc tính slide', 'Slide ' + (state.selectedSlide + 1)); showToast('Chỉnh sửa đã lưu thành version mới.'); });
  $('#branchBtn').addEventListener('click', function () { commitVersion('branch', 'Tạo nhánh khám phá', 'Không thay đổi main branch', { branchKey: 'branch_' + Date.now() }); showToast('Đã tạo branch; snapshot main vẫn được giữ nguyên.'); });
  $('#undoBtn').addEventListener('click', undo); $('#redoBtn').addEventListener('click', redo); $('#exportBtn').addEventListener('click', exportProject); $('#previewBtn').addEventListener('click', openPreview); $('#previewPrevBtn').addEventListener('click', function () { movePreview(-1); }); $('#previewNextBtn').addEventListener('click', function () { movePreview(1); }); $('#zoomOutBtn').addEventListener('click', function () { setZoom(-0.1); }); $('#zoomInBtn').addEventListener('click', function () { setZoom(0.1); }); $('#shareBtn').addEventListener('click', function () { showToast('Share chưa bật trong local-only mode; không có dữ liệu nào được gửi đi.'); });
  $('#languageSelect').addEventListener('change', function (event) { state.project.language = event.target.value; save(); renderAll(); showToast(event.target.value === 'vi' ? 'Đã đặt tiếng Việt làm ngôn ngữ của deck.' : 'Đã chuyển deck sang English; UI vẫn giữ tiếng Việt để vận hành.'); });
  $('#fullscreenBtn').addEventListener('click', function () { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }); $('#addSourceBtn').addEventListener('click', function () { openModal('sourceModal'); }); $('#addSourceBtn2').addEventListener('click', function () { openModal('sourceModal'); }); $('#quickAttachBtn').addEventListener('click', function () { openModal('sourceModal'); }); $('#quickCreateBtn').addEventListener('click', quickCreateDeck); $('#quickCommandInput').addEventListener('keydown', function (event) { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') quickCreateDeck(); }); $('#analyzeSourcesBtn').addEventListener('click', analyzeSources); $('#fileInput').addEventListener('change', function (event) { $('#fileName').textContent = event.target.files[0] ? event.target.files[0].name : 'Chưa chọn file'; ingestFile(event.target.files[0]); }); $('#insightBtn').addEventListener('click', function () { showToast('Source trail: ' + state.project.sources.map(function (source) { return source.name; }).join(' → ')); }); $('#newProjectBtn').addEventListener('click', function () { openModal('projectModal'); }); $('#createProjectBtn').addEventListener('click', createProject); bindDropZone();
  $$('.tool-button[data-tool]').forEach(function (button) { button.addEventListener('click', function () { $$('.tool-button[data-tool]').forEach(function (item) { item.classList.toggle('active', item === button); }); showToast(button.dataset.tool === 'select' ? 'Công cụ chọn đang bật.' : 'Công cụ này đang ở safe mode local; chỉnh text qua canvas/thuộc tính.'); }); });
  $$('[data-close]').forEach(function (button) { button.addEventListener('click', function () { closeModal(button.dataset.close); }); }); $$('.modal-backdrop').forEach(function (backdrop) { backdrop.addEventListener('click', function (event) { if (event.target === backdrop) closeModal(backdrop.id); }); }); document.addEventListener('keydown', function (event) { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); } if (state.currentView === 'editor' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) { if (event.key === '+' || event.key === '=') setZoom(0.1); if (event.key === '-') setZoom(-0.1); if (event.key === 'ArrowLeft' && !$('#previewModal').classList.contains('hidden')) movePreview(-1); if (event.key === 'ArrowRight' && !$('#previewModal').classList.contains('hidden')) movePreview(1); } });
}

ensureInitialVersion(); runQA(); bindEvents(); renderAll();
