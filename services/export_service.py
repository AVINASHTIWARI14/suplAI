"""Generate exportable risk reports (CSV + PDF) of the current risk state."""
import csv
import io
from datetime import datetime

from services.dashboard_service import get_dashboard_summary
from services.disruption_service import get_active_disruptions
from services.supplier_service import get_supplier_risk


def build_csv_report(company_id: str) -> bytes:
    summary = get_dashboard_summary(company_id)
    suppliers = get_supplier_risk(company_id)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["SuplAI Risk Report"])
    writer.writerow(["Generated", datetime.utcnow().isoformat() + "Z"])
    writer.writerow(["Company ID", company_id])
    writer.writerow(["Overall network risk", summary.overall_risk_score])
    writer.writerow([])
    writer.writerow(["Supplier", "Location", "Country", "Risk score", "Lead time (days)"])
    for s in suppliers:
        writer.writerow([s.name, s.location or "", s.country or "", s.risk_score, s.lead_time_days or ""])
    writer.writerow([])
    writer.writerow(["Active disruptions"])
    writer.writerow(["Type", "Location", "Country", "Severity", "Industry", "Start date"])
    for d in summary.active_disruptions:
        writer.writerow([d.event_type or "", d.location or "", d.country or "",
                         d.severity or "", d.affected_industry or "", d.start_date or ""])
    return buf.getvalue().encode("utf-8")


def build_pdf_report(company_id: str) -> bytes:
    # reportlab is optional; give a clear error if it is not installed.
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
        )
    except Exception as exc:  # pragma: no cover
        raise ValueError("PDF export requires 'reportlab' (pip install reportlab)") from exc

    summary = get_dashboard_summary(company_id)
    suppliers = get_supplier_risk(company_id)
    disruptions = get_active_disruptions()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title="SuplAI Risk Report")
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("SuplAI — Supply Chain Risk Report", styles["Title"]))
    story.append(Paragraph(f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
    story.append(Paragraph(f"Overall network risk index: <b>{summary.overall_risk_score}</b>", styles["Normal"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Suppliers by risk", styles["Heading2"]))
    sup_data = [["Supplier", "Location", "Country", "Risk", "Lead (d)"]]
    for s in sorted(suppliers, key=lambda x: x.risk_score, reverse=True):
        sup_data.append([s.name, s.location or "-", s.country or "-", f"{s.risk_score:.0f}",
                         str(s.lead_time_days or "-")])
    sup_table = Table(sup_data, hAlign="LEFT")
    sup_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#132a3a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f7")]),
    ]))
    story.append(sup_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Active disruptions", styles["Heading2"]))
    dis_data = [["Type", "Location", "Severity", "Industry"]]
    for d in disruptions[:10]:
        d = d if isinstance(d, dict) else d.__dict__
        dis_data.append([d.get("event_type", "-"), d.get("location", "-"),
                         d.get("severity", "-"), d.get("affected_industry", "-")])
    dis_table = Table(dis_data, hAlign="LEFT")
    dis_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#132a3a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
    ]))
    story.append(dis_table)

    doc.build(story)
    return buf.getvalue()
