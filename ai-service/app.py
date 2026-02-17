#!/usr/bin/env python3
"""
AI Quality Assessment Service for Agricultural Platform
Analyzes product images and provides quality scores, defect detection, and price recommendations
"""

import os
import json
import time
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import logging

import numpy as np
import cv2
from PIL import Image, ImageEnhance
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
from werkzeug.utils import secure_filename
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
class Config:
    MODEL_PATH = os.getenv('MODEL_PATH', '/app/models')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    MAX_IMAGE_SIZE = 2048
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.webp'}
    QUALITY_THRESHOLDS = {
        'A': 85,
        'B': 70,
        'C': 55,
        'D': 40
    }

@dataclass
class DefectInfo:
    type: str
    severity: float  # 0-1
    location: Optional[Dict[str, int]] = None  # bounding box
    confidence: float = 0.0

@dataclass
class QualityAssessment:
    quality_score: float  # 0-100
    grade: str  # A, B, C, D
    defects: List[DefectInfo]
    recommendations: List[str]
    price_adjustment_percentage: float  # -50 to +20
    confidence_score: float  # 0-100
    processing_time: float
    model_version: str
    timestamp: str

class ImageProcessor:
    """Handles image preprocessing and enhancement"""
    
    def __init__(self):
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def load_and_preprocess(self, image_path: str) -> torch.Tensor:
        """Load and preprocess image for model inference"""
        try:
            # Load image
            image = Image.open(image_path).convert('RGB')
            
            # Resize if too large
            if max(image.size) > Config.MAX_IMAGE_SIZE:
                ratio = Config.MAX_IMAGE_SIZE / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Apply transforms
            tensor = self.transform(image)
            return tensor.unsqueeze(0)  # Add batch dimension
            
        except Exception as e:
            logger.error(f"Error preprocessing image {image_path}: {e}")
            raise
    
    def enhance_image(self, image_path: str) -> Image.Image:
        """Enhance image quality for better analysis"""
        image = Image.open(image_path).convert('RGB')
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        return image
    
    def detect_color_analysis(self, image_path: str) -> Dict[str, Any]:
        """Analyze color distribution for freshness assessment"""
        image = cv2.imread(image_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Calculate color statistics
        mean_hue = np.mean(hsv[:, :, 0])
        mean_saturation = np.mean(hsv[:, :, 1])
        mean_value = np.mean(hsv[:, :, 2])
        
        # Detect brown/dark spots (potential defects)
        brown_mask = cv2.inRange(hsv, (10, 50, 20), (20, 255, 200))
        brown_percentage = (np.sum(brown_mask > 0) / brown_mask.size) * 100
        
        return {
            'mean_hue': float(mean_hue),
            'mean_saturation': float(mean_saturation),
            'mean_value': float(mean_value),
            'brown_spot_percentage': float(brown_percentage)
        }

class QualityModel:
    """AI model for quality assessment"""
    
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.version = "1.0.0"
        self.load_model()
    
    def load_model(self):
        """Load pre-trained model"""
        try:
            # Use ResNet50 as base model (in production, load custom trained model)
            self.model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
            self.model.eval()
            self.model.to(self.device)
            logger.info(f"Model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def predict_quality(self, image_tensor: torch.Tensor, color_analysis: Dict) -> Dict[str, Any]:
        """Predict quality score and defects"""
        try:
            with torch.no_grad():
                image_tensor = image_tensor.to(self.device)
                features = self.model(image_tensor)
                
                # Simulate quality prediction (replace with actual model inference)
                base_score = min(95, max(30, 80 + np.random.normal(0, 10)))
                
                # Adjust based on color analysis
                if color_analysis['brown_spot_percentage'] > 5:
                    base_score -= color_analysis['brown_spot_percentage'] * 2
                
                if color_analysis['mean_saturation'] < 50:
                    base_score -= 10  # Low saturation indicates poor quality
                
                # Ensure score is within bounds
                quality_score = max(0, min(100, base_score))
                
                # Determine grade
                grade = 'D'
                for g, threshold in Config.QUALITY_THRESHOLDS.items():
                    if quality_score >= threshold:
                        grade = g
                        break
                
                # Generate defects based on analysis
                defects = self._generate_defects(color_analysis, quality_score)
                
                # Calculate confidence
                confidence = min(95, max(60, 85 + np.random.normal(0, 5)))
                
                return {
                    'quality_score': float(quality_score),
                    'grade': grade,
                    'defects': defects,
                    'confidence': float(confidence)
                }
                
        except Exception as e:
            logger.error(f"Error in quality prediction: {e}")
            raise
    
    def _generate_defects(self, color_analysis: Dict, quality_score: float) -> List[DefectInfo]:
        """Generate defect information based on analysis"""
        defects = []
        
        # Brown spots detection
        if color_analysis['brown_spot_percentage'] > 2:
            defects.append(DefectInfo(
                type="brown_spots",
                severity=min(1.0, color_analysis['brown_spot_percentage'] / 10),
                confidence=0.8
            ))
        
        # Discoloration
        if color_analysis['mean_saturation'] < 40:
            defects.append(DefectInfo(
                type="discoloration",
                severity=0.6,
                confidence=0.7
            ))
        
        # Poor lighting/quality
        if color_analysis['mean_value'] < 50:
            defects.append(DefectInfo(
                type="poor_lighting",
                severity=0.4,
                confidence=0.6
            ))
        
        return defects

class RecommendationEngine:
    """Generate recommendations based on quality assessment"""
    
    @staticmethod
    def generate_recommendations(assessment_data: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        quality_score = assessment_data['quality_score']
        defects = assessment_data['defects']
        
        # General quality recommendations
        if quality_score >= 85:
            recommendations.append("Excellent quality! Perfect for premium markets.")
            recommendations.append("Consider direct-to-consumer sales for maximum profit.")
        elif quality_score >= 70:
            recommendations.append("Good quality suitable for retail markets.")
            recommendations.append("Proper storage will maintain quality.")
        elif quality_score >= 55:
            recommendations.append("Moderate quality - suitable for processing.")
            recommendations.append("Quick sale recommended to prevent further deterioration.")
        else:
            recommendations.append("Lower quality - consider processing or discount pricing.")
            recommendations.append("Immediate action needed to prevent total loss.")
        
        # Defect-specific recommendations
        defect_types = [d.type for d in defects]
        
        if "brown_spots" in defect_types:
            recommendations.append("Remove affected portions before sale.")
            recommendations.append("Store in cool, dry conditions to prevent spread.")
        
        if "discoloration" in defect_types:
            recommendations.append("Grade as Class II - suitable for processing.")
            recommendations.append("Consider value-added processing options.")
        
        if "poor_lighting" in defect_types:
            recommendations.append("Retake photos in better lighting conditions.")
            recommendations.append("Ensure proper display lighting for buyers.")
        
        return recommendations
    
    @staticmethod
    def calculate_price_adjustment(quality_score: float, defects: List[DefectInfo]) -> float:
        """Calculate recommended price adjustment percentage"""
        base_adjustment = 0.0
        
        # Base adjustment based on quality score
        if quality_score >= 90:
            base_adjustment = 10.0  # Premium pricing
        elif quality_score >= 80:
            base_adjustment = 5.0   # Slight premium
        elif quality_score >= 70:
            base_adjustment = 0.0   # Market price
        elif quality_score >= 60:
            base_adjustment = -10.0 # Discount
        elif quality_score >= 50:
            base_adjustment = -20.0 # Significant discount
        else:
            base_adjustment = -30.0 # Heavy discount
        
        # Additional adjustments for defects
        for defect in defects:
            if defect.severity > 0.7:
                base_adjustment -= 10.0
            elif defect.severity > 0.4:
                base_adjustment -= 5.0
        
        # Ensure within reasonable bounds
        return max(-50.0, min(20.0, base_adjustment))

# Flask application
app = Flask(__name__)
CORS(app)

# Initialize components
image_processor = ImageProcessor()
quality_model = QualityModel()
recommendation_engine = RecommendationEngine()

# Redis connection
try:
    redis_client = redis.from_url(Config.REDIS_URL)
    redis_client.ping()
    logger.info("Connected to Redis")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}")
    redis_client = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': quality_model.version,
        'gpu_available': torch.cuda.is_available()
    })

