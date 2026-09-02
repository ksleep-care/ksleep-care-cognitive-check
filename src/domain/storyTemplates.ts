import { 과와, 으로로, 을를, 이가 } from './particle';

/**
 * 이야기 기억하기의 이야기 틀 10가지.
 *
 * 2025년 기억력 아케이드(memory-test/index.html)의 storyTemplates를 그대로 옮겼다.
 * 틀마다 이름·장소·금액 같은 변수를 뽑아 채우므로, 틀 하나에서만도 수천 가지 이야기가 나온다.
 * 전부 가상의 내용이며 실제 인물·환자 정보를 쓰지 않는다.
 */
export interface StoryTemplateQuestion {
  q: string;
  answer: string;
  /** 보기를 뽑아 올 변수 이름. */
  pool: string;
}

export interface StoryTemplate {
  title: string;
  variables: Record<string, string[]>;
  generate: (v: Record<string, string>) => { content: string; questions: StoryTemplateQuestion[] };
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  // 1. 아침 회의 시나리오
  {
    title: "오늘 아침 회의",
    variables: {
      team: ["마케팅팀", "영업팀", "기획팀", "개발팀", "인사팀"],
      person: ["김수진 과장", "이정민 차장", "박서연 부장", "최민호 과장", "정유진 대리"],
      floor: ["5층", "6층", "7층", "8층", "9층"],
      color: ["빨간색", "파란색", "노란색", "초록색", "검은색"],
      product: ["헬스케어 플러스", "스마트 웰니스", "바이탈 케어", "슬립 가드"],
      date: ["3월 15일", "3월 25일", "4월 5일", "4월 10일"],
      price: ["35,000원", "42,000원", "48,000원", "52,000원"],
      count: ["4명", "5명", "6명", "7명", "8명"],
      day: ["화요일", "수요일", "목요일", "금요일"]
    },
    generate: (v) => ({
      content: `오늘 아침 9시 30분, ${v.team} ${이가(v.person)} ${v.floor} 회의실에서 신제품 런칭 회의를 진행했습니다. 참석자는 총 ${v.count}이었고, 회의 자료는 ${v.color} 폴더에 담겨 있었습니다.\n\n주요 안건은 ${v.date} 출시 예정인 '${v.product}' 제품이었습니다. 예상 판매가는 ${v.price}이고, 타겟 고객은 30-40대 직장인입니다.\n\n다음 회의는 ${v.day} 오후 3시로 예정되었습니다.`,
      questions: [
        { q: "회의를 진행한 사람은?", answer: v.person, pool: "person" },
        { q: "회의는 몇 층에서 진행되었나요?", answer: v.floor, pool: "floor" },
        { q: "회의 자료 폴더 색깔은?", answer: v.color, pool: "color" },
        { q: "신제품 출시 예정일은?", answer: v.date, pool: "date" },
        { q: "제품 예상 판매가는?", answer: v.price, pool: "price" },
        { q: "회의 참석자는 총 몇 명?", answer: v.count, pool: "count" },
        { q: "다음 회의 예정 요일은?", answer: v.day, pool: "day" }
      ]
    })
  },

