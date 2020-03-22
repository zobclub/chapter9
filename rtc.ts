/**
 * Real TIme Clock blocks
 */
//% weight=90 color=#1eb0f0 icon="\uf017"
namespace RTC {
    let i2cAddr = 0x69
    let RV1805_CTRL1 = 0x10
    let RV1805_OSC_CTRL = 0x1C
    let RV1805_CONF_KEY = 0x1F
    let RV1805_TRICKLE_CHRG = 0x20
    let RV1805_IOBATMODE = 0x27
    let RV1805_ID0 = 0x28
    let RV1805_OUT_CTRL = 0x30
    let CTRL1_12_24 = 0x40
    let CTRL1_ARST = 0x04
    let CTRL1_WRTC = 0x01
    let HOURS_AM_PM = 0x20
    let RV1805_CONF_WRT = 0x9D
    let partsNo = 1
    let _t: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

    function bcd2dec(d: number): number {
        return ((d >> 4) * 10) + (d % 0x10);
    }

    function dec2bcd(d: number): number {
        return (Math.floor(d / 10) * 0x10) + (d % 10);
    }

    function readReg(raddr: number): number {
        pins.i2cWriteNumber(i2cAddr, raddr, NumberFormat.UInt8BE, false)
        let d = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8BE, false)
        return d;
    }

    function writeReg(raddr: number, d: number): void {
        pins.i2cWriteNumber(i2cAddr, ((raddr << 8) + d), NumberFormat.UInt16BE, false)
    }

    function is12Hour(): number {
        let controlRegister = readReg(RV1805_CTRL1)
        return (controlRegister & CTRL1_12_24)
    }

    function set24Hour(): void {
        if (is12Hour()) {
            let hour = readReg(0x03)
            let pm = false
            if (hour & HOURS_AM_PM)
                pm = true
            let setting = readReg(RV1805_CTRL1)
            setting &= ~CTRL1_12_24
            writeReg(RV1805_CTRL1, setting)
            hour = bcd2dec(hour)
            if (pm)
                hour += 12
            else if (hour == 12)
                hour = 0
            if (hour == 24)
                hour = 12
            hour = dec2bcd(hour)
            writeReg(0x03, hour)
        }
    }

    function enableLowPower(): void {
        writeReg(RV1805_CONF_KEY, RV1805_CONF_WRT)
        writeReg(RV1805_IOBATMODE, 0x00)
        writeReg(RV1805_CONF_KEY, RV1805_CONF_WRT)
        writeReg(RV1805_OUT_CTRL, 0x30)
        writeReg(RV1805_CONF_KEY, 0xA1)
        writeReg(RV1805_OSC_CTRL, 0b11111100)
    }

    function enableTrickleCharge(): void {
        writeReg(RV1805_CONF_KEY, RV1805_CONF_WRT)
        let value = (0b1010 << 4)
        value |= (0b01 << 2)
        value |= 0b01
        writeReg(RV1805_TRICKLE_CHRG, value)
    }
    /**
     * Begin RTC
     */
    //% blockId="RTC_INITIALIZE" block="init rtc"
    export function init(): void {
        partsNo = readReg(RV1805_ID0)
        enableTrickleCharge()
        enableLowPower()
        let setting = readReg(RV1805_CTRL1)
        setting |= CTRL1_ARST
        setting |= CTRL1_WRTC
        writeReg(RV1805_CTRL1, setting)
        set24Hour()
    }
    /**
     * Update Time
     */
    //% blockId="RTC_UPDATETIME" block="update time"
    export function updateTime(): void {
        pins.i2cWriteNumber(i2cAddr, 0, NumberFormat.UInt8BE, false)
        let t1 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt32BE, false)
        let t2 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt32BE, false)
        _t[0] = t1 >> 24
        _t[1] = (t1 >> 16) & 0xFF
        _t[2] = (t1 >> 8) & 0xFF
        _t[3] = t1 & 0xFF
        _t[4] = t2 >> 24
        _t[5] = (t2 >> 16) & 0xFF
        _t[6] = (t2 >> 8) & 0xFF
        _t[7] = t2 & 0xFF
    }
    /**
     * Set Time
     * @param sec describe parameter here, eg: 0
     * @param min describe parameter here, eg: 0
     * @param hour describe parameter here, eg: 0
     */
    //% blockId="RTC_SETTIME" block="set time sec %sec|min %min|hour %hour" 
    export function setTime(sec: number, min: number, hour: number): void {
        _t[0] = dec2bcd(0)
        _t[1] = dec2bcd(sec)
        _t[2] = dec2bcd(min)
        _t[3] = dec2bcd(hour)
        pins.i2cWriteNumber(i2cAddr, 0, NumberFormat.UInt8BE, false)
        let t1 = (_t[0] << 24) + (_t[1] << 16) + (_t[2] << 8) + _t[3]
        pins.i2cWriteNumber(i2cAddr, t1, NumberFormat.UInt32BE, false)
    }
    /**
     * Set Date
     * @param date describe parameter here, eg: 1
     * @param month describe parameter here, eg: 1
     * @param year describe parameter here, eg: 18
     */
    //% blockId="RTC_SETDATE" block="set date %date|month %month|year %year" 
    export function setDate(date: number, month: number, year: number): void {
        _t[4] = dec2bcd(date)
        _t[5] = dec2bcd(month)
        _t[6] = dec2bcd(year)
        _t[7] = dec2bcd(0)
        pins.i2cWriteNumber(i2cAddr, 0x04, NumberFormat.UInt8BE, false)
        let t2 = (_t[4] << 24) + (_t[5] << 16) + (_t[6] << 8) + _t[7]
        pins.i2cWriteNumber(i2cAddr, t2, NumberFormat.UInt32BE, false)
    }
    /**
     * Time Hours
     */
    //% blockId="RTC_HOUR" block="hour"
    export function hourTime(): number {
        return bcd2dec(_t[3])
    }
    /**
     * Time Minutes
     */
    //% blockId="RTC_MIN" block="min"
    export function minTime(): number {
        return bcd2dec(_t[2])
    }
    /**
     * Time Seconds
     */
    //% blockId="RTC_SEC" block="sec"
    export function secTime(): number {
        return bcd2dec(_t[1])
    }
    /**
     * String  Date
     */
    //% blockId="STRING_DATE" block="s_date"
    export function stringDate(): string {
        let s = `0${bcd2dec(_t[6])}`.substr(-2) + '/'
        s += `0${bcd2dec(_t[5])}`.substr(-2) + '/'
        s += `0${bcd2dec(_t[4])}`.substr(-2)
        return s
    }
    /**
     * String Time
     */
    //% blockId="STRING_TIME" block="s_time"
    export function stringTime(): string {
        let s = `0${bcd2dec(_t[3])}`.substr(-2) + ':'
        s += `0${bcd2dec(_t[2])}`.substr(-2) + ':'
        s += `0${bcd2dec(_t[1])}`.substr(-2)
        return s
    }
}

