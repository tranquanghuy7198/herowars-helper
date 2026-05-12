// ==UserScript==
// @name         Hero Wars Automator (Refresh Loop)
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Upgrade -> Wait 5m 10s -> Refresh Tab
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
  let isActionTaken = false;

  // Load persistent data from storage (so it survives the refresh)
  const getStoredTime = () => localStorage.getItem('hw_last_success') || "Never";
  const setStoredTime = (val) => localStorage.setItem('hw_last_success', val);
  const getStoredLog = () => localStorage.getItem('hw_last_log') || "Wait for Hero click...";
  const setStoredLog = (val) => localStorage.setItem('hw_last_log', val);

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
            pointer-events: none; box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
            border-radius: 6px; line-height: 1.5; min-width: 220px;
        `;
    hud.innerHTML = `
            <div style="color: #fff; font-weight: bold; border-bottom: 1px solid #444; margin-bottom: 5px;">[HW_BOT_REFRESHER]</div>
            Status: <span id="bot-status" style="color: #ff0;">Scanning...</span><br>
            <div id="bot-log" style="color: #aaa;">${getStoredLog()}</div>
            <div style="margin-top: 8px; border-top: 1px dashed #444; padding-top: 5px;">
                <div id="bot-timestamp" style="color: #888; font-size: 10px;">Last Success: ${getStoredTime()}</div>
            </div>
        `;
    container.appendChild(hud);
  }

  function updateBot(status, log, timestamp = null) {
    if (document.getElementById('bot-status')) document.getElementById('bot-status').innerText = status;
    if (document.getElementById('bot-log')) {
      document.getElementById('bot-log').innerText = log;
      setStoredLog(log);
    }
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

        // Only start the sequence once per page load
        if (!isActionTaken) {
          isActionTaken = true;
          updateBot("CAPTURED", "Executing upgrade...");
          setTimeout(executeAndScheduleRefresh, 2000); // Small delay to let game settle
        }
      }
    }
    return originalSend.apply(this, arguments);
  };

  // Boilerplate for header capture
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { this._url = u; this._headers = {}; return originalOpen.apply(this, arguments); };
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (n, v) { if (!this._headers) this._headers = {}; this._headers[n] = v; return originalSetHeader.apply(this, arguments); };

  // --- 3. The Refresh Strategy ---
  async function executeAndScheduleRefresh() {
    if (!lastHeaders) return;

    lastRequestId += 15;
    const targetHero = 60;
    const randomSkill = Math.floor(Math.random() * 4) + 1;

    const payload = {
      calls: [{
        name: "heroUpgradeSkill",
        args: { heroId: targetHero, skill: randomSkill },
        ident: "refresh_bot_upgrade"
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
        updateBot("SUCCESS", `Hero[${targetHero}] Skill[${randomSkill}]`, time);

        // --- THE REFRESH LOGIC ---
        let countdown = 310; // 5 minutes 10 seconds
        const timer = setInterval(() => {
          countdown--;
          const mins = Math.floor(countdown / 60);
          const secs = countdown % 60;
          updateBot("WAITING", `Refreshing in ${mins}m ${secs}s...`);

          if (countdown <= 0) {
            clearInterval(timer);
            location.reload(); // Refresh the tab
          }
        }, 1000);

      } else {
        updateBot("FAILED", "Server rejected upgrade. Retrying in 30s...");
        setTimeout(() => location.reload(), 30000);
      }
    } catch (e) {
      updateBot("ERROR", "Network error. Retrying in 30s...");
      setTimeout(() => location.reload(), 30000);
    }
  }

  injectUI();
})();