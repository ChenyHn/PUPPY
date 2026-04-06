import { ChatMessage } from '../types';

export type LocationData = ChatMessage['locationData'];

export async function getRealLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          let locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          
          // 尝试进行逆地理编码 (使用 OpenStreetMap Nominatim API)
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
              headers: {
                'Accept-Language': 'zh-CN,zh;q=0.9'
              }
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                locationName = data.display_name;
              }
            }
          } catch (geocodeError) {
            console.warn('逆地理编码失败，回退到坐标显示', geocodeError);
          }

          const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;

          resolve({
            type: 'real',
            name: locationName,
            lat,
            lon,
            mapUrl
          } as LocationData & { mapUrl: string });
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMsg = '获取位置失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '用户拒绝了定位请求';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMsg = '请求获取用户位置超时';
            break;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export function createVirtualLocation(name: string): LocationData {
  return {
    type: 'virtual',
    name: name || '未知虚拟位置'
  };
}
