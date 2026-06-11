#!/usr/bin/env python3
"""Generate resume_DR.pdf — Dushyanth Ramalingam, synced with LinkedIn (Jun 2026)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    KeepTogether
)

INK = HexColor("#16161e")
GREY = HexColor("#55555f")
BLUE = HexColor("#1d76c9")
LINE = HexColor("#d9d9e0")

styles = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=22,
                           leading=26, textColor=INK, spaceAfter=2),
    "headline": ParagraphStyle("headline", fontName="Helvetica", fontSize=10,
                               leading=14, textColor=BLUE, spaceAfter=4),
    "contact": ParagraphStyle("contact", fontName="Helvetica", fontSize=8.5,
                              leading=12, textColor=GREY),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=10.5,
                         leading=13, textColor=BLUE, spaceBefore=10,
                         spaceAfter=4),
    "role": ParagraphStyle("role", fontName="Helvetica-Bold", fontSize=10,
                           leading=13, textColor=INK, spaceBefore=6),
    "org": ParagraphStyle("org", fontName="Helvetica", fontSize=9,
                          leading=12, textColor=GREY, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9,
                           leading=12.5, textColor=INK),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9,
                             leading=12.5, textColor=INK, leftIndent=9,
                             bulletIndent=0, spaceAfter=1),
    "skill": ParagraphStyle("skill", fontName="Helvetica", fontSize=9,
                            leading=13, textColor=INK),
}

def bullet(text):
    return Paragraph(f'<bullet><font color="#1d76c9">›</font></bullet> {text}', styles["bullet"])

def rule():
    return HRFlowable(width="100%", thickness=0.6, color=LINE, spaceBefore=2, spaceAfter=2)

story = []

# ---------- Header ----------
story.append(Paragraph("DUSHYANTH RAMALINGAM", styles["name"]))
story.append(Paragraph(
    "OmniFDE Consultant&nbsp;&nbsp;|&nbsp;&nbsp;Practice Head — AI &amp; Hyperautomation&nbsp;&nbsp;|&nbsp;&nbsp;"
    "Agentic AI Systems&nbsp;&nbsp;|&nbsp;&nbsp;Gen AI Engineer&nbsp;&nbsp;|&nbsp;&nbsp;Founder @AiSensei",
    styles["headline"]))
story.append(Paragraph(
    "Kuala Lumpur, Malaysia &nbsp;·&nbsp; +60 17 275 0818 &nbsp;·&nbsp; ddrdushy@yahoo.com &nbsp;·&nbsp; "
    'linkedin.com/in/ddr-dushy &nbsp;·&nbsp; github.com/ddrdushy &nbsp;·&nbsp; ddrdushy.github.io',
    styles["contact"]))
story.append(Spacer(1, 4))
story.append(rule())

# ---------- Summary ----------
story.append(Paragraph("SUMMARY", styles["h2"]))
story.append(Paragraph(
    "Technology leader with <b>15+ years</b> from hands-on engineering to leading a global AI &amp; "
    "Hyperautomation practice. Architect of <b>agentic AI systems</b> that fuse RPA with Generative AI — "
    "local RAG, vector search, computer vision and LLM orchestration. Delivered <b>100+ automated "
    "processes</b> and <b>USD $4M+ in verified savings</b> for <b>20+ clients</b> across Asia, the Middle "
    "East and the US. Ships production AI products (<b>HireOps AI</b>, <b>ZeroKey</b>) and teaches AI to "
    "thousands as founder of <b>AiSensei</b>.", styles["body"]))

# ---------- Experience ----------
story.append(Paragraph("EXPERIENCE", styles["h2"]))

def job(role, org, dates, bullets):
    head = Table(
        [[Paragraph(role, styles["role"]),
          Paragraph(f'<para align="right"><font name="Helvetica" size="8.5" color="#55555f">{dates}</font></para>', styles["org"])]],
        colWidths=[118*mm, 52*mm])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(head)
    story.append(Paragraph(org, styles["org"]))
    for b in bullets:
        story.append(bullet(b))

job("Capability Lead — AI &amp; OmniFDE", "Symprio · Malaysia", "Nov 2023 — Present", [
    "Lead the Automation Practice — global strategy and delivery for 20+ clients across Asia, the Middle East and the US.",
    "Manage a 6+ member team across advanced RPA and custom AI development, including local RAG systems.",
    "Personally drive solution design, MVP creation, consulting and training for all major automation initiatives.",
    "Partner with senior business and IT stakeholders to align automation with digital-transformation goals.",
])
job("RPA Project Manager (Contract)", "Generali Malaysia · Insurance", "Jun 2024 — Jun 2025", [
    "Led key RPA programs in the insurance domain, improving process efficiency and team alignment.",
    "Worked cross-functionally with operations, IT and change management to raise automation throughput.",
    "Mentored developers and business stakeholders, lifting the organisation's automation maturity.",
])
job("Automation Solution Architect", "Symprio · Malaysia", "Jan 2020 — Nov 2023", [
    "Architected enterprise-scale automation; helped build and scale the company's Automation Centre of Excellence.",
    "Established governance, operating models and delivery frameworks for sustainable, large-scale automation.",
])
job("RPA Engineer", "KGiSL GSS · India → Malaysia", "Jun 2017 — Dec 2019", [
    "Mastered UiPath and relocated to the Malaysian client site within two weeks of joining; grew the account through delivery trust.",
    "Hybrid BA / solution architect / developer — delivered and oversaw 100+ automated processes.",
    "Built a foundational RPA framework for a key insurance client that remains in production today.",
    "Pre-sales engineer across BFSI, logistics and aviation; delivered formal UiPath training to a major airline.",
])
job("JavaScript Developer (Internship)", "KGISL IAS · India", "2017", [
    "Built a Queue Management System end-to-end in 3 months as sole BA, designer, developer and tester.",
    "Integrated a custom Slack bot for automated answers; served as Master's final-year project.",
])
job("Linux Administrator (Part-time)", "Caliber Interconnect Solutions · India", "Jan 2012 — 2016", [
    "Ran complete IT infrastructure for a 250-employee organisation — mail, FTP and chat servers, org-wide firewall.",
    "Wrote shell scripts for server monitoring, protection and automated alerting to ensure high availability.",
])

# ---------- Products ----------
story.append(Paragraph("PRODUCTS &amp; PROJECTS", styles["h2"]))
for b in [
    "<b>HireOps AI</b> — AI recruiting OS: inbox sync, resume scoring, AI screening and pipeline forecasting (hireops.symprio.com).",
    "<b>ZeroKey</b> — LHDN MyInvois e-invoicing: AI extraction, validation and compliant submission (zerokey.symprio.com).",
    "<b>symprio.com</b> — designed and built the corporate site for Symprio's AI &amp; automation business.",
    "<b>AiSensei</b> — founder of the AI education channel (YouTube @AiSensei_MY); writer at medium.com/@symprioblog.",
]:
    story.append(bullet(b))

# ---------- Skills ----------
rows = [
    ("AI &amp; Agentic", "Agentic AI development · Generative AI · RAG · LangChain · Vector DBs · LLM orchestration · Computer Vision (YOLO) · Prompt engineering"),
    ("Hyperautomation", "UiPath · Power Platform · Power Automate · RPA architecture · n8n · Zapier · Abbyy · Process assessment"),
    ("Engineering", "Python · JavaScript / TypeScript · Node.js · SQL · MongoDB · Shell scripting · Git / CI · Linux"),
    ("Leadership", "Solution architecture · CoE build-out · Pre-sales · Training &amp; mentoring · Project delivery · Stakeholder management"),
]
skill_table = Table(
    [[Paragraph(f'<font color="#1d76c9"><b>{k}</b></font>', styles["skill"]),
      Paragraph(v, styles["skill"])] for k, v in rows],
    colWidths=[34*mm, 136*mm])
skill_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
]))
story.append(KeepTogether([Paragraph("SKILLS", styles["h2"]), skill_table]))

# ---------- Education ----------
story.append(Paragraph("EDUCATION", styles["h2"]))
for b in [
    "<b>Master's, Computer Software Engineering (MCA)</b> — KGiSL-IIM, India · 2015–2017 · <i>KGiSL Achiever award</i>.",
    "<b>BCA, Software Development</b> — Kongunadu Arts &amp; Science College, India · 2012–2015.",
    "<b>Business / Commerce</b> — K/Hindu National College, Sri Lanka · 2007–2012.",
]:
    story.append(bullet(b))

doc = SimpleDocTemplate(
    "/Users/symprio/Desktop/ddrdushy.github.io/docs/resume_DR.pdf",
    pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm, topMargin=14*mm, bottomMargin=14*mm,
    title="Dushyanth Ramalingam — Resume",
    author="Dushyanth Ramalingam",
    subject="OmniFDE Consultant | Practice Head — AI & Hyperautomation",
)
doc.build(story)
print("resume_DR.pdf written")
