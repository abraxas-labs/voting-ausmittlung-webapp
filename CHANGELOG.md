# ✨ Changelog (`v3.28.1`)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Info

```text
This version -------- v3.28.1
Previous version ---- v3.27.8
Initial version ----- v1.25.0
Total commits ------- 2
```

## [v3.28.1] - 2026-03-25

### 🔄 Changed

- keep proportional election ballot cache up to date

## [v3.28.0] - 2026-03-23

### 🔄 Changed

- e-counting import flow without deleting previous imports

## [v3.27.8] - 2026-03-06

### 🔄 Changed

- updated system busy and bundle does not exist yet text

## [v3.27.7] - 2026-03-06

### 🆕 Added

- add polling in the bundle overview if the ui snapshot mismatches

## [v3.27.6] - 2026-03-06

### 🆕 Added

- add bundle detail entry denied option for political businesses

## [v3.27.5] - 2026-03-05

### 🆕 Added

- Introduced a configurable delay for post-processing handlers when receiving events via the watch endpoint. This ensures that data fetched from the backend reflects the latest state under eventual consistency.
  - The delay is controlled via `eventLogConfig.watchDelayMs` and defaults to 0.
  - In environments where eventual consistency applies, set the value to `3 × wal_writer_delay` of the database WAL writer process to guarantee up-to-date data.

## [v3.27.4] - 2026-03-04

### 🔄 Changed

- fix ballot caching for deleted ballots

## [v3.27.3] - 2026-03-04

### 🔄 Changed

- adjusted bundle does not exist info text

## [v3.27.2] - 2026-03-04

### 🔄 Changed

- mitigate race conditions in bundle and ballot views

## [v3.27.1] - 2026-03-03

### 🆕 Added

- add bundle generation action menu item during running pdf generation in case of readonly state so regenerate is possible

## [v3.27.0] - 2026-02-27

### :new: Added

- Introduce a configurable polling mechanism that periodically checks the backend pacing endpoint (/api/status/pacing) for load information.
  - enable polling interval by defining `THROTTLE_POLLING_INTERVAL_SECONDS` in seconds
  - defaults to 0 (disabled)
- Based on the reported delay, gRPC and HTTP interceptors either:
  - pass requests through immediately (delay = 0),
  - delay requests by the specified milliseconds, or
  - block all requests and redirect to a maintenance page (delay = Infinity).

## [v3.26.2] - 2026-02-26

### 🔄 Changed

- allow empty vote ballots on variant ballots

## [v3.26.1] - 2026-02-16

### 🆕 Added

- prevent review of self modified bundle as restricted bundle controller

## [v3.26.0] - 2026-02-16

### 🆕 Added

- remember modified ballot numbers during review

## [v3.25.12] - 2026-02-10

### 🔄 Changed

- hide export if missing permissions

## [v3.25.11] - 2026-02-06

### 🔄 Changed

- hide bundle protocol generate button if no review permmissions

## [v3.25.10] - 2026-02-06

### 🔄 Changed

- extend CD pipeline with enhanced bug bounty publication workflow

## [v3.25.9] - 2026-02-04

### 🔄 Changed

- allow to switch between ballots even when data is invalid

## [v3.25.8] - 2026-02-04

### 🔄 Changed

- correctly delete new ballot

## [v3.25.7] - 2026-02-04

### 🔄 Changed

- allow to delete vote ballot in bundles

## [v3.25.6] - 2026-02-04

### 🔄 Changed

- scrollable candidate list should not receive focus via tab

## [v3.25.5] - 2026-02-04

### 🔄 Changed

- fix shortcuts in vote ballot component

## [v3.25.4] - 2026-01-30

### 🔄 Changed

- live reload on double proportional lot decisions

## [v3.25.3] - 2026-01-27

### 🔄 Changed

- fix previous ballot button

## [v3.25.2] - 2026-01-27

### 🔄 Changed

- show save and validate buttons if user can only enter results

## [v3.25.1] - 2026-01-27

### 🔄 Changed

- allow unspecified for majority ballot group and proportional unmodified lists values

## [v3.25.0] - 2026-01-19

### 🆕 Added

- add canton AR

## [v3.24.3] - 2026-01-12

### 🆕 Added

- add proportional election vote count compared to number of mandates times accounted ballots validation

## [v3.24.2] - 2026-01-09

### 🔄 Changed

- correctly allow bundle export and reviews

## [v3.24.1] - 2026-01-08

### 🔄 Changed

- prevent undefined behavior in double proportional results in union context

## [v3.24.0] - 2026-01-07

### 🔄 Changed

- deactivate check for unique bundle numbers

## [v3.23.4] - 2026-01-05

### 🔄 Changed

- correct live reloading for bundle events

## [v3.23.3] - 2025-12-19

### 🔄 Changed

- improve bundle and ballot related changes

## [v3.23.2] - 2025-12-19

### 🔄 Changed

- remove proportional election double proportional candidate lot decision

## [v3.23.1] - 2025-12-17

### 🆕 Added

- add majority election has candidates validation

## [v3.23.0] - 2025-12-10

### 🔄 Changed

- fix table header alignment for filterable tables

### 🔄 Changed

- allow eCH-0222 only import

### 🔄 Changed

- allow ballot number input when other inputs are invalid

### 🔄 Changed

