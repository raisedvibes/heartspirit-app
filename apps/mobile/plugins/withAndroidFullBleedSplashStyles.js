/**
 * Full-bleed splash theme with Android 12+ system splash configured to avoid
 * launcher icon fallback. Register BEFORE expo-splash-screen (runs after Expo).
 */
const { withAndroidStyles, AndroidConfig } = require("expo/config-plugins")

const SPLASH_STYLE = {
  name: "Theme.App.SplashScreen",
  parent: "Theme.SplashScreen",
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
function withAndroidFullBleedSplashStyles(config) {
  return withAndroidStyles(config, (config) => {
    let styles = config.modResults
    styles.resources.style = (styles.resources.style ?? []).filter(
      ({ $: head }) => head.name !== "Theme.App.SplashScreen"
    )

    const assign = (name, value) => {
      styles = AndroidConfig.Styles.assignStylesValue(styles, {
        add: true,
        parent: SPLASH_STYLE,
        name,
        value,
      })
    }

    // Android 12+ system splash: blank icon so the OS never falls back to adaptive icon.
    assign("windowSplashScreenBackground", "@color/splashscreen_background")
    assign("windowSplashScreenAnimatedIcon", "@drawable/splashscreen_transparent_icon")
    assign("postSplashScreenTheme", "@style/AppTheme")
    // Legacy + post-system-splash: full-bleed intro drawable on the activity window.
    assign("android:windowBackground", "@drawable/ic_launcher_background")

    config.modResults = styles
    return config
  })
}

module.exports = withAndroidFullBleedSplashStyles
