# CCU-GCAU 1

This [SPA](https://en.wikipedia.org/wiki/Single-page_application) project is a revised version of the CCU to GCAU configuration converter based on [Vue.js](https://vuejs.org) (bootstrapped with [@vue/cli](https://cli.vuejs.org) ^3.8.0) components with [Vuetify](https://vuetifyjs.com) framework visual elements

It is combined with [@labzdjee/reac-ter](https://www.npmjs.com/package/@labzdjee/reac-ter) to bind _Vuetify_ [UI](https://en.wikipedia.org/wiki/User_interface) components on a bi-directional basis with external _ECMAscript_ data

## Implementation Notes

Basic _Vuetify_ UI input components such as `v-text-field`, `v-select`... have been systematically wrapped to be _reac-ter_ aware (stored in `components/basics` subfolder). This means all these components have two special Vue `props` which bend them to _external data_ (stored in `data.js`):

- `dataKey` which is a required string which provides key of datum controlled by the _reac-ter_
- `onChanged` is a callback on UI contents change

Particularly, `v-text-field` has been wrapped in three components with specialized Vue `props` to filter and control _text_ with pattern checks (examples in `utils.js`), _numeric_ with range check, scale, and _integer_ with range, up/down icon, scale...

The `onChanged` callback described above is expected _custom events_ to be triggered by components who control those wrapped UI inputs. This callback uses an `eventBus` to satisfy this. The event is caught by the `main` component which takes care of refreshing external data. Most of the mechanism associated to _reac-ter_ is implemented in a commonized Vue `mixins`

Attempt to come up with a sticky menu bar on scroll down lead to quite tricky CSS interaction with _Vuetify_ layout as can be seen in `main.vue`

## Project Setup

```
npm install
```

### Compiles and Hot-reloads for Development

```
npm run serve
```

### Compiles and Minifies for Production

```
npm run build
```

### Lints and Fixes Files

```
npm run lint
```

## App Available in GitHub Pages

For convenience, this project is served by [GiHub Pages](https://pages.github.com)

The app can be access from this link: [https://labzdjee.github.io/ccu-gcau-1](https://labzdjee.github.io/ccu-gcau-1)

### How To

It takes `npm run build` to store output in the `docs` folder. This is done by having `vue.config.js` look like this before running for build:

```javascript
module.exports = {
  publicPath: "/ccu-gcau-1",
  outputDir: "docs",
};
```

After project has been pushed to GitHub, _including the `docs` folder_, then in the repo's settings, look for _gitHub Pages section_ and select _master branch /docs_ folder as _source_
