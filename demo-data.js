// 铁路监控大屏演示数据
// 可以将此文件的内容复制到浏览器控制台中执行，快速添加演示数据

const demoRoutes = [
    // 主要高铁线路
    {
        name: '京沪高铁',
        startLat: 39.9042,
        startLng: 116.4074,
        endLat: 31.2304,
        endLng: 121.4737,
        type: 'main',
        status: 'completed'
    },
    {
        name: '京广高铁',
        startLat: 39.9042,
        startLng: 116.4074,
        endLat: 23.1291,
        endLng: 113.2644,
        type: 'main',
        status: 'completed'
    },
    {
        name: '京津城际',
        startLat: 39.9042,
        startLng: 116.4074,
        endLat: 39.1439,
        endLng: 117.1793,
        type: 'urban',
        status: 'completed'
    },
    {
        name: '沪昆高铁',
        startLat: 31.2304,
        startLng: 121.4737,
        endLat: 25.0389,
        endLng: 102.7183,
        type: 'main',
        status: 'completed'
    },
    {
        name: '成渝高铁',
        startLat: 30.5728,
        startLng: 104.0668,
        endLat: 29.5647,
        endLng: 106.5507,
        type: 'urban',
        status: 'construction'
    },
    {
        name: '西成高铁',
        startLat: 34.2658,
        startLng: 108.9541,
        endLat: 30.5728,
        endLng: 104.0668,
        type: 'main',
        status: 'completed'
    },
    {
        name: '郑徐高铁',
        startLat: 34.7466,
        startLng: 113.6253,
        endLat: 34.2658,
        endLng: 117.2840,
        type: 'main',
        status: 'completed'
    },
    {
        name: '哈大高铁',
        startLat: 45.8038,
        startLng: 126.5349,
        endLat: 38.9140,
        endLng: 121.6147,
        type: 'main',
        status: 'completed'
    },
    {
        name: '兰新高铁',
        startLat: 36.0611,
        startLng: 103.8343,
        endLat: 43.8256,
        endLng: 87.6168,
        type: 'main',
        status: 'construction'
    },
    {
        name: '贵广高铁',
        startLat: 26.6477,
        startLng: 106.6302,
        endLat: 23.1291,
        endLng: 113.2644,
        type: 'branch',
        status: 'completed'
    },
    {
        name: '南广高铁',
        startLat: 22.8167,
        startLng: 108.3669,
        endLat: 23.1291,
        endLng: 113.2644,
        type: 'branch',
        status: 'completed'
    },
    {
        name: '杭深高铁',
        startLat: 30.2741,
        startLng: 120.1551,
        endLat: 22.5431,
        endLng: 114.0579,
        type: 'main',
        status: 'completed'
    },
    {
        name: '青荣城际',
        startLat: 36.0671,
        startLng: 120.3826,
        endLat: 37.5092,
        endLng: 122.1201,
        type: 'urban',
        status: 'completed'
    },
    {
        name: '石济高铁',
        startLat: 38.0428,
        startLng: 114.5149,
        endLat: 36.6512,
        endLng: 116.9977,
        type: 'branch',
        status: 'completed'
    },
    {
        name: '济青高铁',
        startLat: 36.6512,
        startLng: 116.9977,
        endLat: 36.0671,
        endLng: 120.3826,
        type: 'urban',
        status: 'construction'
    },
    {
        name: '商合杭高铁',
        startLat: 34.2972,
        startLng: 115.6506,
        endLat: 30.2741,
        endLng: 120.1551,
        type: 'main',
        status: 'construction'
    },
    {
        name: '京张高铁',
        startLat: 39.9042,
        startLng: 116.4074,
        endLat: 40.7686,
        endLng: 114.8946,
        type: 'main',
        status: 'completed'
    },
    {
        name: '太焦高铁',
        startLat: 37.8570,
        startLng: 112.5489,
        endLat: 35.2161,
        endLng: 113.2206,
        type: 'branch',
        status: 'construction'
    },
    {
        name: '银西高铁',
        startLat: 38.4872,
        startLng: 106.2309,
        endLat: 34.2658,
        endLng: 108.9541,
        type: 'branch',
        status: 'construction'
    },
    {
        name: '连徐高铁',
        startLat: 34.5967,
        startLng: 119.2216,
        endLat: 34.2658,
        endLng: 117.2840,
        type: 'branch',
        status: 'planning'
    },
    // 货运专线
    {
        name: '大秦铁路',
        startLat: 40.0931,
        startLng: 113.2948,
        endLat: 39.0458,
        endLng: 119.6049,
        type: 'freight',
        status: 'completed'
    },
    {
        name: '朔黄铁路',
        startLat: 39.3315,
        startLng: 112.4336,
        endLat: 38.9140,
        endLng: 117.7052,
        type: 'freight',
        status: 'completed'
    },
    {
        name: '瓦日铁路',
        startLat: 37.5530,
        startLng: 112.1870,
        endLat: 35.4164,
        endLng: 119.1975,
        type: 'freight',
        status: 'completed'
    },
    {
        name: '蒙华铁路',
        startLat: 42.2617,
        startLng: 111.9748,
        endLat: 30.5985,
        endLng: 114.2986,
        type: 'freight',
        status: 'construction'
    }
];

// 批量添加演示数据的函数
function loadDemoData() {
    // 清空现有数据
    routes.forEach(route => {
        if (route.polyline) {
            map.removeLayer(route.polyline);
        }
    });
    routes.length = 0;
    
    // 添加演示数据
    demoRoutes.forEach(route => {
        routes.push(route);
        drawRoute(route);
    });
    
    updateRouteList();
    updateStatistics();
    
    showMessage('演示数据加载完成！共加载 ' + demoRoutes.length + ' 条路线', 'success');
    
    // 调整地图视图到中国范围
    map.setView([35.0, 105.0], 4);
}

// 使用方法：
// 1. 打开 railway-monitor.html
// 2. 按 F12 打开开发者工具
// 3. 在控制台中复制粘贴此文件的内容
// 4. 执行 loadDemoData() 函数

console.log('演示数据已准备就绪！');
console.log('执行 loadDemoData() 来加载所有演示路线');
console.log('共包含 ' + demoRoutes.length + ' 条铁路线路');