// src/index.js
import template from '../index.ejs'; // 기본 index.ejs

// 동적으로 EJS 파일 임포트 (예시: page1.ejs, page2.ejs, page3.ejs)
const templates = {
  'page1.html': () => import('./views/폴더1/page1.ejs'),
  'page2.html': () => import('./views/폴더1/page2.ejs'),
  'page3.html': () => import('./views/폴더2/page3.ejs'),
};

// 현재 페이지 결정
function getCurrentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}
// EJS 렌더링 함수
async function render() {
  const currentPage = getCurrentPage();
  const isIndex = currentPage === 'index.html';
  const data = {
    project: {
      projectName: '샘플 프로젝트',
      projectOrg: 'Hivelab',
      projectAuthor: 'IUI',
    },
    files: [
      [
        { theme: '폴더1' },
        { name: 'page1.html', listTitle: '페이지 1 : 첫 번째 페이지', splitStatus: 'new', splitStatusDate: '2025-04-11' },
        { name: 'page2.html', listTitle: '페이지 2 : 두 번째 페이지', splitStatus: 'update', splitStatusDate: '2025-04-10' },
      ],
      [
        { theme: '폴더2' },
        { name: 'page3.html', listTitle: '페이지 3 : 세 번째 페이지', splitStatus: null, splitStatusDate: null },
      ],
    ],
  };

  let html;
if (isIndex) {
    html = template(data);
  } else if (templates[currentPage]) {
    const module = await templates[currentPage]();
    html = module.default(data);
  } else {
    html = '<h1>Page Not Found</h1>';
  }
  document.getElementById('app').innerHTML = html; // DOM 갱신
}

// 초기 렌더링
render();
// 페이지 이동 감지 (뒤로/앞으로 버튼)
window.addEventListener('popstate', () => {
  render();
});
// 링크 클릭 이벤트 처리
document.addEventListener('click', (event) => {
  const link = event.target.closest('.index-link');
  if (link) {
    event.preventDefault(); // 기본 동작 방지
    const page = link.getAttribute('data-page');
    if (page) {
      history.pushState(null, '', `/${page}`); // URL 변경
      render(); // 페이지 렌더링
    }
  }
});
// HMR 핸들러
if (module.hot) {
  module.hot.accept([
    '../index.ejs',
    './views/폴더1/page1.ejs',
    './views/폴더1/page2.ejs',
    './views/폴더2/page3.ejs',
  ], () => {
    console.log('EJS template updated');
    render(); // EJS 변경 시 재렌더링
  });
}