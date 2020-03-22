from microbit import *

I2CADR = 0x3e
contrast = 35

def init():
    sleep(100)
    i2c.write(I2CADR, bytearray([0x00, 0x38]))
    i2c.write(I2CADR, bytearray([0x00, 0x39]))
    i2c.write(I2CADR, bytearray([0x00, 0x04]))
    i2c.write(I2CADR, bytearray([0x00, 0x14]))
    i2c.write(I2CADR, bytearray([0x00, 0x70 | (contrast & 0xF)]))
    i2c.write(I2CADR, bytearray([0x00, 0x5c | (contrast >> 4) & 0x3]))
    i2c.write(I2CADR, bytearray([0x00, 0x6c]))
    sleep(200)
    i2c.write(I2CADR, bytearray([0x00, 0x38]))
    i2c.write(I2CADR, bytearray([0x00, 0x0c]))
    i2c.write(I2CADR, bytearray([0x00, 0x01]))
    sleep(2)

def setCursor(x, y):
    i2c.write(I2CADR, bytearray([0x00, 0x80 | (y * 0x40 + x)]))

def prints(st):
    chars = list(st)
    lastc = chars.pop()
    for c in chars:
        i2c.write(I2CADR, bytearray([0xc0, c]))
    i2c.write(I2CADR, bytearray([0x40, lastc]))

def printn(n):
    s = str(n)
    chars = bytearray(s)
    for c in chars:
        i2c.write(I2CADR, bytearray([0x40, c]))

def setContrast(c):
    i2c.write(I2CADR, bytearray([0x00, 0x39]))
    i2c.write(I2CADR, bytearray([0x00, 0x70 | (c & 0x0f)]))
    i2c.write(I2CADR, bytearray([0x00, 0x5c | (c >> 4) & 0x03]))
    i2c.write(I2CADR, bytearray([0x00, 0x38]))


sleep(200)
init()

while True:
    x = accelerometer.get_x()
    y = accelerometer.get_y()
    setCursor(0, 0)
    prints(b"X=    ")
    setCursor(2, 0)
    printn(x)
    setCursor(0, 1)
    prints(b"Y=    ")
    setCursor(2, 1)
    printn(y)
    sleep(300)
