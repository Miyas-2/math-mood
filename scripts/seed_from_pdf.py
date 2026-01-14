"""
PDF Content Extractor for MoodMath
Extracts content from Matematika SMP Kelas IX textbook and seeds PostgreSQL database

Requirements:
    pip install pdfplumber psycopg2-binary python-dotenv

Usage:
    python scripts/seed_from_pdf.py
"""

import os
import sys
from pathlib import Path

# Load environment variables from .env.local
from dotenv import load_dotenv
load_dotenv('.env.local')

import pdfplumber
import psycopg2
from psycopg2.extras import Json

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        database=os.getenv('POSTGRES_DB', 'mathtutor'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', '')
    )

# Chapter structure based on table of contents
CHAPTERS = [
    {
        'id': 'bab-1', 'num': 1, 'name': 'Penjabaran dan Pemfaktoran',
        'modules': [
            {'id': 'bab1-1', 'name': 'Menguraikan Bentuk Polinom', 'pages': (3, 13)},
            {'id': 'bab1-2', 'name': 'Memfaktorkan', 'pages': (14, 24)},
            {'id': 'bab1-3', 'name': 'Menggunakan Bentuk Aljabar', 'pages': (25, 33)},
        ]
    },
    {
        'id': 'bab-2', 'num': 2, 'name': 'Akar Kuadrat',
        'modules': [
            {'id': 'bab2-1', 'name': 'Bentuk Akar Kuadrat', 'pages': (37, 44)},
            {'id': 'bab2-2', 'name': 'Perhitungan Akar Kuadrat', 'pages': (44, 56)},
        ]
    },
    {
        'id': 'bab-3', 'num': 3, 'name': 'Persamaan Kuadrat',
        'modules': [
            {'id': 'bab3-1', 'name': 'Menyelesaikan Persamaan Kuadrat', 'pages': (62, 78)},
            {'id': 'bab3-2', 'name': 'Menggunakan Persamaan Kuadrat', 'pages': (79, 85)},
        ]
    },
    {
        'id': 'bab-4', 'num': 4, 'name': 'Fungsi y = ax²',
        'modules': [
            {'id': 'bab4-1', 'name': 'Fungsi y = ax²', 'pages': (89, 111)},
            {'id': 'bab4-2', 'name': 'Macam-Macam Fungsi', 'pages': (111, 118)},
        ]
    },
    {
        'id': 'bab-5', 'num': 5, 'name': 'Kesebangunan',
        'modules': [
            {'id': 'bab5-1', 'name': 'Kesebangunan', 'pages': (125, 138)},
            {'id': 'bab5-2', 'name': 'Garis-Garis Sejajar dan Kesebangunan', 'pages': (138, 150)},
            {'id': 'bab5-3', 'name': 'Kesebangunan dan Pengukuran', 'pages': (150, 160)},
        ]
    },
    {
        'id': 'bab-6', 'num': 6, 'name': 'Lingkaran',
        'modules': [
            {'id': 'bab6-1', 'name': 'Sudut Keliling dan Sudut Pusat', 'pages': (163, 173)},
            {'id': 'bab6-2', 'name': 'Penggunaan Teorema Sudut Keliling', 'pages': (173, 181)},
        ]
    },
    {
        'id': 'bab-7', 'num': 7, 'name': 'Teorema Pythagoras',
        'modules': [
            {'id': 'bab7-1', 'name': 'Teorema Pythagoras', 'pages': (185, 191)},
            {'id': 'bab7-2', 'name': 'Penggunaan Teorema Pythagoras', 'pages': (191, 206)},
        ]
    },
    {
        'id': 'bab-8', 'num': 8, 'name': 'Survei Sampel',
        'modules': [
            {'id': 'bab8-1', 'name': 'Survei Sampel', 'pages': (211, 222)},
        ]
    },
]

