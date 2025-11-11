// ==UserScript==
// @name         Game API Penetration Tester
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Automated API testing tool with scheduled attack UI
// @match        https://apps-*.apps.fbsbx.com/*
// @match        https://heroes-fb.nextersglobal.com/*
// @grant        none
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// ==/UserScript==

(function () {
  'use strict';

  // Storage for captured headers
  let lastHeaders = {};
  let apiUrl = 'https://heroes-fb.nextersglobal.com/api/';
  let isCapturing = true;
  let scheduledTimeout = null;

  // Attack configuration
  const ATTACK_CONFIG = {
    name: "arenaAttack",
    args: {
      userId: 11622563,
      heroes: [63, 48, 49, 25, 67],
      pet: 6006,
      favor: {
        "25": 6000,
        "48": 6005,
        "49": 6004,
        "63": 6009,
        "67": 6001
      },
      banners: [5]
    }
  };

  // Calculate signature
  function getSignature(headers, data) {
    const sign = {
      signature: '',
      length: 0,
      add: function (text) {
        this.signature += text;
        if (this.length < this.signature.length) {
          this.length = 3 * (this.signature.length + 1) >> 1;
        }
      }
    };

    sign.add(headers["X-Request-Id"]);
    sign.add(':');
    sign.add(headers["X-Auth-Token"]);
    sign.add(':');
    sign.add(headers["X-Auth-Session-Id"]);
    sign.add(':');
    sign.add(data);
    sign.add(':');
    sign.add('LIBRARY-VERSION=1');
    sign.add('UNIQUE-SESSION-ID=' + headers["X-Env-Unique-Session-Id"]);

    return md5(sign.signature);
  }

  // Intercept XMLHttpRequest to capture headers
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this._url = url;
    this._method = method;
    this._headers = {};
    return originalOpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this._headers) {
      this._headers[name] = value;
    }
    return originalSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (data) {
    // Check if the request contains arenaCheckTargetRange
    if (data && typeof data === 'string' && data.includes('arenaCheckTargetRange')) {
      console.log('[BLOCKED] arenaCheckTargetRange request blocked:', this._url);
      // Don't send the request
      return;
    }

    if (isCapturing && this._url && this._url.includes('heroes-fb.nextersglobal.com/api')) {
      lastHeaders = { ...this._headers };
      updateUIStatus('Headers captured ✓');
    }
    return originalSend.apply(this, arguments);
  };

  // Send authenticated request
  function sendAuthenticatedRequest(requestBody, callback) {
    if (!lastHeaders["X-Auth-Token"]) {
      console.error('[Error] No headers captured yet.');
      updateUIStatus('Error: No headers captured!');
      return;
    }

    const json = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;

    for (const call of json.calls) {
      if (!call?.context?.actionTs) {
        call.context = {
          actionTs: Math.floor(performance.now())
        };
      }
    }

    const jsonString = JSON.stringify(json);
    let headers = { ...lastHeaders };
    headers["X-Request-Id"] = (parseInt(headers["X-Request-Id"]) || 0) + 1;
    headers["X-Auth-Signature"] = getSignature(headers, jsonString);

    console.log('[Attack] Sending request...');

    let xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl, true);
    xhr.responseType = 'json';

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        console.log('[Response]', xhr.status, xhr.response);
        if (callback) callback(xhr.response, xhr.status);
      }
    };

    for (let name in headers) {
      xhr.setRequestHeader(name, headers[name]);
    }

    xhr.send(jsonString);
  }

  // Execute attack
  function executeAttack(timestamp) {
    const attackRequest = {
      calls: [{
        name: ATTACK_CONFIG.name,
        args: ATTACK_CONFIG.args,
        context: {
          actionTs: timestamp || Math.floor(performance.now())
        },
        ident: "body"
      }]
    };

    updateUIStatus('Attacking...');
    sendAuthenticatedRequest(attackRequest, (response, status) => {
      if (status === 200) {
        updateUIStatus('Attack sent successfully! ✓');
      } else {
        updateUIStatus(`Attack failed (${status})`);
      }
    });
  }

  // Schedule attack based on timezone and hour
  function scheduleAttackByTime(timezone, targetHour) {
    if (scheduledTimeout) {
      clearTimeout(scheduledTimeout);
    }

    // Calculate target time in UTC
    const now = new Date();
    const targetDate = new Date();

    // Set target time to specified hour in target timezone
    targetDate.setHours(targetHour, 0, 0, 0);

    // Adjust for timezone offset
    const localOffset = now.getTimezoneOffset(); // minutes
    const targetOffset = -timezone * 60; // convert to minutes, negative because UTC is subtracted
    const offsetDiff = targetOffset - localOffset;

    targetDate.setMinutes(targetDate.getMinutes() + offsetDiff);

    // Subtract 500ms for early execution
    const attackTime = new Date(targetDate.getTime() - 500);

    // If target time has passed today, schedule for tomorrow
    if (attackTime <= now) {
      attackTime.setDate(attackTime.getDate() + 1);
    }

    const delay = attackTime - now;

    console.log('[Schedule] Target time:', attackTime.toLocaleString());
    console.log('[Schedule] Current time:', now.toLocaleString());
    console.log('[Schedule] Delay:', Math.floor(delay / 1000), 'seconds');

    updateUIStatus(`Scheduled for ${attackTime.toLocaleTimeString()}`);
    updateCountdown(delay);

    scheduledTimeout = setTimeout(() => {
      executeAttack();
      updateUIStatus('Attack executed!');
    }, delay);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      const remaining = attackTime - new Date();
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        updateCountdown(0);
      } else {
        updateCountdown(remaining);
      }
    }, 100);
  }

  // Create UI
  function createUI() {
    const container = document.createElement('div');
    container.id = 'api-tester-ui';
    container.innerHTML = `
            <style>
                #api-tester-ui {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    min-width: 320px;
                    color: white;
                }
                #api-tester-ui h3 {
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                    text-align: center;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                #api-tester-ui .input-group {
                    margin-bottom: 12px;
                }
                #api-tester-ui label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 13px;
                    font-weight: 500;
                    opacity: 0.9;
                }
                #api-tester-ui input {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    background: rgba(255,255,255,0.95);
                    color: #333;
                }
                #api-tester-ui button {
                    width: 100%;
                    padding: 12px;
                    margin-top: 10px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                #api-tester-ui .btn-schedule {
                    background: #10b981;
                    color: white;
                }
                #api-tester-ui .btn-schedule:hover {
                    background: #059669;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(16,185,129,0.4);
                }
                #api-tester-ui .btn-attack {
                    background: #ef4444;
                    color: white;
                }
                #api-tester-ui .btn-attack:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(239,68,68,0.4);
                }
                #api-tester-ui .btn-cancel {
                    background: #6b7280;
                    color: white;
                    margin-top: 5px;
                }
                #api-tester-ui .btn-cancel:hover {
                    background: #4b5563;
                }
                #api-tester-ui .status {
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 6px;
                    font-size: 12px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }
                #api-tester-ui .countdown {
                    font-size: 24px;
                    font-weight: bold;
                    text-align: center;
                    margin: 15px 0;
                    padding: 15px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 2px;
                }
                #api-tester-ui .toggle {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 30px;
                    height: 30px;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                #api-tester-ui .toggle:hover {
                    background: rgba(255,255,255,0.3);
                }
                #api-tester-ui.minimized .content {
                    display: none;
                }
                #api-tester-ui.minimized {
                    min-width: auto;
                    padding: 10px 15px;
                }
            </style>
            <button class="toggle" onclick="this.parentElement.classList.toggle('minimized')">−</button>
            <div class="content">
                <h3>⚔️ Attack Scheduler</h3>
                <div class="input-group">
                    <label>Timezone (UTC offset)</label>
                    <input type="number" id="timezone-input" value="7" min="-12" max="14" step="1">
                </div>
                <div class="input-group">
                    <label>Target Hour (0-23)</label>
                    <input type="number" id="hour-input" value="21" min="0" max="23" step="1">
                </div>
                <button class="btn-schedule" onclick="window.scheduleAttackFromUI()">Schedule Attack</button>
                <button class="btn-attack" onclick="window.attackNow()">Attack Now</button>
                <button class="btn-cancel" onclick="window.cancelSchedule()">Cancel Schedule</button>
                <div class="countdown" id="countdown-display">--:--:--</div>
                <div class="status" id="status-display">Waiting for action...</div>
            </div>
        `;
    document.body.appendChild(container);
  }

  // Update UI status
  function updateUIStatus(message) {
    const statusEl = document.getElementById('status-display');
    if (statusEl) {
      statusEl.textContent = message;
    }
    console.log('[Status]', message);
  }

  // Update countdown display
  function updateCountdown(ms) {
    const countdownEl = document.getElementById('countdown-display');
    if (!countdownEl) return;

    if (ms <= 0) {
      countdownEl.textContent = '00:00:00.000';
      return;
    }

    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    countdownEl.textContent =
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  // Window functions for UI buttons
  window.scheduleAttackFromUI = function () {
    const timezone = parseInt(document.getElementById('timezone-input').value);
    const hour = parseInt(document.getElementById('hour-input').value);
    scheduleAttackByTime(timezone, hour);
  };

  window.attackNow = function () {
    executeAttack();
  };

  window.cancelSchedule = function () {
    if (scheduledTimeout) {
      clearTimeout(scheduledTimeout);
      scheduledTimeout = null;
      updateUIStatus('Schedule cancelled');
      updateCountdown(0);
    }
  };

  // Expose API
  window.GameAPITester = {
    attack: () => executeAttack(),
    attackAt: (timestamp) => executeAttack(timestamp),
    scheduleAttack: (timestamp) => scheduleAttackByTime(timestamp),
    sendRequest: (requestBody, callback) => sendAuthenticatedRequest(requestBody, callback),
    getHeaders: () => lastHeaders,
    getTimestamp: () => Math.floor(performance.now()),
    setAttackConfig: (config) => Object.assign(ATTACK_CONFIG.args, config),
    getAttackConfig: () => ATTACK_CONFIG
  };

  // Initialize UI when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }

  console.log('='.repeat(60));
  console.log('[Game API Tester] Loaded with UI!');
  console.log('='.repeat(60));
})();