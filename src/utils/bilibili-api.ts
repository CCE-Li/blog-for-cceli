// B站API工具函数
export interface BilibiliAnimeItem {
	title: string;
	status: "watching" | "completed" | "planned";
	rating: number;
	cover: string;
	description: string;
	episodes: string;
	year: string;
	genre: string[];
	studio: string;
	link: string;
	progress: number;
	totalEpisodes: number;
	startDate: string;
	endDate: string;
}

// B站API基础配置
const BILIBILI_API_BASE = "https://api.bilibili.com";

/**
 * 获取B站番剧排行榜数据
 * @param seasonType 番剧类型，1=番剧，2=国创
 * @param day 天数，3=最近3天，7=最近7天
 */
export async function fetchBilibiliRankList(seasonType: number = 1, day: number = 3) {
	try {
		const response = await fetch(
			`${BILIBILI_API_BASE}/pgc/web/rank/list?season_type=${seasonType}&day=${day}`,
			{
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					'Referer': 'https://www.bilibili.com/',
				},
			}
		);
		
		if (!response.ok) {
			throw new Error(`B站API错误: ${response.status}`);
		}
		
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("获取B站排行榜数据失败:", error);
		return null;
	}
}

/**
 * 获取B站番剧详细信息
 * @param seasonId 番剧ID
 */
export async function fetchBilibiliSeasonInfo(seasonId: string) {
	try {
		const response = await fetch(
			`${BILIBILI_API_BASE}/pgc/view/web/season?season_id=${seasonId}`,
			{
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					'Referer': 'https://www.bilibili.com/',
				},
			}
		);
		
		if (!response.ok) {
			throw new Error(`B站API错误: ${response.status}`);
		}
		
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`获取番剧 ${seasonId} 详细信息失败:`, error);
		return null;
	}
}

/**
 * 获取B站用户追番列表（需要用户授权）
 * @param userId 用户ID
 * @param followStatus 追番状态：1=追番中，2=已完结，3=想看
 * @param pageSize 每页数量，默认20
 * @param pageNum 页码，默认1
 */
export async function fetchBilibiliUserFollowList(
	userId: string, 
	followStatus: number = 1, 
	pageSize: number = 20, 
	pageNum: number = 1
) {
	try {
		// 使用更完整的请求头和参数
		const response = await fetch(
			`${BILIBILI_API_BASE}/pgc/web/follow/list?type=1&follow_status=${followStatus}&ps=${pageSize}&pn=${pageNum}`,
			{
				method: 'GET',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Referer': 'https://www.bilibili.com/',
					'Origin': 'https://www.bilibili.com',
					'Accept': 'application/json, text/plain, */*',
					'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
					'Accept-Encoding': 'gzip, deflate, br',
					'Connection': 'keep-alive',
					'Cookie': `DedeUserID=${userId}; buvid3=; SESSDATA=;`, // 需要真实的Cookie
				},
			}
		);
		
		console.log(`B站API请求状态: ${response.status}`);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`B站API错误详情: ${response.status} - ${errorText}`);
			throw new Error(`B站API错误: ${response.status} - ${errorText}`);
		}
		
		const data = await response.json();
		console.log('B站API响应数据:', data);
		return data;
	} catch (error) {
		console.error("获取用户追番列表失败:", error);
		return null;
	}
}

/**
 * 获取用户所有追番状态的数据
 * @param userId 用户ID
 */
export async function fetchBilibiliUserAllFollowList(userId: string) {
	try {
		// 并行获取不同状态的追番数据
		const [watchingData, completedData, plannedData] = await Promise.all([
			fetchBilibiliUserFollowList(userId, 1, 50, 1), // 追番中
			fetchBilibiliUserFollowList(userId, 2, 50, 1), // 已完结
			fetchBilibiliUserFollowList(userId, 3, 50, 1), // 想看
		]);

		return {
			watching: watchingData,
			completed: completedData,
			planned: plannedData,
		};
	} catch (error) {
		console.error("获取用户所有追番数据失败:", error);
		return null;
	}
}

/**
 * 处理B站排行榜数据，转换为统一格式
 * @param rankData B站排行榜数据
 */
