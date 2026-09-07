import { useState } from 'react';
import Icon3D from '../ui/Icon3D';
import { GAME_META, GAME_ORDER } from '../domain/session';
import { BASELINE_STORAGE_KEY } from '../domain/baseline';

export default function GuideTab() {
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="tab-panel">
      <h1 className="panel-title">게임 안내</h1>
      <p className="lead">연구에서 쓰이는 과제의 원리를 참고한 짧은 게임이에요. 정식 검사와 같거나 ADHD를 측정하는 앱은 아니에요.</p>
      <ul className="guide-list">{GAME_ORDER.map(key => {
        const meta = GAME_META[key];
        return <li className="guide-row" key={key}>
          <div className="guide-head"><Icon3D name={key} size={28} /><h2>{meta.title}</h2></div>
          <p>{meta.description}</p>
          <details className="guide-detail"><summary>과제 원리와 한계</summary>
            <p><strong>무엇을 보나요</strong> · {meta.looksAt}</p>
            <p><strong>어떻게 바꿨나요</strong> · {meta.basis}</p>
            <p><strong>한계</strong> · {meta.limit}</p>
            <a href={meta.source} target="_blank" rel="noreferrer noopener">원형 과제 자료 읽기 ↗</a>
          </details>
        </li>;
      })}</ul>
      <div className="notice-box">
        <p>이 앱은 어떤 게임도 진단·선별·치료 판단에 쓰지 않아요.</p>
        <p>레벨·기기·브라우저가 다르면 기록을 직접 비교하지 마세요. 새로 만든 이야기들의 난이도 동등성은 검증하지 않았어요.</p>
        <p>게임 결과와 답안은 저장하지 않아요. 이 창을 새로고침하면 사라져요.</p>
      </div>
      <details className="legacy-records"><summary>이전 버전의 저장 기록 관리</summary>
        <p>이전 버전에서 이 브라우저에 저장한 기록은 자동으로 지우지 않아요. 원하면 아래에서 삭제할 수 있어요.</p>
        {deleted ? <p role="status">내 기록을 모두 삭제했어요.</p> : confirming ?
          <div className="confirm-card" role="alertdialog" aria-labelledby="delete-title">
            <h2 id="delete-title">내 기록을 모두 지울까요?</h2><p>되돌릴 수 없어요.</p>
            <button className="danger-button" type="button" onClick={() => {
              try { localStorage.removeItem(BASELINE_STORAGE_KEY); setDeleted(true); setConfirming(false); }
              catch { setError(true); }
            }}>네, 모두 지울게요</button>
            <button className="quiet-button" type="button" onClick={() => setConfirming(false)}>취소</button>
            {error && <p role="alert">브라우저가 저장소 접근을 막았어요. 브라우저의 사이트 데이터 설정에서 삭제해 주세요.</p>}
          </div> :
          <button className="quiet-button" type="button" onClick={() => setConfirming(true)}>내 기록 모두 삭제</button>}
      </details>
    </div>
  );
}
