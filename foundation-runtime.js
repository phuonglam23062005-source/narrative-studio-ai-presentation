/* Phase 0 runtime boundary: safe local fallback, feature flags and user-visible errors. */
(function () {
  var STORAGE_NAMESPACE = 'narrative-studio.foundation.v1';
  var locationProtocol = window.location && window.location.protocol ? window.location.protocol : '';
  var flags = Object.freeze({
    localOnly: true,
    fileMode: locationProtocol === 'file:',
    externalPublish: false,
    canva: false,
    serverAuth: false,
    aiProvider: false
  });

  function safeStorage() {
    var memory = {};
    var storage = null;
    var persistentAvailable = false;

    try {
      var candidate = window.localStorage;
      var probe = STORAGE_NAMESPACE + '.probe';
      candidate.setItem(probe, 'ok');
      candidate.removeItem(probe);
      storage = candidate;
      persistentAvailable = true;
    } catch (error) {
      persistentAvailable = false;
    }

    function getMemory(key) {
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    }

    return {
      get available() { return persistentAvailable; },
      getItem: function (key) {
        if (storage && persistentAvailable) {
          try {
            var value = storage.getItem(key);
            if (value !== null) return value;
          } catch (error) {
            persistentAvailable = false;
          }
        }
        return getMemory(key);
      },
      setItem: function (key, value) {
        var normalized = String(value);
        if (storage && persistentAvailable) {
          try {
            storage.setItem(key, normalized);
            return;
          } catch (error) {
            persistentAvailable = false;
          }
        }
        memory[key] = normalized;
      },
      removeItem: function (key) {
        if (storage && persistentAvailable) {
          try {
            storage.removeItem(key);
          } catch (error) {
            persistentAvailable = false;
          }
        }
        delete memory[key];
      }
    };
  }

  var storage = safeStorage();
  window.NarrativeFoundation = Object.freeze({
    version: 'phase-0',
    flags: flags,
    isEnabled: function (name) { return flags[name] === true; },
    storage: storage,
    storageAvailable: storage.available,
    reportError: function (error) {
      var message = error && error.message ? error.message : 'Đã xảy ra lỗi runtime.';
      var notice = document.getElementById('runtimeNotice');
      if (!notice) {
        notice = document.createElement('div');
        notice.id = 'runtimeNotice';
        notice.setAttribute('role', 'alert');
        notice.className = 'runtime-notice';
        document.body.appendChild(notice);
      }
      notice.textContent = 'Ứng dụng gặp lỗi và đã giữ boundary local-first: ' + message;
      notice.classList.add('visible');
      console.error('[Narrative Studio]', error);
    }
  });

  window.addEventListener('error', function (event) {
    if (event.error) window.NarrativeFoundation.reportError(event.error);
  });
  window.addEventListener('unhandledrejection', function (event) {
    window.NarrativeFoundation.reportError(event.reason || new Error('Promise bị từ chối.'));
  });
})();
