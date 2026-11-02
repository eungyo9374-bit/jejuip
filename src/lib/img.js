// TourAPI 이미지 주소가 http:// 로 오는 경우가 있어, https 배포 화면에서 막히지 않게 바꿔 줍니다
export const secure = (url) => (url ? url.replace(/^http:\/\//, 'https://') : url)
