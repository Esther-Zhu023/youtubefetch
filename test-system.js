#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3001';

async function testSystem() {
  console.log('🚀 开始测试AI趋势发现平台...\n'.cyan);

  const tests = [
    {
      name: '健康检查',
      url: '/api/health',
      method: 'GET'
    },
    {
      name: '添加示例数据',
      url: '/api/admin/add-sample-data',
      method: 'POST'
    },
    {
      name: '获取热门项目',
      url: '/api/trends/hot',
      method: 'GET'
    },
    {
      name: '获取小众项目',
      url: '/api/trends/niche',
      method: 'GET'
    },
    {
      name: '获取关键词',
      url: '/api/keywords/trending',
      method: 'GET'
    },
    {
      name: '获取分析数据',
      url: '/api/analytics/overview',
      method: 'GET'
    },
    {
      name: '获取系统状态',
      url: '/api/admin/status',
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📋 测试: ${test.name}...`.yellow);
      
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        console.log(`✅ ${test.name} - 通过`.green);
        
        // 显示一些关键数据
        if (test.url === '/api/admin/status' && response.data.data) {
          console.log(`   📊 总项目数: ${response.data.data.totalProjects}`.gray);
        }
        if (test.url === '/api/trends/hot' && response.data.data) {
          console.log(`   🔥 热门项目数: ${response.data.data.length}`.gray);
        }
        
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - 失败: 响应格式错误`.red);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - 失败: ${error.message}`.red);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 提示: 请确保服务器正在运行 (npm run server:dev)'.yellow);
      }
    }
    
    console.log(''); // 空行
  }

  // 测试结果总结
  console.log('📊 测试结果总结:'.cyan);
  console.log(`✅ 通过: ${passedTests}/${totalTests}`.green);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`.red);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！系统运行正常！'.green.bold);
    console.log('🌐 访问 http://localhost:3000 查看前端界面'.cyan);
  } else {
    console.log('\n⚠️  部分测试失败，请检查服务器配置'.yellow.bold);
  }

  // 额外的系统信息
  console.log('\n📋 系统信息:'.cyan);
  console.log(`🔗 后端API: ${BASE_URL}`.gray);
  console.log(`🌐 前端界面: http://localhost:3000`.gray);
  console.log(`🔧 管理界面: http://localhost:3000/admin`.gray);
  
  // YouTube配置检查
  if (process.env.YOUTUBE_API_KEY) {
    console.log(`📺 YouTube API: 已配置`.green);
  } else {
    console.log(`📺 YouTube API: 未配置 (可选)`.yellow);
  }
}

// 运行测试
testSystem().catch(error => {
  console.error('测试过程中出现错误:', error.message);
  process.exit(1);
});