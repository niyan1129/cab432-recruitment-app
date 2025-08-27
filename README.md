# 招聘视频上传系统 (Recruitment Video Upload System)

这是一个基于Node.js的招聘视频上传系统，支持候选人上传视频简历和HR查看管理功能。系统包含CPU密集型视频处理操作，满足CAB432作业要求。

## 功能特点

### 👤 候选人功能
- 简单登录（无需注册）
- 填写个人信息（姓名、电话、邮箱）
- 上传视频简历
- 查看申请状态

### 👔 HR功能
- HR登录查看候选人列表
- 查看候选人详细信息
- 播放候选人视频
- 对候选人进行评分和评论
- 更新申请状态

### 🔥 CPU密集型操作 (满足CAB432作业要求)

**核心特性**：长视频多质量序列转码，持续5-10分钟高CPU负载

- **序列视频编码** - 逐个生成1080p→720p→480p→360p (⭐ 持续CPU密集)
- **FFmpeg slower预设** - 使用最慢编码预设最大化CPU使用 (⭐ 80%+CPU使用率)
- **长时间处理** - 5-10分钟视频需要持续处理5+分钟 (⭐ 满足作业时长要求)
- **质量优化处理** - 每个质量都进行深度编码优化
- **H.264高质量编码** - 使用较低CRF值确保高CPU负载

**作业演示建议**：
1. 📹 **上传5-10分钟的视频文件**
2. 🔥 **选择多质量处理**: ['1080p', '720p', '480p', '360p']
3. ⏱️ **观察CPU使用率**: 处理期间应持续保持80%+
4. 📊 **监控时长**: 整个处理过程持续5-15分钟

**CPU负载特点**：
- 🔥 **短视频(1-2分钟)**: 2-6分钟处理时间
- 🔥🔥 **中等视频(5分钟)**: 5-15分钟处理时间 ✅ 
- 🔥🔥🔥 **长视频(10分钟+)**: 10-30分钟处理时间 ✅✅

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MongoDB + Mongoose
- **视频处理**: FFmpeg + fluent-ffmpeg
- **图像处理**: Sharp
- **认证**: JWT
- **文件上传**: Multer

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 环境配置
创建 `.env` 文件：
```
MONGODB_URI=mongodb://localhost:27017/recruitment_app
JWT_SECRET=your_super_secure_jwt_secret_key
PORT=3000
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600
```

### 3. 启动MongoDB
确保MongoDB服务正在运行

### 4. 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 初始化默认用户
访问: `POST http://localhost:3000/api/auth/init-users`

## 预设账号

### 候选人账号
- **邮箱**: candidate@demo.com
- **密码**: 123456
- **角色**: candidate

### HR账号
- **邮箱**: hr@demo.com
- **密码**: 123456
- **角色**: hr

## API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/init-users` - 初始化默认用户
- `GET /api/auth/me` - 获取当前用户信息

### 候选人接口
- `POST /api/candidates/profile` - 创建/更新个人信息
- `GET /api/candidates/profile` - 获取个人信息
- `POST /api/candidates/upload-video` - 上传视频（CPU密集型）
- `GET /api/candidates/video-status` - 查看视频处理状态
- `POST /api/candidates/submit-application` - 提交申请

### HR接口
- `GET /api/hr/candidates` - 获取候选人列表
- `GET /api/hr/candidates/:id` - 获取候选人详情
- `GET /api/hr/candidates/:id/video` - 播放候选人视频
- `GET /api/hr/candidates/:id/thumbnail` - 获取视频缩略图
- `POST /api/hr/candidates/:id/review` - 添加评分评论
- `PUT /api/hr/candidates/:id/status` - 更新申请状态

### 视频处理和压力测试
- `GET /api/videos/stress-test` - CPU密集型压力测试
- `POST /api/videos/simulate-load` - 模拟CPU负载
- `GET /api/videos/performance` - 获取服务器性能指标
- `GET /api/videos/processing-info` - 获取视频处理能力信息

## CPU密集型操作演示

### 1. 视频上传处理
上传视频文件时，系统会执行以下CPU密集型操作：
- 视频格式分析和元数据提取
- H.264编码压缩（最耗CPU）
- 分辨率调整到720p
- 生成视频缩略图
- 图像优化处理

### 2. 压力测试
```bash
# 基础压力测试
GET /api/videos/stress-test?complexity=1000000

# 高强度压力测试
GET /api/videos/stress-test?complexity=5000000

# 模拟负载
POST /api/videos/simulate-load
{
  "duration": 10000,
  "intensity": "high"
}
```

## 目录结构

```
├── models/
│   ├── User.js              # 用户模型
│   └── Candidate.js         # 候选人模型
├── routes/
│   ├── auth.js              # 认证路由
│   ├── candidates.js        # 候选人路由
│   ├── hr.js               # HR路由
│   └── videos.js           # 视频处理路由
├── middleware/
│   ├── auth.js             # 认证中间件
│   └── upload.js           # 文件上传中间件
├── services/
│   └── videoProcessor.js   # 视频处理服务（CPU密集型）
├── uploads/                # 文件上传目录
├── server.js              # 主服务器文件
└── package.json           # 项目配置
```

## 性能监控

系统提供实时性能监控：
- CPU使用率
- 内存使用情况
- 视频处理队列状态
- 服务器负载指标

访问 `GET /api/videos/performance` 查看实时性能数据。

## 注意事项

1. **FFmpeg依赖**: 确保系统已安装FFmpeg
2. **文件存储**: 上传的视频文件存储在./uploads目录
3. **内存使用**: 视频处理会消耗大量内存，建议至少4GB RAM
4. **CPU负载**: 视频编码是CPU密集型操作，会显著增加CPU使用率
5. **文件大小**: 默认限制视频文件大小为2GB (支持长视频)

## 作业要求满足情况

✅ **CPU密集型进程**: 视频编码、格式转换、缩略图生成
✅ **服务器负载**: 可通过压力测试接口触发高CPU使用率
✅ **实际应用场景**: 招聘视频上传和处理系统
✅ **性能监控**: 提供CPU、内存使用率监控接口

该系统完全满足CAB432作业中关于CPU密集型进程的要求，通过视频处理操作可以有效地给服务器施加计算负载。