export function processBilibiliRankData(rankData: any): BilibiliAnimeItem[] {
	if (!rankData || !rankData.result || !rankData.result.list) {
		return [];
	}

	return rankData.result.list.map((item: any) => {
		// 提取基本信息
		const title = item.title || item.name || "未知标题";
		const cover = item.cover || item.pic || "/assets/anime/default.webp";
		const description = item.desc || item.evaluate || "";
		
		// 提取年份
		const year = item.pub_date ? new Date(item.pub_date).getFullYear().toString() : "未知";
		
		// 提取类型标签
		const genre = item.styles ? item.styles.map((style: any) => style.name) : ["未知"];
		
		// 提取制作方信息
		const studio = item.new_ep?.show_text || item.areas?.[0]?.name || "未知";
		
		// 构建链接
		const link = item.url || `https://www.bilibili.com/bangumi/play/ss${item.season_id}`;
		
		// 提取集数信息
		const totalEpisodes = item.total_episode || item.new_ep?.index_show?.match(/\d+/)?.[0] || 0;
		const progress = 0; // 排行榜数据通常不包含观看进度
		
		return {
			title,
			status: "planned" as const, // 排行榜数据默认为计划观看
			rating: 0, // 排行榜数据通常不包含评分
			cover,
			description,
			episodes: `${totalEpisodes} episodes`,
			year,
			genre,
			studio,
			link,
			progress,
			totalEpisodes: Number(totalEpisodes),
			startDate: item.pub_date || "",
			endDate: item.pub_date || "",
		};
	});
}

/**
 * 获取B站热门番剧数据（推荐使用）
 */
export async function fetchBilibiliPopularAnime(): Promise<BilibiliAnimeItem[]> {
	try {
		console.log("获取B站热门番剧数据...");
		
		// 获取番剧排行榜（最近3天）
		const rankData = await fetchBilibiliRankList(1, 3);
		
		if (!rankData) {
			console.warn("无法获取B站番剧数据，返回空数组");
			return [];
		}
		
		// 处理数据
		const processedData = processBilibiliRankData(rankData);
		
		console.log(`成功获取B站热门番剧数据: ${processedData.length}个`);
		
		// 限制返回数量，避免数据过多
		return processedData.slice(0, 20);
	} catch (error) {
		console.error("获取B站热门番剧数据失败:", error);
		return [];
	}
}

/**
 * 获取B站番剧数据（混合模式 - 推荐使用）
 * 优先使用用户追番数据，失败时使用热门数据
 * @param userId 用户ID
 */
export async function fetchBilibiliMixedAnimeData(userId: string): Promise<BilibiliAnimeItem[]> {
	try {
		console.log(`开始获取B站番剧数据，用户ID: ${userId}`);
		
		// 首先尝试获取用户追番数据
		const userAnimeList = await fetchBilibiliUserAnimeList(userId);
		
		if (userAnimeList.length > 0) {
			console.log(`使用用户追番数据: ${userAnimeList.length}个`);
			return userAnimeList;
		}
		
		// 如果用户追番数据为空，使用热门数据
		console.log("用户追番数据为空，使用热门数据");
		const [popularAnime, chineseAnime] = await Promise.all([
			fetchBilibiliPopularAnime(),
			fetchBilibiliChineseAnime()
		]);
		
		// 合并番剧和国创数据
		const allAnimeList = [...popularAnime, ...chineseAnime];
		
		console.log(`使用热门数据: 番剧${popularAnime.length}个, 国创${chineseAnime.length}个, 总计${allAnimeList.length}个`);
		
		return allAnimeList;
	} catch (error) {
		console.error("获取B站番剧数据失败:", error);
		return [];
	}
}

/**
 * 获取B站国创数据
 */
export async function fetchBilibiliChineseAnime(): Promise<BilibiliAnimeItem[]> {
	try {
		// 获取国创排行榜
		const rankData = await fetchBilibiliRankList(2, 3);
		
		if (!rankData) {
			console.warn("无法获取B站国创数据，返回空数组");
			return [];
		}
		
		// 处理数据
		const processedData = processBilibiliRankData(rankData);
		
		// 限制返回数量
		return processedData.slice(0, 10);
	} catch (error) {
		console.error("获取B站国创数据失败:", error);
		return [];
	}
}

