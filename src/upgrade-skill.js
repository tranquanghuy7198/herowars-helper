// Configuration
const minutes = 5;
const seconds = 30;
const intervalMs = (minutes * 60 + seconds) * 1000;

// Persistent state
let requestId = 100;
const sessionNumber = 55; // This can be randomized or incremented if needed
const sessionId = '0texjwq03dkvgi'; // This can be randomized or kept static if it doesn't expire

console.log(`Starting script: Requesting API every ${minutes}m ${seconds}s...`);

async function runRequest() {
  const performanceTs = Math.floor(performance.now());
  const currentTime = Math.floor(Date.now() / 1000);
  const skill = Math.floor(Math.random() * 4) + 1;

  const url = 'https://heroes-fb.nextersglobal.com/api/';

  const payload = {
    calls: [
      {
        name: "stashClient",
        args: {
          data: [
            {
              type: ".client.button.click",
              params: {
                actionTs: performanceTs,
                windowName: "global",
                buttonName: "heroes",
                timestamp: currentTime,
                sessionNumber: sessionNumber,
                windowCounter: 0,
                assetsReloadNum: 0,
                assetsType: "cache",
                assetsLoadingPercent: 0,
                assetsLoadingTime: 0
              }
            },
            {
              type: ".client.window.open",
              params: {
                actionTs: performanceTs + 4,
                windowName: "heroes",
                prevWindowName: "global",
                prevButtonName: "heroes",
                prevActionName: ".client.button.click",
                timestamp: currentTime,
                sessionNumber: sessionNumber,
                windowCounter: 59,
                assetsReloadNum: 0,
                assetsType: "web",
                assetsLoadingPercent: 0,
                assetsLoadingTime: 64
              }
            }
          ]
        },
        context: {
          actionTs: performanceTs + 1000
        },
        ident: "group_0_body"
      },
      {
        name: "heroUpgradeSkill",
        args: {
          heroId: 60,
          skill: skill
        },
        context: {
          actionTs: performanceTs + 2000
        },
        ident: "group_1_body"
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json; charset=UTF-8',
        'origin': 'https://apps-1701433570146040.apps.fbsbx.com',
        'priority': 'u=1, i',
        'referer': 'https://apps-1701433570146040.apps.fbsbx.com/',
        'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'traceparent': '00-b933d6e4598adb1fa9bee6a69f8d3a75-54bf91cfc09b1fe4-01',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'x-auth-application-id': '1701433570146040',
        'x-auth-network-ident': 'facebook',
        'x-auth-player-id': '11606880',
        'x-auth-session-id': sessionId,
        'x-auth-signature': '45f18e45c74d080a8da87901bc49f77e',
        'x-auth-token': 'ps-VlymD/gCiROrpwucKsokFdGaQZNJbtnqfLHPxYzMEWeBXh-1778597736-14.191.164.73-34fde6501e7ce3ec667bd7db290c0358',
        'x-auth-user-id': '177353923436625',
        'x-env-library-version': '1',
        'x-request-id': requestId.toString(),
        'x-requested-with': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload)
    });

    const logTime = new Date().toLocaleString();

    if (!response.ok) {
      // This specifically catches 400, 401, 500, etc.
      const errorBody = await response.text();
      console.error(`[${logTime}] HTTP Error ${response.status}: ${errorBody}`);
    } else {
      const data = await response.json();
      console.log(`[${logTime}] Success! ID: ${requestId} | Skill: ${skill}`);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleString()}] Network/System Error:`, err.message);
  } finally {
    // Increment regardless of success/fail
    requestId += 100;
  }
}

// Start
runRequest();
setInterval(runRequest, intervalMs);