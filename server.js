// server.js
const WebSocket = require('ws');
const http = require('http');

// إنشاء خادم HTTP
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// تخزين البيانات المشتركة
let sharedData = {
    deliveryAmounts2025: {
        'Crispy Chicken-Hamdan St': [119300, 111546, 87783, 106625, 117066, 106229, 109205, 103184, 0, 0, 0, 0],
        'Crispy Chicken Khaldia': [60360, 51718, 58862, 54785, 54610, 56860, 51618, 51039, 0, 0, 0, 0],
        'Crispy Chicken Shabiya 11': [52778, 51105, 40273, 56981, 56703, 54611, 55160, 55336, 0, 0, 0, 0],
        'Crispy Chicken Muroor': [59749, 58438, 41808, 56795, 54302, 56046, 53001, 44361, 0, 0, 0, 0],
        'Crispy Chicken Al Barsha': [55752, 51699, 42075, 61422, 36988, 41436, 44627, 49296, 0, 0, 0, 0],
        'Crispy Chicken Al Satwa': [26849, 24348, 21934, 29154, 20631, 21005, 24685, 22476, 0, 0, 0, 0],
        'Sum': [374788, 348854, 292735, 365762, 340300, 336187, 338296, 325692, 0, 0, 0, 0]
    },
    deliveryCounts2025: {
        'Crispy Chicken-Hamdan St': [2757, 2460, 1877, 2363, 2515, 2318, 2557, 2247, 0, 0, 0, 0],
        'Crispy Chicken Khaldia': [1241, 1054, 891, 1156, 1083, 1078, 1097, 1032, 0, 0, 0, 0],
        'Crispy Chicken Shabiya 11': [1201, 1136, 906, 1246, 1187, 1114, 1177, 1162, 0, 0, 0, 0],
        'Crispy Chicken Muroor': [1255, 1199, 817, 1211, 1094, 1076, 1114, 912, 0, 0, 0, 0],
        'Crispy Chicken Al Barsha': [1726, 1527, 1427, 1816, 881, 891, 1007, 901, 0, 0, 0, 0],
        'Crispy Chicken Al Satwa': [818, 719, 645, 881, 506, 463, 528, 492, 0, 0, 0, 0],
        'Sum': [8998, 8095, 6563, 8673, 7266, 6940, 7480, 6746, 0, 0, 0, 0]
    }
};

// معالجة الاتصالات الجديدة
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // إرسال البيانات الأولية للعميل الجديد
    ws.send(JSON.stringify({
        type: "initialData",
        payload: sharedData
    }));
    
    // إرسال عدد المستخدمين الحالي
    broadcastUserCount();
    
    // معالجة الرسائل الواردة
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "dataUpdate") {
            // تحديث البيانات المشتركة
            const { branch, monthIndex, deliverySales, deliveryOrders, sumAmount, sumCount } = data.payload;
            
            // تحديث بيانات الفرع
            sharedData.deliveryAmounts2025[branch][monthIndex] = deliverySales;
            sharedData.deliveryCounts2025[branch][monthIndex] = deliveryOrders;
            
            // تحديث المجموع
            sharedData.deliveryAmounts2025['Sum'][monthIndex] = sumAmount;
            sharedData.deliveryCounts2025['Sum'][monthIndex] = sumCount;
            
            // بث التحديث لجميع العملاء المتصلين
            broadcastUpdate({
                type: "dataUpdate",
                payload: {
                    deliveryAmounts2025: {
                        [branch]: sharedData.deliveryAmounts2025[branch],
                        'Sum': sharedData.deliveryAmounts2025['Sum']
                    },
                    deliveryCounts2025: {
                        [branch]: sharedData.deliveryCounts2025[branch],
                        'Sum': sharedData.deliveryCounts2025['Sum']
                    }
                }
            });
        }
    });
    
    // معالجة انقطاع الاتصال
    ws.on('close', () => {
        console.log('Client disconnected');
        broadcastUserCount();
    });
});

// دالة لبث التحديثات لجميع العملاء
function broadcastUpdate(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// دالة لإرسال عدد المستخدمين المتصلين
function broadcastUserCount() {
    const count = wss.clients.size;
    broadcastUpdate({
        type: "userCount",
        count: count
    });
}

// بدء الخادم
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
