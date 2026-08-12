import "./globals.css";

export const metadata = {
  title: "영업조직 핵심과제 Tracker",
  description: "영업조직 핵심과제 진행상황 및 대표 의사결정 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
