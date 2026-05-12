// ==UserScript==
// @name         Hero Wars Automator (Helper Edition)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Uses Function Proxying to capture session and automate
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
  let isLoopRunning = false;

  // --- 1. Aggressive UI Injection ---
  // Instead of waiting for 'load', we try to inject as soon as document.documentElement exists
  function injectUI() {
    if (document.getElementById('hw-automator-hud')) return;
    const container = document.body || document.documentElement;
    if (!container) return setTimeout(injectUI, 100);

    const hud = document.createElement('div');
    hud.id = 'hw-automator-hud';
    hud.style = `position:fixed; top:20px; left:20px; z-index:999999; background:#111; color:#0f0; border:1px solid #0f0; padding:10px; font-family:monospace; font-size:12px; pointer-events:none; box-shadow:0 0 15px #0f0;`;
    hud.innerHTML = `[HW_BOT] Status: <span id="bot-status">Scanning...</span><br>[LOG]: <span id="bot-log">Wait for Hero click</span>`;
    container.appendChild(hud);
  }

  function updateBot(status, log) {
    if (document.getElementById('bot-status')) document.getElementById('bot-status').innerText = status;
    if (document.getElementById('bot-log')) document.getElementById('bot-log').innerText = log;
  }

  // --- 2. Request Interception (HeroWarsHelper Method) ---
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (data) {
    // HeroWarsHelper monitors nextersglobal API calls specifically
    if (this._url && this._url.includes('nextersglobal.com/api/')) {
      const token = this._headers && this._headers["X-Auth-Token"];
      const sign = this._headers && this._headers["X-Auth-Signature"];

      if (token && sign) {
        lastHeaders = { ...this._headers };
        const reqId = parseInt(this._headers["X-Request-Id"]) || 0;
        if (reqId > lastRequestId) lastRequestId = reqId;

        if (!isLoopRunning) {
          isLoopRunning = true;
          updateBot("CAPTURED", "Starting loop in 5s");
          setTimeout(startAutomation, 5000);
        }
      }
    }
    return originalSend.apply(this, arguments);
  };

  // Proxy the 'open' and 'setRequestHeader' to catch metadata
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    this._headers = {};
    return originalOpen.apply(this, arguments);
  };

  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (n, v) {
    if (!this._headers) this._headers = {};
    this._headers[n] = v;
    return originalSetHeader.apply(this, arguments);
  };

  // --- 3. The Automation Engine ---
  async function startAutomation() {
    setInterval(async () => {
      if (!lastHeaders) return;

      // Increment Req ID (Game logic often checks for sequential IDs)
      lastRequestId += 1;

      const payload = {
        calls: [{
          name: "heroUpgradeSkill",
          args: { heroId: 60, skill: 1 }, // Defaulting to Galahad/Hero 60
          ident: "bot_upgrade"
        }]
      };

      try {
        const res = await fetch('https://heroes-fb.nextersglobal.com/api/', {
          method: 'POST',
          headers: { ...lastHeaders, "X-Request-Id": lastRequestId.toString() },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          updateBot("ACTIVE", "Upgrade Success @ " + new Date().toLocaleTimeString());
        }
      } catch (e) {
        updateBot("ERROR", "Check Console");
      }
    }, (5 * 60 + 30) * 1000); // 5.5 minutes
  }

  // Run UI injection
  injectUI();
})();