  // 2. 출장 일정 시나리오
  {
    title: "다음 주 출장",
    variables: {
      city: ["부산", "대전", "광주", "대구", "제주"],
      transport: ["KTX", "비행기", "고속버스", "자가용"],
      hotel: ["신라호텔", "롯데호텔", "하얏트호텔", "메리어트호텔"],
      duration: ["2박 3일", "1박 2일", "3박 4일", "당일치기"],
      client: ["삼성전자", "LG화학", "현대자동차", "SK하이닉스", "포스코"],
      budget: ["150만원", "200만원", "250만원", "300만원"],
      companion: ["김대리", "박과장", "이차장", "최부장"],
      purpose: ["계약 협상", "기술 미팅", "공장 견학", "파트너십 논의"]
    },
    generate: (v) => ({
      content: `다음 주 월요일, ${으로로(v.city)} ${v.duration} 출장이 예정되어 있습니다. 이동은 ${을를(v.transport)} 이용하고, 숙소는 ${으로로(v.hotel)} 예약되었습니다.\n\n출장 목적은 ${과와(v.client)}의 ${v.purpose}입니다. 예상 경비는 ${v.budget}이며, ${과와(v.companion)} 함께 출장을 갑니다.\n\n출발은 오전 7시이고, 첫 미팅은 오후 2시에 시작됩니다.`,
      questions: [
        { q: "출장 도시는 어디인가요?", answer: v.city, pool: "city" },
        { q: "이동 수단은 무엇인가요?", answer: v.transport, pool: "transport" },
        { q: "숙소는 어디인가요?", answer: v.hotel, pool: "hotel" },
        { q: "출장 기간은?", answer: v.duration, pool: "duration" },
        { q: "미팅 상대 회사는?", answer: v.client, pool: "client" },
        { q: "출장 예상 경비는?", answer: v.budget, pool: "budget" },
        { q: "함께 가는 사람은?", answer: v.companion, pool: "companion" }
      ]
    })
  },

  // 3. 점심 약속 시나리오
  {
    title: "오늘 점심 약속",
    variables: {
      restaurant: ["명동교자", "본죽", "서브웨이", "한솥도시락", "계절밥상"],
      cuisine: ["한식", "일식", "중식", "양식", "분식"],
      location: ["회사 앞", "강남역", "을지로", "종로", "여의도"],
      time: ["12시", "12시 30분", "1시", "1시 30분"],
      people: ["3명", "4명", "5명", "6명"],
      budget_per: ["15,000원", "20,000원", "25,000원", "30,000원"],
      organizer: ["영희", "철수", "민수", "지영", "현우"],
      occasion: ["프로젝트 완료 기념", "신입 환영", "생일 파티", "그냥 회식"]
    },
    generate: (v) => ({
      content: `오늘 점심은 ${이가(v.organizer)} 주선한 ${v.occasion} 식사가 있습니다. 장소는 ${v.location}에 있는 ${v.restaurant}이고, ${v.cuisine} 전문점입니다.\n\n약속 시간은 ${v.time}이고, 참석 인원은 ${v.people}입니다. 1인당 예산은 ${v.budget_per} 정도로 잡혀있습니다.\n\n식당까지는 회사에서 걸어서 10분 거리입니다.`,
      questions: [
        { q: "점심 식당 이름은?", answer: v.restaurant, pool: "restaurant" },
        { q: "음식 종류는?", answer: v.cuisine, pool: "cuisine" },
        { q: "식당 위치는?", answer: v.location, pool: "location" },
        { q: "약속 시간은?", answer: v.time, pool: "time" },
        { q: "참석 인원은?", answer: v.people, pool: "people" },
        { q: "1인당 예산은?", answer: v.budget_per, pool: "budget_per" },
        { q: "약속을 주선한 사람은?", answer: v.organizer, pool: "organizer" }
      ]
    })
  },

