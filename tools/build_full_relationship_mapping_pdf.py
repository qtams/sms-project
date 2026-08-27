import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "REVAMPED_DATABASE_SCHEMA.md"
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT = OUTPUT_DIR / "School_Management_System_Full_Relationship_Mapping.pdf"

# A1 landscape in points (33.1 x 23.4 inches).
PAGE_W, PAGE_H = 2383.2, 1684.8
MARGIN = 52
TITLE_H = 108

MODULES = {
    "Identity and Access": ["USERS", "STAFF_PROFILES", "POSITIONS", "DEPARTMENTS", "AUDIT_LOGS"],
    "Academic Structure": ["SCHOOL_YEARS", "GRADE_LEVELS", "SECTIONS", "TEACHERS", "SECTION_TEACHERS"],
    "Applications and Enrollment A": ["APPLICATIONS", "APPLICATION_DOCUMENTS", "APPLICATION_STATUS_HISTORY", "STUDENTS", "GUARDIANS"],
    "Applications and Enrollment B": ["STUDENT_GUARDIANS", "STUDENT_DOCUMENTS", "ENROLLMENTS", "ENROLLMENT_STATUS_HISTORY"],
    "RFID and Attendance": ["RFID_CARDS", "RFID_ASSIGNMENTS", "RFID_DEVICES", "ATTENDANCE_RECORDS", "RFID_SCAN_EVENTS", "ATTENDANCE_CORRECTIONS"],
    "Academic Grading": ["SUBJECTS", "GRADING_PERIODS", "CLASS_OFFERINGS", "STUDENT_GRADES"],
}

COLORS = {
    "Identity and Access": (colors.HexColor("#24557A"), colors.HexColor("#E8F1F7")),
    "Academic Structure": (colors.HexColor("#27775B"), colors.HexColor("#E7F4EE")),
    "Applications and Enrollment A": (colors.HexColor("#A06B15"), colors.HexColor("#FFF3D9")),
    "Applications and Enrollment B": (colors.HexColor("#A06B15"), colors.HexColor("#FFF3D9")),
    "RFID and Attendance": (colors.HexColor("#A33E62"), colors.HexColor("#FBE8EF")),
    "Academic Grading": (colors.HexColor("#604AA3"), colors.HexColor("#EEE9FA")),
}

TARGETS = {
    "user": "USERS", "department": "DEPARTMENTS", "position": "POSITIONS", "school_year": "SCHOOL_YEARS",
    "grade_level": "GRADE_LEVELS", "section": "SECTIONS", "teacher": "TEACHERS", "application": "APPLICATIONS",
    "reviewed_by": "USERS", "changed_by": "USERS", "student": "STUDENTS", "guardian": "GUARDIANS",
    "verified_by": "USERS", "created_by": "USERS", "enrollment": "ENROLLMENTS", "from_section": "SECTIONS",
    "to_section": "SECTIONS", "rfid_card": "RFID_CARDS", "staff_profile": "STAFF_PROFILES", "assigned_by": "USERS",
    "rfid_device": "RFID_DEVICES", "attendance_record": "ATTENDANCE_RECORDS", "recorded_by": "USERS",
    "corrected_by": "USERS", "subject": "SUBJECTS", "class_offering": "CLASS_OFFERINGS",
    "grading_period": "GRADING_PERIODS", "encoded_by": "USERS", "approved_by": "USERS",
}


def parse_schema():
    text = SOURCE.read_text(encoding="utf-8")
    mermaid = re.search(r"```mermaid\s+(.*?)```", text, re.S).group(1)
    tables = {}
    for name, body in re.findall(r"^\s{4}([A-Z_]+) \{\s*(.*?)^\s{4}\}", mermaid, re.S | re.M):
        cols = []
        for line in body.splitlines():
            parts = line.strip().split()
            if len(parts) >= 2:
                cols.append({"type": parts[0], "name": parts[1], "key": " ".join(parts[2:]).replace(",", ", ")})
        tables[name] = cols
    relationships = []
    pattern = r'^\s{4}([A-Z_]+) (\|\|--o\||\|\|--o\{|\|\|--\|\{|o\|--o\{) ([A-Z_]+) : "?([^"\n]+)"?$'
    for left, symbol, right, label in re.findall(pattern, mermaid, re.M):
        relationships.append((left, symbol, right, label.strip()))
    return tables, relationships


def module_for(table):
    for module, tables in MODULES.items():
        if table in tables:
            return module
    return "Identity and Access"


def draw_header(c, page_num, subtitle, title="School Management System - Full Relationship Mapping"):
    c.setFillColor(colors.HexColor("#172B3A"))
    c.rect(0, PAGE_H - TITLE_H, PAGE_W, TITLE_H, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(MARGIN, PAGE_H - 60, title)
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor("#D8E5ED"))
    c.drawString(MARGIN, PAGE_H - 88, subtitle)
    c.setFillColor(colors.HexColor("#98B5C6"))
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 60, f"Page {page_num} of 2")


