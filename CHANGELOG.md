# Changelog

## [1.3.0](https://github.com/bissquit/garden-ui/compare/v1.2.0...v1.3.0) (2026-02-11)


### Features

* **api:** Update types for event-driven service status management ([5967993](https://github.com/bissquit/garden-ui/commit/5967993e5f57b635be075ce2f6954795507c8111))
* **dashboard:** Event updates with service management ([00d6a2a](https://github.com/bissquit/garden-ui/commit/00d6a2aaab2cc238fd598d7dac7b0bada6180fc3))
* rework event page ([ec1608d](https://github.com/bissquit/garden-ui/commit/ec1608d431f91ba11cd50c281afb375af41c9999))
* rework eventForm to use affected_services ([0a704ac](https://github.com/bissquit/garden-ui/commit/0a704ac445f2a699835cfa4d8365a561ac9d1e9a))

## [1.2.0](https://github.com/bissquit/garden-ui/compare/v1.1.0...v1.2.0) (2026-02-07)


### Features

* perform refactoring to show al r/o objects (backend api 1.5.0) ([a4a9c85](https://github.com/bissquit/garden-ui/commit/a4a9c85525d2dd8f643062815092bd377fe7b5fb))


### Bug Fixes

* add slug autocomplete for groups ([08dc1a8](https://github.com/bissquit/garden-ui/commit/08dc1a8e2cb5f83e56c50e2a8bb6a802ddc7270b))
* handle error creating group/service with existed slug ([#28](https://github.com/bissquit/garden-ui/issues/28)) ([baadc4f](https://github.com/bissquit/garden-ui/commit/baadc4f3e74333e7d509dbc851a575dc9c43c7a9))
* hide UI elements depending on user role ([#21](https://github.com/bissquit/garden-ui/issues/21)) ([6a5eda4](https://github.com/bissquit/garden-ui/commit/6a5eda4919fc1318cd6af17f588a8475770ee5ef))
* include Change History into event Timeline ([#32](https://github.com/bissquit/garden-ui/issues/32)) ([ad09aab](https://github.com/bissquit/garden-ui/commit/ad09aabe5f3e87f86132fb372e5932bbddece733))
* move service tags configuration to settings, remove gear button ([#31](https://github.com/bissquit/garden-ui/issues/31)) ([a06411d](https://github.com/bissquit/garden-ui/commit/a06411d24ca0c00090b492245a1bdbfe3588e5f5))
* permit removing group with active services ([9369c39](https://github.com/bissquit/garden-ui/commit/9369c3997f38cc28c22c8b588189b23d46dbf4ec))
* refactoring of user menu and settings ([#24](https://github.com/bissquit/garden-ui/issues/24)) ([1f86df5](https://github.com/bissquit/garden-ui/commit/1f86df583f32d13994048fced9079de6bf1cdc7e))
* replace delete icon to archive icon for groups and services ([#30](https://github.com/bissquit/garden-ui/issues/30)) ([aa5feaa](https://github.com/bissquit/garden-ui/commit/aa5feaa0f0dc3bc096f6bf3a9edd9366cab5efa5))
* use refetchQueries for immediate UI updates after mutations ([b111ecb](https://github.com/bissquit/garden-ui/commit/b111ecb61afedd2317b008cdd849ab4c6e64314e))

## [1.1.0](https://github.com/bissquit/garden-ui/compare/v1.0.0...v1.1.0) (2026-02-02)


### Features

* implement crud from stage5, add service tags ([c39fd97](https://github.com/bissquit/garden-ui/commit/c39fd974e4a9ae85f15881510915c18105062e5d))
* implement dashboard CRUD operations (stage5) ([7c21dff](https://github.com/bissquit/garden-ui/commit/7c21dffd3e13fe614889e35cc866c1fbaf01be04))
* implement Notification Channels UI ([eacc671](https://github.com/bissquit/garden-ui/commit/eacc671dbbe2ec54e61000651672788a836625a8))
* implement phase4 (read features) ([592e443](https://github.com/bissquit/garden-ui/commit/592e443ab9bd383f5ee67a57d0179cfb7b27b8ce))
* implement Settings Page ([37b17c1](https://github.com/bissquit/garden-ui/commit/37b17c1b72a167d7e3953b5cbdd6d193b7606c25))
* implement stage 3 ([#3](https://github.com/bissquit/garden-ui/issues/3)) ([470543f](https://github.com/bissquit/garden-ui/commit/470543fbabd80d2252978815f55efc466edfb230))
* implement Subscriptions UI ([645c508](https://github.com/bissquit/garden-ui/commit/645c508caacf30cdb6c449e1dc8e46bf3b061478))
* improve events - working with groups, change members ([faa702e](https://github.com/bissquit/garden-ui/commit/faa702ebed3c2052584b6411a45b89eed526f000))
* migrate services and groups to new backend structure ([3dd3677](https://github.com/bissquit/garden-ui/commit/3dd3677abd11467f7dee0f56b351bce34c859734))


### Bug Fixes

* add favicon ([9733bcf](https://github.com/bissquit/garden-ui/commit/9733bcf8db27d6299ff7b28957c888fd297833d9))
* bugs from stage5 ([eda80cb](https://github.com/bissquit/garden-ui/commit/eda80cb42259ea9f7687502a99581e6833214f88))
* rename project to backend name ([c634075](https://github.com/bissquit/garden-ui/commit/c634075618fa2748905d1bc21d0bd7b227469875))

## [Unreleased]

### Bug Fixes

* fix service/group form dialog scroll on small screens
* add automatic logout on 401 unauthorized response
* display affected services in event details card

## [1.1.0](https://github.com/bissquit/garden-ui/compare/v1.0.0...v1.1.0) (2026-01-28)


### Features

* implement phase4 (read features) ([592e443](https://github.com/bissquit/garden-ui/commit/592e443ab9bd383f5ee67a57d0179cfb7b27b8ce))
* implement stage 3 ([#3](https://github.com/bissquit/garden-ui/issues/3)) ([470543f](https://github.com/bissquit/garden-ui/commit/470543fbabd80d2252978815f55efc466edfb230))


### Bug Fixes

* add favicon ([9733bcf](https://github.com/bissquit/garden-ui/commit/9733bcf8db27d6299ff7b28957c888fd297833d9))
* rename project to backend name ([c634075](https://github.com/bissquit/garden-ui/commit/c634075618fa2748905d1bc21d0bd7b227469875))

## 1.0.0 (2026-01-27)


### Features

* initial working state of the project ([#1](https://github.com/bissquit/garden-ui/issues/1)) ([d7ab6c3](https://github.com/bissquit/garden-ui/commit/d7ab6c35d7e26347de2b77d272fe857d4e7afaff))
