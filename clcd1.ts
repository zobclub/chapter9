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

