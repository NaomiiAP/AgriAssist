from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging

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

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables")
else:
    logger.info("GOOGLE_API_KEY loaded successfully")
    genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the Gemini model
model = genai.GenerativeModel('gemini-2.0-flash')

# System prompt for agricultural context
SYSTEM_PROMPT = """You are AgriAssist, an AI assistant specialized in agriculture. 
You provide helpful information about farming, crop management, weather impacts, 
and agricultural best practices. Keep your responses concise, practical, and focused 
on agricultural topics. If the question is not related to agriculture, politely redirect 
the conversation back to agricultural topics.

Use markdown formatting in your responses:
- Use **bold** for important terms and key points
- Use *italic* for emphasis
- Use lists (both ordered and unordered) for steps and recommendations
- Use `code` formatting for technical terms
- Use proper spacing between paragraphs

Example format:
**Important:** Key point here
*Note:* Additional information

1. First step
2. Second step
3. Third step

- Bullet point
- Another point
- Final point"""

# System prompt for pest advice
PEST_PROMPT = """You are an expert agricultural pest control advisor. Provide detailed, practical advice for managing pests in crops.
Focus on organic and sustainable solutions when possible. Format your response with the following sections using markdown:

**Immediate Control Measures:**
- List immediate actions to control the pest
- Focus on organic solutions first
- Include both chemical and non-chemical options

**Preventive Strategies:**
- Long-term prevention methods
- Cultural practices
- Environmental modifications

**Treatment Schedule:**
- Timing of applications
- Frequency of treatments
- Duration of control measures

**Safety Precautions:**
- Personal protective equipment
- Environmental considerations
- Safe handling practices

Use markdown formatting:
- Use **bold** for important terms
- Use *italic* for emphasis
- Use bullet points for lists
- Keep each section clear and actionable."""

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
        logger.info(f"Processing message: {user_message}")
        
        # Prepare the chat
        chat = model.start_chat(history=[])
        
        # Send system prompt first
        chat.send_message(SYSTEM_PROMPT)
        
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
