/**
* BME280 block
*/
//% weight=90 color=#1eb0f0 icon="\uf0c2" block="BME280"
namespace BME280 {
    const i2cAddr = 0x76
    const BME280_ID = 0x60
    const BME280_REG_CHIPID = 0xD0
    const BME280_REG_DIG_T = 0x88
    const BME280_REG_DIG_P = 0x8E
    const BME280_REG_DIG_H1 = 0xA1
    const BME280_REG_DIG_H2 = 0xE1

    const BME280_REG_PRESSUREDATA = 0xF7
    const BME280_REG_TEMPDATA = 0xFA
    const BME280_REG_HUMIDITY = 0xFD

    const BME280_REG_CONTROL_HUM = 0xF2
    const BME280_REG_CONTROL = 0xF4
    const BME280_REG_CONFIG = 0xF5

    let dig_T1 = 0
    let dig_T2 = 0
    let dig_T3 = 0
    let dig_P1 = 0
    let dig_P2 = 0
    let dig_P3 = 0
    let dig_P4 = 0
    let dig_P5 = 0
    let dig_P6 = 0
    let dig_P7 = 0
    let dig_P8 = 0
    let dig_P9 = 0
    let dig_H1 = 0
    let dig_H2 = 0
    let dig_H3 = 0
    let dig_H4 = 0
    let dig_H5 = 0
    let dig_H6 = 0
    let t_fine = 0
    let id = 0


    function readReg(raddr: number): number {
        pins.i2cWriteNumber(i2cAddr, raddr, NumberFormat.UInt8BE, false)
        let d = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8BE, false)
        return d;
    }

    function writeReg(raddr: number, d: number): void {
        pins.i2cWriteNumber(i2cAddr, ((raddr << 8) + d), NumberFormat.UInt16BE, false)
    }

    /**
     * BME280 Initialize
     */
    //% blockId="BME280_INITIALIZE" block="init bme280"
    export function init(): void {
        basic.pause(40)
        id = readReg(BME280_REG_CHIPID)
        pins.i2cWriteNumber(i2cAddr, BME280_REG_DIG_T, NumberFormat.UInt8BE, false)
        dig_T1 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16LE, false)
        dig_T2 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_T3 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P1 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16LE, false)
        dig_P2 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P3 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P4 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P5 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P6 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P7 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P8 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_P9 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)

        pins.i2cWriteNumber(i2cAddr, BME280_REG_DIG_H1, NumberFormat.UInt8BE, false)
        dig_H1 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8LE, false)

        pins.i2cWriteNumber(i2cAddr, BME280_REG_DIG_H2, NumberFormat.UInt8BE, false)
        dig_H2 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int16LE, false)
        dig_H3 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8LE, false)
        let d1 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8LE, false)
        let d2 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8LE, false)
        let d3 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8LE, false)
        dig_H4 = (d1 << 4) + (d2 & 0x0F)
        if (dig_H4 >= 0x8000)
            dig_H4 -= 0x10000
        dig_H5 = (d3 << 4) + ((d2 >> 4) & 0x0F)
        if (dig_H5 >= 0x8000)
            dig_H5 -= 0x10000
        dig_H6 = pins.i2cReadNumber(i2cAddr, NumberFormat.Int8LE, false)

        writeReg(BME280_REG_CONTROL_HUM, 0x02)
        writeReg(BME280_REG_CONTROL, 0x37)
        writeReg(BME280_REG_CONFIG, 0x70)
    }

    /**
     * Get Temperature
     */
    //% blockId="BME280_TEMPERATURE" block="temperature"
    export function getTemperature(): number {
        pins.i2cWriteNumber(i2cAddr, BME280_REG_TEMPDATA, NumberFormat.UInt8BE, false)
        let t = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt32BE, false)
        let adc_T = (t >> 12) & 0x000FFFFF

        let t1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let t2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        t_fine = t1 + t2

        return (t_fine * 5 + 128) >> 8
    }

    /**
     * Get Pressure
     */
    //% blockId="BME280_PRESSURE" block="pressure"
    export function getPressure(): number {
        getTemperature()
        pins.i2cWriteNumber(i2cAddr, BME280_REG_PRESSUREDATA, NumberFormat.UInt8BE, false)
        let p = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt32BE, false)
        let adc_P = (p >> 12) & 0x000FFFFF
        let p1 = (t_fine >> 1) - 64000
        let p2 = (((p1 >> 2) * (p1 >> 2)) >> 11) * dig_P6
        p2 = p2 + ((p1 * dig_P5) << 1)
        p2 = (p2 >> 2) + (dig_P4 << 16)
        p1 = (((dig_P3 * ((p1 >> 2) * (p1 >> 2)) >> 13) >> 3) + (((dig_P2) * p1) >> 1)) >> 18
        p1 = ((32768 + p1) * dig_P1) >> 15
        if (p1 == 0)
            return 0
        let _p = ((1048576 - adc_P) - (p2 >> 12)) * 3125
        _p = (_p / p1) * 2;
        p1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        p2 = (((_p >> 2)) * dig_P8) >> 13
        return _p + ((p1 + p2 + dig_P7) >> 4)
    }
    /**
     * Get Humidity
     */
    //% blockId="BME280_HUMIDITY" block="humidity"
    export function getHumidity(): number {
        getTemperature()
        pins.i2cWriteNumber(i2cAddr, BME280_REG_HUMIDITY, NumberFormat.UInt8BE, false)
        let adc_H = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16BE, false)
        let h1 = t_fine - 76800
        let h2 = ((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * h1) + 16384) >> 15
        h1 = h2 * (((((((h1 * dig_H6) >> 10) * (((h1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        h1 = h1 - (((((h1 >> 15) * (h1 >> 15)) >> 7) * dig_H1) >> 4)
        if (h1 < 0)
            h1 = 0
        if (h1 > 419430400)
            h1 = 419430400
        return ((h1 >> 12) * 100) >> 10
    }

    function num2str(n: number): string {
        let n1 = Math.floor(n / 100)
        let n2 = Math.floor(n - (n1 * 100))
        let s = `${n1}` + '.' + `${n2}`
        return s
    }

    //% blockId="STRING_TEMPERATURE" block="s_temperature"
    export function stringTemperature(): string {
        let s = num2str(getTemperature()) + "\xdfC"
        return s
    }
    //% blockId="STRING_PRESSURE" block="s_pressure"
    export function stringPressure(): string {
        let s = num2str(getPressure())
        return s
    }
    //% blockId="STRING_HUMIDITY" block="s_humidity"
    export function stringHumidity(): string {
        let s = num2str(getHumidity()) + "%"
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
