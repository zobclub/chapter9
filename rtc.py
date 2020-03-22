from microbit import i2c, sleep
import clcd

I2CADR = 0x69
RV1805_CTRL1 = 0x10
RV1805_OSC_CTRL = 0x1C
RV1805_CONF_KEY = 0x1F
RV1805_TRICKLE_CHRG = 0x20
RV1805_IOBATMODE = 0x27
RV1805_ID0 = 0x28
RV1805_OUT_CTRL = 0x30
CTRL1_12_24 = 0x40
CTRL1_ARST = 0x04
CTRL1_WRTC = 0x01
HOURS_AM_PM = 0x20
RV1805_CONF_WRT = 0x9D
partsNo = 0
_t = [0, 0, 0, 0, 0, 0, 0, 0]

class RTC:
    def __init__(self):
        global partsNo
        partsNo = self.readReg(RV1805_ID0)
        self.enableTrickleCharge()
        self.enableLowPower()
        setting = self.readReg(RV1805_CTRL1)
        setting |= CTRL1_ARST
        setting |= CTRL1_WRTC
        self.writeReg(RV1805_CTRL1, setting)
        self.set24Hour()

    def bcd2dec(self, d):
        return ((d // 0x10) * 10) + (d % 0x10)

    def dec2bcd(self, d):
        return ((d // 10) * 0x10) + (d % 10)

    def readReg(self, raddr):
        i2c.write(I2CADR, bytearray([raddr]))
        d = i2c.read(I2CADR, 1)
        return d[0]

    def writeReg(self, raddr, d):
        i2c.write(I2CADR, bytearray([raddr, d]))

    def is12Hour(self):
        controlRegister = self.readReg(RV1805_CTRL1)
        return (controlRegister & CTRL1_12_24)

    def set24Hour(self):
        if (self.is12Hour()):
            hour = self.readReg(0x03)
            pm = False
            if (hour & HOURS_AM_PM):        
                pm = True
        
            setting = self.readReg(RV1805_CTRL1)
            setting &= ~CTRL1_12_24
            self.writeReg(RV1805_CTRL1, setting)
            hour = self.bcd2dec(hour)
        
            if(pm):
                hour += 12
            elif(hour == 12):
                hour = 0

            if(hour == 24):
                hour = 12
            hour = self.dec2bcd(hour)
            self.writeReg(0x03, hour)

    def enableLowPower(self):
        self.writeReg(RV1805_CONF_KEY, RV1805_CONF_WRT)
        self.writeReg(RV1805_IOBATMODE, 0x00)
        self.writeReg(RV1805_CONF_KEY, RV1805_CONF_WRT)
        self.writeReg(RV1805_OUT_CTRL, 0x30)
        self.writeReg(RV1805_CONF_KEY, 0xA1)
        self.writeReg(RV1805_OSC_CTRL, 0b11111100)

    def enableTrickleCharge(self):
        self.writeReg(RV1805_CONF_KEY, RV1805_CONF_WRT)
        value = 0
        value |= ( 0b1010 << 4)
        value |= (0b01 << 2)
        value |= 0b01
        self.writeReg(RV1805_TRICKLE_CHRG, value)

    def updateTime(self):
        global _t
        i2c.write(I2CADR, bytearray([0]))
        _t = i2c.read(I2CADR, 8)

    def stringTime(self):
        global _t
        s = '{:02}:{:02}:{:02}'.format(self.bcd2dec(_t[3]), self.bcd2dec(_t[2]), self.bcd2dec(_t[1]))
        return s

    def stringDate(self):
        global _t
        s = '{:02}/{:02}/{:02}'.format(self.bcd2dec(_t[6]), self.bcd2dec(_t[5]), self.bcd2dec(_t[4]))
        return s

rtc = RTC()
lcd = clcd.CLCD()
sleep(100)
while True:
    rtc.updateTime()
    lcd.setCursor(0,0)
    s = rtc.stringTime()
    lcd.prints(bytearray(s))
    lcd.setCursor(0,1)
    s = rtc.stringDate()
    lcd.prints(bytearray(s))
    sleep(1000)
