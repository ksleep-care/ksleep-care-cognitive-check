import { 이가, 과와 } from './particle';

/** 직접 작성한 가상 사건. 검사 원문과 실제 인물 정보를 사용하지 않는다. */
export interface StoryTemplateQuestion { q: string; answer: string; pool: string; alternatives?: string[] }
export interface StoryTemplate {
  title: string; variables: Record<string, string[]>;
  generate: (v: Record<string, string>) => { content: string; questions: StoryTemplateQuestion[]; delayedQuestions: StoryTemplateQuestion[] };
}

/** 장소뿐 아니라 사건·문제·해결 행동을 함께 바꾸는 24개 장면. */
const scenes = [
  ['산장에 남긴 지도', '산장', '등산 지도가 비에 젖었습니다', '새 지도를 펼쳐 돌아갈 길을 표시했습니다', '지도'],
  ['라디오의 첫 방송', '방송실', '첫 방송의 대본 순서가 바뀌었습니다', '오프닝을 다시 정리하고 방송을 시작했습니다', '대본'],
  ['바닷가의 유리병', '해변', '모래에 묻힌 유리병을 발견했습니다', '병을 씻어 해변 기록관에 전달했습니다', '유리병'],
  ['도서관의 숨은 편지', '도서관', '반납된 책 사이에서 편지가 나왔습니다', '분실물 담당자에게 편지를 맡겼습니다', '편지'],
  ['목공방의 작은 의자', '목공방', '만들던 의자의 다리 길이가 달랐습니다', '짧은 다리를 새로 깎아 의자를 완성했습니다', '의자'],
  ['기차역의 도시락', '기차역', '승강장에 도시락 가방이 남아 있었습니다', '안내소에 가방을 맡기고 열차에 올랐습니다', '도시락 가방'],
  ['온실의 새 화분', '온실', '새로 온 화분의 이름표가 떨어졌습니다', '식물을 확인하고 이름표를 다시 달았습니다', '화분'],
  ['영화관의 특별 상영', '영화관', '상영 직전 자막 파일이 열리지 않았습니다', '예비 파일을 찾아 상영을 준비했습니다', '저장 장치'],
  ['시장 골목의 간판', '시장', '바람에 가게 간판이 기울었습니다', '주인과 함께 간판을 다시 고정했습니다', '간판'],
  ['우체국의 소포', '우체국', '소포 포장의 한쪽이 찢어졌습니다', '내용물을 확인하고 포장을 다시 했습니다', '소포'],
  ['천문대의 관측 노트', '천문대', '구름 때문에 관측을 시작할 수 없었습니다', '구름이 걷힌 뒤 첫 관측을 기록했습니다', '관측 노트'],
  ['빵집의 새 메뉴', '빵집', '시식할 빵의 설명 카드가 빠졌습니다', '재료를 확인해 설명 카드를 만들었습니다', '설명 카드'],
  ['공연장의 악보', '공연장', '연습실에 악보 한 장이 남아 있었습니다', '연주자에게 악보를 전달하고 자리를 안내했습니다', '악보'],
  ['박물관의 작은 발견', '박물관', '전시 모형 아래에서 부품을 발견했습니다', '안내 데스크에 부품을 전달했습니다', '모형 부품'],
  ['자전거 여행의 쉼표', '자전거 쉼터', '자전거 바퀴의 바람이 빠졌습니다', '펌프로 바람을 넣고 다음 길을 확인했습니다', '공기 펌프'],
  ['사진관의 오래된 필름', '사진관', '오래된 필름의 봉투가 바뀌었습니다', '촬영 날짜를 대조해 봉투를 바로잡았습니다', '필름'],
  ['캠핑장의 랜턴', '캠핑장', '해가 지기 전에 랜턴이 꺼졌습니다', '새 건전지를 넣어 식탁을 밝혔습니다', '랜턴'],
  ['수족관의 안내판', '수족관', '안내판의 화살표가 반대로 붙었습니다', '동선을 확인하고 화살표를 고쳤습니다', '안내판'],
  ['공항의 작은 전시', '공항', '전시할 그림 한 점의 받침이 없었습니다', '예비 받침을 찾아 전시를 마무리했습니다', '그림'],
  ['동네 극장의 무대', '동네 극장', '무대 소품의 손잡이가 빠졌습니다', '손잡이를 고정하고 리허설을 이어갔습니다', '무대 소품'],
  ['종이 공방의 모빌', '종이 공방', '모빌의 한쪽이 무겁게 기울었습니다', '종이 조각을 옮겨 균형을 맞췄습니다', '모빌'],
  ['섬마을의 작은 배', '선착장', '배에 실을 상자의 끈이 풀렸습니다', '상자를 다시 묶고 정해진 자리에 실었습니다', '상자'],
  ['음악실의 녹음', '음악실', '녹음 중 마이크 소리가 끊겼습니다', '연결선을 교체하고 처음부터 녹음했습니다', '마이크'],
  ['벼룩시장의 보물', '벼룩시장', '물건에 붙인 가격표가 바뀌었습니다', '주인에게 확인하고 가격표를 바로 붙였습니다', '가격표'],
];

