<script lang="ts">
    import { onMount } from "svelte";
    import { Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle, Wind } from "lucide-svelte";

    $: formattedTime = currentTime.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    let currentTime = new Date();
    let weather: {
        temp: number;
        condition: string;
        location: string;
    } | null = null;
    let weatherLoading = true;
    let weatherError = false;

    // localStorage 键名
    const LOCATION_KEY = "weather_location";
    const WEATHER_KEY = "weather_data";
    const WEATHER_TIMESTAMP_KEY = "weather_timestamp";
    const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30分钟

    onMount(() => {
        const interval = setInterval(() => {
            currentTime = new Date();
        }, 10000);

        // 检查缓存并决定是否需要更新
        checkAndUpdateWeather();

        return () => {
            clearInterval(interval);
        };
    });

    function checkAndUpdateWeather() {
        try {
            const cached = localStorage.getItem(WEATHER_KEY);
            const timestamp = localStorage.getItem(WEATHER_TIMESTAMP_KEY);

            if (cached && timestamp) {
                const now = Date.now();
                const cacheTime = parseInt(timestamp);
                const elapsed = now - cacheTime;

                // 加载缓存数据
                weather = JSON.parse(cached);
                weatherLoading = false;

                // 如果缓存超过设定时间，延迟更新
                if (elapsed >= WEATHER_CACHE_DURATION) {
                    setTimeout(fetchWeather, 1000);
                }
            } else {
                // 没有缓存，延迟获取天气
                setTimeout(fetchWeather, 1000);
            }
        } catch (error) {
            console.warn("检查天气缓存失败:", error);
            setTimeout(fetchWeather, 1000);
        }
    }

    async function getLocation(): Promise<{ latitude: number; longitude: number; city: string }> {
        // 先检查缓存
        const cached = localStorage.getItem(LOCATION_KEY);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (error) {
                console.warn("解析缓存位置失败:", error);
            }
        }

        // 尝试多个 IP 定位 API
        let latitude: number;
        let longitude: number;
        let city: string;

        try {
            // 方案1: 使用 ip-api.com (免费，无需 key，支持 HTTPS)
            const ipResponse = await fetch("http://ip-api.com/json/?fields=lat,lon,city", {
                signal: AbortSignal.timeout(8000),
            });
            if (!ipResponse.ok) throw new Error("IP API 1 failed");
            const ipData = await ipResponse.json();
            if (ipData.lat && ipData.lon) {
                latitude = ipData.lat;
                longitude = ipData.lon;
                city = ipData.city || "未知位置";
            } else {
                throw new Error("Invalid IP data");
            }
        } catch (ipError1) {
            console.warn("IP定位方案1失败，尝试方案2:", ipError1);
            try {
                // 方案2: 使用 ipapi.co (备用)
                const ipResponse2 = await fetch("https://ipapi.co/json/", {
                    signal: AbortSignal.timeout(8000),
                });
                if (!ipResponse2.ok) throw new Error("IP API 2 failed");
                const ipData2 = await ipResponse2.json();
                latitude = ipData2.latitude;
                longitude = ipData2.longitude;
                city = ipData2.city || "未知位置";
            } catch (ipError2) {
                console.warn("IP定位方案2失败，尝试方案3:", ipError2);
                try {
                    // 方案3: 使用 ipwhois.app
                    const ipResponse3 = await fetch("http://ipwho.is/", {
                        signal: AbortSignal.timeout(8000),
                    });
                    if (!ipResponse3.ok) throw new Error("IP API 3 failed");
                    const ipData3 = await ipResponse3.json();
                    latitude = ipData3.latitude;
                    longitude = ipData3.longitude;
                    city = ipData3.city || "未知位置";
                } catch (ipError3) {
                    console.warn("所有IP定位方案失败，使用默认位置（北京）:", ipError3);
                    // 回退到北京坐标
                    latitude = 39.9042;
                    longitude = 116.4074;
                    city = "北京";
                }
            }
        }

        const location = { latitude, longitude, city };
        // 保存到 localStorage
        try {
            localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        } catch (error) {
            console.warn("保存位置到缓存失败:", error);
        }

        return location;
    }

    async function fetchWeather() {
        try {
            weatherLoading = true;
            weatherError = false;

            // 获取位置（优先使用缓存）
            const { latitude, longitude, city } = await getLocation();

            // 使用 Open-Meteo API 获取天气
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
                {
                    signal: AbortSignal.timeout(10000),
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!weatherResponse.ok) {
                throw new Error(`Weather API returned ${weatherResponse.status}`);
            }

            const weatherData = await weatherResponse.json();

            weather = {
                temp: Math.round(weatherData.current.temperature_2m),
                condition: getWeatherCondition(weatherData.current.weather_code),
                location: city,
            };

            // 保存到 localStorage
            try {
                localStorage.setItem(WEATHER_KEY, JSON.stringify(weather));
                localStorage.setItem(WEATHER_TIMESTAMP_KEY, Date.now().toString());
            } catch (error) {
                console.warn("保存天气到缓存失败:", error);
            }

            weatherError = false;
        } catch (error) {
            console.error("获取天气信息失败:", error);
            weatherError = true;
            // 显示错误但不清空之前的数据
            if (!weather) {
                weather = null;
            }
        } finally {
            weatherLoading = false;
        }
    }

    // 根据 WMO 天气代码转换为中文描述
    function getWeatherCondition(code: number): string {
        if (code === 0) return "晴朗";
        if (code <= 3) return "多云";
        if (code <= 48) return "雾";
        if (code <= 57) return "毛毛雨";
        if (code <= 67) return "雨";
        if (code <= 77) return "雪";
        if (code <= 82) return "阵雨";
        if (code <= 86) return "阵雪";
        if (code >= 95) return "雷暴";
        return "未知";
    }

    // 根据天气状况返回对应的图标组件
    function getWeatherIcon(condition: string) {
        if (condition.includes("晴")) return Sun;
        if (condition.includes("雨") || condition.includes("阵雨")) return CloudRain;
        if (condition.includes("雪") || condition.includes("阵雪")) return CloudSnow;
        if (condition.includes("毛毛雨")) return CloudDrizzle;
        if (condition.includes("雾") || condition.includes("霾")) return Wind;
        return Cloud;
    }

    function getDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${year} 年 ${month} 月 ${day} 日 星期${["日", "一", "二", "三", "四", "五", "六"][date.getDay()]}`;
    }
</script>

<div class="flex flex-col rounded-sm p-4 bg-[var(--bg2)] mr-4 relative">
    <div>
        <span class="text-8xl">{formattedTime.split(":")[0]}</span>
        <span class="text-5xl">: {formattedTime.split(":")[1]}</span>
    </div>
    <br />
    <span class="text-lg ml-2">{getDate()}</span>

    <!-- 天气模块 -->
    {#if weather && !weatherLoading}
        <div class="absolute top-4 right-4 flex flex-col items-center gap-1">
            <svelte:component
                this={getWeatherIcon(weather.condition)}
                class="w-12 h-12 opacity-80"
            />
            <div class="flex flex-col items-center leading-tight">
                <span class="text-2xl font-medium">{weather.temp}°C</span>
                <span class="text-xs opacity-60">{weather.condition}</span>
            </div>
        </div>
    {:else if weatherLoading}
        <div class="absolute top-4 right-4 flex flex-col items-center gap-1">
            <div class="w-12 h-12 flex items-center justify-center">
                <span class="text-xs opacity-50">加载中...</span>
            </div>
        </div>
    {:else if weatherError}
        <div
            class="absolute top-4 right-4 flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            on:click={fetchWeather}
            on:keydown={(e) => e.key === "Enter" && fetchWeather()}
            role="button"
            tabindex="0"
        >
            <Cloud class="w-12 h-12 opacity-50" />
            <span class="text-xs opacity-50">点击重试</span>
        </div>
    {/if}
</div>