@app.route('/analyze', methods=['POST'])
def analyze_quality():
    """Main quality analysis endpoint"""
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    try:
        # Validate request
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        
        files = request.files.getlist('images')
        if len(files) == 0:
            return jsonify({'error': 'No images provided'}), 400
        
        # Get product metadata
        product_type = request.form.get('product_type', 'unknown')
        product_category = request.form.get('product_category', 'unknown')
        
        logger.info(f"Processing request {request_id} for {product_type}")
        
        results = []
        
        for i, file in enumerate(files):
            if file.filename == '':
                continue
            
            # Validate file
            filename = secure_filename(file.filename)
            file_ext = os.path.splitext(filename)[1].lower()
            
            if file_ext not in Config.SUPPORTED_FORMATS:
                return jsonify({'error': f'Unsupported file format: {file_ext}'}), 400
            
            # Save temporary file
            temp_path = f'/tmp/{request_id}_{i}_{filename}'
            file.save(temp_path)
            
            try:
                # Process image
                image_tensor = image_processor.load_and_preprocess(temp_path)
                color_analysis = image_processor.detect_color_analysis(temp_path)
                
                # Run AI analysis
                prediction = quality_model.predict_quality(image_tensor, color_analysis)
                
                # Generate recommendations
                recommendations = recommendation_engine.generate_recommendations(prediction)
                price_adjustment = recommendation_engine.calculate_price_adjustment(
                    prediction['quality_score'], prediction['defects']
                )
                
                # Create assessment
                assessment = QualityAssessment(
                    quality_score=prediction['quality_score'],
                    grade=prediction['grade'],
                    defects=prediction['defects'],
                    recommendations=recommendations,
                    price_adjustment_percentage=price_adjustment,
                    confidence_score=prediction['confidence'],
                    processing_time=time.time() - start_time,
                    model_version=quality_model.version,
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
                
                results.append(asdict(assessment))
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        # Cache results if Redis is available
        if redis_client:
            try:
                cache_key = f"analysis:{request_id}"
                redis_client.setex(cache_key, 3600, json.dumps(results))  # 1 hour TTL
            except Exception as e:
                logger.warning(f"Failed to cache results: {e}")
        
        total_time = time.time() - start_time
        
        return jsonify({
            'request_id': request_id,
            'results': results,
            'processing_time': total_time,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing request {request_id}: {e}")
        return jsonify({
            'error': 'Internal processing error',
            'request_id': request_id
        }), 500

@app.route('/analyze/<request_id>', methods=['GET'])
def get_analysis_result(request_id: str):
    """Get cached analysis result"""
    if not redis_client:
        return jsonify({'error': 'Cache not available'}), 503
    
    try:
        cache_key = f"analysis:{request_id}"
        cached_result = redis_client.get(cache_key)
        
        if cached_result:
            return jsonify({
                'request_id': request_id,
                'results': json.loads(cached_result),
                'cached': True
            })
        else:
            return jsonify({'error': 'Result not found or expired'}), 404
            
    except Exception as e:
        logger.error(f"Error retrieving cached result: {e}")
        return jsonify({'error': 'Cache retrieval error'}), 500

@app.route('/models/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'version': quality_model.version,
        'device': str(quality_model.device),
        'supported_formats': list(Config.SUPPORTED_FORMATS),
        'quality_thresholds': Config.QUALITY_THRESHOLDS,
        'max_image_size': Config.MAX_IMAGE_SIZE
    })

if __name__ == '__main__':
    logger.info("Starting AI Quality Assessment Service")
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_ENV') == 'development')
