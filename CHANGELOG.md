# ✨ Changelog (`v3.20.2`)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Info

```text
This version -------- v3.20.2
Previous version ---- v3.19.0
Initial version ----- v1.25.0
Total commits ------- 8
```

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

- show correct proportional candidate end result state after lot decision

### 🆕 Added

- double proportional lot decision feedback improvements

### 🆕 Added

- add majority election candidate reporting type

### 🔄 Changed

- optimize proportional election lot decisions

### 🔄 Changed

- enable optional fields in update counting circle details
- update proto

### 🔄 Changed

- enable optional fields in update counting circle details

### 🔄 Changed

- mandate distribution auto-refresh and finalize fixes

### 🔄 Changed

- use correct button click api

### 🆕 Added

- add 2FA to submission finished and audited tentatively methods

### 🔄 Changed

- change majority election candidate result bar relative ratios

### 🔄 Changed

- improve viewing counting circle exports in monitoring

### 🔄 Changed

- adjust contest detail info layout depending of sub total labels

### 🔄 Changed

- fix contst detail info electorate layout

### 🔄 Changed

- fix(VOTING-6086): error snackbar

### 🔄 Changed

- fix update contest details after counting circle switch

### 🔄 Changed

- fix bc number clear spacing and perentage display

### 🔄 Changed

- bump BC version

### 🔄 Changed

- show export cockpit only if the tenant has export configs

### ❌ Removed

- removed proportional election candidate range removal

### 🔄 Changed

- reset result state timestamps correctly

### 🔄 Changed

- support counting circle result reset with monitoring states

### 🔄 Changed

- hide monitoring cockpit action buttons only if to check filter is set

### 🔄 Changed

- show conventional total voting cards

### 🔄 Changed

- only show monitoring status bar when all states are displayed

### 🔄 Changed

- refactor dockerfile
- remove redundant file copies
- add explicit workdir in final image to avoid surprises

### ❌ Removed

- remove entrypoint shell script since its functionality is shifted to the deployment in ops repo

### 🔒 Security

- using explicit nginx user instead of root for copying nginx configs and webroot

### 🆕 Added

- added links to/from erfassung/monitoring exports

### 🔄 Changed

- monitoring cockpit sort filtered counting circle after every filter update

### 🔄 Changed

- monitoring cockpit filters counting circle results by filtered results

### 🔄 Changed

- monitoring cockpit grid sticky header

- move monitoring cockpit grid into base-component table

### 🔄 Changed

- monitoring cockpit filters counting circle results by filtered results

### 🔄 Changed

- secondary election candidate end result state dependent of primary election result

### 🔄 Changed

- monitoring cockpit political business overview vertical scrollbar is always visible

### 🆕 Added

- add multiple sort to monitoring cockpit political business table

### 🔄 Changed

- change ballot count label

### 🔄 Changed

- rework monitoring political business overview

### 🔄 Changed

- fixed majority election ballot layout

### 🆕 Added

- feat(VOTING-5293): generic event watching

### 🆕 Added

- e-counting write-in handling

### 🔄 Changed

- update dependencies

### 🔄 Changed

- ensure valid majority election ballot

revert routing changes in result-export service

### 🔄 Changed

- routing in result-export.service.ts

### 🔄 Changed

- monitoring cockpit filter layout