  // 4. 택배 도착 시나리오
  {
    title: "택배 알림",
    variables: {
      item: ["노트북 거치대", "무선 키보드", "모니터 암", "책상 정리함", "LED 스탠드"],
      courier: ["CJ대한통운", "한진택배", "롯데택배", "우체국택배", "로젠택배"],
      sender: ["쿠팡", "네이버쇼핑", "11번가", "G마켓", "옥션"],
      price: ["32,000원", "45,000원", "58,000원", "67,000원", "78,000원"],
      delivery_time: ["오전 중", "오후 2-4시", "오후 5-7시", "저녁 7시 이후"],
      location: ["경비실", "무인택배함", "문 앞", "직접 수령"],
      tracking: ["5723", "8841", "3356", "9912", "4478"]
    },
    generate: (v) => ({
      content: `주문하신 ${v.item} 상품이 오늘 배송 예정입니다. 택배사는 ${v.courier}이고, ${v.sender}에서 발송되었습니다.\n\n결제 금액은 ${v.price}이었고, 예상 도착 시간은 ${v.delivery_time}입니다. 수령 장소는 ${으로로(v.location)} 설정되어 있습니다.\n\n운송장 마지막 4자리는 ${v.tracking}입니다.`,
      questions: [
        { q: "배송되는 상품은?", answer: v.item, pool: "item" },
        { q: "택배사는 어디인가요?", answer: v.courier, pool: "courier" },
        { q: "어디서 구매했나요?", answer: v.sender, pool: "sender" },
        { q: "결제 금액은?", answer: v.price, pool: "price" },
        { q: "예상 도착 시간은?", answer: v.delivery_time, pool: "delivery_time" },
        { q: "수령 장소는?", answer: v.location, pool: "location" },
        { q: "운송장 마지막 4자리는?", answer: v.tracking, pool: "tracking" }
      ]
    })
  },

  // 5. 병원 예약 시나리오
  {
    title: "병원 예약 확인",
    variables: {
      hospital: ["서울대병원", "삼성서울병원", "세브란스병원", "아산병원", "강남성심병원"],
      department: ["내과", "정형외과", "피부과", "안과", "이비인후과"],
      doctor: ["김영수 교수", "이미영 과장", "박준혁 전문의", "최서연 교수"],
      date: ["이번 주 금요일", "다음 주 월요일", "다음 주 수요일", "이번 주 토요일"],
      time: ["오전 9시", "오전 10시 30분", "오후 2시", "오후 3시 30분"],
      floor: ["3층", "5층", "7층", "10층"],
      prep: ["금식 필요", "준비물 없음", "검사 결과지 지참", "신분증 지참"]
    },
    generate: (v) => ({
      content: `${v.hospital} ${v.department} 진료 예약이 확인되었습니다. 담당 의사는 ${v.doctor}님이고, 예약일은 ${v.date} ${v.time}입니다.\n\n진료실은 ${v.floor}에 위치해 있으며, 예약 시 참고사항은 "${v.prep}"입니다.\n\n예약 10분 전까지 접수를 완료해주세요.`,
      questions: [
        { q: "예약된 병원은?", answer: v.hospital, pool: "hospital" },
        { q: "진료과는?", answer: v.department, pool: "department" },
        { q: "담당 의사는?", answer: v.doctor, pool: "doctor" },
        { q: "예약 날짜는?", answer: v.date, pool: "date" },
        { q: "예약 시간은?", answer: v.time, pool: "time" },
        { q: "진료실 위치는?", answer: v.floor, pool: "floor" },
        { q: "참고사항은?", answer: v.prep, pool: "prep" }
      ]
    })
  },

  // 6. 영화 예매 시나리오
  {
    title: "영화 예매 확인",
    variables: {
      movie: ["범죄도시4", "파묘", "듄2", "웡카", "아쿠아맨2"],
      theater: ["CGV 강남", "롯데시네마 월드타워", "메가박스 코엑스", "CGV 용산"],
      date: ["오늘 저녁", "내일 오후", "이번 주 토요일", "다음 주 일요일"],
      time: ["6시 40분", "7시 20분", "8시 10분", "9시 30분"],
      seats: ["G열 12, 13번", "H열 8, 9번", "F열 15, 16번", "J열 5, 6번"],
      people: ["2명", "3명", "4명"],
      format: ["IMAX", "4DX", "일반", "돌비시네마"],
      price: ["28,000원", "36,000원", "44,000원", "52,000원"]
    },
    generate: (v) => ({
      content: `영화 예매가 완료되었습니다. 영화 제목은 '${v.movie}'이고, 상영관은 ${v.theater}입니다.\n\n상영 일시는 ${v.date} ${v.time}이며, 좌석은 ${v.seats}입니다. 관람 인원은 ${v.people}이고, ${v.format} 상영입니다.\n\n총 결제 금액은 ${v.price}입니다.`,
      questions: [
        { q: "예매한 영화 제목은?", answer: v.movie, pool: "movie" },
        { q: "상영관은 어디인가요?", answer: v.theater, pool: "theater" },
        { q: "상영 날짜는?", answer: v.date, pool: "date" },
        { q: "상영 시간은?", answer: v.time, pool: "time" },
        { q: "예매한 좌석은?", answer: v.seats, pool: "seats" },
        { q: "관람 인원은?", answer: v.people, pool: "people" },
        { q: "총 결제 금액은?", answer: v.price, pool: "price" }
      ]
    })
  },

