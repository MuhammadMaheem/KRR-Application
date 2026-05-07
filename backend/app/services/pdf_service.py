import fitz  # This is PyMuPDF
from fastapi import UploadFile

async def process_pdf(file: UploadFile):
    """Extracts text and metadata from an uploaded PDF."""
    
    # 1. Read the uploaded file into memory
    content = await file.read()
    
    # 2. Open it with PyMuPDF
    doc = fitz.open(stream=content, filetype="pdf")
    
    # 3. Extract the text page by page
    text = ""
    for page in doc:
        text += page.get_text()
        
    # 4. Return both the text and the metadata exactly how main.py expects it
    return {
        "text": text,
        "metadata": doc.metadata
    }