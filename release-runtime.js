/* Release layer: adds safe editor operations, source recovery and accessibility
 * without changing the canonical Presentation JSON contract. */
(function () {
  function byId(id) { return document.getElementById(id); }
  function uid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }

  function snapshotProject() {
    return {
      slides: deepCopy(state.project.slides),
      brief: deepCopy(state.project.brief),
      language: state.project.language,
      theme: deepCopy(state.project.theme),
      qa: deepCopy(state.project.qa),
      stage: state.project.stage
    };
  }

  function verifyPatch(patch) {
    var slide = currentSlide();
    if (!patch || patch.schemaVersion !== 'presentation-patch.v1') return { ok: false, message: 'Patch không đúng schema.' };
    if (patch.baseVersionId !== state.project.currentVersionId) return { ok: false, message: 'Patch không còn khớp revision hiện tại.' };
    if (!patch.scope || patch.scope.type !== 'slide' || patch.scope.id !== slide.id) return { ok: false, message: 'Patch vượt quá scope slide đang chọn.' };
    if (!Array.isArray(patch.operations) || !patch.operations.length) return { ok: false, message: 'Patch không có thay đổi hợp lệ.' };
    var accepted = ['update_text', 'update_style', 'add_element'];
    var invalid = patch.operations.some(function (operation) {
      return !accepted.includes(operation.op) || typeof operation.target !== 'string' || operation.target.indexOf(slide.id + '.') !== 0;
    });
    return invalid ? { ok: false, message: 'Một operation không hợp lệ hoặc ngoài scope.' } : { ok: true };
  }

  function updateSlideOrder() {
    state.project.slides.forEach(function (slide, index) { slide.order = index + 1; });
  }

  function addSlide() {
    var template = deepCopy(currentSlide());
    template.id = uid('slide');
    template.intent = 'content';
    template.layoutId = 'content.title_body.v1';
    template.kicker = 'NỘI DUNG MỚI';
    template.title = 'Một ý quan trọng cần làm rõ.';
    template.titleEn = 'An important idea to clarify.';
    template.subtitle = 'Thêm bằng chứng, ví dụ hoặc quyết định tiếp theo vào đây.';
    template.subtitleEn = 'Add evidence, an example or the next decision here.';
    template.speakerNotes = 'Slide mới. Bổ sung nguồn trước khi chia sẻ.';
    template.sourceRefs = state.project.sources.length ? [state.project.sources[0].id] : [];
    state.project.slides.splice(state.selectedSlide + 1, 0, template);
    state.selectedSlide += 1;
    updateSlideOrder();
    runQA();
    commitVersion('slide_add', 'Thêm slide', 'Tạo slide mới sau slide đang chọn.');
    showToast('Đã thêm slide mới và tạo snapshot.');
  }

  function duplicateSlide() {
    var duplicate = deepCopy(currentSlide());
    duplicate.id = uid('slide');
    duplicate.kicker = (duplicate.kicker || 'SLIDE') + ' / BẢN SAO';
    state.project.slides.splice(state.selectedSlide + 1, 0, duplicate);
    state.selectedSlide += 1;
    updateSlideOrder();
    runQA();
    commitVersion('slide_duplicate', 'Nhân bản slide', 'Bản sao có ID riêng và vẫn giữ nguồn tham chiếu.');
    showToast('Đã nhân bản slide.');
  }

  function deleteSlide() {
    if (state.project.slides.length <= 1) return showToast('Deck cần ít nhất một slide.', 'warning');
    var deleted = currentSlide();
    state.project.slides.splice(state.selectedSlide, 1);
    state.selectedSlide = Math.max(0, state.selectedSlide - 1);
    updateSlideOrder();
    runQA();
    commitVersion('slide_delete', 'Xóa slide', 'Đã xóa ' + deleted.id + ' trong version mới.');
    showToast('Đã xóa slide; lịch sử vẫn giữ bản cũ.');
  }

  function moveSlide(direction) {
    var target = state.selectedSlide + direction;
    if (target < 0 || target >= state.project.slides.length) return;
    var slides = state.project.slides;
    var item = slides.splice(state.selectedSlide, 1)[0];
    slides.splice(target, 0, item);
    state.selectedSlide = target;
    updateSlideOrder();
    runQA();
    commitVersion('slide_reorder', 'Sắp xếp lại slide', 'Đã đổi thứ tự slide trong version mới.');
  }

  function addEditorControls() {
    var toolbar = document.querySelector('.canvas-foot');
    if (!toolbar) return;
    var wrapper = byId('releaseSlideActions');
    if (!wrapper) {
      wrapper = document.createElement('span');
      wrapper.id = 'releaseSlideActions';
      wrapper.className = 'release-slide-actions';
      wrapper.innerHTML = '<button class="slide-action-button" id="moveSlideLeftBtn" title="Đưa slide sang trái">←</button><button class="slide-action-button" id="moveSlideRightBtn" title="Đưa slide sang phải">→</button><button class="slide-action-button" id="duplicateSlideBtn" title="Nhân bản slide">Nhân bản</button><button class="slide-action-button accent" id="addSlideBtn" title="Thêm slide">＋ Slide</button><button class="slide-action-button danger" id="deleteSlideBtn" title="Xóa slide">Xóa</button>';
      toolbar.appendChild(wrapper);
    }
    if (wrapper.dataset.bound === 'true') return;
    wrapper.dataset.bound = 'true';
    byId('moveSlideLeftBtn').addEventListener('click', function () { moveSlide(-1); });
    byId('moveSlideRightBtn').addEventListener('click', function () { moveSlide(1); });
    byId('duplicateSlideBtn').addEventListener('click', duplicateSlide);
    byId('addSlideBtn').addEventListener('click', addSlide);
    byId('deleteSlideBtn').addEventListener('click', deleteSlide);
  }

  function addSourceActions() {
    var originalRenderSources = window.renderSources;
    window.renderSources = function () {
      originalRenderSources();
      document.querySelectorAll('.source-item').forEach(function (item, index) {
        if (item.querySelector('.source-actions')) return;
        var source = state.project.sources[index];
        if (!source) return;
        var actions = document.createElement('span');
        actions.className = 'source-actions';
        actions.innerHTML = '<button type="button" data-source-action="retry" title="Phân tích lại nguồn">↻</button><button type="button" data-source-action="remove" title="Bỏ nguồn">×</button>';
        item.appendChild(actions);
        actions.addEventListener('click', function (event) {
          var action = event.target.dataset.sourceAction;
          if (!action) return;
          if (action === 'retry') {
            source.status = 'queued';
            save();
            originalRenderSources();
            showToast('Đã đưa ' + source.name + ' vào hàng đợi local.');
          }
          if (action === 'remove') {
            state.project.sources = state.project.sources.filter(function (candidate) { return candidate.id !== source.id; });
            state.project.slides.forEach(function (slide) { slide.sourceRefs = slide.sourceRefs.filter(function (ref) { return ref !== source.id; }); });
            state.project.sourceMap.facts = Math.max(0, state.project.sourceMap.facts - 1);
            runQA();
            commitVersion('source_remove', 'Bỏ nguồn', 'Đã bỏ ' + source.name + ' khỏi project hiện tại.');
            showToast('Đã bỏ nguồn trong version mới.');
          }
        });
      });
    };
  }

  function enhanceInterview() {
    var modal = byId('interviewModal');
    if (!modal || byId('interviewHint')) return;
    var hint = document.createElement('p');
    hint.id = 'interviewHint';
    hint.className = 'interview-hint';
    hint.textContent = 'AI đã đọc 3 nguồn; còn 3 điểm cần bạn xác nhận. Bạn có thể chọn đề xuất hoặc bỏ qua.';
    modal.querySelector('.question-list').before(hint);
    var footer = modal.querySelector('.modal-foot');
    var skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'ghost-button';
    skip.textContent = 'Bỏ qua các câu hỏi';
    skip.addEventListener('click', function () {
      state.project.brief.answers = ['unknown', 'unknown', 'unknown'];
      state.project.brief.locked = true;
      state.project.stage = 'brief_locked';
      closeModal('interviewModal');
      commitVersion('brief_skipped', 'Master brief đã khóa', 'Người dùng bỏ qua các điểm chưa biết.');
      showToast('Đã khóa brief với các điểm chưa biết được đánh dấu.');
    });
    footer.insertBefore(skip, footer.firstChild);
  }

  function overridePatchApply() {
    window.applyPatch = function () {
      var verdict = verifyPatch(state.pendingPatch);
      if (!verdict.ok) {
        state.pendingPatch = null;
        byId('patchPreview').classList.add('hidden');
        return showToast(verdict.message, 'warning');
      }
      var before = snapshotProject();
      var patch = state.pendingPatch;
      var slide = currentSlide();
      patch.operations.forEach(function (operation) {
        if (operation.op === 'update_text' && operation.target.endsWith('.title')) slide[state.project.language === 'en' ? 'titleEn' : 'title'] = operation.value;
        if (operation.op === 'update_text' && operation.target.endsWith('.subtitle')) slide[state.project.language === 'en' ? 'subtitleEn' : 'subtitle'] = operation.value;
        if (operation.op === 'add_element') slide.speakerNotes += '\n' + operation.value;
      });
      state.pendingPatch = null;
      byId('patchPreview').classList.add('hidden');
      runQA();
      commitVersion('ai_patch', 'AI patch đã áp dụng', patch.operations.length + ' operation đã qua schema, scope và revision check.');
      state.future.push({ snapshot: before });
      showToast('Patch đã áp dụng an toàn và có thể hoàn tác.');
    };
  }

  function installKeyboard() {
    document.addEventListener('keydown', function (event) {
      if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSlide();
      }
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        moveSlide(-1);
      }
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        moveSlide(1);
      }
    });
  }

  function exposeReleaseStatus() {
    var meter = document.querySelector('.free-meter p');
    if (meter) meter.textContent = 'Private local-first · không gửi dữ liệu';
  }

  addEditorControls();
  addSourceActions();
  enhanceInterview();
  overridePatchApply();
  installKeyboard();
  exposeReleaseStatus();
  renderAll();
})();
