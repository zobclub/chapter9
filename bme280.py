from ustruct import unpack
from microbit import i2c, sleep
import clcd

I2CADR = 0x76
BME280_ID = 0x60
BME280_REG_CHIPID = 0xD0
BME280_REG_DIG_T = 0x88
BME280_REG_DIG_P = 0x8E
BME280_REG_DIG_H1 = 0xA1
BME280_REG_DIG_H2 = 0xE1

BME280_REG_PRESSUREDATA = 0xF7
BME280_REG_TEMPDATA = 0xFA
BME280_REG_HUMIDITY = 0xFD

BME280_REG_CONTROL_HUM = 0xF2
BME280_REG_CONTROL = 0xF4
BME280_REG_CONFIG = 0xF5

class BME280():
    def __init__(self):
        sleep(40)
        i2c.write(I2CADR, bytearray([BME280_REG_CHIPID]))
        i = i2c.read(I2CADR,1)
        id = i[0]
        if id != BME280_ID:
            return
        i2c.write(I2CADR, bytearray([BME280_REG_DIG_T]))
        t = i2c.read(I2CADR,26)
        self.dig_T1, self.dig_T2, self.dig_T3, self.dig_P1, \
            self.dig_P2, self.dig_P3, self.dig_P4, self.dig_P5, \
            self.dig_P6, self.dig_P7, self.dig_P8, self.dig_P9, \
            _, self.dig_H1= unpack("<HhhHhhhhhhhhBB", t)        
        i2c.write(I2CADR, bytearray([BME280_REG_DIG_H2]))
        h = i2c.read(I2CADR,7)
        self.dig_H2, self.dig_H3 = unpack("hB", h) 
        hh = (h[3] * 16) + (h[4] & 0x0F)
        self.dig_H4 = hh if hh < 0x8000 else hh - 0x10000
        hh = (h[5] * 16) + (h[4] >> 4)
        self.dig_H5 = hh if hh < 0x8000 else hh - 0x10000
        self.dig_H6 = h[6] if h[6] < 0x80 else h[6] - 0x100
        i2c.write(I2CADR, bytearray([BME280_REG_CONTROL_HUM, 0x02]))
        i2c.write(I2CADR, bytearray([BME280_REG_CONTROL, 0x37]))
        i2c.write(I2CADR, bytearray([BME280_REG_CONFIG, 0x70]))

    def getTemperature(self):
        i2c.write(I2CADR, bytearray([BME280_REG_TEMPDATA]))
        t = i2c.read(I2CADR,3)
        adc_T = (t[0]*65536 + t[1]*256 + t[2]) >> 4 
        t1 = (((adc_T >> 3) - (self.dig_T1 << 1)) * self.dig_T2) >> 11
        t2 = (((((adc_T >> 4)-self.dig_T1)*((adc_T >> 4)-self.dig_T1)) >> 12)*self.dig_T3) >> 14
        self.t_fine = t1 + t2
        T = (self.t_fine * 5 + 128) >> 8
        return T

    def getPressure(self):
        self.getTemperature()
        i2c.write(I2CADR, bytearray([BME280_REG_PRESSUREDATA]))
        p = i2c.read(I2CADR,3)
        adc_P = (p[0]*65536 + p[1]*256 + p[2]) >> 4
        p1 = self.t_fine - 128000
        p2 = p1 * p1 * self.dig_P6
        p2 = p2 + (p1*self.dig_P5 << 17)
        p2 = p2 + (self.dig_P4<<35)
        p1 = ((p1 * p1 * self.dig_P3)>>8) + ((p1 * self.dig_P2)<<12)
        p1 = (((1<<47)+p1) * self.dig_P1) >> 33
        if p1 == 0:
            return 0
        p = 1048576 - adc_P
        p = (((p<<31)-p2)*3125) // p1
        p1 = (self.dig_P9 * (p>>13) * (p>>13)) >> 25
        p2 = ((self.dig_P8) * p) >> 19
        p = ((p + p1 + p2) >> 8) + (self.dig_P7<<4)
        p = p // 256
        return p

bme = BME280()
lcd = clcd.CLCD()

while True:
    t = bme.getTemperature()
    t1 = t // 100
    t2 = t - t1 *100
    lcd.setCursor(1, 0)
    lcd.printn2(t1, t2)
    lcd.setCursor(7, 0)
    lcd.prints(b'C')
    p = bme.getPressure()
    p1 = p // 100
    p2 = p - p1 * 100
    lcd.setCursor(1, 1)
    lcd.printn2(p1, p2)
    sleep(1000)