- better count of voters total label

### ❌ Removed

- remove duplicated bundle number popup

### 🆕 Added

- manual ballot number generation

### 🔄 Changed

- set majority election ballot empty vote count to zero for manual empty vote counting

### 🔄 Changed

- improve proportional election new bundle dialog

### 🔄 Changed

- update base components and angular lib

### 🔄 Changed

- change label for proportional election bundle review card
- change title for bundle overview for majority and proportinoal election

### 🔄 Changed

- show export button on end result page

### 🆕 Added

- show total count of voters per sub total

### 🔄 Changed

- improve bundle layout

### 🔄 Changed

- first ballot should show as number 1, not 0

### 🔄 Changed

- improve unmodified list results layout

### 🔄 Changed

- redirect to monitoring depending on the end result state

### 🆕 Added

- add election lot decision state

### ❌ Removed

- remove missing majority election candidate result validation

### 🔄 Changed

- consider election candidate check digit option

- improve result bundles and ballots

### 🔄 Changed

- consider election candidate check digit option

### 🔄 Changed

- adjust proportional election ballot candidates layout

- angular and base components update

## [v3.22.0] - 2025-12-09

### 🆕 Added

- live reload for e-voting import and display empty counting circles

## [v3.21.0] - 2025-12-03

### 🔄 Changed

- allow eCH-0222 only import

## [v3.20.2] - 2025-11-14

### 🔄 Changed

- show correct proportional candidate end result state after lot decision

## [v3.20.1] - 2025-10-20

### 🆕 Added

- double proportional lot decision feedback improvements

## [v3.20.0] - 2025-10-13

### 🆕 Added

- add majority election candidate reporting type

## [v3.19.2] - 2025-10-07

### 🔄 Changed

- optimize proportional election lot decisions

## [v3.19.1] - 2025-09-30

### 🔄 Changed

- enable optional fields in update counting circle details
- update proto

### 🔄 Changed

- enable optional fields in update counting circle details

### 🔄 Changed

- mandate distribution auto-refresh and finalize fixes

### 🔄 Changed

- use correct button click api

## [v3.19.0] - 2025-09-03

### 🆕 Added

- add 2FA to submission finished and audited tentatively methods

## [v3.18.7] - 2025-08-12

### 🔄 Changed

- change majority election candidate result bar relative ratios

## [v3.18.6] - 2025-08-06

### 🔄 Changed

- improve viewing counting circle exports in monitoring

## [v3.18.5] - 2025-08-06

### 🔄 Changed

- adjust contest detail info layout depending of sub total labels

## [v3.18.4] - 2025-08-06

### 🔄 Changed

- fix contst detail info electorate layout

## [v3.18.3] - 2025-07-28

### 🔄 Changed

- fix(VOTING-6086): error snackbar

## [v3.18.2] - 2025-07-23

### 🔄 Changed

- fix update contest details after counting circle switch

## [v3.18.1] - 2025-07-22

### 🔄 Changed

- fix bc number clear spacing and perentage display

## [v3.18.0] - 2025-07-11

### 🔄 Changed

- bump BC version

## [v3.17.5] - 2025-07-07

### 🔄 Changed

- show export cockpit only if the tenant has export configs

## [v3.17.4] - 2025-07-03

### ❌ Removed

- removed proportional election candidate range removal

## [v3.17.3] - 2025-07-02

### 🔄 Changed

- reset result state timestamps correctly

## [v3.17.2] - 2025-06-30

### 🔄 Changed

- support counting circle result reset with monitoring states

## [v3.17.1] - 2025-06-19

### 🔄 Changed

- hide monitoring cockpit action buttons only if to check filter is set

## [v3.17.0] - 2025-06-16

### 🔄 Changed

- show conventional total voting cards

## [v3.16.1] - 2025-06-16

### 🔄 Changed

- only show monitoring status bar when all states are displayed

## [v3.16.0] - 2025-06-02

### 🔄 Changed

- count of voters sub total with domain of influence type

## [v3.15.0] - 2025-05-27

### 🔄 Changed

- refactor dockerfile
- remove redundant file copies
- add explicit workdir in final image to avoid surprises

### ❌ Removed

- remove entrypoint shell script since its functionality is shifted to the deployment in ops repo

### 🔒 Security

- using explicit nginx user instead of root for copying nginx configs and webroot

## [v3.14.0] - 2025-05-26

### 🆕 Added

- added links to/from erfassung/monitoring exports

### 🔄 Changed

- monitoring cockpit sort filtered counting circle after every filter update

### 🔄 Changed

- monitoring cockpit filters counting circle results by filtered results

### 🔄 Changed

- monitoring cockpit grid sticky header

- move monitoring cockpit grid into base-component table

## [v3.13.1] - 2025-05-01

### 🔄 Changed

- monitoring cockpit filters counting circle results by filtered results

## [v3.13.0] - 2025-04-15

### 🔄 Changed

- secondary election candidate end result state dependent of primary election result

## [v3.12.3] - 2025-04-14

### 🔄 Changed

- monitoring cockpit political business overview vertical scrollbar is always visible

## [v3.12.2] - 2025-04-01

### 🆕 Added

- add multiple sort to monitoring cockpit political business table

## [v3.12.1] - 2025-03-31

### 🔄 Changed

- change ballot count label

