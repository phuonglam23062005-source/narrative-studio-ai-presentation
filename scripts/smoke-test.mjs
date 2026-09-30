import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const agents = fs.readFileSync(new URL('../agent-runtime.js', import.meta.url), 'utf8');
const release = fs.readFileSync(new URL('../release-runtime.js', import.meta.url), 'utf8');
const releaseCss = fs.readFileSync(new URL('../release.css', import.meta.url), 'utf8');
const lightCss = fs.readFileSync(new URL('../light-theme.css', import.meta.url), 'utf8');
const foundation = fs.readFileSync(new URL('../foundation-runtime.js', import.meta.url), 'utf8');
const domain = fs.readFileSync(new URL('../presentation-domain.js', import.meta.url), 'utf8');
const auth = fs.readFileSync(new URL('../auth-runtime.js', import.meta.url), 'utf8');
const authConfig = fs.readFileSync(new URL('../auth-config.js', import.meta.url), 'utf8');
const schema = JSON.parse(fs.readFileSync(new URL('../docs/presentation.schema.json', import.meta.url), 'utf8'));

const requiredIds = ['slideCanvas', 'previewModal', 'previewCanvas', 'sourceList', 'interviewModal', 'sourceModal', 'projectModal', 'languageSelect', 'undoBtn', 'redoBtn', 'zoomInBtn', 'zoomOutBtn', 'exportBtn', 'slideActionsToggle', 'slideActionsMenu', 'authGate', 'loginForm', 'registerForm', 'googleButton', 'googleAuthStatus', 'roleBadge', 'rolePill', 'quickCommandInput', 'quickAttachBtn', 'quickCreateBtn', 'view-admin', 'adminUserList'];
const missing = requiredIds.filter((id) => !html.includes(`id="${id}"`));
const checks = {
  htmlRequiredIds: missing.length === 0,
  jsonSourceOfTruth: domain.includes('presentation-json.v1') && app.includes('toPresentationJSON'),
  patchContract: app.includes('presentation-patch') && app.includes('baseVersionId') && app.includes('requiresConfirmation'),
  versionGraph: app.includes('parentVersionId') && app.includes('restoreVersion') && app.includes('function undo'),
  vietnameseDefault: app.includes("language: 'vi'") && html.includes('Tiếng Việt'),
  schemaRequired: Array.isArray(schema.required) && schema.required.includes('slides') && schema.required.includes('qa'),
  agentOrchestration: agents.includes('route_goal') && agents.includes('build_source_map') && agents.includes('evaluate_quality') && agents.includes('completedStages'),
  agentSafety: agents.includes('MAX_STEPS') && agents.includes('presentation-json.v1') && agents.includes('không publish'),
  agentRecovery: agents.includes('parsed.executionAlive = false') && agents.includes("run.status === 'paused' && run.id") && agents.includes('run.executionAlive = false'),
  releaseSafety: release.includes('verifyPatch') && release.includes('baseVersionId') && release.includes('scope') && release.includes('snapshotProject'),
  slideOperations: release.includes('duplicateSlide') && release.includes('addSlide') && release.includes('deleteSlide') && release.includes('moveSlide'),
  foundationBoundary: foundation.includes('localOnly: true') && foundation.includes('unhandledrejection') && foundation.includes('safeStorage'),
  localSourceComposer: app.includes('deriveLocalSourceMap') && app.includes('composeLocalSlides') && app.includes('generation_prepare') && app.includes('brief.locked'),
  presentationContractValidation: domain.includes('validatePresentationJSON') && app.includes('validatePresentationJSON') && app.includes('Snapshot Presentation JSON đã qua contract validation'),
  localIngestionBoundary: app.includes('SUPPORTED_SOURCE_TYPES') && app.includes('MIME type không khớp') && app.includes('file chưa parse giữ ở queue'),
  integrationReadiness: html.includes('integrationReadiness') && app.includes('Supabase Auth + RLS') && app.includes('Gemini / AI provider') && app.includes('LOCAL-ONLY'),
  dragDropIngestion: app.includes('bindDropZone') && app.includes('dataTransfer.files') && app.includes('is-dragging'),
  storageQuotaFallback: foundation.includes('persistentAvailable') && foundation.includes('storage.setItem') && foundation.includes('memory[key] = normalized'),
  fileModeAwareness: foundation.includes("fileMode: locationProtocol === 'file:'") && app.includes('Đang mở bằng file://'),
  domainBoundary: domain.includes('window.NarrativePresentationDomain') && app.includes('DOMAIN.toPresentationJSON') && html.includes('presentation-domain.js'),
  uiPolish: html.includes('workflowSteps') && app.includes('workflowIndex') && releaseCss.includes('ambientFloat') && releaseCss.includes('prefers-reduced-motion') && releaseCss.includes('panel-card:hover'),
  previewAndZoom: app.includes('function renderPreview') && app.includes('function setZoom') && app.includes('previewPrevBtn') && app.includes('zoomInBtn') && app.includes('--slide-zoom') && releaseCss.includes('preview-modal') && releaseCss.includes('transform: scale(var(--slide-zoom'),
  renderScheduling: app.includes('function renderAllNow') && app.includes('requestAnimationFrame') && app.includes('if (renderFrame) return'),
  compactSlideActions: html.includes('slideActionsMenu') && html.includes('aria-expanded="false"') && releaseCss.includes('.slide-actions-menu'),
  deferredControlsHidden: releaseCss.includes('.tool-button[data-tool="text"]') && releaseCss.includes('.tool-button[data-tool="shape"]') && releaseCss.includes('.deferred-share-button')
  ,lightTheme: html.includes('light-theme.css') && lightCss.includes('.auth-gate') && lightCss.includes('--light-panel')
  ,localAuth: html.includes('auth-runtime.js') && auth.includes('passwordHash') && auth.includes('narrative:authenticated')
  ,googleAuthBoundary: html.includes('auth-config.js') && authConfig.includes('googleClientId') && auth.includes('accounts.google.com/gsi/client') && auth.includes('googleVerifyEndpoint') && auth.includes('credential')
  ,roleSeparation: html.includes('data-view="admin"') && html.includes('role-badge admin') && auth.includes('normalizeRole') && auth.includes('isAdmin') && app.includes('Khu vực quản trị')
  ,commandFirstFlow: html.includes('command-first-card') && app.includes('function quickCreateDeck') && app.includes('quickCreateBtn')
};

if (missing.length || Object.values(checks).some((value) => !value)) {
  console.error(JSON.stringify({ checks, missing }, null, 2));
  process.exit(1);
}

console.log('Smoke test passed:', Object.keys(checks).length, 'architecture checks');