# Quiz questions for each module
QUIZZES = [
    {'module_id': 'bab1-1', 'question': 'Hasil dari (x + 2)(x + 3) adalah...', 'options': ['x² + 5x + 6', 'x² + 6x + 5', 'x² + 5x + 5', 'x² + 6x + 6'], 'correct': 0, 'explanation': '(x+2)(x+3) = x² + 3x + 2x + 6 = x² + 5x + 6'},
    {'module_id': 'bab1-1', 'question': 'Hasil dari (a + b)² adalah...', 'options': ['a² + 2ab + b²', 'a² + ab + b²', 'a² - 2ab + b²', 'a² + b²'], 'correct': 0, 'explanation': 'Rumus kuadrat: (a+b)² = a² + 2ab + b²'},
    {'module_id': 'bab1-2', 'question': 'Faktor dari x² + 7x + 12 adalah...', 'options': ['(x+3)(x+4)', '(x+2)(x+6)', '(x+1)(x+12)', '(x+6)(x+2)'], 'correct': 0, 'explanation': '3×4=12 dan 3+4=7, jadi faktornya (x+3)(x+4)'},
    {'module_id': 'bab1-2', 'question': 'Faktor dari x² - 9 adalah...', 'options': ['(x+3)(x-3)', '(x+9)(x-1)', '(x+3)(x+3)', '(x-3)(x-3)'], 'correct': 0, 'explanation': 'Selisih kuadrat: a²-b² = (a+b)(a-b)'},
    {'module_id': 'bab1-3', 'question': 'Jika x = 2, maka nilai dari x² + 3x + 2 adalah...', 'options': ['12', '10', '8', '14'], 'correct': 0, 'explanation': '2² + 3(2) + 2 = 4 + 6 + 2 = 12'},
    {'module_id': 'bab2-1', 'question': 'Nilai √144 adalah...', 'options': ['11', '12', '13', '14'], 'correct': 1, 'explanation': '12 × 12 = 144'},
    {'module_id': 'bab2-1', 'question': 'Bilangan kuadrat sempurna antara 50 dan 70 adalah...', 'options': ['64', '56', '68', '72'], 'correct': 0, 'explanation': '64 = 8², satu-satunya kuadrat sempurna antara 50-70'},
    {'module_id': 'bab2-2', 'question': 'Bentuk sederhana dari √50 adalah...', 'options': ['5√2', '2√5', '10√5', '25√2'], 'correct': 0, 'explanation': '√50 = √(25×2) = 5√2'},
    {'module_id': 'bab2-2', 'question': 'Hasil dari √8 × √2 adalah...', 'options': ['4', '8', '16', '2'], 'correct': 0, 'explanation': '√8 × √2 = √16 = 4'},
    {'module_id': 'bab3-1', 'question': 'Akar dari x² - 5x + 6 = 0 adalah...', 'options': ['x=2 dan x=3', 'x=-2 dan x=-3', 'x=1 dan x=6', 'x=-1 dan x=-6'], 'correct': 0, 'explanation': '(x-2)(x-3)=0, jadi x=2 atau x=3'},
    {'module_id': 'bab3-1', 'question': 'Bentuk umum persamaan kuadrat adalah...', 'options': ['ax² + bx + c = 0', 'ax + b = 0', 'ax³ + bx = 0', 'a + bx = c'], 'correct': 0, 'explanation': 'Persamaan kuadrat memiliki pangkat tertinggi 2'},
    {'module_id': 'bab3-2', 'question': 'Jika x² = 49, maka x adalah...', 'options': ['7', '-7', '±7', '49'], 'correct': 2, 'explanation': 'x bisa 7 atau -7'},
    {'module_id': 'bab4-1', 'question': 'Grafik y = x² membuka ke...', 'options': ['Atas', 'Bawah', 'Kiri', 'Kanan'], 'correct': 0, 'explanation': 'Koefisien a positif, parabola membuka ke atas'},
    {'module_id': 'bab4-1', 'question': 'Titik puncak y = x² terletak di...', 'options': ['(0,0)', '(1,1)', '(0,1)', '(1,0)'], 'correct': 0, 'explanation': 'Parabola y=x² memiliki puncak di titik asal'},
    {'module_id': 'bab4-2', 'question': 'Grafik y = -x² membuka ke...', 'options': ['Bawah', 'Atas', 'Kiri', 'Kanan'], 'correct': 0, 'explanation': 'Koefisien a negatif, parabola membuka ke bawah'},
    {'module_id': 'bab5-1', 'question': 'Dua segitiga sebangun jika...', 'options': ['Sudut-sudutnya sama besar', 'Sisi-sisinya sama panjang', 'Luasnya sama', 'Kelilingnya sama'], 'correct': 0, 'explanation': 'Kesebangunan ditentukan oleh kesamaan sudut'},
    {'module_id': 'bab5-2', 'question': 'Jika dua garis sejajar dipotong garis transversal, maka sudut sehadap...', 'options': ['Sama besar', 'Berbeda', 'Berjumlah 180°', 'Saling tegak lurus'], 'correct': 0, 'explanation': 'Sudut sehadap pada garis sejajar selalu sama besar'},
    {'module_id': 'bab5-3', 'question': 'Skala pada peta 1:10000 artinya...', 'options': ['1 cm = 100 m', '1 cm = 10 m', '1 cm = 1000 m', '1 cm = 1 km'], 'correct': 0, 'explanation': '1 cm di peta = 10000 cm = 100 m di lapangan'},
    {'module_id': 'bab6-1', 'question': 'Sudut keliling yang menghadap busur yang sama adalah...', 'options': ['Sama besar', 'Berbeda', 'Dua kali lipat', 'Setengahnya'], 'correct': 0, 'explanation': 'Sudut keliling menghadap busur sama selalu sama besar'},
    {'module_id': 'bab6-2', 'question': 'Sudut pusat adalah...sudut keliling yang menghadap busur sama', 'options': ['Dua kali', 'Setengah', 'Sama dengan', 'Tiga kali'], 'correct': 0, 'explanation': 'Sudut pusat = 2 × sudut keliling'},
    {'module_id': 'bab7-1', 'question': 'Jika a=3, b=4, maka c dalam teorema Pythagoras adalah...', 'options': ['5', '6', '7', '12'], 'correct': 0, 'explanation': 'c² = 3² + 4² = 9 + 16 = 25, c = 5'},
    {'module_id': 'bab7-1', 'question': 'Teorema Pythagoras berlaku untuk segitiga...', 'options': ['Siku-siku', 'Sama sisi', 'Sama kaki', 'Sembarang'], 'correct': 0, 'explanation': 'a² + b² = c² hanya berlaku untuk segitiga siku-siku'},
    {'module_id': 'bab7-2', 'question': 'Segitiga dengan sisi 5, 12, 13 adalah segitiga...', 'options': ['Siku-siku', 'Sama sisi', 'Sama kaki', 'Sembarang'], 'correct': 0, 'explanation': '5² + 12² = 25 + 144 = 169 = 13²'},
    {'module_id': 'bab7-2', 'question': 'Jarak antara titik (0,0) dan (3,4) adalah...', 'options': ['5', '7', '12', '25'], 'correct': 0, 'explanation': 'd = √(3² + 4²) = √25 = 5'},
    {'module_id': 'bab8-1', 'question': 'Survei sampel digunakan untuk...', 'options': ['Memprediksi populasi dari sampel', 'Menghitung semua data', 'Membuat grafik', 'Mengurutkan data'], 'correct': 0, 'explanation': 'Survei sampel memprediksi karakteristik populasi dari sampel'},
    {'module_id': 'bab8-1', 'question': 'Sampel yang baik harus...', 'options': ['Representatif', 'Besar', 'Kecil', 'Mudah diakses'], 'correct': 0, 'explanation': 'Sampel harus mewakili populasi dengan baik'},
]


