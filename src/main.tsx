import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './arcade.css';

const root = document.getElementById('root');
if (!root) throw new Error('앱을 표시할 영역을 찾지 못했습니다.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

document.fonts.load('400 15px "Pretendard Variable"', '인지').then(() => {
  if (!document.fonts.check('400 15px "Pretendard Variable"')) {
    console.error('[design] Pretendard 로딩 실패. 폴백 폰트로 렌더링 중입니다.');
  }
});
