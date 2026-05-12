// ==UserScript==
// @name         Hero Wars Automator (Forced Refresh)
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Forced reload every 5m 10s regardless of request outcome
// @author       Gemini
// @match        *://*.hero-wars.com/*
// @match        *://*.nextersglobal.com/*
// @match        *://apps-1701433570146040.apps.fbsbx.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  let lastHeaders = null;
  let lastRequestId = 0;
  let sequenceStarted = false;

  // Persistent storage helpers
  const getStoredTime = () => localStorage.getItem('hw_last_success') || "Never";
  const setStoredTime = (val) => localStorage.setItem('hw_last_success', val);

  // --- 1. UI Injection ---
  function injectUI() {
    if (document.getElementById('hw-automator-hud')) return;
    const container = document.body || document.documentElement;
    if (!container) return setTimeout(injectUI, 100);

    const hud = document.createElement('div');
    hud.id = 'hw-automator-hud';
    hud.style = `
            position: fixed; top: 20px; left: 20px; z-index: 999999; 
            background: rgba(10, 10, 10, 0.95); color: #0f0; 
            border: 1px solid #0f0; padding: 12px; 
            font-family: 'Courier New', monospace; font-size: 12px; 
            pointer-events: none; border-radius: 6px; line-height: 1.5; min-width: 230px;
        `;
    hud.innerHTML = `
            <div style="color: #fff; font-weight: bold; border-bottom: 1px solid #444; margin-bottom: 5px;">[HW_BOT_FORCED]</div>
            Status: <span id="bot-status" style="color: #ff0;">Scanning...</span><br>
            <div id="bot-log" style="color: #aaa;">Wait for Hero click...</div>
            <div style="margin-top: 8px; border-top: 1px dashed #444; padding-top: 5px;">
                <div id="bot-timestamp" style="color: #888; font-size: 10px;">Last Success: ${getStoredTime()}</div>
            </div>
        `;
    container.appendChild(hud);
  }

  function updateBot(status, log, timestamp = null) {
    if (document.getElementById('bot-status')) document.getElementById('bot-status').innerText = status;
    if (document.getElementById('bot-log')) document.getElementById('bot-log').innerText = log;
    if (timestamp && document.getElementById('bot-timestamp')) {
      document.getElementById('bot-timestamp').innerText = `Last Success: ${timestamp}`;
      setStoredTime(timestamp);
    }
  }

  // --- 2. XHR Interception ---
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (data) {
    if (this._url && this._url.includes('nextersglobal.com/api/')) {
      if (this._headers && this._headers["X-Auth-Token"]) {
        lastHeaders = { ...this._headers };
        const reqId = parseInt(this._headers["X-Request-Id"]) || 0;
        if (reqId > lastRequestId) lastRequestId = reqId;

        if (!sequenceStarted) {
          sequenceStarted = true;
          startForcedSequence();
        }
      }
    }
    return originalSend.apply(this, arguments);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { this._url = u; this._headers = {}; return originalOpen.apply(this, arguments); };
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (n, v) { if (!this._headers) this._headers = {}; this._headers[n] = v; return originalSetHeader.apply(this, arguments); };

  // --- 3. The Forced Sequence ---
  async function startForcedSequence() {
    // 1. Trigger the countdown immediately
    let countdown = 310; // 5 mins 10 secs
    const timer = setInterval(() => {
      countdown--;
      const mins = Math.floor(countdown / 60);
      const secs = countdown % 60;
      updateBot("FORCED LOOP", `Reloading in ${mins}m ${secs}s...`);

      if (countdown <= 0) {
        clearInterval(timer);
        location.reload();
      }
    }, 1000);

    // 2. Fire the upgrade request after a 3s safety delay
    setTimeout(async () => {
      if (!lastHeaders) return;

      lastRequestId += 20;
      const payload = {
        calls: [{
          name: "heroUpgradeSkill",
          args: { heroId: 60, skill: Math.floor(Math.random() * 4) + 1 },
          ident: "forced_bot_call"
        }]
      };

      try {
        const res = await fetch('https://heroes-fb.nextersglobal.com/api/', {
          method: 'POST',
          headers: { ...lastHeaders, "X-Request-Id": lastRequestId.toString() },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const time = new Date().toLocaleTimeString();
          updateBot("FORCED LOOP", `Upgrade Sent!`, time);
        } else {
          console.error("Upgrade request failed, waiting for reload...");
        }
      } catch (e) {
        console.error("Network error during upgrade:", e);
      }
    }, 3000);
  }

  injectUI();
})();