# Changelog

## [1.5.0](https://github.com/bissquit/garden-ui/compare/v1.4.0...v1.5.0) (2026-03-02)


### Features

* **api:** add frontend health check endpoint ([8e94d7f](https://github.com/bissquit/garden-ui/commit/8e94d7f1265a4132d7c28928fe98131d2accb27f))
* **app:** add React error boundaries and custom 404 page ([8daeff0](https://github.com/bissquit/garden-ui/commit/8daeff007bb7223c4771b26a90b99a6aa65adebe))
* **auth:** add password change flow and must_change_password enforcement ([bb078b2](https://github.com/bissquit/garden-ui/commit/bb078b20da4a23c95ac2a6e3d15845110f17a5e9))
* **auth:** add profile editing, password recovery, and user management ([5e2afa8](https://github.com/bissquit/garden-ui/commit/5e2afa887fba39c37e3679420c318442cf9cfbcc))
* **auth:** update User type and handle account deactivation on login ([6e3ad56](https://github.com/bissquit/garden-ui/commit/6e3ad56f99ab8621882a51fa15959656f9f4dd1e))
* **config:** add security headers to Next.js config ([1f6aab4](https://github.com/bissquit/garden-ui/commit/1f6aab4c5de095f0258636f2bcced1250101d1a9))
* **config:** add white-labeling support via NEXT_PUBLIC_SITE_NAME env var ([b8f68fb](https://github.com/bissquit/garden-ui/commit/b8f68fb991a07b31ef735fc0af7d8894e6b91d6a))
* **ui:** replace loading spinners with skeleton placeholders ([8bc63aa](https://github.com/bissquit/garden-ui/commit/8bc63aa82474c2882946f7c9e057025ee812bcdd))


### Bug Fixes

* **ui:** change CardTitle to render as semantic &lt;h3&gt; instead of &lt;div&gt; ([b3ba718](https://github.com/bissquit/garden-ui/commit/b3ba7189e844cdfa0c3b6877bff475130dee524e))

## [1.4.0](https://github.com/bissquit/garden-ui/compare/v1.3.0...v1.4.0) (2026-02-22)


### Features

* **channels:** add email verification code support and resend functionality ([a33f586](https://github.com/bissquit/garden-ui/commit/a33f58638ab83c180d47e49e7081a713fb6db0b2))
* **channels:** integrate notifications config endpoint for dynamic channel types ([a9fcce2](https://github.com/bissquit/garden-ui/commit/a9fcce291cef4c387c9a38d16c8f212806237bea))
* **channels:** support is_default field for notification channels ([f013637](https://github.com/bissquit/garden-ui/commit/f0136370dcbf694578d9fb98fe2760a3c45bccec))
* **events:** add dynamic status filtering by type and active-only toggle ([8afed63](https://github.com/bissquit/garden-ui/commit/8afed63fd6d8c48cf79d60fe34cb7ba1f9bce5e0))
* **settings:** improve subscription editor UX and compact settings layout ([1828c53](https://github.com/bissquit/garden-ui/commit/1828c537e79c92b07c30f6992f0fbacb1bf9cdef))
* **subscriptions:** add group checkboxes, show unverified channels in matrix ([ff2ca82](https://github.com/bissquit/garden-ui/commit/ff2ca82f2a44b774d283dd6f08dcf634a210ab52))
* **subscriptions:** implement matrix UI for per-channel subscriptions ([81b4e7c](https://github.com/bissquit/garden-ui/commit/81b4e7c0aa93d520e0468c7fda858a6e60dfef7e))
* **subscriptions:** migrate to per-channel subscriptions model (Backend 2.8.0) ([06032ee](https://github.com/bissquit/garden-ui/commit/06032ee3078e9403c71140bae080c81a22480fd7))
* **ui:** add mattermost support and email verification code dialog ([df5b24a](https://github.com/bissquit/garden-ui/commit/df5b24a5e8dde315d00c6b6e06396a766a36d466))


### Bug Fixes

* change left top icon depending on theme ([2243b58](https://github.com/bissquit/garden-ui/commit/2243b584e0749307d8ed28cf96e208237128766d))
* **channels:** improve notification channels UX — type labels, matrix refresh, telegram instructions ([9ac01f6](https://github.com/bissquit/garden-ui/commit/9ac01f6aa1fb0c5d86ba8e52485fb51661f7504d))
* **channels:** improve verification error handling for 422/429 responses ([7659478](https://github.com/bissquit/garden-ui/commit/76594789d5ca557e9692b51bf134c1923bd91387))
* **events:** default notify_subscribers to true in form reset state ([5fc6012](https://github.com/bissquit/garden-ui/commit/5fc601207d0ffe3d38d9e5e7a7ae118831d8d233))
* **ui:** align channel icons with checkboxes in subscription matrix ([918daff](https://github.com/bissquit/garden-ui/commit/918daffc6133bd189765db0b5999d230c66b7f92))
* **ui:** remove event type badge and fix severity hover color ([3813bfb](https://github.com/bissquit/garden-ui/commit/3813bfb0d6c6e30c59f6a6b0f14f0cfdd9aed3f3))
* **ui:** replace channel actions dropdown with inline icon buttons ([af0db6e](https://github.com/bissquit/garden-ui/commit/af0db6e3f12dc30f44bcaf31db655af82c93300e))

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
