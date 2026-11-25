#!/usr/bin/env python3
"""Generate the editable DoItBad interview presentation."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.enum.dml import MSO_THEME_COLOR
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs/interview/assets"
OUTPUT = ROOT / "docs/interview/DoItBad-Apresentacao-Tecnica-3-Minutos.pptx"

W = Inches(13.333)
H = Inches(7.5)

CREAM = RGBColor(246, 240, 229)
PAPER = RGBColor(255, 251, 243)
INK = RGBColor(52, 55, 47)
MUTED = RGBColor(104, 105, 96)
SAGE = RGBColor(89, 105, 75)
LIGHT_SAGE = RGBColor(229, 234, 220)
TERRACOTTA = RGBColor(184, 103, 72)
PEACH = RGBColor(240, 185, 151)
GOLD = RGBColor(226, 192, 103)
NIGHT = RGBColor(43, 49, 63)
WHITE = RGBColor(255, 255, 255)


def add_solid_background(slide, color=CREAM):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_text(
    slide,
    text,
    x,
    y,
    w,
    h,
    *,
    size=18,
    color=INK,
    bold=False,
    font="Aptos",
    align=PP_ALIGN.LEFT,
    valign=MSO_ANCHOR.TOP,
    margin=0,
    line_spacing=1.0,
):
    box = slide.shapes.add_textbox(x, y, w, h)
    frame = box.text_frame
    frame.clear()
    frame.margin_left = frame.margin_right = frame.margin_top = frame.margin_bottom = margin
    frame.vertical_anchor = valign
    paragraph = frame.paragraphs[0]
    paragraph.alignment = align
    paragraph.line_spacing = line_spacing
    run = paragraph.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return box


def add_rich_lines(slide, lines, x, y, w, h, *, size=17, color=INK, gap=8):
    box = slide.shapes.add_textbox(x, y, w, h)
    frame = box.text_frame
    frame.clear()
    frame.margin_left = frame.margin_right = Inches(0.03)
    frame.margin_top = frame.margin_bottom = 0
    for index, item in enumerate(lines):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.text = item
        paragraph.font.name = "Aptos"
        paragraph.font.size = Pt(size)
        paragraph.font.color.rgb = color
        paragraph.space_after = Pt(gap)
        paragraph.line_spacing = 1.05
    return box


def add_round_rect(slide, x, y, w, h, fill=PAPER, line=None, radius=True):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = line or fill
    return shape


def add_label(slide, text, x=Inches(0.72), y=Inches(0.45), color=SAGE):
    add_text(slide, text.upper(), x, y, Inches(5.5), Inches(0.3), size=10, color=color, bold=True)


def add_title(slide, title, subtitle=None, *, y=Inches(0.82), width=Inches(11.9)):
    add_text(
        slide,
        title,
        Inches(0.72),
        y,
        width,
        Inches(0.78),
        size=29,
        color=INK,
        bold=True,
        font="Aptos Display",
    )
    if subtitle:
        add_text(
            slide,
            subtitle,
            Inches(0.75),
            y + Inches(0.68),
            width,
            Inches(0.44),
            size=13,
            color=MUTED,
        )


def add_footer(slide, number, section="APRESENTAÇÃO TÉCNICA"):
    add_text(slide, "DoItBad", Inches(0.72), Inches(7.14), Inches(1.2), Inches(0.2), size=9, color=SAGE, bold=True)
    add_text(slide, section, Inches(5.3), Inches(7.14), Inches(2.8), Inches(0.2), size=8, color=MUTED, align=PP_ALIGN.CENTER)
    add_text(slide, f"{number:02d}", Inches(12.1), Inches(7.12), Inches(0.5), Inches(0.22), size=9, color=MUTED, align=PP_ALIGN.RIGHT)


def add_picture_cover(slide, path, x, y, w, h, *, radius=False):
    path = Path(path)
    with Image.open(path) as image:
        source_ratio = image.width / image.height
    target_ratio = w / h
    picture = slide.shapes.add_picture(str(path), x, y, w, h)
    if source_ratio > target_ratio:
        visible = target_ratio / source_ratio
        crop = (1 - visible) / 2
        picture.crop_left = crop
        picture.crop_right = crop
    elif source_ratio < target_ratio:
        visible = source_ratio / target_ratio
        crop = (1 - visible) / 2
        picture.crop_top = crop
        picture.crop_bottom = crop
    if radius:
        picture._element.spPr.prstGeom.prst = "roundRect"
    return picture


def add_picture_contain(slide, path, x, y, w, h):
    path = Path(path)
    with Image.open(path) as image:
        ratio = image.width / image.height
    target = w / h
    if ratio > target:
        height = w / ratio
        return slide.shapes.add_picture(str(path), x, y + (h - height) / 2, width=w, height=height)
    width = h * ratio
    return slide.shapes.add_picture(str(path), x + (w - width) / 2, y, width=width, height=h)


def add_note(slide, text):
    frame = slide.notes_slide.notes_text_frame
    frame.text = text


def add_number_badge(slide, number, x, y, fill=SAGE):
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, Inches(0.46), Inches(0.46))
    circle.fill.solid()
    circle.fill.fore_color.rgb = fill
    circle.line.color.rgb = fill
    add_text(
        slide,
        str(number),
        x,
        y + Inches(0.01),
        Inches(0.46),
        Inches(0.42),
        size=13,
        color=WHITE,
        bold=True,
        align=PP_ALIGN.CENTER,
        valign=MSO_ANCHOR.MIDDLE,
    )


def slide_cover(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_picture_cover(slide, ASSETS / "landing-hero.png", Inches(7.25), 0, Inches(6.08), H)
    overlay = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.7), 0, Inches(1.25), H)
    overlay.fill.solid()
    overlay.fill.fore_color.rgb = CREAM
    overlay.fill.transparency = 12
    overlay.line.fill.background()
    add_label(slide, "Projeto de produto multiplataforma", y=Inches(0.72))
    add_text(slide, "DoItBad", Inches(0.72), Inches(1.5), Inches(5.8), Inches(0.85), size=46, color=INK, bold=True, font="Aptos Display")
    add_text(slide, "Pequenos começos.\nContinuidade possível.", Inches(0.72), Inches(2.42), Inches(5.7), Inches(1.25), size=29, color=SAGE, bold=True, font="Aptos Display")
    add_text(slide, "Case técnico em 3 minutos", Inches(0.75), Inches(4.08), Inches(4.5), Inches(0.4), size=16, color=TERRACOTTA, bold=True)
    add_rich_lines(slide, ["Web • Android/iOS", "Supabase • FastAPI • IA com fallback"], Inches(0.75), Inches(4.62), Inches(5.3), Inches(1.0), size=15, color=MUTED, gap=6)
    add_text(slide, "15 OUT 2026", Inches(0.75), Inches(6.72), Inches(1.8), Inches(0.25), size=9, color=MUTED, bold=True)
    add_note(slide, "0:00–0:20 — O DoItBad é um produto web e mobile criado para uma situação comum: saber o que precisa ser feito, mas sentir que começar é grande demais. A proposta é transformar essa intenção em um próximo passo pequeno, concreto e retomável.")
    return slide


def slide_problem(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "01 • Problema")
    add_title(slide, "Saber o que fazer não significa conseguir começar.", "O atrito está entre intenção, clareza e energia disponível.")
    add_text(slide, "“", Inches(0.7), Inches(2.05), Inches(0.6), Inches(0.7), size=56, color=TERRACOTTA, font="Georgia")
    add_text(slide, "Ferramentas tradicionais organizam tarefas.\nO DoItBad organiza o primeiro movimento.", Inches(1.18), Inches(2.2), Inches(5.1), Inches(1.35), size=24, color=INK, bold=True, font="Aptos Display")
    problems = [
        ("01", "Tarefa grande", "A pessoa enxerga o objetivo, mas não a ação possível agora."),
        ("02", "Perda de contexto", "Depois de uma pausa, é difícil lembrar exatamente onde retomar."),
        ("03", "Pressão", "Rankings e cobranças podem aumentar culpa em vez de reduzir atrito."),
    ]
    for index, (number, title, body) in enumerate(problems):
        y = Inches(2.02 + index * 1.35)
        add_round_rect(slide, Inches(7.0), y, Inches(5.55), Inches(1.08), fill=PAPER, line=LIGHT_SAGE)
        add_text(slide, number, Inches(7.25), y + Inches(0.2), Inches(0.5), Inches(0.3), size=11, color=TERRACOTTA, bold=True)
        add_text(slide, title, Inches(7.82), y + Inches(0.14), Inches(2.0), Inches(0.3), size=17, color=INK, bold=True)
        add_text(slide, body, Inches(7.82), y + Inches(0.49), Inches(4.25), Inches(0.42), size=11, color=MUTED)
    add_text(slide, "HIPÓTESE", Inches(1.2), Inches(4.35), Inches(1.0), Inches(0.25), size=9, color=SAGE, bold=True)
    add_text(slide, "Reduzir o tamanho do próximo passo diminui o custo emocional de começar.", Inches(1.2), Inches(4.68), Inches(5.1), Inches(0.9), size=18, color=SAGE, bold=True)
    add_footer(slide, 2)
    add_note(slide, "0:20–0:45 — O problema não é falta de lista. É a distância entre intenção e ação, causada por ambiguidade, cansaço ou perda de contexto. Em vez de adicionar cobrança, a hipótese do produto é reduzir o tamanho do próximo passo e preservar o fio da meada para a retomada.")
    return slide


def slide_solution(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "02 • Solução")
    add_title(slide, "Um fluxo que transforma intenção em movimento.", "A experiência conduz sem retirar autonomia da pessoa.")
    stages = [
        ("Registrar", "uma tarefa ou intenção"),
        ("Entender", "o bloqueio real"),
        ("Reduzir", "para uma microação"),
        ("Focar", "por um tempo curto"),
        ("Retomar", "com contexto preservado"),
    ]
    for index, (title, body) in enumerate(stages):
        x = Inches(0.73 + index * 2.48)
        add_number_badge(slide, index + 1, x, Inches(2.02), TERRACOTTA if index == 2 else SAGE)
        if index < len(stages) - 1:
            line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x + Inches(0.5), Inches(2.23), Inches(1.88), Inches(0.025))
            line.fill.solid(); line.fill.fore_color.rgb = PEACH; line.line.fill.background()
        add_text(slide, title, x, Inches(2.63), Inches(1.9), Inches(0.35), size=16, color=INK, bold=True)
        add_text(slide, body, x, Inches(3.02), Inches(1.92), Inches(0.55), size=11, color=MUTED)
    add_round_rect(slide, Inches(0.72), Inches(4.05), Inches(12.0), Inches(2.42), fill=PAPER, line=LIGHT_SAGE)
    add_picture_cover(slide, ASSETS / "web-desktop/07-step.png", Inches(0.9), Inches(4.23), Inches(5.55), Inches(2.05))
    add_picture_cover(slide, ASSETS / "web-desktop/08-timer.png", Inches(6.6), Inches(4.23), Inches(5.55), Inches(2.05))
    add_footer(slide, 3)
    add_note(slide, "0:45–1:15 — O fluxo começa com uma tarefa, identifica o bloqueio, propõe uma microação e inicia uma sessão curta. Ao terminar, guarda nota, humor e próximo passo. Assim, lista, calendário, mapa, histórico e retomada mostram o mesmo trabalho sem inventar progresso.")
    return slide


def slide_multiplatform(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "03 • Produto")
    add_title(slide, "A mesma regra de negócio, adaptada a cada tela.", "Paridade funcional sem forçar a mesma interface em web e mobile.")
    add_round_rect(slide, Inches(0.7), Inches(1.85), Inches(8.45), Inches(4.65), fill=PAPER, line=LIGHT_SAGE)
    add_picture_cover(slide, ASSETS / "web-desktop/10-history.png", Inches(0.88), Inches(2.03), Inches(8.1), Inches(4.3))
    add_round_rect(slide, Inches(9.48), Inches(1.75), Inches(2.55), Inches(4.92), fill=NIGHT, line=NIGHT)
    add_picture_contain(slide, ASSETS / "android/10-history.png", Inches(9.62), Inches(1.9), Inches(2.27), Inches(4.62))
    add_text(slide, "WEB DESKTOP", Inches(1.0), Inches(6.58), Inches(2.0), Inches(0.25), size=9, color=SAGE, bold=True)
    add_text(slide, "ANDROID FÍSICO", Inches(9.7), Inches(6.76), Inches(2.0), Inches(0.25), size=9, color=SAGE, bold=True, align=PP_ALIGN.CENTER)
    add_round_rect(slide, Inches(11.95), Inches(2.04), Inches(0.7), Inches(3.95), fill=LIGHT_SAGE, line=LIGHT_SAGE)
    add_text(slide, "18\ntelas\n\nWeb\n+\nMobile", Inches(12.03), Inches(2.32), Inches(0.52), Inches(3.3), size=13, color=SAGE, bold=True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    add_footer(slide, 4)
    add_note(slide, "1:15–1:45 — A solução tem 18 telas e estados equivalentes na web e no aplicativo. Eu compartilhei tipos e regras no pacote TypeScript core, mas mantive componentes próprios: no desktop há sidebar e composição horizontal; no mobile há navegação compacta, safe area e armazenamento seguro de sessão.")
    return slide


def slide_architecture(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "04 • Arquitetura")
    add_title(slide, "Separar contextos, compartilhar o que realmente importa.")
    add_round_rect(slide, Inches(0.68), Inches(1.72), Inches(8.1), Inches(4.98), fill=WHITE, line=LIGHT_SAGE)
    add_picture_contain(slide, ASSETS / "architecture.png", Inches(0.86), Inches(1.9), Inches(7.74), Inches(4.62))
    decisions = [
        ("Astro", "conteúdo, SEO e quatro idiomas"),
        ("React + Expo", "experiências web e nativa"),
        ("Core TypeScript", "domínio e sincronização comuns"),
        ("Supabase", "Auth, PostgreSQL e RLS"),
        ("FastAPI", "fronteira segura para IA"),
    ]
    add_text(slide, "DECISÕES-CHAVE", Inches(9.12), Inches(1.9), Inches(2.5), Inches(0.25), size=9, color=TERRACOTTA, bold=True)
    for index, (title, body) in enumerate(decisions):
        y = Inches(2.38 + index * 0.78)
        add_text(slide, title, Inches(9.12), y, Inches(1.55), Inches(0.25), size=14, color=INK, bold=True)
        add_text(slide, body, Inches(10.52), y, Inches(2.05), Inches(0.48), size=10.5, color=MUTED)
    add_footer(slide, 5)
    add_note(slide, "1:45–2:15 — A arquitetura é um monorepo. Astro atende a presença pública e SEO; React/Vite atende o workspace; Expo entrega o aplicativo; e o core TypeScript concentra domínio. Supabase fornece autenticação, PostgreSQL e RLS. A IA fica em uma API FastAPI separada para proteger segredos e validar respostas.")
    return slide


def slide_trust(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "05 • Dados, segurança e IA")
    add_title(slide, "O modelo probabilístico nunca controla o domínio.", "Regras determinísticas cercam dados, autorização e recomendação.")
    add_round_rect(slide, Inches(0.68), Inches(1.85), Inches(7.25), Inches(4.75), fill=WHITE, line=LIGHT_SAGE)
    add_picture_contain(slide, ASSETS / "database-erd.png", Inches(0.86), Inches(2.03), Inches(6.88), Inches(4.38))
    controls = [
        ("RLS por usuário", "O banco bloqueia leitura e escrita entre contas."),
        ("Revisão otimista", "Evita sobrescrever edições feitas em outro dispositivo."),
        ("IA restrita", "Recebe no máximo cinco tarefas elegíveis e não inventa IDs."),
        ("Fallback", "Se o modelo falha, uma regra determinística mantém o produto útil."),
    ]
    for index, (title, body) in enumerate(controls):
        y = Inches(1.93 + index * 1.12)
        add_round_rect(slide, Inches(8.28), y, Inches(4.35), Inches(0.92), fill=PAPER, line=LIGHT_SAGE)
        add_number_badge(slide, index + 1, Inches(8.48), y + Inches(0.22), TERRACOTTA if index == 3 else SAGE)
        add_text(slide, title, Inches(9.08), y + Inches(0.14), Inches(2.2), Inches(0.26), size=14, color=INK, bold=True)
        add_text(slide, body, Inches(9.08), y + Inches(0.46), Inches(3.25), Inches(0.36), size=10, color=MUTED)
    add_footer(slide, 6)
    add_note(slide, "2:15–2:40 — Segurança entra no banco com RLS por usuário e validações SQL. A revisão otimista evita sobrescrever mudanças de outro dispositivo. Na IA, regras escolhem tarefas elegíveis, Pydantic valida o JSON e um fallback determinístico mantém o produto funcionando se o modelo falhar.")
    return slide


def slide_results(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide, NIGHT)
    add_label(slide, "06 • Resultado e aprendizado", color=GOLD)
    add_text(slide, "Produto executável, evidência real\ne limites declarados.", Inches(0.72), Inches(1.02), Inches(6.4), Inches(1.18), size=31, color=WHITE, bold=True, font="Aptos Display")
    metrics = [
        ("75", "testes E2E aprovados"),
        ("0", "falhas na suíte completa"),
        ("18", "telas web + mobile"),
        ("34", "páginas Astro geradas"),
    ]
    for index, (number, label) in enumerate(metrics):
        x = Inches(0.72 + index * 2.05)
        add_text(slide, number, x, Inches(2.63), Inches(1.5), Inches(0.62), size=32, color=GOLD, bold=True, font="Aptos Display")
        add_text(slide, label, x, Inches(3.27), Inches(1.7), Inches(0.55), size=10.5, color=WHITE)
    add_round_rect(slide, Inches(8.9), Inches(0.72), Inches(3.75), Inches(5.72), fill=RGBColor(53, 60, 75), line=RGBColor(102, 112, 95))
    add_text(slide, "O que este case demonstra", Inches(9.25), Inches(1.1), Inches(3.05), Inches(0.4), size=17, color=WHITE, bold=True)
    add_rich_lines(
        slide,
        [
            "• decisão de produto guiando arquitetura",
            "• compartilhamento sem acoplar interfaces",
            "• segurança aplicada no banco",
            "• IA com limites e degradação segura",
            "• teste encontrando um defeito real no mobile",
        ],
        Inches(9.22),
        Inches(1.75),
        Inches(3.0),
        Inches(2.9),
        size=13,
        color=WHITE,
        gap=12,
    )
    add_text(slide, "Próximo passo", Inches(9.25), Inches(4.78), Inches(2.0), Inches(0.28), size=11, color=GOLD, bold=True)
    add_text(slide, "Validar iOS em hardware e medir o tempo até a primeira microação com usuários reais.", Inches(9.25), Inches(5.18), Inches(2.95), Inches(0.75), size=13, color=WHITE, bold=True)
    add_text(slide, "Obrigada — perguntas?", Inches(0.75), Inches(5.25), Inches(6.2), Inches(0.65), size=25, color=PEACH, bold=True, font="Aptos Display")
    add_text(slide, "Anexos técnicos nas próximas páginas", Inches(0.77), Inches(6.12), Inches(4.2), Inches(0.3), size=11, color=RGBColor(201, 207, 198))
    add_footer(slide, 7, section="FIM DO ROTEIRO DE 3 MINUTOS")
    add_note(slide, "2:40–3:00 — O resultado é um produto executável: 75 testes E2E aprovados, zero falhas, 18 telas e Android validado fisicamente. O principal aprendizado foi manter produto, arquitetura e evidência coerentes. O próximo passo é validar iOS em hardware e medir com usuários o tempo até a primeira microação.")
    return slide


def slide_appendix_stack(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "Anexo A • Stack")
    add_title(slide, "Tecnologias e justificativas")
    rows = [
        ("Landing", "Astro + React islands", "HTML estático, SEO, i18n e pouca hidratação"),
        ("Web", "React 19 + Vite", "workspace interativo e responsivo"),
        ("Mobile", "Expo + React Native", "uma base nativa com acesso a módulos do dispositivo"),
        ("Domínio", "TypeScript compartilhado", "paridade de regra sem compartilhar UI"),
        ("Backend", "Supabase/PostgreSQL", "Auth, RLS, SQL e migrações explícitas"),
        ("IA", "FastAPI + Pydantic", "segredos isolados e resposta estruturada"),
        ("Editorial", "Sanity + fallback local", "operação sem deploy e build resiliente"),
        ("Qualidade", "Playwright + ESLint + TS", "fluxo, acessibilidade, segurança e contratos"),
    ]
    for index, (layer, tech, reason) in enumerate(rows):
        y = Inches(1.75 + index * 0.62)
        if index % 2 == 0:
            add_round_rect(slide, Inches(0.7), y - Inches(0.06), Inches(11.95), Inches(0.55), fill=PAPER, line=PAPER, radius=False)
        add_text(slide, layer, Inches(0.92), y, Inches(1.25), Inches(0.28), size=11, color=TERRACOTTA, bold=True)
        add_text(slide, tech, Inches(2.25), y, Inches(2.75), Inches(0.28), size=12, color=INK, bold=True)
        add_text(slide, reason, Inches(5.1), y, Inches(7.1), Inches(0.34), size=11, color=MUTED)
    add_footer(slide, 8, section="ANEXO TÉCNICO")
    add_note(slide, "Anexo para perguntas sobre stack e trade-offs. Não faz parte dos três minutos.")


def slide_appendix_database(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_label(slide, "Anexo B • Dados")
    add_title(slide, "Modelo de dados, integridade e isolamento")
    add_picture_contain(slide, ASSETS / "database-erd.png", Inches(0.62), Inches(1.5), Inches(8.2), Inches(5.35))
    add_round_rect(slide, Inches(9.0), Inches(1.68), Inches(3.55), Inches(4.75), fill=PAPER, line=LIGHT_SAGE)
    add_text(slide, "Pontos para explicar", Inches(9.35), Inches(2.0), Inches(2.8), Inches(0.4), size=17, color=INK, bold=True)
    add_rich_lines(slide, ["RLS por auth.uid()", "CHECK por tipo de payload JSONB", "revision para concorrência otimista", "índice: um foco ativo por usuário", "recomendação ligada à revisão da tarefa"], Inches(9.35), Inches(2.65), Inches(2.75), Inches(2.8), size=13, color=MUTED, gap=12)
    add_footer(slide, 9, section="ANEXO TÉCNICO")
    add_note(slide, "Anexo para perguntas sobre banco, JSONB, RLS e concorrência.")


def slide_appendix_evidence(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide, NIGHT)
    add_label(slide, "Anexo C • Evidências", color=GOLD)
    add_text(slide, "Builds, testes e validação física", Inches(0.72), Inches(0.9), Inches(7.5), Inches(0.6), size=29, color=WHITE, bold=True, font="Aptos Display")
    add_round_rect(slide, Inches(0.66), Inches(1.58), Inches(12.0), Inches(5.15), fill=RGBColor(40, 46, 59), line=RGBColor(102, 112, 95))
    add_picture_contain(slide, ASSETS / "test-summary.png", Inches(0.88), Inches(1.8), Inches(11.56), Inches(4.7))
    add_footer(slide, 10, section="ANEXO TÉCNICO")
    add_note(slide, "Anexo para comprovar os números da apresentação e discutir estratégia de testes.")


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    prs.core_properties.title = "DoItBad — apresentação técnica em 3 minutos"
    prs.core_properties.subject = "Case técnico para entrevistas"
    prs.core_properties.author = "DoItBad"
    prs.core_properties.keywords = "DoItBad, React, Expo, Supabase, FastAPI, IA, arquitetura"

    slide_cover(prs)
    slide_problem(prs)
    slide_solution(prs)
    slide_multiplatform(prs)
    slide_architecture(prs)
    slide_trust(prs)
    slide_results(prs)
    slide_appendix_stack(prs)
    slide_appendix_database(prs)
    slide_appendix_evidence(prs)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
