from pathlib import Path
import fitz

pdf_path = Path("attached_assets/Prompt_1789192389806.pdf")
output_dir = Path(".agents/outputs/prompt_pdf_pages")
output_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"pages={doc.page_count}")
print(f"metadata={doc.metadata}")

for index, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    output_path = output_dir / f"page-{index + 1}.png"
    pix.save(output_path)
    print(f"rendered={output_path} size={pix.width}x{pix.height}")