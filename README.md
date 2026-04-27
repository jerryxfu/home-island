# 🏝️ Home Island

A beautiful, minimalist browser extension that transforms your new tab page into a dynamic home island.

## 🛍️ Installation links

-

Chrome: [https://chromewebstore.google.com/detail/home-island/nodhcheaheohpnbdpbkoggbhecmbhoep](https://chromewebstore.google.com/detail/home-island/nodhcheaheohpnbdpbkoggbhecmbhoep)

- Firefox: [https://addons.mozilla.org/firefox/addon/home-island/](https://addons.mozilla.org/firefox/addon/home-island/)
- Safari: Available soon on the App Store (search for "Home Island")

## ✨ Features

- **Dynamic Time-Based Background**: Color gradients that smoothly transition throughout the day with stars at night
- **Personalized Greeting**: Contextual greeting that changes based on time of day and include your name
- **Customizable Shortcuts**: Add your favorite websites as clickable icons
- **Focus Mode**: A distraction-free mode that hides shortcuts and stars for a clean, serene experience
- Settings menu and Focus mode buttons are in the bottom right corner of the page.

## Developer notes

### Bundle extension without Safari support:

```
zip -r home-island.zip . --exclude "Home Island/*" --exclude ".git/*" --exclude "LICENSE"
```

### Xcode project for Safari support:

Run (once) the following command at the root of the project to generate the Safari version of the extension:

```
xcrun safari-web-extension-converter .
```

For project updates, simply rebuild and run the project in Xcode, and the Safari extension will be updated automatically.
Do not rerun the above command.
