console.log('실행됨')
if (module.hot) {
  module.hot.accept((err) => {
    if (err) {
      console.error('HMR 오류:', err);
    }
  });
}