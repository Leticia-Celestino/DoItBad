#!/usr/bin/env python3
"""Build the interview dossier DOCX from the versioned Markdown source."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/interview/DOITBAD-DOSSIE-TECNICO.md"
OUTPUT = ROOT / "docs/interview/DoItBad-Dossie-Tecnico-Entrevista.docx"

GREEN = "334134"
SAGE = "64705A"
TERRACOTTA = "B86F50"
CREAM = "F5EFE4"
LIGHT_SAGE = "E8EBE3"
INK = "2F342F"
MUTED = "686A65"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = tc_pr.find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        tc_pr.append(shading)
    shading.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_page_number(paragraph) -> None:
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Página ")
    run.font.size = Pt(8)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.extend((fld_char1, instr_text, fld_char2))


def add_toc(paragraph) -> None:
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = 'TOC \\o "1-3" \\h \\z \\u'
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    placeholder = OxmlElement("w:t")
    placeholder.text = "Atualize este campo no Word/LibreOffice para gerar o sumário."
    separate.append(placeholder)
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend((begin, instruction, separate, end))


def set_update_fields(document: Document) -> None:
    settings = document.settings._element
    update = OxmlElement("w:updateFields")
    update.set(qn("w:val"), "true")
    settings.append(update)


def clean_inline(value: str) -> str:
    value = re.sub(r"\[([^]]+)]\(([^)]+)\)", r"\1 (\2)", value)
    value = value.replace("**", "").replace("__", "")
    value = value.replace("`", "")
    return value.strip()


def add_inline(paragraph, text: str) -> None:
    """Add a small Markdown inline subset: bold and code."""
    pattern = re.compile(r"(\*\*.+?\*\*|`.+?`)")
    position = 0
    for match in pattern.finditer(text):
        if match.start() > position:
            paragraph.add_run(text[position : match.start()])
        token = match.group(0)
        if token.startswith("**"):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
            run.font.color.rgb = RGBColor.from_string(GREEN)
        else:
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor.from_string(TERRACOTTA)
        position = match.end()
    if position < len(text):
        paragraph.add_run(text[position:])


def add_code_block(document: Document, code: str) -> None:
    paragraph = document.add_paragraph(style="Code Block")
    run = paragraph.add_run(code.rstrip())
    run.font.name = "Consolas"
    run.font.size = Pt(8)
    p_pr = paragraph._p.get_or_add_pPr()
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), "F2F3EF")
    p_pr.append(shading)
    borders = OxmlElement("w:pBdr")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), "18")
    left.set(qn("w:color"), TERRACOTTA)
    borders.append(left)
    p_pr.append(borders)


def add_markdown_table(document: Document, lines: list[str]) -> None:
    rows = []
    for line in lines:
        cells = [clean_inline(value) for value in line.strip().strip("|").split("|")]
        rows.append(cells)
    if len(rows) > 1 and all(re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in rows[1]):
        rows.pop(1)
    if not rows:
        return
    column_count = max(len(row) for row in rows)
    table = document.add_table(rows=len(rows), cols=column_count)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    table.autofit = True
    for row_index, values in enumerate(rows):
        row = table.rows[row_index]
        for column_index in range(column_count):
            cell = row.cells[column_index]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cell)
            text = values[column_index] if column_index < len(values) else ""
            paragraph = cell.paragraphs[0]
            add_inline(paragraph, text)
            for run in paragraph.runs:
                run.font.size = Pt(8)
            if row_index == 0:
                set_cell_shading(cell, GREEN)
                for run in paragraph.runs:
                    run.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)
            elif row_index % 2 == 0:
                set_cell_shading(cell, "F7F5EF")
        if row_index == 0:
            set_repeat_table_header(row)
    document.add_paragraph().paragraph_format.space_after = Pt(2)


def add_image(document: Document, alt: str, image_path: Path) -> None:
    if not image_path.exists():
        paragraph = document.add_paragraph()
        run = paragraph.add_run(f"[Imagem não encontrada: {image_path.name}]")
        run.italic = True
        return
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    run.add_picture(str(image_path), width=Inches(6.15))
    caption = document.add_paragraph(style="Caption")
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption.add_run(alt)


def configure_document(document: Document) -> None:
    section = document.sections[0]
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.0)
    section.header_distance = Cm(0.8)
    section.footer_distance = Cm(0.8)

    normal = document.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(9.5)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.08

    heading_sizes = {1: 22, 2: 15, 3: 11.5}
    heading_colors = {1: GREEN, 2: GREEN, 3: TERRACOTTA}
    for level in (1, 2, 3):
        style = document.styles[f"Heading {level}"]
        style.font.name = "Aptos Display"
        style.font.size = Pt(heading_sizes[level])
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(heading_colors[level])
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.space_before = Pt(14 if level == 1 else 10)
        style.paragraph_format.space_after = Pt(5)

    document.styles["Caption"].font.name = "Aptos"
    document.styles["Caption"].font.size = Pt(8)
    document.styles["Caption"].font.italic = True
    document.styles["Caption"].font.color.rgb = RGBColor.from_string(MUTED)

    if "Code Block" not in [style.name for style in document.styles]:
        document.styles.add_style("Code Block", WD_STYLE_TYPE.PARAGRAPH)

    header = section.header.paragraphs[0]
    header.text = "DoItBad  •  Dossiê técnico"
    header.style = document.styles["Caption"]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    add_page_number(section.footer.paragraphs[0])


def add_cover(document: Document) -> None:
    spacer = document.add_paragraph()
    spacer.paragraph_format.space_after = Pt(60)
    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("DoItBad")
    run.font.name = "Aptos Display"
    run.font.size = Pt(42)
    run.font.bold = True
    run.font.color.rgb = RGBColor.from_string(GREEN)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("Dossiê técnico para apresentação")
    run.font.name = "Aptos Display"
    run.font.size = Pt(22)
    run.font.color.rgb = RGBColor.from_string(TERRACOTTA)

    promise = document.add_paragraph()
    promise.alignment = WD_ALIGN_PARAGRAPH.CENTER
    promise.paragraph_format.space_before = Pt(24)
    promise.paragraph_format.space_after = Pt(30)
    run = promise.add_run("Transformar intenções em pequenos começos possíveis")
    run.font.size = Pt(13)
    run.font.italic = True
    run.font.color.rgb = RGBColor.from_string(SAGE)

    for label in (
        "Arquitetura • Produto • Banco de dados • Segurança • IA • Testes",
        "Versão 0.1.0  |  15 de outubro de 2026",
    ):
        paragraph = document.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run(label)
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor.from_string(MUTED)

    document.add_page_break()
    heading = document.add_heading("Sumário", level=1)
    heading.paragraph_format.space_after = Pt(12)
    add_toc(document.add_paragraph())
    document.add_page_break()


def build() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Markdown não encontrado: {SOURCE}")

    document = Document()
    configure_document(document)
    set_update_fields(document)
    document.core_properties.title = "DoItBad — Dossiê técnico para apresentação"
    document.core_properties.subject = "Arquitetura, produto, dados, segurança, IA e testes"
    document.core_properties.author = "DoItBad"
    document.core_properties.keywords = "DoItBad, arquitetura, React, Expo, Supabase, FastAPI, entrevista"
    add_cover(document)

    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    index = 0
    first_title_skipped = False
    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if not stripped:
            index += 1
            continue

        if stripped.startswith("```"):
            language = stripped[3:].strip()
            code_lines = []
            index += 1
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index])
                index += 1
            prefix = f"[{language}]\n" if language and language != "text" else ""
            add_code_block(document, prefix + "\n".join(code_lines))
            index += 1
            continue

        image_match = re.fullmatch(r"!\[([^]]*)]\(([^)]+)\)", stripped)
        if image_match:
            image_path = (SOURCE.parent / image_match.group(2)).resolve()
            add_image(document, image_match.group(1), image_path)
            index += 1
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            add_markdown_table(document, table_lines)
            continue

        heading_match = re.match(r"^(#{1,3})\s+(.+)$", stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = clean_inline(heading_match.group(2))
            if level == 1 and not first_title_skipped:
                first_title_skipped = True
            else:
                document.add_heading(text, level=level)
            index += 1
            continue

        if stripped == "---":
            paragraph = document.add_paragraph()
            p_pr = paragraph._p.get_or_add_pPr()
            borders = OxmlElement("w:pBdr")
            bottom = OxmlElement("w:bottom")
            bottom.set(qn("w:val"), "single")
            bottom.set(qn("w:sz"), "8")
            bottom.set(qn("w:color"), TERRACOTTA)
            borders.append(bottom)
            p_pr.append(borders)
            index += 1
            continue

        if stripped.startswith("> "):
            paragraph = document.add_paragraph(style="Quote")
            add_inline(paragraph, stripped[2:])
            paragraph.paragraph_format.left_indent = Cm(0.6)
            index += 1
            continue

        unordered = re.match(r"^\s*-\s+(.+)$", line)
        ordered = re.match(r"^\s*\d+\.\s+(.+)$", line)
        if unordered or ordered:
            paragraph = document.add_paragraph(
                style="List Bullet" if unordered else "List Number"
            )
            add_inline(paragraph, (unordered or ordered).group(1))
            index += 1
            continue

        paragraph_lines = [stripped]
        index += 1
        while index < len(lines):
            candidate = lines[index].strip()
            if not candidate:
                break
            if (
                candidate.startswith(("#", "```", "|", "> ", "![", "- "))
                or re.match(r"^\d+\.\s+", candidate)
                or candidate == "---"
            ):
                break
            paragraph_lines.append(candidate)
            index += 1
        paragraph = document.add_paragraph()
        add_inline(paragraph, " ".join(paragraph_lines).replace("  ", " "))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    try:
        build()
    except ImportError as exc:
        print("Dependência ausente. Instale python-docx.", file=sys.stderr)
        raise exc
