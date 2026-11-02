package com.sowjixerox.app

import android.annotation.SuppressLint
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.sowjixerox.app.printer.PrinterBridgePlugin

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var bridgePlugin: PrinterBridgePlugin

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set layout with WebView
        webView = WebView(this)
        setContentView(webView)

        // Configure edge-to-edge dark styling
        window.statusBarColor = getColor(R.color.bg_dark)
        window.navigationBarColor = getColor(R.color.bg_dark)

        // Setup WebView settings
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Attach native printer & update bridge
        bridgePlugin = PrinterBridgePlugin(this, webView)
        webView.addJavascriptInterface(bridgePlugin, "AndroidPrinterBridge")

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Check if launched with a USB device attached
                handleIncomingUsbIntent(intent)
            }
        }

        // Load bundled web app assets or local preview
        webView.loadUrl("file:///android_asset/web/index.html")
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingUsbIntent(intent)
    }

    private fun handleIncomingUsbIntent(intent: Intent?) {
        if (intent?.action == UsbManager.ACTION_USB_DEVICE_ATTACHED) {
            val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE)
            }
            if (device != null) {
                val isHp = device.vendorId == 0x03F0 && device.productId == 0x3B17
                val isCanon = device.vendorId == 0x04A9 && device.productId == 0x1824
                val model = when {
                    isHp -> "HP LaserJet M1005"
                    isCanon -> "Canon PIXMA G3010"
                    else -> "USB Printer"
                }
                webView.evaluateJavascript("window.onUsbDeviceConnected && window.onUsbDeviceConnected('$model')", null)
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
