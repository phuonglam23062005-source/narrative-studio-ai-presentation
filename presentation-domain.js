/* Canonical Presentation JSON boundary. No DOM, provider or network dependency. */
(function () {
  var SCHEMA_VERSION = 'presentation-json.v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function displayText(project, slide, field) {
    return project.language === 'en' && slide[field + 'En'] ? slide[field + 'En'] : slide[field];
  }

  function validatePresentationJSON(payload) {
    var errors = [];
    var elementIds = {};
    if (!payload || payload.schemaVersion !== SCHEMA_VERSION) errors.push('schemaVersion không đúng.');
    if (!payload || !payload.deckId || !['vi', 'en'].includes(payload.language)) errors.push('Thiếu deckId hoặc language hợp lệ.');
    if (!payload || !Array.isArray(payload.slides) || !payload.slides.length) errors.push('Deck phải có ít nhất một slide.');
    if (payload && Array.isArray(payload.slides)) payload.slides.forEach(function (slide, index) {
      if (!/^slide_[A-Za-z0-9_-]+$/.test(slide.id || '')) errors.push('Slide ' + (index + 1) + ' thiếu ID hợp lệ.');
      if (slide.order !== index + 1) errors.push('Thứ tự slide không liên tục.');
      if (!Array.isArray(slide.elements) || !slide.elements.length) errors.push('Slide ' + (index + 1) + ' thiếu elements.');
      if (!Array.isArray(slide.sourceRefs)) errors.push('Slide ' + (index + 1) + ' thiếu sourceRefs.');
      (slide.elements || []).forEach(function (element) {
        if (!element.id || elementIds[element.id]) errors.push('Element ID bị thiếu hoặc trùng: ' + (element.id || 'unknown'));
        elementIds[element.id] = true;
        if (!['text', 'image', 'shape', 'chart', 'diagram'].includes(element.type)) errors.push('Element type không hợp lệ: ' + element.type);
        if (!element.frame || !['x', 'y', 'w', 'h'].every(function (key) { return Number.isFinite(element.frame[key]); })) errors.push('Element ' + element.id + ' có frame không hợp lệ.');
        if (!Array.isArray(element.sourceRefs)) errors.push('Element ' + element.id + ' thiếu sourceRefs.');
      });
    });
    if (!payload || !payload.qa || !Array.isArray(payload.qa.issues)) errors.push('QA payload không hợp lệ.');
    return { ok: errors.length === 0, errors: errors };
  }

  function toPresentationJSON(project) {
    if (!project || !project.id || !Array.isArray(project.slides)) throw new Error('Project không đủ dữ liệu để tạo Presentation JSON.');
    return {
      schemaVersion: SCHEMA_VERSION,
      deckId: project.id,
      language: project.language,
      brief: clone(project.brief || {}),
      theme: clone(project.theme || {}),
      slides: project.slides.map(function (slide, index) {
        var sourceRefs = clone(slide.sourceRefs || []);
        return {
          id: slide.id,
          order: index + 1,
          intent: slide.intent,
          layoutId: slide.layoutId,
          elements: [
            { id: slide.id + '_title', type: 'text', frame: { x: 80, y: 80, w: 1300, h: 160 }, content: { text: displayText(project, slide, 'title') }, style: { fontSize: 42 }, sourceRefs: clone(sourceRefs) },
            { id: slide.id + '_subtitle', type: 'text', frame: { x: 80, y: 260, w: 1000, h: 100 }, content: { text: displayText(project, slide, 'subtitle') }, style: { fontSize: 15 }, sourceRefs: clone(sourceRefs) }
          ],
          speakerNotes: slide.speakerNotes,
          sourceRefs: sourceRefs
        };
      }),
      version: Array.isArray(project.versions) ? project.versions.length : 0,
      currentVersionId: project.currentVersionId || null,
      qa: clone(project.qa || { status: 'warning', issues: ['QA chưa chạy.'] })
    };
  }

  window.NarrativePresentationDomain = Object.freeze({
    version: 'presentation-domain.v1',
    schemaVersion: SCHEMA_VERSION,
    validatePresentationJSON: validatePresentationJSON,
    toPresentationJSON: toPresentationJSON
  });
})();
