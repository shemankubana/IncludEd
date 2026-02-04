from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import numpy as np
import pickle
import json
from datetime import datetime
from stable_baselines3 import PPO
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="IncludEd RL API",
    description="Adaptive Learning Platform - ML Inference Service",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model storage
MODEL = None
SCALER = None
MODEL_METADATA = None

# Action mapping
ACTION_MAP = {
    0: {
        "name": "maintain",
        "description": "Continue with current settings",
        "ui_changes": []
    },
    1: {
        "name": "increase_text_size",
        "description": "Increase font size and line spacing for dyslexia support",
        "ui_changes": [
            {"type": "font_size", "value": 20},
            {"type": "line_height", "value": 2.0},
            {"type": "letter_spacing", "value": "0.12em"}
        ]
    },
    2: {
        "name": "activate_tts",
        "description": "Enable text-to-speech for reading assistance",
        "ui_changes": [
            {"type": "tts_enabled", "value": True},
            {"type": "highlight_current_word", "value": True}
        ]
    },
    3: {
        "name": "insert_break",
        "description": "Suggest 2-minute attention break for ADHD management",
        "ui_changes": [
            {"type": "show_break_modal", "value": True},
            {"type": "break_duration", "value": 120}
        ]
    },
    4: {
        "name": "adjust_difficulty",
        "description": "Adapt content difficulty based on performance",
        "ui_changes": [
            {"type": "difficulty_adjustment", "value": "adaptive"},
            {"type": "show_difficulty_feedback", "value": True}
        ]
    }
}


# Pydantic models for API requests/responses
class StudentState(BaseModel):
    """8-dimensional state vector from frontend telemetry"""
    reading_speed: float = Field(..., description="Words per minute", ge=0)
    mouse_dwell_time: float = Field(..., description="Average hover time in ms", ge=0)
    scroll_hesitation: float = Field(..., description="Pause frequency per page", ge=0)
    backtrack_frequency: float = Field(..., description="Re-reading instances", ge=0)
    attention_score: float = Field(..., description="0-100 attention metric", ge=0, le=100)
    current_difficulty: int = Field(..., description="Content difficulty level 1-5", ge=1, le=5)
    time_on_task: float = Field(..., description="Minutes on current content", ge=0)
    comprehension_score: float = Field(..., description="Last quiz score 0-100", ge=0, le=100)
    
    class Config:
        schema_extra = {
            "example": {
                "reading_speed": 75.5,
                "mouse_dwell_time": 850.2,
                "scroll_hesitation": 12.3,
                "backtrack_frequency": 18.7,
                "attention_score": 62.5,
                "current_difficulty": 3,
                "time_on_task": 8.2,
                "comprehension_score": 58.3
            }
        }


class PredictionRequest(BaseModel):
    student_id: str
    session_id: str
    state: StudentState
    disability_type: Optional[str] = "unknown"


class PredictionResponse(BaseModel):
    student_id: str
    session_id: str
    timestamp: str
    predicted_action: int
    action_name: str
    action_description: str
    ui_changes: List[Dict]
    confidence: float
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str]
    timestamp: str


@app.on_event("startup")
async def load_model():
    """Load trained RL model and feature scaler on startup"""
    global MODEL, SCALER, MODEL_METADATA
    
    try:
        # Load PPO model
        MODEL = PPO.load("../models/ppo_adaptive_learning")
        print("✅ PPO model loaded successfully")
        
        # Load feature scaler
        with open("../models/feature_scaler.pkl", "rb") as f:
            SCALER = pickle.load(f)
        print("✅ Feature scaler loaded successfully")
        
        # Load model metadata
        with open("../models/model_metadata.json", "r") as f:
            MODEL_METADATA = json.load(f)
        print("✅ Model metadata loaded successfully")
        
        print(f"🚀 IncludEd API ready - Model version: {MODEL_METADATA['version']}")
        
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        raise


@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if MODEL is not None else "model_not_loaded",
        model_loaded=MODEL is not None,
        model_version=MODEL_METADATA.get('version') if MODEL_METADATA else None,
        timestamp=datetime.now().isoformat()
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check with model status"""
    return HealthResponse(
        status="healthy" if MODEL is not None else "model_not_loaded",
        model_loaded=MODEL is not None,
        model_version=MODEL_METADATA.get('version') if MODEL_METADATA else None,
        timestamp=datetime.now().isoformat()
    )


@app.get("/model/info")
async def model_info():
    """Get detailed model information"""
    if MODEL_METADATA is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return MODEL_METADATA


@app.post("/predict", response_model=PredictionResponse)
async def predict_action(request: PredictionRequest):
    """
    Main inference endpoint: Predict optimal learning intervention
    
    Takes current student state and returns recommended action with UI changes
    """
    if MODEL is None or SCALER is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Extract state features
        state_vector = np.array([
            request.state.reading_speed,
            request.state.mouse_dwell_time,
            request.state.scroll_hesitation,
            request.state.backtrack_frequency,
            request.state.attention_score,
            request.state.current_difficulty,
            request.state.time_on_task,
            request.state.comprehension_score
        ]).reshape(1, -1)
        
        # Normalize features using saved scaler
        state_normalized = SCALER.transform(state_vector)
        
        # Get model prediction
        action, _states = MODEL.predict(state_normalized, deterministic=True)
        action = int(action[0])
        
        # Map action to UI changes
        action_info = ACTION_MAP[action]
        
        # Calculate confidence (softmax over action probabilities)
        # In production, extract from policy network logits
        confidence = 0.85  # Placeholder - extract from model.policy
        
        return PredictionResponse(
            student_id=request.student_id,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            predicted_action=action,
            action_name=action_info["name"],
            action_description=action_info["description"],
            ui_changes=action_info["ui_changes"],
            confidence=confidence,
            model_version=MODEL_METADATA['version']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/batch")
async def predict_batch(requests: List[PredictionRequest]):
    """Batch prediction endpoint for multiple students"""
    if MODEL is None or SCALER is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        results = []
        for req in requests:
            pred = await predict_action(req)
            results.append(pred)
        
        return {
            "predictions": results,
            "batch_size": len(results),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.get("/actions")
async def list_actions():
    """List all available RL actions with descriptions"""
    return {
        "actions": ACTION_MAP,
        "total_actions": len(ACTION_MAP)
    }


# For local testing
if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )