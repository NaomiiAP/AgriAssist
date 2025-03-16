from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Basic configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

# In-memory storage for marketplace items (replace with database in production)
marketplace_items: Dict[int, dict] = {}
next_item_id = 1

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables")
else:
    logger.info("GOOGLE_API_KEY loaded successfully")
    genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the Gemini model
model = genai.GenerativeModel('gemini-2.0-flash')

# System prompts for different languages
SYSTEM_PROMPTS = {
    'en': """You are AgriAssist, an AI assistant specialized in agriculture. 
You provide helpful information about farming, crop management, weather impacts, 
and agricultural best practices. Keep your responses concise, practical, and focused 
on agricultural topics. If the question is not related to agriculture, politely redirect 
the conversation back to agricultural topics.

Use markdown formatting in your responses:
- Use **bold** for important terms and key points
- Use *italic* for emphasis
- Use lists (both ordered and unordered) for steps and recommendations
- Use proper spacing between paragraphs""",

    'hi': """मैं AgriAssist हूं, कृषि में विशेषज्ञ एक AI सहायक।
मैं खेती, फसल प्रबंधन, मौसम प्रभाव और कृषि सर्वोत्तम प्रथाओं के बारे में जानकारी प्रदान करता हूं।
मेरे जवाब संक्षिप्त, व्यावहारिक और कृषि विषयों पर केंद्रित होंगे।

अपने उत्तरों में मैं इस तरह का प्रारूप उपयोग करूंगा:
- **बोल्ड** महत्वपूर्ण शब्दों के लिए
- *इटैलिक* जोर देने के लिए
- क्रमबद्ध और अक्रमबद्ध सूचियों का उपयोग
- पैराग्राफ के बीच उचित स्पेसिंग""",

    'bn': """আমি AgriAssist, কৃষি বিশেষজ্ঞ AI সহকারী।
আমি কৃষি, ফসল পরিচালনা, আবহাওয়ার প্রভাব এবং কৃষি সর্বোত্তম অনুশীলন সম্পর্কে তথ্য প্রদান করি।
আমার উত্তরগুলি সংক্ষিপ্ত, ব্যবহারিক এবং কৃষি বিষয়ে কেন্দ্রীভূত হবে।

আমার উত্তরে আমি এই ফরম্যাট ব্যবহার করব:
- **বোল্ড** গুরুত্বপূর্ণ শব্দের জন্য
- *ইটালিক* জোর দেওয়ার জন্য
- ক্রমানুসারে এবং ক্রমবিহীন তালিকা ব্যবহার
- অনুচ্ছেদের মধ্যে উপযুক্ত স্পেসিং"""
}

# System prompt for pest advice
PEST_PROMPT = """You are an expert agricultural pest control advisor. Provide concise, practical advice for managing pests in crops.
Focus on organic and sustainable solutions when possible. Format your response with the following sections using markdown:

**Immediate Control Measures:**
- List 3-4 key actions to control the pest
- Focus on organic solutions first

**Preventive Strategies:**
- List 3-4 essential prevention methods
- Focus on practical, easy-to-implement solutions

**Treatment Schedule:**
- Key timing points
- Frequency of applications
- Duration

**Safety Precautions:**
- Essential safety measures
- Key environmental considerations

Keep each section brief and actionable. Use bullet points for clarity."""

# System prompt for yield predictions
YIELD_PROMPT = """You are an agricultural yield prediction expert. Provide concise, single-line predictions for crop yields, harvest timing, and market prices.

Format your response with exactly these three lines:

Expected Yield: [Number] tons/hectare
Best Harvest Time: [Month/Season]
Estimated Market Price: ₹[Price]/ton

Keep each line simple and direct. Do not include any additional text or explanations."""


@app.route('/')
def home():
    logger.info("Home endpoint accessed")
    return jsonify({
        "message": "Welcome to AgriAssist API",
        "status": "running"
    })

@app.route('/health')
def health_check():
    logger.info("Health check endpoint accessed")
    return jsonify({
        "status": "healthy",
        "service": "AgriAssist API"
    })

