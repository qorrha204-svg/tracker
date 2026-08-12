export const BUSINESS_UNITS = ["원쌈", "박가부대", "감탄계", "원베러커피", "유통", "크레스타운", "공통"];

export const STATUS_OPTIONS = [
  { value: "on_track", label: "On-Track" },
  { value: "done", label: "Done" },
  { value: "hold", label: "Hold" },
  { value: "delayed", label: "Delayed" },
];

export const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]));

export const STATUS_COLOR = {
  done: "var(--status-done)",
  on_track: "var(--status-ontrack)",
  hold: "var(--status-hold)",
  delayed: "var(--status-delayed)",
};

export const BOARD_OPTIONS = [
  { value: "core", label: "핵심과제" },
  { value: "department", label: "부서별 과제" },
];

export const BOARD_LABEL = Object.fromEntries(BOARD_OPTIONS.map((b) => [b.value, b.label]));

// "viewer" is the default tier every signup starts at — it's shown as a
// blank label everywhere (no badge clutter); only admin/ceo get a name.
export const ROLE_OPTIONS = ["viewer", "admin", "ceo"];

export const ROLE_LABEL = {
  ceo: "대표이사",
  admin: "관리자",
  editor: "",
  viewer: "",
};