## [v3.12.0] - 2025-03-26

### 🔄 Changed

- rework monitoring political business overview

## [v3.11.1] - 2025-03-18

### 🔄 Changed

- fixed majority election ballot layout

## [v3.11.0] - 2025-03-11

### 🆕 Added

- feat(VOTING-5293): generic event watching

## [v3.10.0] - 2025-03-05

### 🆕 Added

- e-counting write-in handling

## [v3.9.2] - 2025-03-04

### 🔄 Changed

- update dependencies

## [v3.9.1] - 2025-03-04

### 🔄 Changed

- ensure valid majority election ballot

## [v3.9.0] - 2025-02-28

### 🔄 Changed

- add e-counting import

## [v3.8.1] - 2025-02-26

revert routing changes in result-export service

## [v3.8.0] - 2025-02-24

### 🔄 Changed

- routing in result-export.service.ts

## [v3.7.4] - 2025-02-19

### 🔄 Changed

- monitoring cockpit filter layout

## [v3.7.3] - 2025-02-14

### 🔄 Changed

- save counting circle details when a previous sub total entry is not enabled anymore

## [v3.7.2] - 2025-02-14

### 🔄 Changed

- udpate node version

## [v3.7.1] - 2025-02-14

### 🔄 Changed

- monitoring cockpit grid footer button height adjusted

## [v3.7.0] - 2025-02-13

### 🔄 Changed

- angular 19 update

## [v3.6.0] - 2025-02-12

### :arrows_counterclockwise: Changed

- show better error message when data export failed to generate

## [v3.5.0] - 2025-02-10

### 🆕 Added

- add political business result bundle logs

### 🔄 Changed

- proportional election lot decision sort by order number instead of list description

### 🔄 Changed

- proportional election result and end result ux improvements

### 🔄 Changed

- delete comments if counting circle results are resetted

### 🔄 Changed

- all state filters are correctly displayed in the dropdown selection of the bundle table

### 🔄 Changed

- filtering bundle table with correct states

### 🔄 Changed

- store selected monitoring cockpit tab into session storage

### 🔄 Changed

- consolidate bundle overview tables into one

## [v3.4.6] - 2025-01-24

### 🔄 Changed

- show view results button in monitoring cockpit for all state filters

## [v3.4.5] - 2025-01-23

### 🔄 Changed

- show counting circles with only non-owned results also in the monitoring cockpit grid

## [v3.4.4] - 2025-01-21

### 🔄 Changed

- update base components

## [v3.4.3] - 2025-01-16

### 🔄 Changed

- adjust spacing in contest header for past locked contests

## [v3.4.2] - 2025-01-13

### ❌ Removed

- remove clearing filter for counting circles in monitoring cockpit

## [v3.4.1] - 2025-01-08

### 🔄 Changed

- change label of submission by ballot groups

## [v3.4.0] - 2025-01-07

### 🆕 Added

- add robots meta tag to instruct crawlers to not index content
- add X-Robots-Tag response header to instruct crawlers to not index content

## [v3.3.6] - 2025-01-07

### 🔄 Changed

- rename list votes count and blank rows count for proportional election

## [v3.3.5] - 2025-01-07

### 🔄 Changed

- update dependencies

## [v3.3.4] - 2025-01-07

### 🔄 Changed

- rework monitoring cockpit state filter and store filter into session storage

## [v3.3.3] - 2024-12-11

### 🔄 Changed

- change disabled form fields to readonly

## [v3.3.2] - 2024-12-05

### 🔄 Changed

- monitoring state filters show correct amount

## [v3.3.1] - 2024-12-05

### 🔄 Changed

- show invalid and empty votes for majority election result

## [v3.3.0] - 2024-12-03

### 🆕 Added

- show roles in header tenant switch

## [v3.2.0] - 2024-11-27

### 🆕 Added

- add secondary majority election candidate vote count validation

### 🆕 Added

- add contest list filter and sort

### 🔄 Changed

- update state in contest detail header correctly

### 🔄 Changed

- set correct ui state after proportional election mandate distribution reverted

### 🆕 Added

- secondary majority election result validations

### 🔄 Changed

- tooltips in dialogs not visible

### 🔄 Changed

- reset results should reset voting cards and count of voters information

### 🔄 Changed

- archived contest list with description and owner column

### 🔄 Changed

- change form field errors from hint to bc-error

### ❌ Removed

- remove unnecessary space for checkboxes and radio buttons

### 🆕 Added

- publish results option on domain of influence

## [v3.1.2] - 2024-11-24

### :arrows_counterclockwise: Changed

- fix tenant loading in contest detail when checking for required contact data

## [v3.1.1] - 2024-11-08

### 🔄 Changed

- fix unnecessary scrollbar for popups

## [v3.1.0] - 2024-11-07

### 🆕 Added

- add reset to submission finished and flag for correction endpoints

## [v3.0.0] - 2024-11-07

BREAKING CHANGE: update Angular to version 18

### 🔄 Changed

- update Angular to version 18
- migrate to new build system

## [v2.18.2] - 2024-11-06

### 🔄 Changed

- finish submission and audit tentatively only for communal political businesses

## [v2.18.1] - 2024-11-06

### 🔄 Changed

- contest detail info should not update voting cards

## [v2.18.0] - 2024-11-06

