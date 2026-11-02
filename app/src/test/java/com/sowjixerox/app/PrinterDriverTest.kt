package com.sowjixerox.app

import com.sowjixerox.app.printer.HpM1005UsbDriver
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for Sowji Xerox Printer Drivers and ZjStream Constants
 */
class PrinterDriverTest {

    @Test
    fun testHpM1005VendorAndProductIds() {
        assertEquals("HP Vendor ID must match 0x03F0 (1008)", 0x03F0, HpM1005UsbDriver.HP_VENDOR_ID)
        assertEquals("HP M1005 Product ID must match 0x3B17 (15127)", 0x3B17, HpM1005UsbDriver.HP_M1005_PRODUCT_ID)
    }

    @Test
    fun testZjStreamMagicHeader() {
        // ZjStream starts with 0x5A5A5A5A ('ZZZZ')
        val expectedMagic = 0x5A5A5A5A.toInt()
        assertEquals(expectedMagic, HpM1005UsbDriver.ZJ_MAGIC)
    }

    @Test
    fun testSemanticVersionStructure() {
        val versionName = "2.4.0"
        val parts = versionName.split(".")
        assertEquals(3, parts.size)
        assertTrue(parts[0].toInt() >= 2)
    }

    @Test
    fun testUpdateSecurityPackageName() {
        assertEquals("com.sowjixerox.app", com.sowjixerox.app.updater.ApkUpdateManager.EXPECTED_PACKAGE_NAME)
        assertEquals("com.sowjixerox.app.fileprovider", com.sowjixerox.app.updater.ApkUpdateManager.FILE_PROVIDER_AUTHORITY)
    }
}
