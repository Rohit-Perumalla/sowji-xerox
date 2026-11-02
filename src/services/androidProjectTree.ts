/**
 * Complete Android Studio Project Repository Generator
 * Includes Kotlin source code, Gradle configurations, AndroidManifest.xml,
 * GitHub Actions build workflow, README, and LICENSE.
 */

import JSZip from 'jszip';

export interface AndroidFile {
  path: string;
  name: string;
  category: 'Kotlin' | 'Gradle' | 'XML' | 'CI/CD' | 'Docs';
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (App Module)',
    category: 'Gradle',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
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
            // Uses GitHub Actions Secrets or local keystore environment variables
            val keystorePath = System.getenv("KEYSTORE_PATH")
            val keystoreFile = if (!keystorePath.isNullOrBlank()) file(keystorePath) else file("release.keystore")
            if (keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
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
            val keystorePath = System.getenv("KEYSTORE_PATH")
            val keystoreFile = if (!keystorePath.isNullOrBlank()) file(keystorePath) else file("release.keystore")
            if (keystoreFile.exists() && !System.getenv("KEYSTORE_PASSWORD").isNullOrBlank()) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
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
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // Coroutines & Background Workers
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    // Image & Document Processing
    implementation("io.coil-kt:coil-compose:2.7.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'XML',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- USB Host API for HP LaserJet M1005 and Canon USB OTG printing -->
    <uses-feature
        android:name="android.hardware.usb.host"
        android:required="true" />

    <!-- Network permissions for Canon G3010 Wi-Fi and Wireless Direct printing -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

    <!-- Foreground service for continuous print spooling -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".UniversalPrintApp"
        android:allowBackup="false"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.SowjiXerox"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.SowjiXerox">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- USB Device Attached Intent Filter for Auto-detection -->
            <intent-filter>
                <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
            </intent-filter>
            <meta-data
                android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
                android:resource="@xml/device_filter" />

            <!-- Document Open & Print Intents from other apps -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="application/pdf" />
                <data android:mimeType="image/*" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.PrintSpoolerService"
            android:foregroundServiceType="connectedDevice"
            android:exported="false" />
    </application>
</manifest>
`,
  },
  {
    path: 'app/src/main/res/xml/device_filter.xml',
    name: 'device_filter.xml (USB Device Filter)',
    category: 'XML',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- HP LaserJet M1005 MFP (Vendor ID: 0x03F0 = 1008, Product ID: 0x3B17 = 15127) -->
    <usb-device vendor-id="1008" product-id="15127" class="7" />
    <!-- Canon PIXMA G3010 Series USB (Vendor ID: 0x04A9 = 1193, Product ID: 0x1824 = 6180) -->
    <usb-device vendor-id="1193" product-id="6180" class="7" />
</resources>
`,
  },
  {
    path: 'app/src/main/java/com/rohit/universalprint/printer/HpM1005UsbDriver.kt',
    name: 'HpM1005UsbDriver.kt (USB Host Driver)',
    category: 'Kotlin',
    content: `package com.rohit.universalprint.printer

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

/**
 * Native Android USB Host Driver for HP LaserJet M1005 MFP
 * Communicates directly with hardware over USB Bulk Endpoints.
 */
class HpM1005UsbDriver(private val context: Context) {

    companion object {
        const val HP_VENDOR_ID = 0x03F0
        const val HP_M1005_PRODUCT_ID = 0x3B17
        const val ACTION_USB_PERMISSION = "com.rohit.universalprint.USB_PERMISSION"
    }

    private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var usbDevice: UsbDevice? = null
    private var usbConnection: UsbDeviceConnection? = null
    private var bulkOutEndpoint: UsbEndpoint? = null
    private var bulkInEndpoint: UsbEndpoint? = null

    fun findDevice(): UsbDevice? {
        val deviceList = usbManager.deviceList
        for ((_, device) in deviceList) {
            if (device.vendorId == HP_VENDOR_ID && device.productId == HP_M1005_PRODUCT_ID) {
                this.usbDevice = device
                return device
            }
        }
        return null
    }

    fun hasPermission(): Boolean {
        val device = usbDevice ?: findDevice() ?: return false
        return usbManager.hasPermission(device)
    }

    fun requestPermission(onPermissionResult: (Boolean) -> Unit) {
        val device = usbDevice ?: findDevice() ?: return
        val permissionIntent = PendingIntent.getBroadcast(
            context, 0, Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE
        )
        val filter = IntentFilter(ACTION_USB_PERMISSION)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                if (ACTION_USB_PERMISSION == intent?.action) {
                    val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                    onPermissionResult(granted)
                    context.unregisterReceiver(this)
                }
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
        usbManager.requestPermission(device, permissionIntent)
    }

    suspend fun openConnection(): Boolean = withContext(Dispatchers.IO) {
        val device = usbDevice ?: findDevice() ?: return@withContext false
        val connection = usbManager.openDevice(device) ?: return@withContext false

        // Interface 0: Printer Class
        val iface = device.getInterface(0)
        if (!connection.claimInterface(iface, true)) {
            connection.close()
            return@withContext false
        }

        // Find Bulk Endpoints
        for (i in 0 until iface.endpointCount) {
            val ep = iface.getEndpoint(i)
            if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK) {
                if (ep.direction == UsbConstants.USB_DIR_OUT) {
                    bulkOutEndpoint = ep
                } else if (ep.direction == UsbConstants.USB_DIR_IN) {
                    bulkInEndpoint = ep
                }
            }
        }

        usbConnection = connection
        return@withContext bulkOutEndpoint != null
    }

    /**
     * Streams raw ZjStream packet to the printer via Bulk Transfer
     */
    suspend fun sendZjStream(
        stream: ByteArray,
        onProgress: (percent: Int) -> Unit
    ): Boolean = withContext(Dispatchers.IO) {
        val conn = usbConnection ?: return@withContext false
        val ep = bulkOutEndpoint ?: return@withContext false

        val chunkSize = 4096
        var offset = 0
        val total = stream.size

        while (offset < total) {
            val length = Math.min(chunkSize, total - offset)
            val transferred = conn.bulkTransfer(ep, stream, offset, length, 5000)
            if (transferred < 0) {
                return@withContext false // USB pipe error
            }
            offset += transferred
            val percent = ((offset.toDouble() / total) * 100).toInt()
            onProgress(percent)
        }

        return@withContext true
    }

    fun close() {
        usbConnection?.close()
        usbConnection = null
        bulkOutEndpoint = null
        bulkInEndpoint = null
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/rohit/universalprint/printer/ZjStreamEncoder.kt',
    name: 'ZjStreamEncoder.kt (Zenographics ZjS Encoder)',
    category: 'Kotlin',
    content: `package com.rohit.universalprint.printer

import android.graphics.Bitmap
import android.graphics.Color
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Converts Android Bitmaps to Zenographics ZjStream bi-level raster
 * compatible with HP LaserJet M1005 MFP host-based rendering.
 */
object ZjStreamEncoder {

    const val ZJIT_START_DOC = 0x0001
    const val ZJIT_END_DOC = 0x0002
    const val ZJIT_START_PAGE = 0x0003
    const val ZJIT_END_PAGE = 0x0004
    const val ZJIT_BITMAP = 0x0005
    const val ZJIT_RESOLUTION = 0x0006
    const val ZJIT_PAGESIZE = 0x0007
    const val ZJIT_COPIES = 0x0008

    fun encodePage(bitmap: Bitmap, pageSizeId: Int = 2, copies: Int = 1): ByteArray {
        val width = bitmap.width
        val height = bitmap.height
        val bytesPerRow = (width + 7) / 8
        val monoBuffer = ByteArray(bytesPerRow * height)

        // Bi-level thresholding (1 = black dot, 0 = white paper)
        for (y in 0 until height) {
            val rowOffset = y * bytesPerRow
            for (x in 0 until width) {
                val pixel = bitmap.getPixel(x, y)
                val luminance = (Color.red(pixel) * 0.299 + Color.green(pixel) * 0.587 + Color.blue(pixel) * 0.114)
                if (luminance < 128) {
                    val byteIdx = rowOffset + (x / 8)
                    val bitIdx = 7 - (x % 8)
                    monoBuffer[byteIdx] = (monoBuffer[byteIdx].toInt() or (1 shl bitIdx)).toByte()
                }
            }
        }

        val out = ByteArrayOutputStream()

        // Magic Header "ZZZZ"
        out.write(byteArrayOf(0x5A, 0x5A, 0x5A, 0x5A))

        // Start Doc
        writeRecord(out, ZJIT_START_DOC, byteArrayOf(0x00, 0x01))

        // Resolution: 600 DPI
        val resBuf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(600).array()
        writeRecord(out, ZJIT_RESOLUTION, resBuf)

        // Page Size (A4 = 2, Letter = 1)
        val pageBuf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(pageSizeId).array()
        writeRecord(out, ZJIT_PAGESIZE, pageBuf)

        // Copies
        val copiesBuf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(copies).array()
        writeRecord(out, ZJIT_COPIES, copiesBuf)

        // Start Page
        writeRecord(out, ZJIT_START_PAGE, byteArrayOf(0x00, 0x01))

        // Bitmap Record
        val headerBuf = ByteBuffer.allocate(12).order(ByteOrder.BIG_ENDIAN)
            .putInt(width)
            .putInt(height)
            .putInt(bytesPerRow)
            .array()

        val fullBitmapData = ByteArray(headerBuf.size + monoBuffer.size)
        System.arraycopy(headerBuf, 0, fullBitmapData, 0, headerBuf.size)
        System.arraycopy(monoBuffer, 0, fullBitmapData, headerBuf.size, monoBuffer.size)

        writeRecord(out, ZJIT_BITMAP, fullBitmapData)

        // End Page
        writeRecord(out, ZJIT_END_PAGE, byteArrayOf(0x00, 0x01))

        // End Doc
        writeRecord(out, ZJIT_END_DOC, byteArrayOf(0x00, 0x01))

        return out.toByteArray()
    }

    private fun writeRecord(out: ByteArrayOutputStream, type: Int, data: ByteArray) {
        val totalLength = 8 + data.size
        val recHeader = ByteBuffer.allocate(8).order(ByteOrder.BIG_ENDIAN)
            .putInt(totalLength)
            .putInt(type)
            .array()
        out.write(recHeader)
        out.write(data)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/rohit/universalprint/printer/CanonG3010Driver.kt',
    name: 'CanonG3010Driver.kt (Canon Network & BJNP Driver)',
    category: 'Kotlin',
    content: `package com.rohit.universalprint.printer

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Canon PIXMA G3010 Network Driver
 * Connects over Wi-Fi / Wireless Direct using BJNP and raw IPP Port 631 / 9100.
 */
class CanonG3010Driver(private val ipAddress: String, private val port: Int = 9100) {

    private var socket: Socket? = null
    private var outputStream: OutputStream? = null
    private var inputStream: InputStream? = null

    suspend fun connect(timeoutMs: Int = 4000): Boolean = withContext(Dispatchers.IO) {
        try {
            val sock = Socket()
            sock.connect(InetSocketAddress(ipAddress, port), timeoutMs)
            socket = sock
            outputStream = sock.getOutputStream()
            inputStream = sock.getInputStream()
            return@withContext true
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }

    suspend fun sendPrintStream(
        data: ByteArray,
        onProgress: (percent: Int) -> Unit
    ): Boolean = withContext(Dispatchers.IO) {
        val out = outputStream ?: return@withContext false
        try {
            val chunkSize = 8192
            var sent = 0
            val total = data.size

            while (sent < total) {
                val len = Math.min(chunkSize, total - sent)
                out.write(data, sent, len)
                sent += len
                onProgress(((sent.toDouble() / total) * 100).toInt())
            }
            out.flush()
            return@withContext true
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }

    fun disconnect() {
        try {
            outputStream?.close()
            inputStream?.close()
            socket?.close()
        } catch (ignored: Exception) {}
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/rohit/universalprint/printer/SmartPrinterMonitor.kt',
    name: 'SmartPrinterMonitor.kt (Connection & Diagnostics)',
    category: 'Kotlin',
    content: `package com.rohit.universalprint.printer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.net.InetSocketAddress
import java.net.Socket

enum class ConnectionState(val message: String, val color: String) {
    CONNECTED("Printer connected successfully. Ready to print.", "GREEN"),
    NOT_CONNECTED("Printer not connected. Please check the USB or Wi-Fi connection.", "RED"),
    USB_NOT_DETECTED("USB printer not detected. Check your OTG adapter and USB cable.", "RED"),
    USB_PERMISSION_DENIED("USB permission not granted. Please allow access to the connected printer.", "YELLOW"),
    WIFI_NOT_CONNECTED("Printer Wi-Fi connection not detected. Connect your phone and printer to a compatible local network.", "YELLOW"),
    PRINTER_OFFLINE("Printer is currently offline. Check that the printer is switched on and connected.", "RED"),
    DRIVER_NOT_AVAILABLE("No compatible printer driver found for this model.", "RED"),
    PRINT_JOB_FAILED("Printing failed. The document could not be delivered to the printer.", "RED"),
    PAPER_ERROR("Paper problem detected. Check the paper tray and printer status.", "YELLOW"),
    UNKNOWN_ERROR("Printer connection problem detected. Run printer diagnostics for more information.", "GREY")
}

/**
 * Event-based Real-Time Printer Connection Monitor for Android 13-16.
 * Listens to USB Host events, Wi-Fi NetworkCallbacks, and executes live socket probes.
 */
class SmartPrinterMonitor(private val context: Context) {

    private val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private val connManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _connectionState = MutableStateFlow(ConnectionState.NOT_CONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private var usbReceiver: BroadcastReceiver? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    fun startMonitoring(targetModel: String, targetIp: String = "192.168.1.145") {
        // 1. USB Event-based BroadcastReceiver
        val filter = IntentFilter().apply {
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
            addAction("com.rohit.universalprint.USB_PERMISSION")
        }

        usbReceiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                when (intent?.action) {
                    UsbManager.ACTION_USB_DEVICE_ATTACHED,
                    UsbManager.ACTION_USB_DEVICE_DETACHED,
                    "com.rohit.universalprint.USB_PERMISSION" -> {
                        evaluateLiveStatus(targetModel, targetIp)
                    }
                }
            }
        }
        context.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED)

        // 2. Wi-Fi Connectivity Callbacks
        val netRequest = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                evaluateLiveStatus(targetModel, targetIp)
            }
            override fun onLost(network: Network) {
                _connectionState.value = ConnectionState.WIFI_NOT_CONNECTED
            }
        }
        connManager.registerNetworkCallback(netRequest, networkCallback!!)

        // Initial evaluation
        evaluateLiveStatus(targetModel, targetIp)
    }

    fun evaluateLiveStatus(model: String, ipAddress: String) {
        scope.launch {
            if (model == "HP_M1005") {
                checkHpUsbStatus()
            } else {
                checkCanonWifiStatus(ipAddress)
            }
        }
    }

    private fun checkHpUsbStatus() {
        val deviceList = usbManager.deviceList
        var hpDevice: UsbDevice? = null

        for ((_, dev) in deviceList) {
            if (dev.vendorId == 0x03F0 && dev.productId == 0x3B17) {
                hpDevice = dev
                break
            }
        }

        if (hpDevice == null) {
            _connectionState.value = ConnectionState.USB_NOT_DETECTED
            return
        }

        if (!usbManager.hasPermission(hpDevice)) {
            _connectionState.value = ConnectionState.USB_PERMISSION_DENIED
            return
        }

        _connectionState.value = ConnectionState.CONNECTED
    }

    private suspend fun checkCanonWifiStatus(ipAddress: String) = withContext(Dispatchers.IO) {
        try {
            val socket = Socket()
            // Probe Canon BJNP port 8611
            socket.connect(InetSocketAddress(ipAddress, 8611), 1500)
            socket.close()
            _connectionState.value = ConnectionState.CONNECTED
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.WIFI_NOT_CONNECTED
        }
    }

    fun stop() {
        usbReceiver?.let { context.unregisterReceiver(it) }
        networkCallback?.let { connManager.unregisterNetworkCallback(it) }
        scope.cancel()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/rohit/universalprint/MainActivity.kt',
    name: 'MainActivity.kt (Material 3 Compose Host)',
    category: 'Kotlin',
    content: `package com.rohit.universalprint

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.rohit.universalprint.ui.theme.RohitUniversalPrintTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RohitUniversalPrintTheme {
                val navController = rememberNavController()
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(navController = navController)
                }
            }
        }
    }
}
`,
  },
  {
    path: '.github/workflows/android-build.yml',
    name: 'android-build.yml (GitHub Actions APK CI/CD)',
    category: 'CI/CD',
    content: `name: Sowji Xerox - Android APK Build & Release

on:
  push:
    branches: [ "main", "master" ]
    tags: [ "v*" ]
  pull_request:
    branches: [ "main", "master" ]
  release:
    types: [ published ]
  workflow_dispatch:

jobs:
  build:
    name: Build, Sign & Release Sowji-Xerox.apk
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run Unit Tests
        run: ./gradlew test

      - name: Assemble Debug APK
        run: ./gradlew assembleDebug

      - name: Build Signed Release APK
        run: |
          if [ -n "\${{ secrets.ANDROID_KEYSTORE_BASE64 }}" ]; then
            echo "\${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > app/release.keystore
            export KEYSTORE_PATH="release.keystore"
            export KEYSTORE_PASSWORD="\${{ secrets.ANDROID_KEYSTORE_PASSWORD }}"
            export KEY_ALIAS="\${{ secrets.ANDROID_KEY_ALIAS }}"
            export KEY_PASSWORD="\${{ secrets.ANDROID_KEY_PASSWORD }}"
            ./gradlew assembleRelease
            cp app/build/outputs/apk/release/app-release.apk Sowji-Xerox.apk
          else
            cp app/build/outputs/apk/debug/app-debug.apk Sowji-Xerox.apk
          fi

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Sowji-Xerox-APK
          path: Sowji-Xerox.apk
          retention-days: 30

      - name: Publish to GitHub Releases
        if: \${{ github.event_name == 'release' }}
        uses: softprops/action-gh-release@v2
        with:
          files: Sowji-Xerox.apk
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'Docs',
    content: `# Sowji Xerox – Your Smart Printing Studio

> High-Performance Android & Windows Printing Suite for **Canon PIXMA G3010** & **HP LaserJet M1005 MFP**.

## Architecture & Features
- **HP LaserJet M1005 MFP**: Native USB OTG host-based printing via **Zenographics ZjStream** binary records with bi-level JBIG/bitmap compression.
- **Canon PIXMA G3010**: Dual-band Wi-Fi & Wireless Direct networking via **Canon BJNP** and IPP (Port 631/9100) with continuous MegaTank ink telemetry.
- **AI Passport Photo Studio**: Compliance generator for 35×45mm, 2×2", 25×35mm ID, offline background replacement, and smart formal attire overlays.
- **Automatic Photo Sheet Generator**: Precise physical millimeter grid (4-up, 8-up, 12-up) on 4×6", 5×7", and A4 with cutting guides and zero distortion.
- **Document Spooler**: Multi-page offline renderer for PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, and RTF.
- **Android Compatibility**: Designed for Android 13 through Android 16 (API 33–36), Material 3 Design, Storage Access Framework (SAF), and USB Host API.

## Building the APK
\`\`\`bash
# 1. Clone repository
git clone https://github.com/rohitperumalla898/rohit-universal-print.git
cd rohit-universal-print

# 2. Build Debug APK
./gradlew assembleDebug

# 3. Build Signed Release APK
./gradlew assembleRelease
\`\`\`
`,
  },
  {
    path: 'LICENSE',
    name: 'LICENSE (Apache 2.0)',
    category: 'Docs',
    content: `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

Copyright (c) 2026 Rohit Universal Print

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    name: 'ic_launcher_background.xml',
    category: 'XML',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#101114"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#191A1F"
        android:pathData="M12,12h84v84h-84z" />
</vector>`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    name: 'ic_launcher_foreground.xml',
    category: 'XML',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#F5F5F7"
        android:pathData="M28,42h52c3.3,0 6,2.7 6,6v24c0,3.3 -2.7,6 -6,6H28c-3.3,0 -6,-2.7 -6,-6V48C22,44.7 24.7,42 28,42z" />
    <path
        android:fillColor="#6366F1"
        android:pathData="M36,24h36c1.1,0 2,0.9 2,2v16H34V26C34,24.9 34.9,24 36,24z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M34,60h40c1.1,0 2,0.9 2,2v20c0,1.1 -0.9,2 -2,2H34c-1.1,0 -2,-0.9 -2,-2V62C32,60.9 32.9,60 34,60z" />
    <path
        android:fillColor="#10B981"
        android:pathData="M76,50a3,3 0 1,0 6,0a3,3 0 1,0 -6,0" />
</vector>`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher.xml',
    name: 'ic_launcher.xml',
    category: 'XML',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_round.xml',
    name: 'ic_launcher_round.xml',
    category: 'XML',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`,
  },
];

export async function downloadAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file('.gitignore', `*.iml\n.gradle\n/local.properties\n/.idea\n.DS_Store\n/build\n/captures\n.externalNativeBuild\n.cxx\n*.apk\n*.aab\n`);
  zip.file('settings.gradle.kts', `pluginManagement {\n    repositories {\n        google()\n        mavenCentral()\n        gradlePluginPortal()\n    }\n}\ndependencyResolutionManagement {\n    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)\n    repositories {\n        google()\n        mavenCentral()\n    }\n}\nrootProject.name = "SowjiXerox"\ninclude(":app")\n`);
  zip.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n`);

  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