### 🆕 Added

- optional rank in candidate lot decisions

## [v2.17.0] - 2024-11-04

### 🆕 Added

- add proportional election end result list lot decisions

## [v2.16.20] - 2024-11-04

### 🔄 Changed

- remove duplicated contact data

## [v2.16.19] - 2024-10-29

### 🔄 Changed

- update contest details after save

### 🔄 Changed

- increase proportional election ballot width

## [v2.16.18] - 2024-10-29

### 🔄 Changed

- vote ballot content tab navigation improved

## [v2.16.17] - 2024-10-28

### 🔄 Changed

- change monitoring cockpit state filters

## [v2.16.16] - 2024-10-25

### 🔄 Changed

- remove unnecessary focus in contest detail dialog

## [v2.16.15] - 2024-10-22

### 🔄 Changed

- update result state for result detail

## [v2.16.14] - 2024-10-16

### 🔄 Changed

- change submit results button text for responsible monitor authority

## [v2.16.13] - 2024-10-14

### 🆕 Added

- add has ballot groups

## [v2.16.12] - 2024-10-11

### ❌ Removed

- remove counting circle detail validate endpoint

## [v2.16.11] - 2024-10-10

### 🔄 Changed

- adjust cockpit grid status bar

## [v2.16.10] - 2024-10-10

### 🔄 Changed

- validate has no save button if no unsaved changes

## [v2.16.9] - 2024-10-09

### 🔄 Changed

- validate has no save button if no unsaved changes

## [v2.16.8] - 2024-10-03

### ❌ Removed

- remove zh feature flag

## [v2.16.7] - 2024-10-03

### 🔄 Changed

- fix logout after new tab is opened

## [v2.16.6] - 2024-09-30

### 🔄 Changed

- change list number label

## [v2.16.5] - 2024-09-30

### 🔄 Changed

- show empty votes not for single mandate

## [v2.16.4] - 2024-09-30

### 🔄 Changed

- adjusted counting circle dropdown width

## [v2.16.3] - 2024-09-27

### 🔄 Changed

- ballot without party is now selectable with tab

## [v2.16.2] - 2024-09-26

### 🔄 Changed

- bold total valid label and value

## [v2.16.1] - 2024-09-26

### :arrows_counterclockwise: Changed

- do not allow closing contact dialog and only show it when necessary

## [v2.16.0] - 2024-09-25

### 🆕 Added

- foreigner and minor voters

## [v2.15.6] - 2024-09-12

### 🔄 Changed

- align evoting variant ballot labels

### 🆕 Added

- add ballot question type labels

## [v2.15.5] - 2024-09-06

### 🔄 Changed

- result submission finished to audited tentatively for owned results

## [v2.15.4] - 2024-09-04

### 🔄 Changed

- migrate from gcr to harbor

## [v2.15.3] - 2024-09-04

fix(VOTING-4850): only consider states of owned political businesses for the summary state in monitoring

## [v2.15.2] - 2024-09-04

### 🔄 Changed

- cancel 2FA should not disabled submission finish button

## [v2.15.1] - 2024-09-04

### 🔄 Changed

- change submit results and audit tentatively label

## [v2.15.0] - 2024-09-04

### 🆕 Added

- add correction finished and audited tentatively endpoint

## [v2.14.4] - 2024-09-03

### 🆕 Added

- add validation hint for audited and self owned businesses

## [v2.14.3] - 2024-09-03

### 🔄 Changed

- sort counting circles in monitoring cockpit when live reload

## [v2.14.2] - 2024-08-28

### 🔄 Changed

- show mandate distribution trigger only with correct mandate algorithm

## [v2.14.1] - 2024-08-28

### 🔄 Changed

- create protocol link changed

## [v2.14.0] - 2024-08-28

### 🆕 Added

- optional individual candidates on majority elections

## [v2.13.2] - 2024-08-28

🔄 Changed

update bug bounty template reference
patch ci-cd template version, align with new defaults

## [v2.13.1] - 2024-08-22

### 🔄 Changed

- show empty votes always for secondary majority election

## [v2.13.0] - 2024-08-20

### 🆕 Added

- add 2fa fallback qr code

## [v2.12.2] - 2024-08-16

### 🔄 Changed

- monitoring cockpit grid footer sticky

## [v2.12.1] - 2024-08-14

### 🔄 Changed

- scroll added candidate into view

## [v2.12.0] - 2024-08-14

### 🆕 Added

- add asynchronous bundle review

## [v2.11.1] - 2024-08-09

### 🔄 Changed

- vote question result equality total count of no should win

## [v2.11.0] - 2024-08-08

### :new: Added

- added political business and ballot sub type

## [v2.10.2] - 2024-08-06

### 🔄 Changed

- readonly counting circle details if the user does not have the permissions

## [v2.10.1] - 2024-08-05

### 🔄 Changed

- submission done text

## [v2.10.0] - 2024-07-19

### 🆕 Added

- canton settings with publish results before audited tentatively

## [v2.9.2] - 2024-07-15

### 🔄 Changed

- index.html set default language to german and disable google translation

## [v2.9.1] - 2024-06-25

### 🔄 Changed

- show only owned political businesses in export cockpit

## [v2.9.0] - 2024-06-21

### 🆕 Added

- explicit election mandate distribution

