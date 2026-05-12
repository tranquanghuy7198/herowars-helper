// ==UserScript==
// @name         Hero Wars Automator (Detailed Logging)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Intercepts session and logs Hero ID + Skill on screen
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

  // --- 1. UI Injection ---
  function injectUI() {
    if (document.getElementById('hw-automator-hud')) return;
    const container = document.body || document.documentElement;
    if (!container) return setTimeout(injectUI, 100);

    const hud = document.createElement('div');
    hud.id = 'hw-automator-hud';
    hud.style = `
            position: fixed; top: 20px; left: 20px; z-index: 999999; 
            background: rgba(17, 17, 17, 0.95); color: #0f0; 
            border: 1px solid #0f0; padding: 12px; 
            font-family: 'Courier New', monospace; font-size: 12px; 
            pointer-events: none; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            border-radius: 4px; line-height: 1.6;
        `;
    hud.innerHTML = `
            <div style="color: #fff; font-weight: bold; border-bottom: 1px solid #0f0; margin-bottom: 5px;">[HW_BOT_V3.1]</div>
            Status: <span id="bot-status" style="color: #ff0;">Scanning...</span><br>
            <div id="bot-log" style="color: #aaa; margin-top: 5px;">Wait for game activity...</div>
            <div id="bot-last-upgrade" style="color: #0ff; margin-top: 5px; font-weight: bold;"></div>
        `;
    container.appendChild(hud);
  }

  function updateBot(status, log, upgradeInfo = "") {
    if (document.getElementById('bot-status')) document.getElementById('bot-status').innerText = status;
    if (document.getElementById('bot-log')) document.getElementById('bot-log').innerText = log;
    if (document.getElementById('bot-last-upgrade')) document.getElementById('bot-last-upgrade').innerHTML = upgradeInfo;
  }

  // --- 2. XHR Proxying ---
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (data) {
    if (this._url && this._url.includes('nextersglobal.com/api/')) {
      if (this._headers && this._headers["X-Auth-Token"]) {
        lastHeaders = { ...this._headers };
        const reqId = parseInt(this._headers["X-Request-Id"]) || 0;
        if (reqId > lastRequestId) lastRequestId = reqId;

        if (!isLoopRunning) {
          isLoopRunning = true;
          updateBot("CAPTURED", "Starting automation...");
          setTimeout(startAutomation, 5000);
        }
      }
    }
    return originalSend.apply(this, arguments);
  };

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

  // --- 3. Automation Loop ---
  async function startAutomation() {
    const intervalMs = (5 * 60 + 30) * 1000;

    async function doUpgrade() {
      if (!lastHeaders) return;

      lastRequestId += 10;
      const targetHero = 60;
      const randomSkill = Math.floor(Math.random() * 4) + 1;

      const payload = {
        calls: [{
          name: "heroUpgradeSkill",
          args: { heroId: targetHero, skill: randomSkill },
          context: { actionTs: Math.floor(performance.now()) },
          ident: "bot_upgrade"
        }]
      };

      try {
        const res = await fetch('https://heroes-fb.nextersglobal.com/api/', {
          method: 'POST',
          headers: { ...lastHeaders, "X-Request-Id": lastRequestId.toString() },
          body: JSON.stringify(payload)
        });

        const time = new Date().toLocaleTimeString();

        if (res.ok) {
          updateBot(
            "ACTIVE",
            `Last Sync: ${time}`,
            `LATEST: Hero[${targetHero}] Skill[${randomSkill}] ✓`
          );
        } else {
          updateBot("ERROR", `Status ${res.status}`, "Request Rejected");
        }
      } catch (e) {
        updateBot("OFFLINE", "Network Error", e.message);
      }
    }

    // Run once immediately, then interval
    doUpgrade();
    setInterval(doUpgrade, intervalMs);
  }

  injectUI();
})();