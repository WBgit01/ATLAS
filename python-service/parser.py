"""Parse biometric attendance Excel exports into normalized JSON records."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, time, timedelta
from typing import Any

import pandas as pd


def normalize_name(name: str | None) -> str:
    if not name or (isinstance(name, float) and pd.isna(name)):
        return ""
    text = str(name).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def parse_time_value(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, time):
        return value.strftime("%H:%M:%S")
    if isinstance(value, datetime):
        return value.strftime("%H:%M:%S")
    if isinstance(value, (int, float)):
        # Excel fractional day
        if 0 < value < 1:
            total_seconds = int(round(value * 24 * 3600))
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return None
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    match = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?", text)
    if match:
        h, m, s = match.group(1), match.group(2), match.group(3) or "00"
        return f"{int(h):02d}:{m}:{s}"
    return None


def parse_date_range(text: str | None) -> tuple[str | None, str | None]:
    if not text:
        return None, None
    match = re.search(r"(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})", str(text))
    if match:
        return match.group(1), match.group(2)
    return None, None


def parse_day_label(label: str, year: int, month: int) -> str | None:
    if not label or not isinstance(label, str):
        return None
    match = re.match(r"^(\d{1,2})\s+\w{2}$", label.strip())
    if not match:
        return None
    day = int(match.group(1))
    try:
        return datetime(year, month, day).strftime("%Y-%m-%d")
    except ValueError:
        return None


def hours_between(time_in: str | None, time_out: str | None) -> float:
    if not time_in or not time_out:
        return 0.0
    try:
        fmt = "%H:%M:%S"
        t_in = datetime.strptime(time_in, fmt)
        t_out = datetime.strptime(time_out, fmt)
        if t_out < t_in:
            t_out += timedelta(days=1)
        return round((t_out - t_in).total_seconds() / 3600, 2)
    except ValueError:
        return 0.0


def first_valid_time(*values: Any) -> str | None:
    for value in values:
        parsed = parse_time_value(value)
        if parsed:
            return parsed
    return None


def extract_block_info(df: pd.DataFrame, start_col: int) -> dict[str, Any]:
    info: dict[str, Any] = {
        "name": None,
        "normalizedName": None,
        "department": None,
        "deviceUserId": None,
        "periodStart": None,
        "periodEnd": None,
        "absenceDays": 0,
        "leaveDays": 0,
        "workDays": 0,
        "lateTimes": 0,
        "lateMinutes": 0,
        "earlyTimes": 0,
        "earlyMinutes": 0,
        "overtimeHours": 0.0,
        "dailyRecords": [],
    }

    def cell(row: int, col_offset: int = 0):
        col = start_col + col_offset
        if col >= df.shape[1] or row >= len(df):
            return None
        return df.iloc[row, col]

    name = cell(3, 9)
    if not name or str(name).strip().lower() in ("name", "nan"):
        return info

    info["name"] = str(name).strip()
    info["normalizedName"] = normalize_name(info["name"])
    dept = cell(3, 1)
    info["department"] = str(dept).strip() if dept and str(dept).strip().lower() not in ("dept.", "nan") else None

    date_range = cell(4, 1)
    start, end = parse_date_range(str(date_range) if date_range else None)
    info["periodStart"] = start
    info["periodEnd"] = end

    user_id = cell(4, 9)
    info["deviceUserId"] = str(user_id).strip() if user_id is not None and str(user_id).strip() != "User ID" else None

    def safe_int(val):
        try:
            return int(float(val)) if val is not None and str(val).strip() not in ("", "nan") else 0
        except (TypeError, ValueError):
            return 0

    def safe_float(val):
        try:
            return float(val) if val is not None and str(val).strip() not in ("", "nan") else 0.0
        except (TypeError, ValueError):
            return 0.0

    info["absenceDays"] = safe_int(cell(7, 0))
    info["leaveDays"] = safe_int(cell(7, 1))
    info["workDays"] = safe_int(cell(7, 4))
    info["lateTimes"] = safe_int(cell(7, 8))
    info["lateMinutes"] = safe_int(cell(7, 9))
    info["earlyTimes"] = safe_int(cell(7, 12))
    info["earlyMinutes"] = safe_int(cell(7, 13))
    info["overtimeHours"] = safe_float(cell(7, 5))

    if not start:
        return info

    year = int(start[:4])
    month = int(start[5:7])

    for row_idx in range(12, len(df)):
        day_label = cell(row_idx, 0)
        if not day_label or str(day_label).strip().lower() == "nan":
            continue
        date_str = parse_day_label(str(day_label), year, month)
        if not date_str:
            continue

        before_in = parse_time_value(cell(row_idx, 1))
        before_out = parse_time_value(cell(row_idx, 3))
        after_in = parse_time_value(cell(row_idx, 6))
        after_out = parse_time_value(cell(row_idx, 8))
        ot_in = parse_time_value(cell(row_idx, 10))
        ot_out = parse_time_value(cell(row_idx, 12))

        punches = [p for p in [before_in, before_out, after_in, after_out, ot_in, ot_out] if p]
        if not punches:
            continue

        time_in = first_valid_time(before_in, after_in, ot_in)
        time_out = first_valid_time(ot_out, after_out, before_out, ot_in if not ot_out else ot_out)

        # Better pairing: earliest punch in, latest punch out
        if punches:
            sorted_punches = sorted(punches)
            time_in = sorted_punches[0]
            time_out = sorted_punches[-1] if len(sorted_punches) > 1 else None

        hours = hours_between(time_in, time_out) if time_in and time_out else 0.0
        status = "present"
        flags: list[str] = []

        if time_in and not time_out:
            status = "incomplete"
            flags.append("missing_time_out")
        elif time_out and not time_in:
            status = "incomplete"
            flags.append("missing_time_in")
        elif not time_in and not time_out:
            status = "absent"
        elif len(punches) > 2:
            flags.append("multiple_punches")

        info["dailyRecords"].append(
            {
                "date": date_str,
                "timeIn": time_in,
                "timeOut": time_out,
                "punches": punches,
                "hoursRendered": hours,
                "status": status,
                "flags": flags,
                "beforeNoonIn": before_in,
                "beforeNoonOut": before_out,
                "afterNoonIn": after_in,
                "afterNoonOut": after_out,
                "overtimeIn": ot_in,
                "overtimeOut": ot_out,
            }
        )

    return info


def parse_attendance_sheet(df: pd.DataFrame) -> list[dict[str, Any]]:
    blocks = []
    # Three employee blocks per sheet, ~15 columns apart
    for start_col in (0, 15, 30):
        block = extract_block_info(df, start_col)
        if block.get("name"):
            blocks.append(block)
    return blocks


def parse_statistics_table(df: pd.DataFrame) -> list[dict[str, Any]]:
    records = []
    for row_idx in range(3, len(df)):
        user_id = df.iloc[row_idx, 0]
        name = df.iloc[row_idx, 1]
        if name is None or str(name).strip().lower() in ("name", "nan", ""):
            continue
        dept = df.iloc[row_idx, 2]
        records.append(
            {
                "deviceUserId": str(user_id).strip() if user_id is not None else None,
                "name": str(name).strip(),
                "normalizedName": normalize_name(str(name)),
                "department": str(dept).strip() if dept and str(dept).lower() != "nan" else None,
                "expectedWorkHours": float(df.iloc[row_idx, 3]) if pd.notna(df.iloc[row_idx, 3]) else 0,
                "actualWorkHours": float(df.iloc[row_idx, 4]) if pd.notna(df.iloc[row_idx, 4]) else 0,
                "lateTimes": int(float(df.iloc[row_idx, 5])) if pd.notna(df.iloc[row_idx, 5]) else 0,
                "lateMinutes": int(float(df.iloc[row_idx, 6])) if pd.notna(df.iloc[row_idx, 6]) else 0,
                "earlyTimes": int(float(df.iloc[row_idx, 7])) if pd.notna(df.iloc[row_idx, 7]) else 0,
                "earlyMinutes": int(float(df.iloc[row_idx, 8])) if pd.notna(df.iloc[row_idx, 8]) else 0,
                "overtimeHours": float(df.iloc[row_idx, 9]) if pd.notna(df.iloc[row_idx, 9]) else 0,
                "absenceDays": int(float(df.iloc[row_idx, 13])) if pd.notna(df.iloc[row_idx, 13]) else 0,
                "leaveDays": int(float(df.iloc[row_idx, 14])) if pd.notna(df.iloc[row_idx, 14]) else 0,
            }
        )
    return records


def parse_biometric_excel(file_path: str) -> dict[str, Any]:
    xl = pd.ExcelFile(file_path)
    result: dict[str, Any] = {
        "fileName": file_path.split("\\")[-1].split("/")[-1],
        "processedAt": datetime.utcnow().isoformat() + "Z",
        "periodStart": None,
        "periodEnd": None,
        "students": [],
        "statistics": [],
        "anomalies": [],
    }

    stats_by_name: dict[str, dict] = {}

    if "Attendance Statistic Table" in xl.sheet_names:
        stats_df = pd.read_excel(file_path, sheet_name="Attendance Statistic Table", header=None)
        result["statistics"] = parse_statistics_table(stats_df)
        for stat in result["statistics"]:
            stats_by_name[stat["normalizedName"]] = stat
        if stats_df.shape[0] > 0:
            start, end = parse_date_range(str(stats_df.iloc[0, 0]))
            result["periodStart"] = start
            result["periodEnd"] = end

    students_map: dict[str, dict[str, Any]] = {}

    for sheet_name in xl.sheet_names:
        if sheet_name in ("Shift Setting Table", "Attendance Statistic Table"):
            continue
        if not re.match(r"^\d", sheet_name):
            continue
        sheet_df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        for block in parse_attendance_sheet(sheet_df):
            key = block["normalizedName"]
            if not key:
                continue
            if not result["periodStart"] and block.get("periodStart"):
                result["periodStart"] = block["periodStart"]
                result["periodEnd"] = block["periodEnd"]

            if key not in students_map:
                stat = stats_by_name.get(key, {})
                students_map[key] = {
                    "name": block["name"],
                    "normalizedName": key,
                    "department": block.get("department") or stat.get("department"),
                    "deviceUserId": block.get("deviceUserId"),
                    "periodStart": block.get("periodStart"),
                    "periodEnd": block.get("periodEnd"),
                    "summary": {
                        "absenceDays": block.get("absenceDays") or stat.get("absenceDays", 0),
                        "leaveDays": block.get("leaveDays") or stat.get("leaveDays", 0),
                        "workDays": block.get("workDays", 0),
                        "lateTimes": block.get("lateTimes") or stat.get("lateTimes", 0),
                        "lateMinutes": block.get("lateMinutes") or stat.get("lateMinutes", 0),
                        "earlyTimes": block.get("earlyTimes") or stat.get("earlyTimes", 0),
                        "earlyMinutes": block.get("earlyMinutes") or stat.get("earlyMinutes", 0),
                        "overtimeHours": block.get("overtimeHours") or stat.get("overtimeHours", 0),
                        "expectedWorkHours": stat.get("expectedWorkHours", 0),
                        "actualWorkHours": stat.get("actualWorkHours", 0),
                    },
                    "dailyRecords": [],
                }
            existing_dates = {r["date"] for r in students_map[key]["dailyRecords"]}
            for record in block["dailyRecords"]:
                if record["date"] in existing_dates:
                    result["anomalies"].append(
                        {
                            "type": "duplicate_day",
                            "studentName": block["name"],
                            "date": record["date"],
                            "message": f"Duplicate attendance entry for {block['name']} on {record['date']}",
                        }
                    )
                    continue
                students_map[key]["dailyRecords"].append(record)
                if record.get("flags"):
                    for flag in record["flags"]:
                        result["anomalies"].append(
                            {
                                "type": flag,
                                "studentName": block["name"],
                                "date": record["date"],
                                "message": f"{flag.replace('_', ' ').title()} for {block['name']} on {record['date']}",
                            }
                        )

    result["students"] = list(students_map.values())
    return result


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python parser.py <excel_file_path>"}))
        sys.exit(1)
    file_path = sys.argv[1]
    try:
        data = parse_biometric_excel(file_path)
        print(json.dumps(data, default=str))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
