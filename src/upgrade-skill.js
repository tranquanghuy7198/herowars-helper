const { exec } = require('child_process');

// Configuration
const url = 'https://example.com';
const minutes = 5;
const seconds = 30;
const intervalMs = (minutes * 60 + seconds) * 1000; // Convert to milliseconds

console.log(`Starting: Requesting ${url} every ${minutes}m ${seconds}s...`);

function runCurl() {
  const performanceTs = Math.floor(performance.now())
  const currentTime = Math.floor(Date.now() / 1000);
  const skill = Math.floor(Math.random() * 4) + 1; // Random skill between 1 and 4
  const command = `curl --location 'https://heroes-fb.nextersglobal.com/api/' \
    --header 'accept: */*' \
    --header 'accept-language: en-US,en;q=0.9' \
    --header 'content-type: application/json; charset=UTF-8' \
    --header 'origin: https://apps-1701433570146040.apps.fbsbx.com' \
    --header 'priority: u=1, i' \
    --header 'referer: https://apps-1701433570146040.apps.fbsbx.com/' \
    --header 'sec-ch-ua: "Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"' \
    --header 'sec-ch-ua-mobile: ?0' \
    --header 'sec-ch-ua-platform: "macOS"' \
    --header 'sec-fetch-dest: empty' \
    --header 'sec-fetch-mode: cors' \
    --header 'sec-fetch-site: cross-site' \
    --header 'traceparent: 00-b933d6e4598adb1fa9bee6a69f8d3a75-54bf91cfc09b1fe4-01' \
    --header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36' \
    --header 'x-auth-application-id: 1701433570146040' \
    --header 'x-auth-network-ident: facebook' \
    --header 'x-auth-player-id: 11606880' \
    --header 'x-auth-session-id: 0texiso0ym407t' \
    --header 'x-auth-session-key;' \
    --header 'x-auth-signature: 45f18e45c74d080a8da87901bc49f77e' \
    --header 'x-auth-token: ps-VlymD/gCiROrpwucKsokFdGaQZNJbtnqfLHPxYzMEWeBXh-1778597736-14.191.164.73-34fde6501e7ce3ec667bd7db290c0358' \
    --header 'x-auth-user-id: 177353923436625' \
    --header 'x-env-library-version: 1' \
    --header 'x-env-unique-session-id: null' \
    --header 'x-full-referer: https://apps-1701433570146040.apps.fbsbx.com/br-compress-instant-bundle/br/648494677267229/25518291007825203/index.html?is_shield_env=0&version=34&nonnull_share_payload=0&gcgs=0&should_log_unsafe_numbers=1&use_generic_dialog_for_switch_async=1&use_generic_dialog_for_create_async=1&use_pass_through_for_coplay_custom_update=1&include_share_link_async=0&include_video_plugin_get_content_id_async=0&include_ar_navigate_to_camera_with_effect_async=0&include_room_clear_camera_effect_async=0&include_context_is_public_async=0&include_is_ad_break_test=0&include_register_screenshot_provider=0&use_bridge_for_coplay_custom_update=0&gtiaa=nq&environment_type=standard&intr_en=1&iaa_u_intent=HIGH&iaa_b_ads=0&iaa_ux_score=0&csp_cache=2&IsMobileWeb=0&cloud_host_override[cluster]&cloud_host_override[host]&cloud_host_override[hostname]&cloud_host_override[pop]&cloud_host_override[port]&cloud_host_override[site_key]&cloud_host_override[site_keys]&cloud_host_override[sp_tier]&cloud_host_override[target]&cloud_host_override[targets]&context_source_id&custom_update_id&entry_point=fb_gg_url&source=fbinstant-1701433570146040' \
    --header 'x-request-id: 35' \
    --header 'x-requested-with: XMLHttpRequest' \
    --header 'x-server-time: 0' \
    --data '{
        "calls": [
            {
                "name": "stashClient",
                "args": {
                    "data": [
                        {
                            "type": ".client.button.click",
                            "params": {
                                "actionTs": ${performanceTs},
                                "windowName": "global",
                                "buttonName": "heroes",
                                "timestamp": ${currentTime},
                                "sessionNumber": 51,
                                "windowCounter": 0,
                                "assetsReloadNum": 0,
                                "assetsType": "cache",
                                "assetsLoadingPercent": 0,
                                "assetsLoadingTime": 0
                            }
                        },
                        {
                            "type": ".client.window.open",
                            "params": {
                                "actionTs": ${performanceTs + 4},
                                "windowName": "heroes",
                                "prevWindowName": "global",
                                "prevButtonName": "heroes",
                                "prevActionName": ".client.button.click",
                                "timestamp": ${currentTime},
                                "sessionNumber": 51,
                                "windowCounter": 59,
                                "assetsReloadNum": 0,
                                "assetsType": "web",
                                "assetsLoadingPercent": 0,
                                "assetsLoadingTime": 64
                            }
                        }
                    ]
                },
                "context": {
                    "actionTs": ${performanceTs + 1000}
                },
                "ident": "group_0_body"
            },
            {
                "name": "heroUpgradeSkill",
                "args": {
                    "heroId": 60,
                    "skill": ${skill}
                },
                "context": {
                    "actionTs": ${performanceTs + 2000}
                },
                "ident": "group_1_body"
            }
        ]
    }'
  `;

  exec(command, (error, stdout, stderr) => {
    const timestamp = new Date().toLocaleString();

    if (error) {
      console.error(`[${timestamp}] Error: ${error.message}`);
      return;
    }

    console.log(`[${timestamp}] Response Status: ${stdout}`);
  });
}

// Run once immediately, then start the interval
runCurl();
setInterval(runCurl, intervalMs);