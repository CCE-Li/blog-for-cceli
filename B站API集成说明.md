# B站API集成说明

## 功能概述

已成功为您的博客集成了B站API，可以从B站获取热门番剧和国创数据，并在看番界面展示。

## 已实现的功能

### 1. B站API工具函数 (`src/utils/bilibili-api.ts`)
- `fetchBilibiliPopularAnime()`: 获取B站热门番剧排行榜
- `fetchBilibiliChineseAnime()`: 获取B站国创排行榜
- `fetchBilibiliUserAnimeList()`: 获取用户追番列表
- `fetchBilibiliUserFollowList()`: 获取用户追番数据（按状态）
- `fetchBilibiliUserAllFollowList()`: 获取用户所有追番状态数据
- `fetchBilibiliRankList()`: 获取B站排行榜数据
- `fetchBilibiliSeasonInfo()`: 获取番剧详细信息
- `processBilibiliRankData()`: 处理B站排行榜数据格式
- `processBilibiliUserFollowData()`: 处理用户追番数据格式

### 2. 配置文件更新 (`src/config.ts`)
```typescript
anime: {
    mode: "bilibili", // 设置为B站模式
    bilibili: {
        userId: "440430791", // B站用户ID
        apiKey: "", // B站API密钥（如果需要）
        useUserFollow: true, // 是否使用用户追番数据
    },
},
```

### 3. 页面集成 (`src/pages/anime.astro`)
- 支持三种模式：`local`（本地）、`bangumi`（Bangumi API）、`bilibili`（B站API）
- 自动回退机制：如果B站API失败，自动使用本地数据
- 错误处理和日志记录

### 4. 类型定义更新 (`src/types/config.ts`)
- 添加了B站模式支持
- 更新了配置类型定义

## 使用方法

### 1. 启用B站模式
在 `src/config.ts` 中设置：
```typescript
anime: {
    mode: "bilibili", // 使用B站API
    bilibili: {
        userId: "你的B站用户ID", // 替换为实际用户ID
        useUserFollow: true, // 使用用户追番数据
    },
}
```

### 2. 测试B站API
- 访问 `/bilibili-test` 页面查看B站热门数据
- 访问 `/bilibili-user-test` 页面查看用户追番数据

### 3. 查看番剧页面
访问 `/anime` 页面查看集成的B站番剧数据。

### 4. 配置选项
- `useUserFollow: true` - 优先使用用户追番数据，无数据时回退到热门数据
- `useUserFollow: false` - 直接使用B站热门数据

## API数据来源

### 用户追番数据
- 来源：B站用户追番列表API
- 数据：用户追番的番剧、观看进度、评分、状态等
- 状态：追番中、已完结、想看

### 热门番剧
- 来源：B站番剧排行榜（最近3天）
- 数据：番剧标题、封面、描述、年份、类型、制作方等

### 国创数据
- 来源：B站国创排行榜（最近3天）
- 数据：国创标题、封面、描述、年份、类型、制作方等

## 数据格式

B站API返回的数据会被转换为统一格式：
```typescript
interface BilibiliAnimeItem {
    title: string;           // 标题
    status: "watching" | "completed" | "planned"; // 状态
    rating: number;          // 评分
    cover: string;           // 封面图片
    description: string;     // 描述
    episodes: string;        // 集数信息
    year: string;           // 年份
    genre: string[];        // 类型标签
    studio: string;         // 制作方
    link: string;           // 链接
    progress: number;        // 观看进度
    totalEpisodes: number;  // 总集数
    startDate: string;      // 开始日期
    endDate: string;        // 结束日期
}
```

## 错误处理

1. **API请求失败**：自动回退到本地数据
2. **数据解析错误**：记录错误日志，使用默认数据
3. **网络超时**：设置合理的超时时间

## 注意事项

1. **API限制**：B站API可能有请求频率限制，建议适当缓存数据
2. **数据更新**：B站数据会定期更新，建议设置合理的缓存策略
3. **用户隐私**：仅获取公开的排行榜数据，不涉及用户个人信息

## 自定义配置

### 修改用户ID
在 `src/config.ts` 中修改：
```typescript
bilibili: {
    userId: "你的B站用户ID",
}
```

### 添加API密钥（如果需要）
```typescript
bilibili: {
    userId: "你的B站用户ID",
    apiKey: "你的API密钥",
}
```

## 故障排除

1. **404错误**：检查B站API接口是否可用
2. **数据为空**：检查网络连接和API响应
3. **图片加载失败**：检查图片URL是否有效

## 扩展功能

可以进一步扩展的功能：
1. 用户追番列表（需要用户授权）
2. 番剧详细信息
3. 评论和评分数据
4. 个性化推荐

## 测试页面

访问 `/bilibili-test` 可以查看：
- B站API数据获取状态
- 热门番剧和国创数据预览
- API响应统计信息
