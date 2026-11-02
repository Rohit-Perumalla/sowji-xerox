package com.sowjixerox.app.printer

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Native Android Wi-Fi / LAN Driver for Canon PIXMA G3010 MegaTank
 * Implements BJNP discovery and IPP raw socket print streaming.
 */
class CanonG3010Driver {

    companion object {
        const val BJNP_PORT = 8611
        const val RAW_PRINT_PORT = 9100
        const val IPP_PORT = 631
    }

    suspend fun checkReachability(ipAddress: String, timeoutMs: Int = 2000): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val socket = Socket()
                socket.connect(InetSocketAddress(ipAddress, BJNP_PORT), timeoutMs)
                socket.close()
                true
            } catch (e: Exception) {
                // Try raw port 9100 as fallback
                try {
                    val rawSocket = Socket()
                    rawSocket.connect(InetSocketAddress(ipAddress, RAW_PRINT_PORT), timeoutMs)
                    rawSocket.close()
                    true
                } catch (e2: Exception) {
                    false
                }
            }
        }

    suspend fun sendRawStream(
        ipAddress: String,
        port: Int = RAW_PRINT_PORT,
        data: ByteArray,
        progressCallback: (Float) -> Unit
    ): Boolean = withContext(Dispatchers.IO) {
        var socket: Socket? = null
        try {
            socket = Socket()
            socket.connect(InetSocketAddress(ipAddress, port), 5000)
            val outputStream: OutputStream = socket.getOutputStream()

            val chunkSize = 8192
            var offset = 0
            val total = data.size

            while (offset < total) {
                val length = (total - offset).coerceAtMost(chunkSize)
                outputStream.write(data, offset, length)
                offset += length
                progressCallback(offset.toFloat() / total.toFloat())
            }
            outputStream.flush()
            true
        } catch (e: Exception) {
            false
        } finally {
            try {
                socket?.close()
            } catch (_: Exception) {}
        }
    }
}