  // 7. 운동 클래스 시나리오
  {
    title: "운동 수업 예약",
    variables: {
      class_type: ["필라테스", "요가", "크로스핏", "스피닝", "수영"],
      gym: ["애플짐", "스포애니", "엑스핏", "휘트니스타", "블루핏"],
      instructor: ["민지 강사", "수현 코치", "재원 트레이너", "하늘 강사"],
      day: ["월/수/금", "화/목", "주말반", "매일반"],
      time: ["오전 7시", "오전 9시", "저녁 7시", "저녁 9시"],
      duration: ["50분", "60분", "75분", "90분"],
      monthly: ["12만원", "15만원", "18만원", "22만원"]
    },
    generate: (v) => ({
      content: `${v.gym}에서 ${v.class_type} 수업이 예약되었습니다. 담당 강사는 ${v.instructor}님이고, 수업 요일은 ${v.day}입니다.\n\n수업 시간은 ${v.time} 시작이며, 수업 시간은 ${v.duration}입니다. 월 수강료는 ${v.monthly}입니다.\n\n운동복과 개인 물품을 준비해주세요.`,
      questions: [
        { q: "신청한 운동 종류는?", answer: v.class_type, pool: "class_type" },
        { q: "헬스장 이름은?", answer: v.gym, pool: "gym" },
        { q: "담당 강사는?", answer: v.instructor, pool: "instructor" },
        { q: "수업 요일은?", answer: v.day, pool: "day" },
        { q: "수업 시작 시간은?", answer: v.time, pool: "time" },
        { q: "수업 시간(길이)은?", answer: v.duration, pool: "duration" },
        { q: "월 수강료는?", answer: v.monthly, pool: "monthly" }
      ]
    })
  },

  // 8. 항공권 예약 시나리오
  {
    title: "항공권 예약 확인",
    variables: {
      destination: ["도쿄", "오사카", "방콕", "싱가포르", "다낭"],
      airline: ["대한항공", "아시아나", "진에어", "제주항공", "티웨이"],
      departure: ["3월 15일", "3월 22일", "4월 5일", "4월 12일"],
      dep_time: ["오전 8시 30분", "오전 10시 45분", "오후 1시 20분", "오후 6시 15분"],
      flight_no: ["KE703", "OZ201", "LJ305", "TW901", "7C108"],
      terminal: ["제1터미널", "제2터미널"],
      seat: ["12A 창가", "23C 복도", "8B 가운데", "31A 창가"],
      price: ["385,000원", "420,000원", "298,000원", "512,000원"]
    },
    generate: (v) => ({
      content: `${v.destination}행 항공권 예약이 완료되었습니다. 항공사는 ${v.airline}이고, 편명은 ${v.flight_no}입니다.\n\n출발일은 ${v.departure} ${v.dep_time}이며, 인천공항 ${v.terminal}에서 출발합니다. 좌석은 ${v.seat}입니다.\n\n총 결제 금액은 ${v.price}입니다.`,
      questions: [
        { q: "목적지는 어디인가요?", answer: v.destination, pool: "destination" },
        { q: "항공사는?", answer: v.airline, pool: "airline" },
        { q: "출발 날짜는?", answer: v.departure, pool: "departure" },
        { q: "출발 시간은?", answer: v.dep_time, pool: "dep_time" },
        { q: "항공편명은?", answer: v.flight_no, pool: "flight_no" },
        { q: "출발 터미널은?", answer: v.terminal, pool: "terminal" },
        { q: "좌석 번호는?", answer: v.seat, pool: "seat" }
      ]
    })
  },

