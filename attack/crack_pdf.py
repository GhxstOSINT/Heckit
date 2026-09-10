from pypdf import PdfReader
import sys

reader = PdfReader("onboarding.pdf")
if not reader.is_encrypted:
    print("Not encrypted.")
    sys.exit()

print("[*] Brute-forcing PDF password...")
# In a real scenario, you'd use a massive wordlist. Here we simulate it.
for pwd in ["admin", "password", "stitchd", "stitchd2026"]:
    if reader.decrypt(pwd) > 0:
        print(f"\n[!] CRACKED! Password: {pwd}\n")
        print("--- EXTRACTED SECRETS ---")
        for page in reader.pages: print(page.extract_text())
        sys.exit()
print("[-] Failed to crack.")