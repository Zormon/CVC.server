const IP = '10.1.1.10'
const PORT = '3000'

new QRCode(document.getElementById("qrcode"), `http://${IP}:${PORT}/mobile`)