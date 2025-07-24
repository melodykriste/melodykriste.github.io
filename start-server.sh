#!/bin/bash

# 铁路监控大屏启动脚本
echo "==================================="
echo "🚄 铁路线路标段建设监控大屏"
echo "==================================="

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "✅ 检测到 Python3"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo "✅ 检测到 Python"
    PYTHON_CMD="python"
else
    echo "❌ 未找到 Python，请先安装 Python"
    exit 1
fi

# 选择端口
PORT=8000
echo "🌐 启动Web服务器，端口: $PORT"

# 启动服务器
echo "📂 服务器根目录: $(pwd)"
echo "🔗 访问地址: http://localhost:$PORT/railway-monitor.html"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

# 尝试自动打开浏览器
if command -v xdg-open &> /dev/null; then
    echo "🔄 正在打开浏览器..."
    sleep 2 && xdg-open "http://localhost:$PORT/railway-monitor.html" &
elif command -v open &> /dev/null; then
    echo "🔄 正在打开浏览器..."
    sleep 2 && open "http://localhost:$PORT/railway-monitor.html" &
fi

# 启动HTTP服务器
$PYTHON_CMD -m http.server $PORT