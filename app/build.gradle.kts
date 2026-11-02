plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.sowjixerox.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.sowjixerox.app"
        minSdk = 33 // Android 13
        targetSdk = 35 // Android 15 & 16 Ready
        versionCode = 240
        versionName = "2.4.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            // Evaluates environment variables injected by GitHub Actions secrets or local build
            val keystorePath = System.getenv("KEYSTORE_PATH") ?: System.getenv("SIGNING_KEY_PATH") ?: "release.keystore"
            val keystoreFile = file(keystorePath)
            if (keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: System.getenv("KEY_STORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS") ?: System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD") ?: System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Use release signing config if keystore exists and password is provided, otherwise fallback to debug signing
            val keystorePath = System.getenv("KEYSTORE_PATH") ?: System.getenv("SIGNING_KEY_PATH")
            val keystoreFile = if (!keystorePath.isNullOrBlank()) file(keystorePath) else file("release.keystore")
            val hasPassword = !(System.getenv("KEYSTORE_PASSWORD") ?: System.getenv("KEY_STORE_PASSWORD")).isNullOrBlank()
            if (keystoreFile.exists() && hasPassword) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.webkit:webkit:1.12.1")

    // Coroutines for async printer I/O
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