/**
 * 处理用户追番数据，转换为统一格式
 * @param followData 用户追番数据
 * @param status 追番状态
 */
export function processBilibiliUserFollowData(followData: any, status: string): BilibiliAnimeItem[] {
	if (!followData || !followData.result || !followData.result.list) {
		return [];
	}

	return followData.result.list.map((item: any) => {
		// 提取基本信息
		const title = item.title || item.name || "未知标题";
		const cover = item.cover || item.pic || "/assets/anime/default.webp";
		const description = item.desc || item.evaluate || "";
		
		// 提取年份
		const year = item.pub_date ? new Date(item.pub_date).getFullYear().toString() : "未知";
		
		// 提取类型标签
		const genre = item.styles ? item.styles.map((style: any) => style.name) : ["未知"];
		
		// 提取制作方信息
		const studio = item.new_ep?.show_text || item.areas?.[0]?.name || "未知";
		
		// 构建链接
		const link = item.url || `https://www.bilibili.com/bangumi/play/ss${item.season_id}`;
		
		// 提取集数信息
		const totalEpisodes = item.total_episode || item.new_ep?.index_show?.match(/\d+/)?.[0] || 0;
		
		// 提取观看进度
		const progress = item.progress || 0;
		
		// 提取评分
		const rating = item.rating || 0;

		return {
			title,
			status: status as "watching" | "completed" | "planned",
			rating,
			cover,
			description,
			episodes: `${totalEpisodes} episodes`,
			year,
			genre,
			studio,
			link,
			progress,
			totalEpisodes: Number(totalEpisodes),
			startDate: item.pub_date || "",
			endDate: item.pub_date || "",
		};
	});
}

/**
 * 获取B站用户基本信息（公开接口）
 * @param userId 用户ID
 */
export async function fetchBilibiliUserInfo(userId: string) {
	try {
		const response = await fetch(
			`${BILIBILI_API_BASE}/x/space/acc/info?mid=${userId}`,
			{
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					'Referer': 'https://space.bilibili.com/',
				},
			}
		);
		
		if (!response.ok) {
			throw new Error(`B站用户信息API错误: ${response.status}`);
		}
		
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("获取B站用户信息失败:", error);
		return null;
	}
}

/**
 * 获取用户追番数据（推荐使用）
 * @param userId 用户ID
 */
export async function fetchBilibiliUserAnimeList(userId: string): Promise<BilibiliAnimeItem[]> {
	try {
		console.log(`尝试获取用户 ${userId} 的追番数据...`);
		
		// 首先尝试获取用户信息，验证用户ID是否有效
		const userInfo = await fetchBilibiliUserInfo(userId);
		if (!userInfo || userInfo.code !== 0) {
			console.warn(`用户 ${userId} 不存在或无法访问，将使用热门数据`);
			return [];
		}
		
		console.log(`用户信息获取成功: ${userInfo.data?.name || '未知用户'}`);
		
		// 尝试获取用户追番数据
		const allFollowData = await fetchBilibiliUserAllFollowList(userId);
		
		if (!allFollowData || !allFollowData.watching || !allFollowData.completed || !allFollowData.planned) {
			console.warn("无法获取用户追番数据，可能的原因：");
			console.warn("1. 用户未登录B站");
			console.warn("2. 用户没有追番记录");
			console.warn("3. API接口需要用户授权");
			console.warn("4. 接口已变更或限制访问");
			return [];
		}
		
		// 处理不同状态的数据
		const watchingList = processBilibiliUserFollowData(allFollowData.watching, "watching");
		const completedList = processBilibiliUserFollowData(allFollowData.completed, "completed");
		const plannedList = processBilibiliUserFollowData(allFollowData.planned, "planned");
		
		// 合并所有数据
		const allAnimeList = [...watchingList, ...completedList, ...plannedList];
		
		console.log(`成功获取用户追番数据: 追番中${watchingList.length}个, 已完结${completedList.length}个, 想看${plannedList.length}个`);
		
		// 限制返回数量，避免数据过多
		return allAnimeList.slice(0, 50);
	} catch (error) {
		console.error("获取用户追番数据失败:", error);
		return [];
	}
}
