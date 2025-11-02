function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Trình duyệt không hỗ trợ lấy vị trí.');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        let message = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Bạn đã từ chối quyền truy cập vị trí.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Không thể xác định vị trí.';
            break;
          case error.TIMEOUT:
            message = 'Hết thời gian chờ vị trí.';
            break;
          default:
            message = 'Lỗi không xác định.';
        }
        reject(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  });
}
