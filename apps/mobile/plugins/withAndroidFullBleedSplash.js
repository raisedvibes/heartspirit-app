/**
 * Android full-bleed splash drawables. Register BEFORE expo-splash-screen.
 */
const fs = require("fs")
const path = require("path")
const { withDangerousMod, XML } = require("expo/config-plugins")

const INTRO_IMAGE = "assets/images/heartspirit_intro.png"

const SPLASH_LOGO_DENSITY_DIRS = [
  "drawable-mdpi",
  "drawable-hdpi",
  "drawable-xhdpi",
  "drawable-xxhdpi",
  "drawable-xxxhdpi",
  "drawable-night-mdpi",
  "drawable-night-hdpi",
  "drawable-night-xhdpi",
  "drawable-night-xxhdpi",
  "drawable-night-xxxhdpi",
]

/** @type {import('expo/config-plugins').ConfigPlugin} */
function withAndroidFullBleedSplash(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot
      const sourceImage = path.join(projectRoot, INTRO_IMAGE)
      const resRoot = path.join(projectRoot, "android/app/src/main/res")

      await Promise.all(
        SPLASH_LOGO_DENSITY_DIRS.map(async (dir) => {
          const outDir = path.join(resRoot, dir)
          await fs.promises.mkdir(outDir, { recursive: true })
          await fs.promises.copyFile(sourceImage, path.join(outDir, "splashscreen_logo.png"))
        })
      )

      const launcherBackgroundPath = path.join(resRoot, "drawable/ic_launcher_background.xml")
      await XML.writeXMLAsync({
        path: launcherBackgroundPath,
        xml: {
          "layer-list": {
            $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
            item: [
              { $: { "android:drawable": "@color/splashscreen_background" } },
              {
                bitmap: [
                  {
                    $: {
                      "android:gravity": "fill",
                      "android:src": "@drawable/splashscreen_logo",
                    },
                  },
                ],
              },
            ],
          },
        },
      })

      return config
    },
  ])
}

module.exports = withAndroidFullBleedSplash
