// ==UserScript==
// @name         Hero Wars XHR Interceptor & Auto-Upgrade
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Intercepts XHR headers and automates skill upgrades
// @match        https://www.hero-wars.com/*
// @match        https://apps-1701433570146040.apps.fbsbx.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  let lastHeaders = {};
  let lastRequestId = 0;
  let isLoopRunning = false;

  // 1. CREATE HUD UI
  const hud = document.createElement('div');
  hud.style = `position: fixed; top: 10px; right: 10px; z-index: 999999; background: rgba(0, 0, 0, 0.9); color: #fff; padding: 15px; border: 2px solid #ef4444; border-radius: 8px; font-family: 'Segoe UI', sans-serif; font-size: 13px; min-width: 220px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);`;
  hud.innerHTML = `
        <div style="font-weight: bold; border-bottom: 1px solid #444; margin-bottom: 8px; color: #ef4444; text-align: center;">UPGRADE AUTOMATOR</div>
        <div id="hw-status" style="text-align: center;">Interacting with game...</div>
        <div id="hw-details" style="margin-top: 8px; font-size: 11px; color: #aaa; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;">Waiting for XHR capture...</div>
    `;
  document.body.appendChild(hud);

  function updateHud(status, details = "") {
    document.getElementById('hw-status').innerHTML = status;
    if (details) document.getElementById('hw-details').innerHTML = details;
  }

  // 2. XHR INTERCEPTOR LOGIC (Targeting the Game's actual request method)
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    this._headers = {};
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    this._headers[name] = value;
    return originalSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (data) {
    if (this._url && this._url.includes('nextersglobal.com/api/')) {
      // Check if headers are valid
      if (this._headers["X-Auth-Token"]) {
        lastHeaders = { ...this._headers };

        const currentId = parseInt(this._headers["X-Request-Id"]) || 0;
        if (currentId > lastRequestId) lastRequestId = currentId;

        if (!isLoopRunning) {
          isLoopRunning = true;
          updateHud("<span style='color: #10b981;'>✓ Data Captured</span>", "Starting auto-loop in 5s...");
          setTimeout(startAutomation, 5000);
        }
      }
    }
    return originalSend.apply(this, arguments);
  };

  // 3. THE AUTOMATED REQUEST
  async function startAutomation() {
    const intervalMs = (5 * 60 + 30) * 1000;

    async function runUpgrade() {
      // Use the logic from your sample: current ID + increment
      lastRequestId += 100;

      const skill = Math.floor(Math.random() * 4) + 1;
      const heroId = 60;

      const payload = {
        calls: [{
          name: "heroUpgradeSkill",
          args: { heroId: heroId, skill: skill },
          context: { actionTs: Math.floor(performance.now()) },
          ident: "auto_upgrade_call"
        }]
      };

      // Prepare headers with the fresh Request ID
      const headersToSend = {
        ...lastHeaders,
        "X-Request-Id": lastRequestId.toString()
      };

      try {
        // Use built-in fetch to send the upgrade
        const response = await fetch('https://heroes-fb.nextersglobal.com/api/', {
          method: 'POST',
          headers: headersToSend,
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const time = new Date().toLocaleTimeString();
          updateHud(
            "<span style='color: #10b981;'>Upgrade Sent!</span>",
            `Time: ${time}<br>Hero: ${heroId} | Skill: ${skill}<br>Req ID: ${lastRequestId}`
          );
        } else {
          updateHud("<span style='color: #ef4444;'>Error: " + response.status + "</span>", "Check console for details.");
        }
      } catch (e) {
        updateHud("<span style='color: #ef4444;'>Network Fail</span>");
      }
    }

    runUpgrade();
    setInterval(runUpgrade, intervalMs);
  }
})();