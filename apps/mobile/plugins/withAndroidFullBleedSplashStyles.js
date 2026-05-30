/**
 * Legacy full-bleed splash theme. Register AFTER expo-splash-screen.
 */
const { withAndroidStyles, AndroidConfig } = require("expo/config-plugins")

/** @type {import('expo/config-plugins').ConfigPlugin} */
function withAndroidFullBleedSplashStyles(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults
    styles.resources.style = (styles.resources.style ?? []).filter(
      ({ $: head }) => head.name !== "Theme.App.SplashScreen"
    )

    config.modResults = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent: { name: "Theme.App.SplashScreen", parent: "AppTheme" },
      name: "android:windowBackground",
      value: "@drawable/ic_launcher_background",
    })

    return config
  })
}

module.exports = withAndroidFullBleedSplashStyles