def draw_footer(c):
    c.setStrokeColor(colors.HexColor("#C9D5DC"))
    c.line(MARGIN, 36, PAGE_W - MARGIN, 36)
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#607784"))
    c.drawString(MARGIN, 20, "MySQL 8 / Laravel normalized reference - August 2026")
    c.drawRightString(PAGE_W - MARGIN, 20, "PK = primary key | FK = foreign key | UK = unique key")


def key_columns(columns):
    selected = [x for x in columns if x["key"] or x["name"].endswith("_id")]
    if not any(x["name"] == "id" for x in selected):
        selected.insert(0, columns[0])
    return selected


def positions_for(tables):
    col_gap = 20
    usable_w = PAGE_W - 2 * MARGIN
    col_w = (usable_w - 5 * col_gap) / 6
    content_top = PAGE_H - TITLE_H - 62
    bottom = 70
    rows = 6
    row_h = (content_top - bottom) / rows
    positions = {}
    for col_idx, (_, names) in enumerate(MODULES.items()):
        x = MARGIN + col_idx * (col_w + col_gap)
        for row_idx, name in enumerate(names):
            keys = key_columns(tables[name])
            box_h = 52 + len(keys) * 18
            y_center = content_top - row_h * (row_idx + 0.5)
            y = y_center - box_h / 2
            positions[name] = (x, y, col_w, box_h)
    return positions