### 🔄 Changed

- end result workflow

## [v2.8.3] - 2024-06-21

### 🆕 Added

- add unsaved changes dialog to contact person dialog

## [v2.8.2] - 2024-06-20

### 🔄 Changed

- replace submission finish with submit results everywhere

## [v2.8.1] - 2024-06-20

### 🆕 Added

- add partial results to result overview

## [v2.8.0] - 2024-06-07

### 🆕 Added

- add ready for correction timestamp

## [v2.7.2] - 2024-06-07

### 🔄 Changed

- change no bundles text

## [v2.7.1] - 2024-06-06

### :arrows_counterclockwise: Changed

- update voting lib to fix outdated access tokens on server streaming retries

## [v2.7.0] - 2024-05-29

### 🆕 Added

- add published state to results

## [v2.6.3] - 2024-05-28

### 🔄 Changed

- finish submission for multiple political businesses

## [v2.6.2] - 2024-05-27

### 🔄 Changed

- change plausibilisiert state color

## [v2.6.1] - 2024-05-22

### 🔄 Changed

- angular update UI optimizations

## [v2.6.0] - 2024-05-21

### 🆕 Added

- add sort and filter for bundle table and political business overview tables

## [v2.5.0] - 2024-05-16

### 🆕 Added

- double proportional lot decisions

## [v2.4.4] - 2024-05-13

### 🔄 Changed

- app loading spinner

## [v2.4.3] - 2024-05-08

### 🔄 Changed

- monitoring cockpit state filter

## [v2.4.2] - 2024-05-07

### 🔄 Changed

- navigate to union results

## [v2.4.1] - 2024-04-30

### 🔄 Changed

- result export table

## [v2.4.0] - 2024-04-30

### 🆕 Added

- set multiple bundles to review succeed

## [v2.3.0] - 2024-04-29

### 🆕 Added

- open contest if contest date matches today

## [v2.2.5] - 2024-04-26

### 🔄 Changed

- allow counting circle switch on contest detail

## [v2.2.4] - 2024-04-25

### :arrows_counterclockwise: Changed

- do not set all counting circles states when importing or deleting e-voting results

## [v2.2.3] - 2024-04-24

### 🔄 Changed

- move canton defaults from doi to contest

## [v2.2.2] - 2024-04-24

### 🆕 Added

- add config

## [v2.2.1] - 2024-04-24

### 🔄 Changed

- show all voting cards in contest detail info

## [v2.2.0] - 2024-04-23

### 🔄 Changed

- rework monitoring cockpit overview

## [v2.1.0] - 2024-04-23

### 🆕 Added

- non cantonal double proportional result

## [v2.0.0] - 2024-04-19

BREAKING CHANGE: update to Angular 17 version

### 🔄 Changed

- Angular Update to version 17

## [v1.76.0] - 2024-04-19

### 🆕 Added

- add state plausibilised disabled canton setting

## [v1.75.1] - 2024-04-18

### 🔄 Changed

- ballot navigation icon buttons

## [v1.75.0] - 2024-04-18

### 🆕 Added

- add counting circle result state descriptions

## [v1.74.0] - 2024-04-15

### 🔄 Changed

- group validation results by validity

### :new: Added

- added partial end results

### ❌ Removed

- remove unions from election endresults

### 🆕 Added

- cantonal proportional election union results

### 🆕 Added

- add political business unions to result overview

## [v1.73.1] - 2024-03-20

### 🔄 Changed

- voting cards order

## [v1.73.0] - 2024-03-14

### 🔄 Changed

- fix count representation of filtered counting circles in monitoring

### 🆕 Added

- add monitoring political business overview

### 🆕 Added

- add vote result algorithm popular and counting circle majority

### :arrows_counterclockwise: Changed

- adjust a few permissions checks

- add submission finish and audit tentatively for self owned businesses

### 🆕 Added

- add unsaved changes guard and unload host listener

### 🔄 Changed

- proportional election candidate choose queryable adjusted

## [v1.72.1] - 2024-02-28

### :arrows_counterclockwise: Changed

- fix write in mapping candidate width

## [v1.72.0] - 2024-02-28

### :new: Added

- live updates of write in mapping changes

## [v1.71.0] - 2024-02-27

### :arrows_counterclockwise: Changed

- adjust write in mappings

## [v1.70.1] - 2024-02-20

### 🔄 Changed

- Enable electorates for non-zh

## [v1.70.0] - 2024-02-19

### 🔄 Changed

- change majority election ballot group description

## [v1.69.1] - 2024-02-14

### 🔄 Changed

- disallow empty lists with party in proportional elections

## [v1.69.0] - 2024-02-14

### 🔄 Changed

- set order of domain of influence types

## [v1.68.1] - 2024-02-07

### 🔄 Changed

- adjust state box colors

## [v1.68.0] - 2024-02-06

### 🆕 Added

- Double proportional election mandate algorithms

## [v1.67.3] - 2024-02-05

### 🔄 Changed

- voting card labels for canton TG

## [v1.67.2] - 2024-02-05

### :arrows_counterclockwise: Changed

- fall back to polling when state change listeners do not work

## [v1.67.1] - 2024-02-02

### 🔄 Changed

- update voting-lib to v2.6.3

## [v1.67.0] - 2024-01-31

### 🆕 Added

