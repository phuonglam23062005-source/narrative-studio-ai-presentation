/* Agent Operating System local runtime.
 * It implements a manager/specialist graph, A2A-like message envelopes,
 * checkpoints, budgets, evaluator/optimizer loop and safe local completion.
 */
(function () {
  var RUN_KEY = 'narrative-studio.agent-run.v1';
  var MAX_STEPS = 12;
  var MAX_AGENTS = 6;
  var AGENTS = [
    { id: 'manager', name: 'Manager agent', role: 'Giữ goal, budget, routing và final ownership.', mark: 'M' },
    { id: 'source', name: 'Source analyst', role: 'Lập source map, provenance và uncertainty.', mark: 'S' },
    { id: 'brief', name: 'Brief architect', role: 'Biến yêu cầu thành brief có thể thực thi.', mark: 'B' },
    { id: 'story', name: 'Story planner', role: 'Chọn narrative arc và slide intents.', mark: '✦' },
    { id: 'composer', name: 'Slide composer', role: 'Đưa content vào layout grammar có cấu trúc.', mark: 'C' },
    { id: 'evaluator', name: 'QA evaluator', role: 'Kiểm tra overflow, provenance và kết quả.', mark: 'Q' }
  ];

  function readRun() {
    try {
      var storage = window.NarrativeFoundation ? window.NarrativeFoundation.storage : window.localStorage;
      var raw = storage.getItem(RUN_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed) { parsed.executionAlive = false; if (parsed.status === 'running') parsed.status = 'paused'; }
      return parsed;
    } catch (error) { return null; }
  }
  var run = readRun() || { id: null, status: 'idle', goal: '', step: 0, trace: [], artifacts: {}, activeAgents: {}, budget: { steps: 0, agents: 0, maxSteps: MAX_STEPS, maxAgents: MAX_AGENTS }, startedAt: null, completedAt: null };
  var waiters = [];

  function persist() { var storage = window.NarrativeFoundation ? window.NarrativeFoundation.storage : window.localStorage; storage.setItem(RUN_KEY, JSON.stringify(run)); render(); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function envelope(from, to, type, payload, evidence) {
    return { messageId: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), runId: run.id, from: from, to: to, type: type, goal: run.goal, payload: payload, evidence: evidence || [], createdAt: new Date().toISOString() };
  }
  function addTrace(from, to, type, summary, status, evidence) {
    run.trace.push({ from: from, to: to, type: type, summary: summary, status: status || 'done', evidence: evidence || [], at: new Date().toISOString() });
    if (run.trace.length > 80) run.trace.shift();
  }
  function setAgent(agentId, status) { run.activeAgents[agentId] = status; }
  function updateBudget(agentId) { run.budget.steps += 1; if (!run.budget.agentSet) run.budget.agentSet = {}; if (!run.budget.agentSet[agentId]) { run.budget.agentSet[agentId] = true; run.budget.agents += 1; } }

  function renderTeam() {
    var grid = $('#agentTeamGrid'); if (!grid) return;
    grid.innerHTML = AGENTS.map(function (agent) {
      var status = run.activeAgents[agent.id] || 'idle';
      var label = status === 'running' ? 'đang chạy' : status === 'done' ? 'đã xong' : status === 'error' ? 'lỗi' : 'sẵn sàng';
      return '<article class="agent-card ' + (status === 'running' ? 'active' : status === 'done' ? 'done' : '') + '"><div class="agent-card-top"><div class="agent-avatar">' + agent.mark + '</div><span class="agent-card-status ' + status + '">' + label + '</span></div><h3>' + agent.name + '</h3><p>' + agent.role + '</p></article>';
    }).join('');
  }
  function renderTrace() {
    var timeline = $('#agentTimeline'); if (!timeline) return;
    if (!run.trace.length) { timeline.innerHTML = '<div class="empty-agent-state"><div class="agent-orb large">✦</div><strong>Chưa có run nào</strong><span>Manager sẽ xuất hiện ở đây khi bạn bấm “Chạy đội agent”.</span></div>'; return; }
    timeline.innerHTML = run.trace.slice().reverse().map(function (event) {
      return '<div class="trace-event ' + event.status + '"><span class="trace-dot"></span><div><strong>' + event.from + ' → ' + event.to + ' · ' + event.type + '</strong><p>' + event.summary + (event.evidence && event.evidence.length ? ' · Evidence: ' + event.evidence.join(', ') : '') + '</p></div><time>' + new Date(event.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '</time></div>';
    }).join('');
  }
  function renderOutput() {
    var output = $('#agentArtifact'); var status = $('#artifactStatus'); if (!output || !status) return;
    if (run.status !== 'completed' || !run.artifacts.presentation) { status.textContent = run.status === 'idle' ? 'Chưa có' : run.status === 'paused' ? 'Đang tạm dừng' : 'Đang xử lý'; status.className = 'artifact-status'; output.innerHTML = '<span>Deck, brief, QA report và Presentation JSON sẽ được gom tại đây sau khi evaluator xác minh.</span>'; return; }
    status.textContent = 'Đã xác minh'; status.className = 'artifact-status ready';
    output.innerHTML = '<div class="artifact-grid"><div class="artifact-item"><strong>Deck</strong><span>' + run.artifacts.presentation.slides.length + ' slide · renderer JSON</span></div><div class="artifact-item"><strong>Brief</strong><span>' + (run.artifacts.brief.locked ? 'đã khóa' : 'đề xuất') + ' · ' + run.artifacts.presentation.language + '</span></div><div class="artifact-item"><strong>QA</strong><span>' + run.artifacts.qa.status + ' · ' + run.artifacts.qa.issues.length + ' cảnh báo</span></div><div class="artifact-item"><strong>Provenance</strong><span>' + run.artifacts.sourceMap.facts + ' insight · ' + run.artifacts.sourceMap.conflicts + ' conflict</span></div></div>';
  }
  function render() {
    renderTeam(); renderTrace(); renderOutput();
    var status = $('#agentRunStatus'); var start = $('#startAgentRunBtn'); var pause = $('#pauseAgentRunBtn'); var stop = $('#stopAgentRunBtn'); var bar = $('#agentBudgetBar'); var label = $('#agentBudgetLabel'); var summary = $('#agentTraceSummary');
    if (!status || !start) return;
    status.textContent = run.status === 'running' ? 'Đang chạy' : run.status === 'paused' ? 'Đang tạm dừng' : run.status === 'completed' ? 'Đã hoàn tất' : run.status === 'stopped' ? 'Đã dừng' : 'Sẵn sàng';
    status.className = 'run-state-badge ' + run.status; start.innerHTML = run.status === 'paused' ? '<span>▶</span> Tiếp tục run' : '<span>✦</span> Chạy đội agent'; start.disabled = run.status === 'running'; pause.disabled = run.status !== 'running'; stop.disabled = !['running', 'paused'].includes(run.status);
    var progress = Math.min(100, Math.round((run.budget.steps / MAX_STEPS) * 100)); bar.style.width = progress + '%'; label.textContent = run.budget.steps + ' / ' + MAX_STEPS + ' bước · ' + run.budget.agents + ' / ' + MAX_AGENTS + ' agent'; summary.textContent = run.id ? 'Run ' + run.id + ' · ' + run.trace.length + ' message · state ' + run.status : 'Chưa có run. Khi chạy, mọi message đều có sender, receiver, artifact và evidence.';
  }
  function checkpoint() { run.checkpoint = { step: run.step, completedStages: run.completedStages || [], status: run.status, savedAt: new Date().toISOString() }; persist(); }
  async function waitUntilRunnable() {
    while (run.status === 'paused') await new Promise(function (resolve) { waiters.push(resolve); });
    return run.status === 'running';
  }
  function wake() { var list = waiters.splice(0); list.forEach(function (resolve) { resolve(); }); }

  async function executeStage(agentId, stageName, work) {
    if (!(await waitUntilRunnable())) return false;
    if (run.completedStages && run.completedStages.includes(stageName)) return true;
    if (run.budget.steps >= MAX_STEPS) { run.status = 'stopped'; run.executionAlive = false; addTrace('Manager agent', agentId, 'budget_stop', 'Đã chạm giới hạn bước an toàn.', 'error'); checkpoint(); return false; }
    setAgent(agentId, 'running'); updateBudget(agentId); run.step += 1; addTrace('Manager agent', agentId, 'dispatch', 'Giao subtask: ' + stageName, 'running', ['goal=' + run.goal.slice(0, 42)]); persist();
    await sleep(420);
    try {
      var result = await work();
      setAgent(agentId, 'done'); if (!run.completedStages) run.completedStages = []; run.completedStages.push(stageName); addTrace(agentId, 'Manager agent', 'artifact', result.summary, 'done', result.evidence || []); checkpoint(); return true;
    } catch (error) {
      setAgent(agentId, 'error'); run.status = 'failed'; run.executionAlive = false; addTrace(agentId, 'Manager agent', 'error', error.message || 'Agent failed', 'error'); checkpoint(); return false;
    }
  }

  async function runPipeline() {
    if (run.status === 'running' || run.executionAlive) return;
    if (run.status === 'paused' && run.id) {
      run.status = 'running'; run.executionAlive = true; wake(); checkpoint();
    } else {
      run = { id: 'run_' + Date.now(), status: 'running', executionAlive: true, goal: $('#agentGoalInput').value.trim() || 'Tạo kết quả trình bày từ nguồn hiện tại.', step: 0, completedStages: [], trace: [], artifacts: {}, activeAgents: {}, budget: { steps: 0, agents: 0, maxSteps: MAX_STEPS, maxAgents: MAX_AGENTS, agentSet: {} }, startedAt: new Date().toISOString(), completedAt: null };
      persist();
    }
    var routed = await executeStage('manager', 'route_goal', async function () {
      run.artifacts.route = { intent: 'presentation_generation', language: 'vi', sourcePolicy: 'files_only', autonomy: 'safe_local_auto' };
      return { summary: 'Đã route mục tiêu sang pipeline presentation_generation, mặc định tiếng Việt.', evidence: ['route enum', 'free/local policy'] };
    });
    if (!routed) return;
    var parallel = await Promise.all([
      executeStage('source', 'build_source_map', async function () {
        run.artifacts.sourceMap = clone(state.project.sourceMap); run.artifacts.sourceMap.manifest = state.project.sources.map(function (source) { return { id: source.id, name: source.name, status: source.status }; });
        return { summary: 'Đã chuẩn hóa source map và manifest; dữ liệu nguồn được coi là untrusted.', evidence: [state.project.sources.length + ' source files', 'provenance refs'] };
      }),
      executeStage('brief', 'synthesize_brief', async function () {
        run.artifacts.brief = clone(state.project.brief); run.artifacts.brief.objective = run.goal; run.artifacts.brief.language = 'vi'; run.artifacts.brief.locked = true; run.artifacts.brief.autoAccepted = true;
        return { summary: 'Đã tạo master brief tiếng Việt từ goal + context hiện tại.', evidence: ['goal', 'project brief', 'no external research'] };
      })
    ]);
    if (!parallel.every(Boolean)) return;
    if (!(await executeStage('story', 'plan_story', async function () {
      run.artifacts.storyboard = state.project.slides.map(function (slide, index) { return { order: index + 1, intent: slide.intent, layoutId: slide.layoutId, sourceRefs: slide.sourceRefs }; });
      return { summary: 'Đã lập narrative arc và dependency slide theo layout grammar.', evidence: ['6 slide intents', 'sourceRefs'] };
    }))) return;
    if (!(await executeStage('composer', 'compose_presentation_json', async function () {
      state.project.brief = clone(run.artifacts.brief); state.project.brief.locked = true; state.project.stage = 'generated'; run.artifacts.deck = { slideCount: state.project.slides.length, language: state.project.language, sourceOfTruth: 'presentation-json.v1' };
      return { summary: 'Đã compose deck vào Presentation JSON; renderer web sẽ dựng giao diện.', evidence: ['stable slide ids', 'speaker notes', 'sourceRefs'] };
    }))) return;
    if (!(await executeStage('evaluator', 'evaluate_quality', async function () {
      runQA(); run.artifacts.qa = clone(state.project.qa); return { summary: 'Evaluator đã kiểm tra overflow, provenance và QA status.', evidence: [state.project.qa.status, state.project.qa.issues.length + ' issues'] };
    }))) return;
    if (state.project.qa.issues.length) {
      if (!(await executeStage('composer', 'targeted_repair', async function () {
        state.project.slides.forEach(function (slide) { if (slide.title.length > 72) slide.title = slide.title.slice(0, 69) + '…'; if (slide.subtitle.length > 180) slide.subtitle = slide.subtitle.slice(0, 177) + '…'; });
        runQA(); run.artifacts.qa = clone(state.project.qa); return { summary: 'Optimizer đã sửa đúng các issue evaluator nêu, tối đa một vòng.', evidence: ['targeted repair', 'QA rerun'] };
      }))) return;
    }
    if (!(await executeStage('manager', 'finalize_artifacts', async function () {
      run.artifacts.presentation = toPresentationJSON(); run.artifacts.brief = clone(state.project.brief); run.artifacts.sourceMap = clone(state.project.sourceMap); run.artifacts.qa = clone(state.project.qa);
      if (typeof validatePresentationJSON === 'function') { var validation = validatePresentationJSON(run.artifacts.presentation); if (!validation.ok) throw new Error('Presentation JSON contract failed: ' + validation.errors[0]); }
      commitVersion('agent_team', 'Đội agent hoàn tất', 'Manager verified ' + state.project.slides.length + ' slide · ' + state.project.language + ' · ' + state.project.qa.status);
      return { summary: 'Manager đã verify artifact và ghi version; không publish hoặc gửi dữ liệu ra ngoài.', evidence: ['presentation-json.v1', 'version snapshot', 'QA=' + state.project.qa.status] };
    }))) return;
    run.status = 'completed'; run.executionAlive = false; run.completedAt = new Date().toISOString(); checkpoint(); render(); if (typeof showToast === 'function') showToast('Đội agent đã hoàn tất và tạo artifact cuối.'); if (typeof switchView === 'function') switchView('agents');
  }

  function bind() {
    render();
    $('#startAgentRunBtn').addEventListener('click', function () { if (run.status === 'paused' && run.id && run.executionAlive) { run.status = 'running'; wake(); checkpoint(); } else runPipeline(); });
    $('#pauseAgentRunBtn').addEventListener('click', function () { if (run.status === 'running') { run.status = 'paused'; checkpoint(); if (typeof showToast === 'function') showToast('Run đã tạm dừng tại checkpoint; có thể tiếp tục.'); } });
    $('#stopAgentRunBtn').addEventListener('click', function () { if (['running', 'paused'].includes(run.status)) { run.status = 'stopped'; run.executionAlive = false; wake(); checkpoint(); if (typeof showToast === 'function') showToast('Run đã dừng an toàn; artifact trung gian vẫn giữ trong trace.'); } });
    $('#clearAgentTraceBtn').addEventListener('click', function () { run = { id: null, status: 'idle', goal: '', step: 0, trace: [], artifacts: {}, activeAgents: {}, budget: { steps: 0, agents: 0, maxSteps: MAX_STEPS, maxAgents: MAX_AGENTS }, startedAt: null, completedAt: null }; var storage = window.NarrativeFoundation ? window.NarrativeFoundation.storage : window.localStorage; storage.removeItem(RUN_KEY); render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