def edge_points(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    acx, acy = ax + aw / 2, ay + ah / 2
    bcx, bcy = bx + bw / 2, by + bh / 2
    if abs(bcx - acx) >= abs(bcy - acy):
        if bcx > acx:
            start, end = (ax + aw, acy), (bx, bcy)
        else:
            start, end = (ax, acy), (bx + bw, bcy)
        midx = (start[0] + end[0]) / 2
        return [start, (midx, start[1]), (midx, end[1]), end]
    if bcy > acy:
        start, end = (acx, ay + ah), (bcx, by)
    else:
        start, end = (acx, ay), (bcx, by + bh)
    midy = (start[1] + end[1]) / 2
    return [start, (start[0], midy), (end[0], midy), end]


def draw_arrow(c, points, color):
    c.setStrokeColor(color)
    c.setLineWidth(1.0)
    c.setDash(3, 2)
    path = c.beginPath()
    path.moveTo(*points[0])
    for point in points[1:]:
        path.lineTo(*point)
    c.drawPath(path, stroke=1, fill=0)
    c.setDash()
    x2, y2 = points[-1]
    x1, y1 = points[-2]
    size = 4
    if x2 != x1:
        sign = 1 if x2 > x1 else -1
        arrow = [(x2, y2), (x2 - sign * size, y2 + size / 2), (x2 - sign * size, y2 - size / 2)]
    else:
        sign = 1 if y2 > y1 else -1
        arrow = [(x2, y2), (x2 + size / 2, y2 - sign * size), (x2 - size / 2, y2 - sign * size)]
    p = c.beginPath()
    p.moveTo(*arrow[0]); p.lineTo(*arrow[1]); p.lineTo(*arrow[2]); p.close()
    c.setFillColor(color)
    c.drawPath(p, stroke=0, fill=1)


def draw_entity(c, name, columns, box):
    x, y, w, h = box
    module = module_for(name)
    accent, fill = COLORS[module]
    c.setFillColor(colors.white)
    c.setStrokeColor(accent)
    c.setLineWidth(1.1)
    c.roundRect(x, y, w, h, 5, stroke=1, fill=1)
    c.setFillColor(accent)
    c.roundRect(x, y + h - 30, w, 30, 5, stroke=0, fill=1)
    c.rect(x, y + h - 30, w, 6, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 9, y + h - 20, name.lower())
    keys = key_columns(columns)
    current_y = y + h - 46
    for item in keys:
        key = item["key"] or ("FK" if item["name"].endswith("_id") else "")
        c.setFillColor(fill)
        c.rect(x + 1, current_y - 10, w - 2, 17, stroke=0, fill=1)
        c.setFillColor(accent if key else colors.HexColor("#5B6D78"))
        c.setFont("Helvetica-Bold" if key else "Helvetica", 7.8)
        c.drawString(x + 8, current_y - 3, key or "-")
        c.setFillColor(colors.HexColor("#25313C"))
        c.setFont("Helvetica", 8.3)
        c.drawString(x + 38, current_y - 3, item["name"])
        c.setFillColor(colors.HexColor("#607784"))
        c.setFont("Helvetica", 7.4)
        c.drawRightString(x + w - 8, current_y - 3, item["type"])
        current_y -= 18


def page_one(c, tables, relationships):
    draw_header(c, 1, "All entities and key fields; arrows point from parent to dependent entity")
    positions = positions_for(tables)
    for left, _, right, _ in relationships:
        accent, _ = COLORS[module_for(left)]
        draw_arrow(c, edge_points(positions[left], positions[right]), colors.Color(accent.red, accent.green, accent.blue, alpha=0.58))
    for name, box in positions.items():
        draw_entity(c, name, tables[name], box)
    # Module labels.
    col_gap = 20
    col_w = (PAGE_W - 2 * MARGIN - 5 * col_gap) / 6
    label_y = PAGE_H - TITLE_H - 36
    for idx, module in enumerate(MODULES):
        accent, _ = COLORS[module]
        label = module.replace(" A", "").replace(" B", "")
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(MARGIN + idx * (col_w + col_gap) + col_w / 2, label_y, label)
    draw_footer(c)
    c.showPage()


def relation_type(symbol):
    return {"||--o|": "1 to 0..1", "||--o{": "1 to many", "||--|{": "1 to 1..many", "o|--o{": "0..1 to many"}.get(symbol, symbol)


def inferred_fk(child, parent, tables):
    aliases = {
        "USERS": ["user_id", "reviewed_by", "changed_by", "created_by", "verified_by", "assigned_by", "recorded_by", "corrected_by", "encoded_by", "approved_by"],
        "SECTIONS": ["section_id", "from_section_id", "to_section_id"],
        "APPLICATIONS": ["application_id", "source_application_id"],
    }
    candidates = aliases.get(parent, []) + [parent.lower().rstrip("s") + "_id"]
    child_cols = {x["name"] for x in tables[child]}
    matches = [x for x in candidates if x in child_cols]
    return ", ".join(matches) if matches else "relationship/junction key"


def page_two(c, tables, relationships):
    draw_header(c, 2, "Cardinality, probable foreign key, and implementation meaning", "Relationship Directory")
    x = MARGIN
    top = PAGE_H - TITLE_H - 38
    widths = [300, 175, 300, 300, PAGE_W - 2 * MARGIN - 1075]
    headers = ["Parent", "Cardinality", "Child", "FK in child", "Meaning"]
    row_h = 25
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#DCE8EF"))
    c.rect(x, top - row_h, sum(widths), row_h, stroke=0, fill=1)
    cursor = x
    c.setFillColor(colors.HexColor("#1F4D78"))
    for header, width in zip(headers, widths):
        c.drawString(cursor + 7, top - 17, header)
        cursor += width
    y = top - row_h
    for idx, (parent, symbol, child, label) in enumerate(relationships):
        y -= row_h
        if idx % 2:
            c.setFillColor(colors.HexColor("#F5F8FA"))
            c.rect(x, y, sum(widths), row_h, stroke=0, fill=1)
        vals = [parent.lower(), relation_type(symbol), child.lower(), inferred_fk(child, parent, tables), label]
        cursor = x
        for col_idx, (value, width) in enumerate(zip(vals, widths)):
            c.setFillColor(colors.HexColor("#25313C"))
            c.setFont("Helvetica-Bold" if col_idx in (0, 2) else "Helvetica", 7.8)
            max_w = width - 12
            text = value
            while stringWidth(text, "Helvetica", 7.8) > max_w and len(text) > 5:
                text = text[:-2]
            if text != value:
                text = text.rstrip() + "..."
            c.drawString(cursor + 7, y + 8, text)
            cursor += width
        c.setStrokeColor(colors.HexColor("#D9E2E7"))
        c.line(x, y, x + sum(widths), y)

    note_y = y - 42
    c.setFillColor(colors.HexColor("#FFF3D9"))
    c.roundRect(MARGIN, note_y - 82, PAGE_W - 2 * MARGIN, 82, 5, stroke=0, fill=1)
    c.setFillColor(colors.HexColor("#7A5416"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 12, note_y - 19, "Delete-behavior guidance")
    c.setFont("Helvetica", 8.5)
    c.drawString(MARGIN + 12, note_y - 39, "RESTRICT: students, enrollments, sections, attendance, grades, and other official history.  SET NULL: optional actor and optional parent references.")
    c.drawString(MARGIN + 12, note_y - 57, "CASCADE: true dependent children such as application documents/status history and junction rows. Prefer deactivation/soft deletion for operational master records.")
    draw_footer(c)
    c.showPage()


def build():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    tables, relationships = parse_schema()
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("School Management System Full Relationship Mapping")
    c.setAuthor("SPRYtech Development Team")
    page_one(c, tables, relationships)
    page_two(c, tables, relationships)
    c.save()
    print(f"{OUTPUT}\nTables: {len(tables)}\nRelationships: {len(relationships)}")


if __name__ == "__main__":
    build()