- Added counting circle electorate

## [v1.66.0] - 2024-01-29

### 🔄 Changed

- allow creator of a bundle to print preview

## [v1.65.0] - 2024-01-29

### 🆕 Added

- add candidate check digit

## [v1.64.0] - 2024-01-24

### 🔄 Changed

- contest election detail ux improvements

## [v1.63.1] - 2024-01-23

### 🔄 Changed

- swiss abroad only used if allowed

## [v1.63.0] - 2024-01-22

### 🔄 Changed

- move contest contact data to header

## [v1.62.0] - 2024-01-18

### 🔄 Changed

- split save and validate political business

## [v1.61.0] - 2024-01-17

### 🆕 Added

- show domain of influence type on political businesses

## [v1.60.0] - 2024-01-17

### 🔄 Changed

- move contact data button to contest detail header

## [v1.59.0] - 2024-01-16

### 🔄 Changed

- contest vote detail ux improvements

## [v1.58.0] - 2024-01-16

### 🔄 Changed

- contest detail ux improvements

## [v1.57.0] - 2024-01-12

### :arrows_counterclockwise: Changed

- correctly set permissions in OnPush strategy

### :lock: Security

- change from roles to permissions

## [v1.56.1] - 2024-01-05

### 🔄 Changed

- Timestamp handling with result corrections

## [v1.56.0] - 2023-12-20

### 🆕 Added

- Add counting machine to counting circle details

## [v1.55.0] - 2023-12-19

### 🆕 Added

- add multiple vote ballots

## [v1.54.8] - 2023-12-12

### 🔄 Changed

- Set voting cards on counting circle correctly after live updates

## [v1.54.7] - 2023-11-28

### :arrows_counterclockwise: Changed

- apply strict policy for files that should not be cached

## [v1.54.6] - 2023-11-27

### :arrows_counterclockwise: Changed

- configure caching for statically named resource config.js
- set version tag for referenced config.js in index.html to enforce initial client-side cache invalidation

## [v1.54.5] - 2023-11-24

### :arrows_counterclockwise: Changed

- remove space in audience clientid prefix

## [v1.54.4] - 2023-11-24

### :new: Added

- add support for custom oauth scopes.

## [v1.54.3] - 2023-11-23

### 🔄 Changed

- revert empty and invalid vote count for single majority mandate

## [v1.54.2] - 2023-11-16

### :arrows_counterclockwise: Changed

- do not manually mark protocol exports as generating

## [v1.54.1] - 2023-11-15

### :arrows_counterclockwise: Changed

- correctly select all templates after data has been loaded

## [v1.54.0] - 2023-11-15

### :arrows_counterclockwise: Changed

- reworked export selected protocols feature

## [v1.53.23] - 2023-11-09

### :new: Added

- add environment indicator badge in header

## [v1.53.22] - 2023-10-25

### 🔄 Changed

- improve UX for re-generating single protocol exports

## [v1.53.21] - 2023-10-24

### :arrows_counterclockwise: Changed

- setup automatic refresh to only listen for the access_token lifetime since the IdP only responds with the access_token

## [v1.53.20] - 2023-10-23

This reverts commit 60ee4e312750c5b9d82b3ab87107bccc48cb7971.

## [v1.53.19] - 2023-10-23

### 🔄 Changed

- detect changes in majority election ballots correctly

## [v1.53.18] - 2023-10-22

### 🔄 Changed

- disable retry button for 10 mins after the start of a protocol export

## [v1.53.17] - 2023-10-20

### 🔄 Changed

- Show total blank ballots on end results

## [v1.53.16] - 2023-10-18

### 🔄 Changed

- reset ballot should undo changes

## [v1.53.15] - 2023-10-11

### 🆕 Added

- pop up for bundle creation

## [v1.53.14] - 2023-10-10

### 🔄 Changed

- next ballot enabled for continuous ballot numbers

## [v1.53.13] - 2023-10-10

### 🔄 Changed

- information text for missing entryvariations or entryparameters

## [v1.53.12] - 2023-10-05

### 🔄 Changed

- ballots without a party need at least one candidate

## [v1.53.11] - 2023-09-04

### 🔄 Changed

- enable automatic exports during testing phase

## [v1.53.10] - 2023-08-10

### 🔄 Changed

- update empty vote count only if it really changed

## [v1.53.9] - 2023-08-09

### 🔄 Changed

- consolidate buttons for multiple political business status changes

## [v1.53.8] - 2023-07-28

### 🔄 Changed

- improved save behavior of result entry

## [v1.53.7] - 2023-07-28

### 🔄 Changed

- change initial focus for candidate choose dialog

## [v1.53.6] - 2023-07-28

### 🔄 Changed

- set focus on page load for list results and ballot groups

## [v1.53.5] - 2023-07-28

### 🆕 Added

- added typeahead debounce for counting circle filter

## [v1.53.4] - 2023-07-28

### 🔄 Changed

- rename detail result entry labels

## [v1.53.3] - 2023-07-28

### 🔄 Changed

- ballot without list button placement

## [v1.53.2] - 2023-07-27

### 🔄 Changed

- navigate back from bundle

## [v1.53.1] - 2023-07-26

### 🔄 Changed

- disable automatic export during testing phase

## [v1.53.0] - 2023-07-12

### ❌ Removed