def extract_text_from_pages(pdf, start_page: int, end_page: int) -> str:
    """Extract text from specified page range (1-indexed)"""
    text_parts = []
    
    # PDF page indexing is 0-based
    for page_num in range(start_page - 1, min(end_page, len(pdf.pages))):
        try:
            page = pdf.pages[page_num]
            text = page.extract_text() or ''
            text_parts.append(text)
        except Exception as e:
            print(f"  ⚠️ Error extracting page {page_num + 1}: {e}")
    
    content = '\n\n'.join(text_parts)
    
    # Clean up content
    content = ' '.join(content.split())  # Normalize whitespace
    
    # Limit length for database
    if len(content) > 5000:
        content = content[:5000] + '...'
    
    return content


def seed_database(pdf_path: str):
    """Extract content from PDF and seed database"""
    
    print(f"📖 Opening PDF: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"📄 Total pages: {len(pdf.pages)}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        print("\n🧹 Clearing existing data...")
        cur.execute("DELETE FROM quiz_questions")
        cur.execute("DELETE FROM math_content")
        conn.commit()
        
        content_count = 0
        
        for chapter in CHAPTERS:
            print(f"\n📚 BAB {chapter['num']}: {chapter['name']}")
            
            for module in chapter['modules']:
                start_page, end_page = module['pages']
                
                print(f"  📄 Extracting pages {start_page}-{end_page}...", end=' ')
                content = extract_text_from_pages(pdf, start_page, end_page)
                
                if len(content) < 100:
                    content = f"Materi {module['name']} dari BAB {chapter['num']}: {chapter['name']}. Silakan pelajari konsep-konsep penting dalam bagian ini."
                
                cur.execute("""
                    INSERT INTO math_content 
                    (topic_id, module_id, chapter, section, title, content, difficulty_level, is_scaffolding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    chapter['id'],
                    module['id'],
                    f"BAB {chapter['num']}: {chapter['name']}",
                    module['name'],
                    module['name'],
                    content,
                    1,
                    False
                ))
                
                content_count += 1
                print(f"✅ {len(content)} chars")
        
        conn.commit()
        
        # Insert quiz questions
        print("\n📝 Inserting quiz questions...")
        for quiz in QUIZZES:
            cur.execute("""
                INSERT INTO quiz_questions 
                (module_id, question, options, correct_answer, explanation, difficulty_level)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                quiz['module_id'],
                quiz['question'],
                Json(quiz['options']),
                quiz['correct'],
                quiz['explanation'],
                1
            ))
        
        conn.commit()
        
        print(f"\n✅ Seeded:")
        print(f"   📖 {content_count} content items from PDF")
        print(f"   📝 {len(QUIZZES)} quiz questions")
        
        cur.close()
        conn.close()
        
        print("\n🎉 Done!")


def main():
    # Find PDF file
    pdf_path = Path(__file__).parent.parent / 'rag_content' / '2024_Matematika_KLS_IX.pdf'
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        sys.exit(1)
    
    seed_database(str(pdf_path))


if __name__ == '__main__':
    main()
