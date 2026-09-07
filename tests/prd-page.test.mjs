import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const pagePath = resolve(process.cwd(), 'public/prd/index.html');
const html = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : '';
const document = new JSDOM(html).window.document;

describe('과제 제출용 PRD 페이지', () => {
  it('URL로 열었을 때 한글 PRD의 핵심 구조가 한 문서에 보인다', () => {
    expect(document.documentElement.lang).toBe('ko');
    expect(document.querySelector('meta[name="viewport"]')).not.toBeNull();
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('main')).not.toBeNull();
    expect(document.querySelectorAll('main section').length).toBeGreaterThanOrEqual(6);
  });

  it('목차의 모든 링크가 같은 문서 안의 실제 섹션으로 이동한다', () => {
    const links = [...document.querySelectorAll('nav a[href^="#"]')];

    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const link of links) {
      const id = link.getAttribute('href')?.slice(1);
      expect(id).toBeTruthy();
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it('공개 제출 문서가 외부 추적 자원이나 개인정보 입력을 만들지 않는다', () => {
    const externalResources = document.querySelectorAll(
      'script[src], img[src^="http"], link[href^="http"], iframe, video[src^="http"]',
    );

    expect(externalResources).toHaveLength(0);
    expect(document.querySelectorAll('input, textarea, select')).toHaveLength(0);
  });

  it('브라우저가 존재하지 않는 파비콘을 요청하지 않도록 문서 안에 아이콘을 포함한다', () => {
    const icon = document.querySelector('link[rel="icon"]');

    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('href')).toMatch(/^data:image\/svg\+xml,/);
  });

  it('제품의 존재 이유와 성과의 한계를 분명히 설명한다', () => {
    const purpose = document.querySelector('#purpose')?.textContent ?? '';
    const safety = document.querySelector('#safety')?.textContent ?? '';

    expect(purpose).toContain('치료를 계속할 이유');
    expect(purpose).toContain('환자 자기보고 결과');
    expect(purpose).toContain('게임 결과는 PROMs가 아닙니다');
    expect(safety).toContain('치료 효과를 입증');
    expect(safety).toContain('의료적 판단');
  });

  it('제외한 측정과 근거 없는 목표 수치를 다시 넣지 않는다', () => {
    const body = document.body.textContent ?? '';

    expect(body).not.toContain('3분 집중 측정');
    expect(body).not.toContain('치료 4주');
    expect(body).not.toContain('80%');
    expect(body).not.toContain('70%');
    expect(body).not.toContain('10명 중 8명');
  });

  it('환자가 원할 때 확인하되 비교 조건은 일관되게 설계한다', () => {
    const journey = document.querySelector('#journey')?.textContent ?? '';
    const screens = document.querySelector('#screens')?.textContent ?? '';

    expect(journey).toContain('원할 때 언제든지');
    expect(journey).toContain('졸리고 집중이 잘 안 되던 시간');
    expect(journey).toContain('요일과 시간');
    expect(screens).toContain('내가 정한 시간');
  });

  it('현재 있는 기능과 새로 구현할 범위를 구분한다', () => {
    const implementation = document.querySelector('#technology')?.textContent ?? '';

    expect(implementation).toContain('현재 SOOMi에서 재사용');
    expect(implementation).toContain('새로 구현');
    expect(implementation).toContain('수면검사 결과');
    expect(implementation).toContain('양압기 사용 정보');
    expect(implementation).toContain('인지 컨디션 게임');
  });

  it('성공 기준은 지어낸 비율 대신 검증할 행동과 사용성을 적는다', () => {
    const success = document.querySelector('#success')?.textContent ?? '';

    expect(success).toContain('초기에는 목표 비율을 임의로 정하지 않습니다');
    expect(success).toContain('기준값 완료율');
    expect(success).toContain('알림 후 체크 시작률');
    expect(success).toContain('치료 중단 어려움');
  });
});