- remove second factor transaction for owned political businesses

## [v1.52.1] - 2023-07-06

### 🔄 Changed

- proportional election ballot candidate position scrolls into view if not visible

## [v1.52.0] - 2023-06-28

### 🆕 Added

- add import change listener

## [v1.51.2] - 2023-06-26

### 🔄 Changed

- update all states exclude missing political businesses

## [v1.51.1] - 2023-06-26

### 🔄 Changed

- change button disable and error class to property and color

## [v1.51.0] - 2023-06-20

### 🆕 Added

- Multiple counting circle results submission finished

## [v1.50.1] - 2023-06-19

### 🔄 Changed

- Button arrangement in ballot edit header
- Focus add candidate if no candidate can be removed on proportional election ballots
- Focus add candidate when removing all candidates on proportional election ballots

## [v1.50.0] - 2023-05-31

### 🔄 Changed

- add latest execution timestamp to export cockpit

## [v1.49.4] - 2023-05-31

### 🔄 Changed

- show validation message when majority election has no candidates

## [v1.49.3] - 2023-05-30

### 🔄 Changed

- do not automatically map unmapped write-ins to individual candidate

## [v1.49.2] - 2023-05-26

### 🔄 Changed

- Make certain contact person fields required

## [v1.49.1] - 2023-05-26

### 🔄 Changed

- Change export data date label

## [v1.49.0] - 2023-05-25

### 🔄 Changed

- change new ballot button to next ballot button

## [v1.48.1] - 2023-05-17

### ❌ Removed

- remove wrong proportional election can submit checks

## [v1.48.0] - 2023-05-16

### 🆕 Added

- reset write ins for majority election

## [v1.47.1] - 2023-05-11

### 🔄 Changed

- show correct voting cards on end result page

## [v1.47.0] - 2023-05-08

### 🔄 Changed

- show imported counting circles

## [v1.46.1] - 2023-05-02

### 🔄 Changed

- update cd-templates to resolve blocking deploy-trigger

## [v1.46.0] - 2023-05-01

### 🔄 Changed

- always show e-voting ballot count, even if write-ins are not yet mapped
- automatically count e-voting voting cards

## [v1.45.0] - 2023-03-31

### 🔄 Changed

- add e-voting blank ballots

## [v1.44.2] - 2023-03-29

### 🔄 Changed

- show correct count of voters information and voting cards on end results

## [v1.44.1] - 2023-03-06

### 🔄 Changed

- select the only corrected tab in the monitoring cockpit grid, when all counting circles are corrected

## [v1.44.0] - 2023-03-01

### 🔄 Changed

- protocol export state changes

## [v1.43.0] - 2023-03-01

### 🔄 Changed

- display ignored counting circles of result imports

## [v1.42.2] - 2023-03-01

### 🔄 Changed

- add all voting cards for end result page

## [v1.42.1] - 2023-02-28

### 🔄 Changed

- bundle number input error message

## [v1.42.0] - 2023-02-24

### 🔄 Changed

- async PDF protocol generation process

## [v1.41.5] - 2023-02-22

### 🔄 Changed

- hide export button for monitoring contest detail component

## [v1.41.4] - 2023-02-21

### 🔄 Changed

- bundle number input error message

## [v1.41.3] - 2023-02-16

### 🔄 Changed

- contest state chip

## [v1.41.2] - 2023-02-16

### 🔄 Changed

- dialog width in the bundle number dialog

## [v1.41.1] - 2023-02-13

### 🔄 Changed

- ballot button bar sticky

## [v1.41.0] - 2023-01-31

### 🔄 Changed

- New export page instead of dialog

## [v1.40.2] - 2023-01-30

### 🔄 Changed

- proportional election candidates tab index changed

## [v1.40.1] - 2023-01-30

### 🔄 Changed

- remove candidates in range

## [v1.40.0] - 2023-01-20

### 🔄 Changed

- change app title depending on theme
- cache last used theme

## [v1.39.1] - 2023-01-19

### 🔄 Changed

- remove proportional election candidate at last found position

## [v1.39.0] - 2023-01-18

### 🔄 Changed

- manual proportional election end result

## [v1.38.1] - 2023-01-17

### 🔄 Changed

- improve ballot content view

## [v1.38.0] - 2023-01-06

### 🔄 Changed

- allow unchanged ballots

## [v1.37.4] - 2023-01-06

### 🔄 Changed

- correctly display tie break answer buttons

## [v1.37.3] - 2023-01-05

### ❌ Removed

- remove export button from end result page

## [v1.37.2] - 2023-01-04

### ❌ Removed

- remove internal description, invalid votes and individual empty ballots allowed from elections

## [v1.37.1] - 2022-12-23

### 🔄 Changed

- fix(VOTING-2418): hide proportional election end result columns and protocolls before finalized

## [v1.37.0] - 2022-12-23

### 🆕 Added

- Added export configuration political business metadata, needed for Seantis

## [v1.36.4] - 2022-12-19

### 🔄 Changed

- fix selection of adding proportional election candidate

## [v1.36.3] - 2022-12-19

### ❌ Removed

- remove proportional election list paginator for a new bundle

## [v1.36.2] - 2022-12-19

### 🔄 Changed

- add optional text for formfield default options

## [v1.36.1] - 2022-12-13

