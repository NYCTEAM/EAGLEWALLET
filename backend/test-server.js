// 简单测试服务器 - 用于验证端口和路由
const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

// 测试根路径
app.get('/', (req, res) => {
    res.send('Test Server Running on Port 3001');
});

// 测试 /api/health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API Health endpoint working!',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// 测试 /health (无 /api 前缀)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Health endpoint (no /api prefix) working!',
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log(`Test URLs:`);
    console.log(`  - http://localhost:${PORT}/`);
    console.log(`  - http://localhost:${PORT}/health`);
    console.log(`  - http://localhost:${PORT}/api/health`);
});
