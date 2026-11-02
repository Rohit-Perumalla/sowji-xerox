package com.sowjixerox.app.printer

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.*
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

/**
 * Native Android USB Host Driver for HP LaserJet M1005 MFP
 * Communicates directly with hardware over USB Bulk Endpoints using Zenographics ZjStream.
 */
class HpM1005UsbDriver(private val context: Context) {

    companion object {
        const val HP_VENDOR_ID = 0x03F0
        const val HP_M1005_PRODUCT_ID = 0x3B17
        const val ACTION_USB_PERMISSION = "com.sowjixerox.app.USB_PERMISSION"
        
        // ZjStream Magic Word
        const val ZJ_MAGIC = 0x5A5A5A5A.toInt()
    }
    private var usbConnection: android.hardware.usb.UsbDeviceConnection? = null
    private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var usbDevice: UsbDevice? = null
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

    fun requestPermission(onResult: (Boolean) -> Unit) {
        val device = usbDevice ?: findDevice() ?: run {
            onResult(false)
            return
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_IMMUTABLE
        } else {
            0
        }

        val permissionIntent = PendingIntent.getBroadcast(
            context, 0, Intent(ACTION_USB_PERMISSION), flags
        )

        val filter = IntentFilter(ACTION_USB_PERMISSION)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                if (intent?.action == ACTION_USB_PERMISSION) {
                    val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                    context.unregisterReceiver(this)
                    onResult(granted)
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

    suspend fun openDevice(): Boolean = withContext(Dispatchers.IO) {
        val device = usbDevice ?: findDevice() ?: return@withContext false
        if (!usbManager.hasPermission(device)) return@withContext false

        val connection = usbManager.openDevice(device) ?: return@withContext false
        this.usbConnection = connection

        val usbInterface = device.getInterface(0)
        connection.claimInterface(usbInterface, true)

        for (i in 0 until usbInterface.endpointCount) {
            val endpoint = usbInterface.getEndpoint(i)
            if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK) {
                if (endpoint.direction == UsbConstants.USB_DIR_OUT) {
                    bulkOutEndpoint = endpoint
                } else if (endpoint.direction == UsbConstants.USB_DIR_IN) {
                    bulkInEndpoint = endpoint
                }
            }
        }

        bulkOutEndpoint != null
    }

    suspend fun sendZjStreamBytes(data: ByteArray, progressCallback: (Float) -> Unit): Boolean =
        withContext(Dispatchers.IO) {
            val connection = this.usbConnection ?: return@withContext false
            val endpoint = bulkOutEndpoint ?: return@withContext false

            val chunkSize = 16384 // 16KB USB chunk size
            var offset = 0
            val total = data.size

            while (offset < total) {
                val length = (total - offset).coerceAtMost(chunkSize)
                val chunk = data.copyOfRange(offset, offset + length)
                val sent = connection.bulkTransfer(endpoint, chunk, length, 5000)

                if (sent < 0) {
                    return@withContext false
                }
                offset += length
                progressCallback(offset.toFloat() / total.toFloat())
            }

            true
        }

    fun close() {
        try {
            usbConnection?.close()
        } catch (_: Exception) {}
        usbConnection = null
        bulkOutEndpoint = null
        bulkInEndpoint = null
    }
}
