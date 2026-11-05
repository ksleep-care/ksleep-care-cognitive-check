import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';

const description = '기억력부터 반응속도까지, 7가지 두뇌 게임에 도전해 보세요. 루키부터 마스터까지 나에게 맞는 난이도로 즐겨요.';

describe('공개 링크 소개', () => {
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    it(`${selector}에 승인된 소개 문구를 제공한다`, () => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.querySelector(selector)?.getAttribute('content')).toBe(description);
      expect(doc.title).toBe('인지 컨디션 체크 | 수미헬스');
      expect(html).not.toContain('로그인 없이 이용하는 한글 인지 컨디션 체크');
    });
  }
});
