"""Certificate PDF generation with QR code."""
import io
import qrcode
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


def _qr_image(url: str) -> ImageReader:
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def generate_certificate_pdf(*, student_name: str, project_title: str, category: str,
                             skills: list, completion_date: str, certificate_id: str,
                             verification_url: str) -> bytes:
    buf = io.BytesIO()
    W, H = landscape(A4)
    c = canvas.Canvas(buf, pagesize=(W, H))

    slate = colors.HexColor("#0f172a")
    blue = colors.HexColor("#2563eb")
    gray = colors.HexColor("#52525b")
    light = colors.HexColor("#e4e4e7")

    # Outer border
    c.setStrokeColor(light)
    c.setLineWidth(2)
    c.rect(18 * mm, 15 * mm, W - 36 * mm, H - 30 * mm)
    c.setStrokeColor(blue)
    c.setLineWidth(0.8)
    c.rect(22 * mm, 19 * mm, W - 44 * mm, H - 38 * mm)

    cx = W / 2

    c.setFillColor(blue)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(cx, H - 40 * mm, "E V I D E N T")
    c.setFillColor(gray)
    c.setFont("Helvetica", 9)
    c.drawCentredString(cx, H - 46 * mm, "PROJECT EXPERIENCE PLATFORM")

    c.setFillColor(slate)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(cx, H - 68 * mm, "Certificate of Project Completion")

    c.setFillColor(gray)
    c.setFont("Helvetica", 12)
    c.drawCentredString(cx, H - 82 * mm, "This certifies that")

    c.setFillColor(slate)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(cx, H - 98 * mm, student_name)

    c.setFillColor(gray)
    c.setFont("Helvetica", 12)
    c.drawCentredString(cx, H - 110 * mm, "successfully completed the project")

    c.setFillColor(blue)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(cx, H - 122 * mm, project_title)

    c.setFillColor(gray)
    c.setFont("Helvetica", 10)
    if skills:
        c.drawCentredString(cx, H - 133 * mm, "Skills: " + ", ".join(skills[:8]))
    c.drawCentredString(cx, H - 140 * mm, f"Category: {category}   |   Completed: {completion_date}")

    # QR code (bottom right)
    qr = _qr_image(verification_url)
    c.drawImage(qr, W - 62 * mm, 26 * mm, 30 * mm, 30 * mm)
    c.setFillColor(gray)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W - 47 * mm, 23 * mm, "Scan to verify")

    # Signature area (bottom left)
    c.setStrokeColor(slate)
    c.setLineWidth(0.7)
    c.line(35 * mm, 32 * mm, 90 * mm, 32 * mm)
    c.setFillColor(slate)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(35 * mm, 26 * mm, "Authorized Signature")

    # Certificate ID + verification (center bottom)
    c.setFillColor(gray)
    c.setFont("Helvetica", 8)
    c.drawCentredString(cx, 34 * mm, f"Certificate ID: {certificate_id}")
    c.drawCentredString(cx, 29 * mm, f"Verify at: {verification_url}")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()