### 🔄 Changed

- changed path to logo for whitelabeling

## [v1.36.0] - 2022-12-12

### 🆕 Added

- add white labeling logo for customers

## [v1.35.4] - 2022-12-02

### 🔄 Changed

- smaller voting cards number fields

## [v1.35.3] - 2022-11-30

### 🔄 Changed

- allow zero accounted ballots for political businesses

## [v1.35.2] - 2022-11-30

### 🔄 Changed

- ballot bundle sample size must be greater than zero

## [v1.35.1] - 2022-11-16

### 🔄 Changed

- fix mail voting channel label

## [v1.35.0] - 2022-11-16

### 🔒 Security

- configure client refresh token flow (rfc-6749)

## [v1.34.4] - 2022-11-03

### 🆕 Added

- add eVoting write in mapping to invalid ballot

## [v1.34.3] - 2022-10-31

### 🆕 Added

- add result state change listener for erfassung

## [v1.34.2] - 2022-10-31

### 🔄 Changed

- update can set state on result after on init

## [v1.34.1] - 2022-10-28

### 🔄 Changed

- set all results to audited tentatively depending responsible tenant

## [v1.34.0] - 2022-10-27

### 🆕 Added

- Reset counting circle results in testing phase

## [v1.33.4] - 2022-10-14

### 🔄 Changed

- Fixed majority election lot decision typo

## [v1.33.3] - 2022-10-13

### 🔄 Changed

- no empty vote count and no invalid vote count for single mandate

## [v1.33.2] - 2022-10-04

### 🔄 Changed

- Updated voting-library to fix layouting issues

## [v1.33.1] - 2022-09-28

### 🔄 Changed

- correct button placement in case of more than 3 possible tie break answers

## [v1.33.0] - 2022-09-28

### 🆕 Added

- add second factor transaction

## [v1.32.1] - 2022-09-27

### 🔒 Security

- disable style inline optimization to allow a more restictive CPS eleminating script-src unsafe-inline

## [v1.32.0] - 2022-09-26

### 🆕 Added

- review procedure for vote, majority election and proportional election

## [v1.31.1] - 2022-09-08

### 🔄 Changed

- Send correct counting circle contact person data to the backend, according proto validators

## [v1.31.0] - 2022-09-06

### 🆕 Added

- add white labling

## [v1.30.4] - 2022-08-19

### 🔄 Changed

- Cleaned up code smells
- Fixed bug where bundle review did not work

## [v1.30.3] - 2022-08-18

### ❌ Removed

- TenantGuard, tenant is no longer in the URL

### 🔒 Security

- Changed auth flow to PKCE
- Use "Fragment" response mode
- Update dependencies

## [v1.30.2] - 2022-08-18

### 🆕 Added

- gzip on
- outdated error page

### 🔄 Changed

- base href replacement regex

## [v1.30.1] - 2022-08-17

### 🔄 Changed

- Fixed switching of tabs in the export dialog

## [v1.30.0] - 2022-08-16

### 🔄 Changed

- base components update

## [v1.29.0] - 2022-07-15

### 🆕 Added

- config.js: definitions of window env-handler (replacement ngssc)

### ❌ Removed

- ngssc-library

### 🔒 Security

- The default NGINX listen port is now 8080 instead of 80
- nginx:1.19-alpine image changed to nginxinc/nginx-unprivileged:1.20-alpine

## [v1.28.0] - 2022-07-15

### 🆕 Added

- config.js: definitions of window env-handler (replacement ngssc)

### ❌ Removed

- ngssc-library

### 🔒 Security

- The default NGINX listen port is now 8080 instead of 80
- nginx:1.19-alpine image changed to nginxinc/nginx-unprivileged:1.20-alpine

## [v1.27.0] - 2022-07-15

### 🔒 Security

- nginxinc/nginx-unprivileged:1.20-alpine image changed to nginxinc/nginx-unprivileged:1.22-alpine

## [v1.26.0] - 2022-07-14

### 🆕 Added

- config.js: definitions of window env-handler (replacement ngssc)

### ❌ Removed

- ngssc-library

### 🔒 Security

- The default NGINX listen port is now 8080 instead of 80
- nginx:1.19-alpine image changed to nginxinc/nginx-unprivileged:1.20-alpine

## [v1.25.7] - 2022-06-02

### 🔄 Changed

- Proportional Election unmodified lists save button title adjusted
- Proportional Election unmodified lists save button navigates back after save succeeded.

## [v1.25.6] - 2022-06-01

### 🔄 Changed

- exports should include union id

## [v1.25.5] - 2022-05-31

### 🔄 Changed

- improve vote ballot ux behavior
- fixed submit bundle popup cancel for elections

## [v1.25.4] - 2022-05-30

### 🔄 Changed

- improve proportional create bundle behavior

## [v1.25.3] - 2022-05-25

### 🆕 Added

- add shortcut dialog for bundle overview

## [v1.25.2] - 2022-05-25

### 🔄 Changed

- Vote percent indicator for majority elections should show correct value if no accounted ballots are entered yet (by using the sum of the candidate votes instead).

## [v1.25.1] - 2022-05-25

### 🔄 Changed

- Adjusted page title of the vote review bundle page

## [v1.25.0] - 2022-05-09

### 🎉 Initial release for Bug Bounty
