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
});
