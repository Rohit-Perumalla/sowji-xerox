# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep USB host & network driver classes
-keep class com.sowjixerox.app.printer.** { *; }
-keep class com.sowjixerox.app.updater.** { *; }
-dontwarn java.awt.**
