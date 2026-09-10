import sys
import time
from pypdf import PdfReader

pdf_path = "public/secure/onboarding.pdf"
wordlist = "rockyou.txt"

print(f"Loaded 1 password hash from {pdf_path} (PDF [pypdf])")
print("Press Ctrl-C to abort...")
start_time = time.time()

reader = PdfReader(pdf_path)
count = 0

with open(wordlist, "r", encoding="latin-1") as f:
    for line in f:
        pwd = line.strip()
        count += 1
        # pypdf returns >0 if the password successfully decrypts the file
        if reader.decrypt(pwd) > 0:
            elapsed = time.time() - start_time
            speed = count / elapsed if elapsed > 0 else 0
            print(f"\n{pwd}      ({pdf_path})")
            print(f"1g 0:00:{int(elapsed):02d} DONE ({time.strftime('%Y-%m-%d %H:%M')}) {speed:.0f}p/s {speed:.0f}c/s")
            print("Session completed.")
            sys.exit(0)

print("Session completed (Failed to crack).")
