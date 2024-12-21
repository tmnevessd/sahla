from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import google.generativeai as genai
import PIL.Image
import pytesseract

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/analyze')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'مافيه تا صورة'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'ماخترتي تا صورة'}), 400
    
    if file:
        filename = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filename)
        
        try:
            result = analyze_product_image(filename)
            return jsonify({'result': result})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if os.path.exists(filename):
                os.remove(filename)

def analyze_product_image(image_path):
    try:
        # Configure API
        genai.configure(api_key="AIzaSyAR5_ih5x8gpB2zI5XX59ETCPKsmX9FXSw")
        
        # Create model instance
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Load image
        image = PIL.Image.open(image_path)
        
        # First check if it's a valid product
        check_prompt = """
        Analyze this image and return ONLY ONE of these responses:
        - Return "VALID_PRODUCT" if the image shows:
          * Cosmetics (creams, soaps, shampoo)
          * Electronics
          * Packaged foods
          * Household items
          * Medicine or supplements
          * Beauty products
          * Cleaning products
        
        - Return "NOT_PRODUCT" if the image shows:
          * People/faces
          * Animals
          * Vehicles
          * Landscapes
          * Buildings
          * Screenshots
          * Raw food/meat
          * Any other non-product items
        
        IMPORTANT: Return ONLY "VALID_PRODUCT" or "NOT_PRODUCT" - no other text.
        """
        
        check_response = model.generate_content([check_prompt, image])
        if "NOT_PRODUCT" in check_response.text:
            error_message = """
            ❌ معذرة! 
            
            ℹ️ هاد التطبيق كيقبل غير المنتجات بحال:
            🧴 كريمات
            🧼 صابون
            🧪 مواد التنظيف
            💊 أدوية
            📱 إلكترونيات
            🏠 أدوات المنزل
            
            ⚠️ ما نقدروش نحللو:
            👤 صور الناس
            🐱 الحيوانات
            🚗 السيارات
            🏞️ المناظر الطبيعية
            🥩 اللحوم
            🏢 المباني
            
            🔄 عافاك جرب تصور منتوج آخر
            """
            return format_response(error_message)
        
        # Continue with product analysis if check passes
        extracted_text = pytesseract.image_to_string(image, lang='eng')
        dynamic_element = extracted_text if extracted_text else "معلومات جديدة"
        
        prompt = f"""
        3tini t7lil kamil 3la had lmontoj b darija mafhoma:

        🏷 الشركة المصنعة:
           chkon li san3 had lmontoj? 3tini smiyat charika o/ola l3alama tijaria dyalo.

        🏷️ المنتوج:
           {dynamic_element}

        💰 الثمن:
           3tini taman t9ribi dial had lmontoj b darija. 
           Matalan: "had lmontoj kayt9am bin 50 l 150 dh"

        📝 الاستعمال:
           kifach kanst3mlo had lmontoj? 3tini tari9a sahla o mafhoma.

        🗄️ التخزين:
           fin khassni n7tafed b had lmontoj? o chno lmodat li ymkan liya n7tafed bih?

        💡 نصائح:
           3tini chi nsa2i7 mohima 3la had lmontoj.

        Kteb b darija maghribiya mafhoma o sahla. 
        Zid emojis m3a kol point bach tkoun mafhoma akthar.
        7awel tfham ga3 nas bach y9raw had chi.
        3tini kola ma3loma b tari9a wadha o mratba.
        """
        
        response = model.generate_content([prompt, image])
        return format_response(response.text)
    except Exception as e:
        return format_response(f"⚠️ L9ina mochkil: {str(e)}")

def format_response(text):
    sections = text.split('\n')
    formatted_response = "<div class='analysis-result'>"
    
    current_section = None
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        if any(emoji in section for emoji in ['🏷', '💰', '📝', '🗄️', '💡']):
            if current_section:
                formatted_response += "</div>"
            current_section = section
            cleaned_header = section.replace('*', '').strip()
            formatted_response += f"""
                <div class='result-section'>
                    <h3 class='section-header'>{cleaned_header}</h3>
            """
        elif section.startswith('•') or section.startswith('*'):
            cleaned_section = section.replace('*', '').replace('•', '').strip()
            if cleaned_section:
                formatted_response += f"<div class='section-point'>• {cleaned_section}</div>"
        elif section:
            cleaned_section = section.replace('*', '').strip()
            if cleaned_section:
                formatted_response += f"<div class='section-content'>{cleaned_section}</div>"
    
    if current_section:
        formatted_response += "</div>"
    
    formatted_response += "</div>"
    return formatted_response

if __name__ == '__main__':
    app.run(debug=True)
