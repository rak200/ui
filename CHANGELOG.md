# Changelog

## [0.2.17](https://github.com/rak200/ui/compare/0.2.16...0.2.17) (2026-09-05)


### Features

* ui-menu, both ends of one ARIA relationship in one shadow root ([#121](https://github.com/rak200/ui/issues/121)) ([c742df8](https://github.com/rak200/ui/commit/c742df869b7ce930a451c0c635e198ea493bfa77))

## [0.2.16](https://github.com/rak200/ui/compare/0.2.15...0.2.16) (2026-09-05)


### Features

* ui-toast, two live regions and a clock that is not a token ([#117](https://github.com/rak200/ui/issues/117)) ([fc35d10](https://github.com/rak200/ui/commit/fc35d1067c2815310c304398e9974be685578dd9))

## [0.2.15](https://github.com/rak200/ui/compare/0.2.14...0.2.15) (2026-09-04)


### Features

* ui-tooltip, placed by hand over a popover the platform lifts ([#114](https://github.com/rak200/ui/issues/114)) ([13a4345](https://github.com/rak200/ui/commit/13a434512bbadae8830b52e80b8cc620066704a4))

## [0.2.14](https://github.com/rak200/ui/compare/0.2.13...0.2.14) (2026-09-03)


### Features

* ui-card, and the elevation category it was holding ([#109](https://github.com/rak200/ui/issues/109)) ([9281f0f](https://github.com/rak200/ui/commit/9281f0f980125ef084901bf44e2ae82099b20d8b))

## [0.2.13](https://github.com/rak200/ui/compare/0.2.12...0.2.13) (2026-09-02)


### Features

* ui-radio-group, and the behaviour it did not have to write ([#105](https://github.com/rak200/ui/issues/105)) ([3bdc171](https://github.com/rak200/ui/commit/3bdc171be723c2ca862cdf1572e2048e0a71dd2c))

## [0.2.12](https://github.com/rak200/ui/compare/0.2.11...0.2.12) (2026-08-30)


### Features

* an icon element, and the glyph set behind it ([#100](https://github.com/rak200/ui/issues/100)) ([f34e552](https://github.com/rak200/ui/commit/f34e55224d83df2f90a4019d10948929a210a398))

## [0.2.11](https://github.com/rak200/ui/compare/0.2.10...0.2.11) (2026-08-30)


### Features

* ui-select, a native select the token layer draws the box for ([#96](https://github.com/rak200/ui/issues/96)) ([91929ec](https://github.com/rak200/ui/commit/91929ecc9efde1c5dcc97c145b26d7477af9a600)), closes [#17](https://github.com/rak200/ui/issues/17)

## [0.2.10](https://github.com/rak200/ui/compare/0.2.9...0.2.10) (2026-08-30)


### Features

* ui-checkbox and ui-switch, drawn because the platform has no switch ([#93](https://github.com/rak200/ui/issues/93)) ([f2d98f3](https://github.com/rak200/ui/commit/f2d98f385caa8d0ab05f1e4ed884468e63f02d0f)), closes [#14](https://github.com/rak200/ui/issues/14) [#16](https://github.com/rak200/ui/issues/16)

## [0.2.9](https://github.com/rak200/ui/compare/0.2.8...0.2.9) (2026-08-30)


### Bug Fixes

* reserve the scroll lock's gutter only where the scrollbar takes space ([#90](https://github.com/rak200/ui/issues/90)) ([23680b7](https://github.com/rak200/ui/commit/23680b77be4e09a781b90710636684e59f6a9b55))

## [0.2.8](https://github.com/rak200/ui/compare/0.2.7...0.2.8) (2026-08-29)


### Features

* ui-input and ui-textarea, with the control left in the light DOM ([#87](https://github.com/rak200/ui/issues/87)) ([1e2e7ca](https://github.com/rak200/ui/commit/1e2e7caabf702443a9d3485256986a76c50827b6))

## [0.2.7](https://github.com/rak200/ui/compare/0.2.6...0.2.7) (2026-08-29)


### Features

* ui-dialog, a modal that delegates its trap to the platform ([#85](https://github.com/rak200/ui/issues/85)) ([e8c5d94](https://github.com/rak200/ui/commit/e8c5d94b91bef4a5134c32bf3eed35eaff0569a5))

## [0.2.6](https://github.com/rak200/ui/compare/0.2.5...0.2.6) (2026-08-29)


### Bug Fixes

* the platform's tap highlight painted over the pressed state ([#83](https://github.com/rak200/ui/issues/83)) ([ca4b406](https://github.com/rak200/ui/commit/ca4b4063fba93883a099ef5724fbbf770aa83f1f))

## [0.2.5](https://github.com/rak200/ui/compare/0.2.4...0.2.5) (2026-08-28)


### Features

* the visual language — the derived half, motion, and the button's interaction states ([#77](https://github.com/rak200/ui/issues/77)) ([d071d44](https://github.com/rak200/ui/commit/d071d441ded9a5a5130f70b0d453cb8fa8a53e98))

  Appearing tokens, because adding one widens `Token` and code that enumerates the set finds out at
  compile time: `--ui-duration-100` and `--ui-easing-state` as grounds, and `--ui-duration-state`,
  `--ui-color-hover`, `--ui-color-pressed`, `--ui-color-accent-hover` and `--ui-color-accent-pressed`
  as derived. New exports: `derivedTokens`, `formulas`, `DerivedToken`. The supported override shape
  is a partial map; an exhaustive `Record<Token, string>` is the pattern that breaks.

## [0.2.4](https://github.com/rak200/ui/compare/0.2.3...0.2.4) (2026-08-15)


### Features

* a dark scheme, carried inside each token rather than beside it ([#62](https://github.com/rak200/ui/issues/62)) ([1720102](https://github.com/rak200/ui/commit/1720102ae7984a19c818252062bff5f8a127d49f))

## [0.2.3](https://github.com/rak200/ui/compare/0.2.2...0.2.3) (2026-08-15)


### Bug Fixes

* the focus ring was below the contrast floor it exists to clear ([#60](https://github.com/rak200/ui/issues/60)) ([d366c11](https://github.com/rak200/ui/commit/d366c11d56b3c6e7836b4a189ee2253b84c2f34d))

## [0.2.2](https://github.com/rak200/ui/compare/0.2.1...0.2.2) (2026-08-14)


### Features

* a Storybook playground, with the stories that make it reviewable ([#52](https://github.com/rak200/ui/issues/52)) ([a35e33a](https://github.com/rak200/ui/commit/a35e33ab7758066c2bdc35e167d7e2a5d0e6baa8))

## [0.2.1](https://github.com/rak200/ui/compare/0.2.0...0.2.1) (2026-08-08)


### Features

* `<ui-field>` — label, help and error association ([#38](https://github.com/rak200/ui/issues/38)) ([1ba600b](https://github.com/rak200/ui/commit/1ba600bfcf7bb10b789267512e7198e5a916d6c6))

## [0.2.0](https://github.com/rak200/ui/compare/0.1.2...0.2.0) (2026-08-08)


### ⚠ BREAKING CHANGES

* the element prefix is `ui-`, from the repository name ([#34](https://github.com/rak200/ui/issues/34))

### Features

* the element prefix is `ui-`, from the repository name ([#34](https://github.com/rak200/ui/issues/34)) ([f58c92e](https://github.com/rak200/ui/commit/f58c92eeed9299bd37de2515d07934d748f43f89))

## [0.1.2](https://github.com/rak200/ui/compare/0.1.1...0.1.2) (2026-08-08)


### Bug Fixes

* public docs pointed at a private repository ([#31](https://github.com/rak200/ui/issues/31)) ([5efc43b](https://github.com/rak200/ui/commit/5efc43b81bc5991aad514f57d213e1f409385a63))

## [0.1.1](https://github.com/rak200/ui/compare/0.1.0...0.1.1) (2026-08-02)


### Features

* publish to npm on release, over OIDC with no stored token ([#6](https://github.com/rak200/ui/issues/6)) ([4db8777](https://github.com/rak200/ui/commit/4db87773cbf9a97c40c3abc6935a9048eaf0ad31))

## 0.1.0 (2026-08-02)


### Features

* scaffold the repository from the rak200 baseline ([2ff0598](https://github.com/rak200/ui/commit/2ff0598d2e4c18a98141b0e3ebf20330b73e6a77))
* the token layer and rak-button ([#1](https://github.com/rak200/ui/issues/1)) ([7ba8ed6](https://github.com/rak200/ui/commit/7ba8ed64dec69183ea0850f871f9109f9895fb70))


### Bug Fixes

* bare release tags, and a first release of 0.1.0 rather than 1.0.0 ([#4](https://github.com/rak200/ui/issues/4)) ([06f6d7b](https://github.com/rak200/ui/commit/06f6d7bc7b17a49eb4631ded744a50dcc63d2e10))
* keep the formatter off release-please's files ([#5](https://github.com/rak200/ui/issues/5)) ([332402d](https://github.com/rak200/ui/commit/332402d325516bf8b40476a8e788726c028138a5))