/**
 * CLCD blocks
 */
//% weight=90 color=#1eb0f0 icon="\uf26c"
namespace CLCD {
    let i2cAddr = 0x3e
    let contrast = 35
    function cmd(d: number) {
        pins.i2cWriteNumber(
            i2cAddr,
            d,
            NumberFormat.UInt16BE,
            false
        )
        basic.pause(1)
    }
    function setd(d: number) {
        d = 0xc000 + d
        pins.i2cWriteNumber(
            i2cAddr,
            d,
            NumberFormat.UInt16BE,
            false
        )
    }
    function lastd(d: number) {
        d = 0x4000 + d
        pins.i2cWriteNumber(
            i2cAddr,
            d,
            NumberFormat.UInt16BE,
            false
        )
    }
    /**
     * CLCD Initialize
     */
    //% block="init clcd"
    export function init(): void {
        basic.pause(100)
        cmd(0x38)
        cmd(0x39)
        cmd(0x04)
        cmd(0x70 | (contrast & 0x0F))
        cmd(0x5c | ((contrast >> 4) & 0x03))
        cmd(0x6c)
        basic.pause(200)
        cmd(0x38)
        cmd(0x0c)
        cmd(0x01)
        basic.pause(2)
    }
    /**
     * Set cursor point
     * @param x describe parameter here, eg: 0
     * @param y describe parameter here, eg: 0
     */
    //% block="set cursor x %x|y %y" 
    export function setCursor(x: number, y: number): void {
        cmd(0x80 | (y * 0x40 + x))
    }
    /**
     * Print string
     * @param s describe parameter here, eg: "Hello"
     */
    //% block="print string %s"
    export function prints(s: string): void {
        let ln = s.length
        if (ln == 1)
            lastd(s.charCodeAt(0))
        else {
            for (let i = 0; i < ln - 1; i++) {
                setd(s.charCodeAt(i))
            }
            lastd(s.charCodeAt(ln - 1))
        }
    }
    /**
     * Print number
     * @param n describe parameter here, eg: 0
     */
    //% block="print number %n"
    export function printn(n: number): void {
        let s = n.toString()
        prints(s)
    }
    /**
     * Print decimal number
     * @param n1 describe parameter here, eg: 0
     * @param n2 describe parameter here, eg: 0
     */
    //% block="print decimal %n1|. %n2" 
    export function printn2(n1: number, n2: number): void {
        let s1 = n1.toString()
        let s2 = n2.toString()
        prints(s1 + "." + s2)
    }
    /**
     * Set contrast
     * @param c describe parameter here, eg: 35
     */
    //% block="set contrast %c"
    export function setContrast(c: number): void {
        contrast = c
        cmd(0x39)
        cmd(0x70 | (contrast & 0x0F))
        cmd(0x5c | ((contrast >> 4) & 0x03))
        cmd(0x38)
    }
} 

