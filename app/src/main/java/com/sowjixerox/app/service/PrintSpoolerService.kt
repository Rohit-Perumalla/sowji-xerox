package com.sowjixerox.app.service

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.sowjixerox.app.UniversalPrintApp

class PrintSpoolerService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val printerName = intent?.getStringExtra("printer_name") ?: "Printer"
        val totalPages = intent?.getIntExtra("total_pages", 1) ?: 1

        val notification: Notification = NotificationCompat.Builder(this, UniversalPrintApp.NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Printing to $printerName")
            .setContentText("Spooling 1 of $totalPages pages...")
            .setSmallIcon(android.R.drawable.ic_menu_upload)
            .setOngoing(true)
            .setProgress(100, 0, false)
            .build()

        startForeground(1001, notification)
        return START_NOT_STICKY
    }
}