const closingActions = ['기념사진을 찍었습니다', '주변을 정리했습니다', '손을 씻었습니다', '다음 일정을 확인했습니다'];
const recordPlaces = ['수첩', '휴대폰', '태블릿', '메모지'];
const recipients = ['담당자', '이웃', '가족', '친구'];

export const STORY_TEMPLATES: StoryTemplate[] = scenes.map(([title, place, problem, resolution, item], sceneIndex) => {
  const closing = closingActions[sceneIndex % closingActions.length];
  const record = recordPlaces[Math.floor(sceneIndex / 4) % recordPlaces.length];
  const recipient = recipients[Math.floor(sceneIndex / 6) % recipients.length];
  return {
  title,
  variables: {
    person: ['서윤', '지후', '다온', '하린', '유진', '서우', '도윤', '수현'],
    day: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '공휴일'],
    time: ['오전 8시', '오전 9시', '오전 10시', '오전 11시', '오후 1시', '오후 2시', '오후 3시', '오후 4시'],
    color: ['빨간색', '노란색', '파란색', '초록색', '주황색', '흰색', '검은색', '갈색'],
    companion: ['민재', '지안', '은호', '소율', '태오', '나린', '해준', '예림'],
    count: ['2명', '3명', '4명', '5명', '6명', '7명', '8명', '9명'],
    destination: ['북쪽 입구', '남쪽 입구', '안내 데스크', '마당', '휴게실', '정문', '옆 건물', '주차장'],
  },
  generate: v => ({
    // 모든 조합 변수를 두 문단 안에 둔다. 루키에서 뒤 문단을 감춰도 본문 ID가 충돌하지 않는다.
    content: `${v.day} ${v.time}, ${이가(v.person)} ${place}에 도착했습니다. ${problem}. 가져온 ${item}에는 ${v.color} 표시가 있었습니다.\n\n${과함께(v.companion)} ${resolution}. 함께한 사람은 모두 ${v.count}이었고, 일을 마친 뒤 ${v.destination}에서 모이기로 했습니다.\n\n마지막에는 ${closing}. 오늘 일은 ${record}에 기록하고 ${recipient}에게 소식을 전했습니다.`,
    questions: [
      { q: '처음 도착한 사람은 누구였나요?', answer: v.person, pool: 'person' },
      { q: '어느 날의 일이었나요?', answer: v.day, pool: 'day' },
      { q: '몇 시에 도착했나요?', answer: v.time, pool: 'time' },
      { q: '물건의 표시는 무슨 색이었나요?', answer: v.color, pool: 'color' },
      { q: '누구와 함께 문제를 해결했나요?', answer: v.companion, pool: 'companion' },
      { q: '함께한 사람은 모두 몇 명이었나요?', answer: v.count, pool: 'count' },
      { q: '일을 마친 뒤 어디에서 모이기로 했나요?', answer: v.destination, pool: 'destination' },
    ],
    // 첫 퀴즈와 별도의 사실을 묻는다. 상위 레벨의 추가 사실은 세 번째 문단에 있다.
    // 조합 변수에 보기 풀을 넣으면 본문 번호의 일대일 대응이 깨지므로 별도로 둔다.
    delayedQuestions: [
      { q: '이야기의 일이 시작된 장소는 어디였나요?', answer: place, pool: '', alternatives: scenes.map(s => s[1]) },
      { q: '도착한 뒤 어떤 일이 있었나요?', answer: problem, pool: '', alternatives: scenes.map(s => s[2]) },
      { q: '그 일을 어떻게 해결하거나 처리했나요?', answer: resolution, pool: '', alternatives: scenes.map(s => s[3]) },
      { q: '색깔 표시가 있던 물건은 무엇이었나요?', answer: item, pool: '', alternatives: scenes.map(s => s[4]) },
      { q: '마지막에 한 일은 무엇이었나요?', answer: closing, pool: '', alternatives: closingActions },
      { q: '오늘 일을 어디에 기록했나요?', answer: record, pool: '', alternatives: recordPlaces },
      { q: '누구에게 소식을 전했나요?', answer: recipient, pool: '', alternatives: recipients },
    ],
  }),
  };
});
function 과함께(name: string): string { return `${과와(name)} 함께`; }
