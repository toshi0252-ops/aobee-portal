# AOBEE CITY v2.9.4 — Issue #76

## Changes

- Retrieved the exact approved `aobee_city_title.webp` attachment from the original ChatGPT conversation. Original bytes are retained (372,604 bytes); no substitute title was generated.
- Title illustration and menu now occupy separate responsive grid cells. The entire approved illustration remains visible in portrait and landscape.
- Fixed the existing `art-ready` CSS overriding the title screen's `hidden` state, which left the title intercepting input after starting the game.
- Added seven dedicated scenario illustrations and one grand finale, with the approved title as character/style reference. Built-in ImageGen was used; prompts are recorded in `games/art/aobee_city_art.json`. Each scenario shares its illustration between selection and its ending. Text and buttons remain HTML.
- Added meaningful image descriptions, uncropped scene display, and an explicit grand finale heading. Canvas fallback remains available if images fail to load.
- Free development after an ending now clears `won`, allowing annual policy events again. Previously `offerPolicy()` remained disabled forever after a victory.
- Corrected the advisor's power-plant capacity description from 180 to the actual 240.

## Verification

Edge/Chromium with Playwright, isolated browser storage, deterministic random seeds. Construction uses the game's `buildBatch()` API and pays real costs, obeying population unlocks. No injected money, pre-grown zones, weakened goals, or disabled disasters in the campaign runs.

| Scenario | Clear month | Population | Happiness |
| --- | ---: | ---: | ---: |
| はじまりの街 | 8 | 540 | 87 |
| 赤字都市を救え！ | 19 | 528 | 61 |
| 緑と共に暮らす街 | 31 | 2,448 | 90 |
| 渋滞パニック | 12 | 1,536 | 96 |
| 観光都市あおびー | 29 | 3,048 | 91 |
| 災害からの復興 | 8 | 1,728 | 90 |
| 星に届く大都市 | 49 | 10,128 | 91 |

- Traffic also clears with seeds 7 and 123 in months 30 and 12. Seed 7 fails the traffic threshold initially and only wins after a later continuous 12-month interval. Saving/reloading at month 6 preserves the streak.
- Separate regression verifies railway disconnection resets the streak, 11 months do not clear, month 12 clears, and a version-8 save without newer fields loads with safe defaults.
- Additional 360 months of free development from the legitimately cleared metropolis: population 11,016, cash 4,838,244, happiness 86; 30 policy decisions, 5 storm proposals, and 16 months containing fire-event messages. Disasters stayed enabled. History remains bounded to 360 months.
- All 16 substantive policy choices execute without invalidating city state.
- Viewports: 320×568, 390×844, 568×320, 844×390, 1440×900. Title/menu never overlap or leave the viewport. Actual touchscreen taps build roads; CDP touchscreen drags pan and release pointer state.
- At every viewport, BGM toggles on with a running AudioContext, build SFX schedules without errors, and volume/SFX preferences persist. This verifies the audio path and settings, not listening quality on physical speakers.
- All seven scenario images, all seven endings, staff-roll progression, grand finale, scenario start, and title/scenario image-failure fallbacks pass browser checks. Rendered screenshots were visually inspected.

## Reproduce

With Node and Playwright available (use the host's bundled packages if necessary), from the repository root:

```text
node tests/city-campaign.cjs
node tests/city-regression.cjs
node tests/city-browser.cjs
node tests/city-endings.cjs
```

`CITY_SCENARIOS=traffic` and `CITY_SEED=7`/`123` select the additional campaign cases. Run the default campaign first to produce both saves required by regression. JSON results are in `verification/city/`; generated screenshots and saves are ignored.

## Release boundary

This is an implementation and automated QA result, not a claim of commercial equivalence or user acceptance. Physical iPhone/Android testing and listening on actual speakers have not been performed. Keep the existing development URL; formal portal listing remains pending that final quality review. Existing games and portal entries are untouched; save version and storage keys are unchanged.
