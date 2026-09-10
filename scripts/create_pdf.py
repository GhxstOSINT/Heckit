import os
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECURE_DIR = os.path.join(ROOT, "public", "secure")
os.makedirs(SECURE_DIR, exist_ok=True)
pdf_path = os.path.join(SECURE_DIR, "onboarding.pdf")

PDF_PASSWORD = "letmein"   # in rockyou.txt top 20 → John cracks it instantly

c = canvas.Canvas(pdf_path)
c.setFont("Helvetica-Bold", 16)
c.drawString(100, 750, "Stitch'd Internal DevOps & Onboarding")
c.setFont("Courier", 10)
env = ["# Stitch'd Production Environment Variables",
       "DB_HOST=prod-db.stitchd.internal.aws",
       "DB_USER=stitchd_admin",
       "DB_PASS=SuperSecretProdPass!2026",
       "JWT_SECRET=stitchd_prod_super_secret_2026",
       "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"]
for i, line in enumerate(env):
    c.drawString(100, 700 - (i * 20), line)
c.save()

reader = PdfReader(pdf_path)
writer = PdfWriter()
for page in reader.pages:
    writer.add_page(page)
# use_128bit keeps it RC4-128 ($pdf$2*3*...) = John's fastest PDF path
writer.encrypt(user_password=PDF_PASSWORD, owner_password=PDF_PASSWORD, use_128bit=True)
with open(pdf_path, "wb") as f:
    writer.write(f)
print(f"[+] Encrypted PDF created (password: {PDF_PASSWORD})")