@app.route('/chat', methods=['POST'])
def chat():
    try:
        logger.info("Chat endpoint accessed")
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        if not data or 'message' not in data:
            logger.warning("No message in request data")
            return jsonify({
                "error": "Bad Request",
                "message": "Message is required"
            }), 400

        user_message = data['message']
        language = data.get('language', 'en')  # Default to English if no language specified
        
        logger.info(f"Processing message in {language}: {user_message}")
        
        # Prepare the chat
        chat = model.start_chat(history=[])
        
        # Send system prompt in selected language
        system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS['en'])
        chat.send_message(system_prompt)
        
        # Add language instruction to the message
        if language != 'en':
            user_message = f"Respond in {language} language: {user_message}"
        
        # Get response from Gemini
        response = chat.send_message(user_message)
        logger.info("Successfully got response from Gemini")
        
        return jsonify({
            "response": response.text,
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/pest-advice', methods=['POST'])
def pest_advice():
    try:
        logger.info("Pest advice endpoint accessed")
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        if not data or not all(k in data for k in ['crop', 'pest', 'severity']):
            logger.warning("Missing required fields in request data")
            return jsonify({
                "error": "Bad Request",
                "message": "Crop, pest, and severity are required"
            }), 400

        crop = data['crop']
        pest = data['pest']
        severity = data['severity']
        
        prompt = f"""Provide pest control advice for:
- Crop: {crop}
- Pest: {pest}
- Severity: {severity}

Include:
1. Immediate control measures
2. Preventive strategies
3. Treatment schedule
4. Safety precautions

Focus on organic solutions when possible."""

        # Prepare the chat
        chat = model.start_chat(history=[])
        
        # Send system prompt first
        chat.send_message(PEST_PROMPT)
        
        # Get response from Gemini
        response = chat.send_message(prompt)
        logger.info("Successfully got response from Gemini")
        
        return jsonify({
            "response": response.text,
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Error in pest advice endpoint: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/yield-predict', methods=['POST'])
def yield_predict():
    try:
        logger.info("Yield prediction endpoint accessed")
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        if not data or not all(k in data for k in ['crop', 'area', 'season']):
            logger.warning("Missing required fields in request data")
            return jsonify({
                "error": "Bad Request",
                "message": "Crop type, area, and season are required"
            }), 400

        crop = data['crop']
        area = data['area']
        season = data['season']
        
        # Create a more specific prompt for each crop
        prompt = f"""Analyze and predict yield for {crop} crop:
- Area: {area} hectares
- Growing Season: {season}

Provide predictions in exactly this format:
Expected Yield: [Number] tons/hectare
Best Harvest Time: [Month/Season]
Estimated Market Price: ₹[Price]/ton

Keep predictions realistic and specific to {crop} cultivation."""

        # Prepare the chat
        chat = model.start_chat(history=[])
        
        # Send system prompt first
        chat.send_message(YIELD_PROMPT)
        
        # Get response from Gemini
        response = chat.send_message(prompt)
        logger.info("Successfully got response from Gemini")
        
        return jsonify({
            "response": response.text,
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Error in yield prediction endpoint: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/analyze-crop', methods=['POST'])
def analyze_crop():
    try:
        logger.info("Crop analysis endpoint accessed")
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        if not data or 'image' not in data:
            logger.warning("No image data in request")
            return jsonify({
                "error": "Bad Request",
                "message": "Image data is required"
            }), 400

        # Prepare the chat
        chat = model.start_chat(history=[])
        
        # Send system prompt first
        chat.send_message(DISEASE_PROMPT)
        
        # Get response from Gemini
        response = chat.send_message(data['image'])
        logger.info("Successfully got response from Gemini")
        
        # Parse the response into structured data
        response_text = response.text
        disease = response_text.split('Disease:')[1].split('\n')[0].strip() if 'Disease:' in response_text else "Unknown"
        confidence = response_text.split('Confidence:')[1].split('\n')[0].strip() if 'Confidence:' in response_text else "N/A"
        treatment = response_text.split('Treatment:')[1].split('Prevention:')[0].strip() if 'Treatment:' in response_text else "No treatment information available"
        prevention = response_text.split('Prevention:')[1].strip() if 'Prevention:' in response_text else "No prevention information available"
        
        return jsonify({
            "disease": disease,
            "confidence": confidence,
            "treatment": treatment,
            "prevention": prevention,
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Error in crop analysis endpoint: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/test-api-key', methods=['GET'])
def test_api_key():
    try:
        logger.info("Testing API key...")
        
        # Try to initialize a chat with Gemini
        chat = model.start_chat(history=[])
        
        # Send a simple test message
        response = chat.send_message("Hello, this is a test message.")
        
        return jsonify({
            "status": "success",
            "message": "API key is valid and working",
            "test_response": response.text
        })
    except Exception as e:
        logger.error(f"API key test failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"API key test failed: {str(e)}"
        }), 500

@app.route('/marketplace/items', methods=['GET'])
def get_marketplace_items():
    try:
        logger.info("Fetching marketplace items")
        items = list(marketplace_items.values())
        return jsonify({
            "status": "success",
            "items": items
        })
    except Exception as e:
        logger.error(f"Error fetching marketplace items: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/marketplace/items', methods=['POST'])
def add_marketplace_item():
    try:
        logger.info("Adding new marketplace item")
        data = request.get_json()
        
        if not data or not all(k in data for k in ['name', 'price', 'category', 'seller']):
            return jsonify({
                "error": "Bad Request",
                "message": "Missing required fields"
            }), 400

        global next_item_id
        new_item = {
            "id": next_item_id,
            "name": data['name'],
            "description": data.get('description', ''),
            "price": float(data['price']),
            "category": data['category'],
            "seller": data['seller'],
            "created_at": "2024-03-20"  # In production, use actual timestamp
        }
        
        marketplace_items[next_item_id] = new_item
        next_item_id += 1
        
        logger.info(f"Successfully added item with ID: {new_item['id']}")
        return jsonify({
            "status": "success",
            "item": new_item
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding marketplace item: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/marketplace/items/<int:item_id>', methods=['PUT'])
def update_marketplace_item(item_id: int):
    try:
        logger.info(f"Updating marketplace item with ID: {item_id}")
        data = request.get_json()
        
        if item_id not in marketplace_items:
            return jsonify({
                "error": "Not Found",
                "message": f"Item with ID {item_id} not found"
            }), 404
            
        if not data or not all(k in data for k in ['name', 'price', 'category', 'seller']):
            return jsonify({
                "error": "Bad Request",
                "message": "Missing required fields"
            }), 400

        updated_item = {
            "id": item_id,
            "name": data['name'],
            "description": data.get('description', marketplace_items[item_id]['description']),
            "price": float(data['price']),
            "category": data['category'],
            "seller": data['seller'],
            "created_at": marketplace_items[item_id]['created_at']
        }
        
        marketplace_items[item_id] = updated_item
        
        logger.info(f"Successfully updated item with ID: {item_id}")
        return jsonify({
            "status": "success",
            "item": updated_item
        })
        
    except Exception as e:
        logger.error(f"Error updating marketplace item: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.route('/marketplace/items/<int:item_id>', methods=['DELETE'])
def delete_marketplace_item(item_id: int):
    try:
        logger.info(f"Deleting marketplace item with ID: {item_id}")
        
        if item_id not in marketplace_items:
            return jsonify({
                "error": "Not Found",
                "message": f"Item with ID {item_id} not found"
            }), 404
            
        del marketplace_items[item_id]
        
        logger.info(f"Successfully deleted item with ID: {item_id}")
        return jsonify({
            "status": "success",
            "message": f"Item with ID {item_id} deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting marketplace item: {str(e)}")
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    logger.warning(f"404 error: {error}")
    return jsonify({
        "error": "Not Found",
        "message": "The requested resource was not found on the server"
    }), 404

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"500 error: {error}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error has occurred"
    }), 500

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(debug=True, host='0.0.0.0', port=5000)
