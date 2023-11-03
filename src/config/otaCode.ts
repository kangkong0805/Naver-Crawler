const otaCode: otaCodeType = {
  HPA: "호텔패스",
  JAL: "자란넷",
  EXP: "익스피디아",
  BOO: "호텔스컴바인",
  IAN: "호텔스닷컴",
  CTE: "트립닷컴",
  ACC: "아코르호텔",
  HLT: "힐튼호텔",
  RKT: "라쿠텐 트래블",
  HNJ: "호텔엔조이",
  ITP: "인터파크투어",
  PKG: "호텔패스(객실패키지)",
  MDT: "모두투어",
  TBZ: "트립비토즈",
  NGDC: "여기어때",
  NAGD: "아고다",
  NBDC: "부킹닷컴",
  NTTP: "시크릿볼",
  NYNJ: "야놀자",
  NBOK: "N예약",
};

interface otaCodeType {
  [code: string]: string;
}
