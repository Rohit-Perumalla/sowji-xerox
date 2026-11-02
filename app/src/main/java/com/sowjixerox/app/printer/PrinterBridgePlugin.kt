package com.sowjixerox.app.printer

import android.app.Activity
import android.content.Context
import android.hardware.usb.UsbManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.sowjixerox.app.updater.ApkUpdateManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Native Android JavaScriptInterface Bridge.
 * Binds the web-based Studio UI directly to the underlying Android USB Host API,
 * Wi-Fi TCP/UDP Sockets, and FileProvider APK update installer.
 */
class PrinterBridgePlugin(
    private val activity: Activity,
    private val webView: WebView
) {

    private val hpDriver = HpM1005UsbDriver(activity)
    private val canonDriver = CanonG3010Driver()
    private val updateManager = ApkUpdateManager(activity)
    private val scope = CoroutineScope(Dispatchers.Main)

    @JavascriptInterface
    fun isAndroidNative(): Boolean = true

    @JavascriptInterface
    fun getAndroidApiLevel(): Int = android.os.Build.VERSION.SDK_INT

    /**
     * Enumerates actual connected USB devices via android.hardware.usb.UsbManager
     */
    @JavascriptInterface
    fun listConnectedUsbDevices(): String {
        val usbManager = activity.getSystemService(Context.USB_SERVICE) as UsbManager
        val deviceList = usbManager.deviceList
        val array = JSONArray()

        for ((name, device) in deviceList) {
            val obj = JSONObject()
            obj.put("deviceName", name)
            obj.put("vendorId", device.vendorId)
            obj.put("productId", device.productId)
            obj.put("hasPermission", usbManager.hasPermission(device))

            val isHpM1005 = device.vendorId == 0x03F0 && device.productId == 0x3B17
            val isCanonG3010 = device.vendorId == 0x04A9 && device.productId == 0x1824
            obj.put("isHpM1005", isHpM1005)
            obj.put("isCanonG3010", isCanonG3010)
            array.put(obj)
        }
        return array.toString()
    }

    /**
     * Requests runtime USB permission for the HP LaserJet M1005
     */
    @JavascriptInterface
    fun requestHpUsbPermission(callbackFunction: String) {
        activity.runOnUiThread {
            hpDriver.requestPermission { granted ->
                webView.evaluateJavascript("$callbackFunction($granted)", null)
            }
        }
    }

    /**
     * Sends raw ZjStream byte array to HP LaserJet M1005 bulk endpoint
     */
    @JavascriptInterface
    fun printHpM1005Base64(base64Data: String, callbackFunction: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                val opened = hpDriver.openDevice()
                if (!opened) {
                    dispatchCallback(callbackFunction, false, "Unable to open USB bulk endpoint")
                    return@launch
                }

                val success = hpDriver.sendZjStreamBytes(bytes) { progress ->
                    activity.runOnUiThread {
                        webView.evaluateJavascript("window.onPrintProgress && window.onPrintProgress($progress)", null)
                    }
                }
                hpDriver.close()
                dispatchCallback(callbackFunction, success, if (success) "Printed successfully" else "USB write failed")
            } catch (e: Exception) {
                dispatchCallback(callbackFunction, false, e.message ?: "Unknown print error")
            }
        }
    }

    /**
     * Pings Canon PIXMA G3010 Wi-Fi IP address on BJNP port 8611
     */
    @JavascriptInterface
    fun pingCanonWifi(ipAddress: String, callbackFunction: String) {
        scope.launch(Dispatchers.IO) {
            val reachable = canonDriver.checkReachability(ipAddress)
            dispatchCallback(callbackFunction, reachable, if (reachable) "Reachable" else "Offline")
        }
    }

    /**
     * Checks if Android has granted package installation permission
     */
    @JavascriptInterface
    fun canInstallApks(): Boolean {
        return updateManager.canInstallApks()
    }

    /**
     * Opens Android System Settings to grant Install Unknown Apps permission
     */
    @JavascriptInterface
    fun requestInstallPermission() {
        activity.runOnUiThread {
            updateManager.requestInstallPermission()
        }
    }

    /**
     * Triggers the APK installer with explicit user consent prompt and security checks
     */
    @JavascriptInterface
    fun installApk(filePath: String, expectedSha256: String, callbackFunction: String) {
        activity.runOnUiThread {
            val file = File(filePath)
            if (!file.exists()) {
                dispatchCallback(callbackFunction, false, "APK file not found at: $filePath")
                return@runOnUiThread
            }
            updateManager.installApk(file, expectedSha256) { success, message ->
                dispatchCallback(callbackFunction, success, message)
            }
        }
    }

    private fun dispatchCallback(callbackName: String, success: Boolean, message: String) {
        activity.runOnUiThread {
            val escaped = JSONObject.quote(message)
            webView.evaluateJavascript("$callbackName($success, $escaped)", null)
        }
    }
}