  // 9. 카페 주문 시나리오
  {
    title: "카페 주문 내역",
    variables: {
      cafe: ["스타벅스", "투썸플레이스", "이디야", "메가커피", "블루보틀"],
      drink: ["아이스 아메리카노", "카페라떼", "바닐라라떼", "콜드브루", "녹차라떼"],
      size: ["톨", "그란데", "벤티", "레귤러", "라지"],
      extra: ["샷 추가", "시럽 추가", "얼음 적게", "우유 변경"],
      dessert: ["크로아상", "치즈케이크", "마카롱", "티라미수", "없음"],
      price: ["6,500원", "7,800원", "9,200원", "11,500원"],
      pickup: ["매장", "드라이브스루", "배달"],
      order_no: ["127번", "234번", "056번", "389번"]
    },
    generate: (v) => ({
      content: `${v.cafe} 주문이 접수되었습니다. 음료는 ${v.drink} ${v.size} 사이즈이고, 옵션은 ${v.extra}입니다.\n\n함께 주문한 디저트는 ${v.dessert}이고, 총 결제 금액은 ${v.price}입니다. 수령 방법은 ${v.pickup}입니다.\n\n주문 번호는 ${v.order_no}입니다.`,
      questions: [
        { q: "주문한 카페는?", answer: v.cafe, pool: "cafe" },
        { q: "주문한 음료는?", answer: v.drink, pool: "drink" },
        { q: "음료 사이즈는?", answer: v.size, pool: "size" },
        { q: "추가 옵션은?", answer: v.extra, pool: "extra" },
        { q: "함께 주문한 디저트는?", answer: v.dessert, pool: "dessert" },
        { q: "총 결제 금액은?", answer: v.price, pool: "price" },
        { q: "주문 번호는?", answer: v.order_no, pool: "order_no" }
      ]
    })
  },

  // 10. 은행 업무 시나리오
  {
    title: "은행 업무 알림",
    variables: {
      bank: ["국민은행", "신한은행", "우리은행", "하나은행", "농협"],
      branch: ["강남지점", "역삼지점", "을지로지점", "종로지점", "여의도지점"],
      task: ["정기예금 만기", "대출 상담", "카드 재발급", "통장 개설"],
      amount: ["500만원", "1,000만원", "2,000만원", "3,000만원"],
      date: ["이번 주 금요일", "다음 주 월요일", "다음 주 수요일"],
      time: ["오전 10시", "오전 11시", "오후 2시", "오후 3시"],
      docs: ["신분증", "신분증+도장", "소득증명서", "재직증명서"]
    },
    generate: (v) => ({
      content: `${v.bank} ${v.branch}에서 ${v.task} 관련 예약이 있습니다. 관련 금액은 ${v.amount}입니다.\n\n예약 일시는 ${v.date} ${v.time}이며, 필요 서류는 ${v.docs}입니다.\n\n창구 번호는 당일 발권기에서 확인해주세요.`,
      questions: [
        { q: "어느 은행인가요?", answer: v.bank, pool: "bank" },
        { q: "어느 지점인가요?", answer: v.branch, pool: "branch" },
        { q: "업무 내용은?", answer: v.task, pool: "task" },
        { q: "관련 금액은?", answer: v.amount, pool: "amount" },
        { q: "예약 날짜는?", answer: v.date, pool: "date" },
        { q: "예약 시간은?", answer: v.time, pool: "time" },
        { q: "필요 서류는?", answer: v.docs, pool: "docs" }
      ]
    })
  }

];
