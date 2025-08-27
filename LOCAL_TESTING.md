# 本地测试指南

## 环境要求
1. MongoDB 本地运行 (端口 27017)
2. Node.js 和 npm 已安装
3. 项目依赖已安装 (`npm install`)

## 开始测试

### 1. 启动服务器
```bash
npm run dev
# 或者
node server.js
```

服务器将在 http://localhost:3000 启动

### 2. 初始化测试用户
**POST** `http://localhost:3000/api/auth/init-users`

这将创建测试用户：
- Candidate: username: `candidate`, password: `123456`
- HR: username: `hr`, password: `123456`

### 3. 测试流程

#### 第一步：Candidate 登录
**POST** `http://localhost:3000/api/auth/login`
```json
{
  "username": "candidate",
  "password": "123456"
}
```
保存返回的 `token`

#### 第二步：Candidate 填写信息
**POST** `http://localhost:3000/api/candidates/profile`
Headers: `Authorization: Bearer <token>`
```json
{
  "fullName": "John Doe",
  "phone": "1234567890"
}
```

#### 第三步：Candidate 上传视频
**POST** `http://localhost:3000/api/candidates/upload-video`
Headers: `Authorization: Bearer <token>`
Body: form-data with file field named `video`

上传一个视频文件（支持 .mp4, .mov, .avi, .mkv）

#### 第四步：检查视频处理状态
**GET** `http://localhost:3000/api/candidates/video-status`
Headers: `Authorization: Bearer <token>`

等待处理完成（可能需要几分钟）

#### 第五步：HR 登录
**POST** `http://localhost:3000/api/auth/login`
```json
{
  "username": "hr", 
  "password": "123456"
}
```
保存返回的 `token`

#### 第六步：HR 查看候选人列表
**GET** `http://localhost:3000/api/hr/candidates`
Headers: `Authorization: Bearer <token>`

#### 第七步：HR 查看候选人详情
**GET** `http://localhost:3000/api/hr/candidates/<candidate_id>`
Headers: `Authorization: Bearer <token>`

#### 第八步：HR 获取视频质量选项
**GET** `http://localhost:3000/api/hr/candidates/<candidate_id>/video-qualities`
Headers: `Authorization: Bearer <token>`

#### 第九步：HR 播放视频
**GET** `http://localhost:3000/api/hr/candidates/<candidate_id>/video?quality=1080p`
Headers: `Authorization: Bearer <token>`

可选的质量参数：`1080p`, `720p`, `480p`, `360p`

## 前端测试
访问 http://localhost:3000 使用web界面测试

## 故障排除
1. 确保 MongoDB 正在运行
2. 检查 uploads 目录权限
3. 确保视频文件小于 2GB
4. 检查服务器日志了解错误信息
