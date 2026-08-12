// One-time migration: pulls rows out of the existing "영업조직 핵심과제 tracker"
// Google Sheet (핵심 / 부서별 tabs) and inserts them into Supabase `tasks`.
//
// Usage:
//   1. Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL
//      and SUPABASE_SERVICE_ROLE_KEY (Project Settings -> API in Supabase).
//   2. Run the schema in supabase/schema.sql against your project first.
//   3. npm run import:tasks
//
// The sheet must still be shared as "링크가 있는 모든 사용자 - 뷰어" for the
// CSV export endpoint to work without a Google login.

import { createClient } from "@supabase/supabase-js";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "16qtYTiQW0NGiqdICAC8YSytW3WfdyLuLtrT3N9Ft9rY";
const SHEETS = [
  { name: "핵심", board: "core" },
  { name: "부서별", board: "department" },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env.local에 설정되어 있어야 합니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fetchSheetCsv(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`시트 "${sheetName}" CSV를 가져오지 못했습니다 (HTTP ${res.status}). 시트가 링크 공유(뷰어)로 설정되어 있는지 확인하세요.`);
  }
  return res.text();
}

// Minimal RFC4180 CSV parser (handles quoted fields with embedded commas/newlines).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignore, \n handles the row break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toPriority(raw) {
  const stars = (raw.match(/★/g) || []).length;
  return stars >= 1 ? Math.min(stars, 3) : 1;
}

function toStatus(raw) {
  const v = raw.toLowerCase();
  if (v.includes("done") || raw.includes("✅")) return "done";
  if (v.includes("hold") || raw.includes("⏸")) return "hold";
  if (v.includes("delay") || raw.includes("🔴") || raw.includes("지연")) return "delayed";
  return "on_track";
}

function toProgress(raw) {
  const cleaned = raw.replace("%", "").trim();
  if (!cleaned || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Spreadsheet due dates omit the year (e.g. "08월 14일") — assume current
// year. Verify manually once imported since fiscal-year rollovers won't be
// inferred correctly by this heuristic.
function toDueDate(raw) {
  const match = raw.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (!match) return null;
  const [, month, day] = match;
  const year = new Date().getFullYear();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function rowsToTasks(rows, board) {
  const [header, ...dataRows] = rows;
  const col = (name) => header.findIndex((h) => h.trim() === name);

  const idx = {
    seq: col("No."),
    priority: col("우선과제"),
    businessUnit: col("사업부"),
    category: col("구분"),
    title: col("핵심과제"),
    purpose: col("목적 (Why)") !== -1 ? col("목적 (Why)") : col("목적(Why)"),
    plan: col("목표·실행방안 (What·How)") !== -1 ? col("목표·실행방안 (What·How)") : col("목표·실행방안(What·How)"),
    history: col("업무 진행이력") !== -1 ? col("업무 진행이력") : col("업무진행이력"),
    status: col("Status"),
    progress: col("진척률(%)"),
    dueDate: col("완료일정"),
    owner: col("Task Owner"),
    collab: col("협업부서"),
    flag: col("의사결정·리스크 Flag"),
    ceoComment: col("CEO Comment"),
  };

  return dataRows
    .filter((r) => r.some((cell) => cell.trim() !== "") && r[idx.title]?.trim())
    .map((r) => ({
      board,
      seq: idx.seq !== -1 ? Number(r[idx.seq]) || null : null,
      priority: idx.priority !== -1 ? toPriority(r[idx.priority] || "") : 1,
      business_unit: (r[idx.businessUnit] || "").trim() || "미지정",
      category: (r[idx.category] || "").trim() || null,
      title: r[idx.title].trim(),
      purpose: (r[idx.purpose] || "").trim() || null,
      plan: (r[idx.plan] || "").trim() || null,
      status: idx.status !== -1 ? toStatus(r[idx.status] || "") : "on_track",
      progress_pct: idx.progress !== -1 ? toProgress(r[idx.progress] || "") : null,
      due_date: idx.dueDate !== -1 ? toDueDate(r[idx.dueDate] || "") : null,
      owner_dept: (r[idx.owner] || "").trim() || null,
      collab_depts: (r[idx.collab] || "").trim() || null,
      decision_risk_flag: (r[idx.flag] || "").trim() || null,
      ceo_comment: (r[idx.ceoComment] || "").trim() || null,
      _history: (r[idx.history] || "").trim() || null,
    }));
}

async function main() {
  let totalInserted = 0;

  for (const sheet of SHEETS) {
    console.log(`\n[${sheet.name}] CSV 가져오는 중...`);
    const csv = await fetchSheetCsv(sheet.name);
    const rows = parseCsv(csv);
    const tasks = rowsToTasks(rows, sheet.board);
    console.log(`[${sheet.name}] ${tasks.length}개 과제 파싱 완료`);

    for (const task of tasks) {
      const { _history, ...taskFields } = task;
      const { data, error } = await supabase.from("tasks").insert(taskFields).select("id").single();
      if (error) {
        console.error(`  ✗ "${task.title}" 삽입 실패:`, error.message);
        continue;
      }
      totalInserted++;

      if (_history) {
        const { error: noteError } = await supabase
          .from("task_updates")
          .insert({ task_id: data.id, note: `[스프레드시트 이관] ${_history}` });
        if (noteError) {
          console.error(`  ✗ "${task.title}" 이력 삽입 실패:`, noteError.message);
        }
      }
      console.log(`  ✓ ${task.title}`);
    }
  }

  console.log(`\n총 ${totalInserted}건 삽입 완료.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
