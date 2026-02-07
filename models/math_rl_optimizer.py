"""
Mathematics-Optimized RL Model
Enhanced telemetry tracking for math problem-solving
"""

from pydantic import BaseModel, Field
from typing import Optional
import numpy as np

class MathStudentState(BaseModel):
    """Extended state vector for mathematics learning (12 dimensions)"""
    
    # Original 8 features
    reading_speed: float = Field(..., description="Words per minute", ge=0)
    mouse_dwell_time: float = Field(..., description="Average hover time in ms", ge=0)
    scroll_hesitation: float = Field(..., description="Pause frequency per page", ge=0)
    backtrack_frequency: float = Field(..., description="Re-reading instances", ge=0)
    attention_score: float = Field(..., description="0-100 attention metric", ge=0, le=100)
    current_difficulty: int = Field(..., description="Content difficulty level 1-5", ge=1, le=5)
    time_on_task: float = Field(..., description="Minutes on current content", ge=0)
    comprehension_score: float = Field(..., description="Last quiz score 0-100", ge=0, le=100)
    
    # Math-specific features (4 new dimensions)
    canvas_strokes: int = Field(..., description="Number of pen strokes on canvas", ge=0)
    eraser_usage: int = Field(..., description="Number of eraser actions", ge=0)
    problem_attempts: int = Field(..., description="Number of submission attempts", ge=0)
    hint_requests: int = Field(..., description="Number of hints requested", ge=0)
    
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
                "comprehension_score": 58.3,
                "canvas_strokes": 45,
                "eraser_usage": 8,
                "problem_attempts": 2,
                "hint_requests": 1
            }
        }


# Extended action map for mathematics
MATH_ACTION_MAP = {
    0: {
        "name": "maintain",
        "description": "Continue with current settings",
        "ui_changes": []
    },
    1: {
        "name": "increase_text_size",
        "description": "Increase font size for problem statement",
        "ui_changes": [
            {"type": "font_size", "value": 20},
            {"type": "line_height", "value": 2.0}
        ]
    },
    2: {
        "name": "activate_tts",
        "description": "Read problem aloud with text-to-speech",
        "ui_changes": [
            {"type": "tts_enabled", "value": True},
            {"type": "highlight_current_word", "value": True}
        ]
    },
    3: {
        "name": "insert_break",
        "description": "Suggest 2-minute attention break",
        "ui_changes": [
            {"type": "show_break_modal", "value": True},
            {"type": "break_duration", "value": 120}
        ]
    },
    4: {
        "name": "show_visual_aid",
        "description": "Display visual diagram or illustration",
        "ui_changes": [
            {"type": "show_visual_aid", "value": True},
            {"type": "visual_type", "value": "diagram"}
        ]
    },
    5: {
        "name": "enable_grid_snap",
        "description": "Enable grid snapping for cleaner drawings",
        "ui_changes": [
            {"type": "snap_to_grid", "value": True},
            {"type": "show_grid", "value": True}
        ]
    },
    6: {
        "name": "suggest_hint",
        "description": "Offer a hint for the current problem",
        "ui_changes": [
            {"type": "show_hint_suggestion", "value": True},
            {"type": "hint_level", "value": 1}
        ]
    },
    7: {
        "name": "show_step_by_step",
        "description": "Display step-by-step solution guide",
        "ui_changes": [
            {"type": "show_steps", "value": True},
            {"type": "current_step", "value": 0}
        ]
    }
}


def detect_math_struggle_patterns(state: MathStudentState) -> dict:
    """
    Analyze math-specific telemetry to detect struggle patterns
    
    Returns:
        dict: Detected patterns and recommended interventions
    """
    patterns = {
        "struggling": False,
        "pattern_type": None,
        "recommended_action": 0,
        "confidence": 0.0
    }
    
    # Pattern 1: Excessive erasing (frustration/uncertainty)
    if state.eraser_usage > 10 and state.canvas_strokes > 20:
        erase_ratio = state.eraser_usage / state.canvas_strokes
        if erase_ratio > 0.3:  # More than 30% erasing
            patterns["struggling"] = True
            patterns["pattern_type"] = "excessive_erasing"
            patterns["recommended_action"] = 6  # Suggest hint
            patterns["confidence"] = min(erase_ratio, 0.95)
    
    # Pattern 2: Multiple failed attempts without hints
    if state.problem_attempts >= 2 and state.hint_requests == 0:
        patterns["struggling"] = True
        patterns["pattern_type"] = "avoiding_help"
        patterns["recommended_action"] = 6  # Suggest hint
        patterns["confidence"] = 0.85
    
    # Pattern 3: Low canvas activity (not engaging with problem)
    if state.time_on_task > 5 and state.canvas_strokes < 10:
        patterns["struggling"] = True
        patterns["pattern_type"] = "low_engagement"
        patterns["recommended_action"] = 4  # Show visual aid
        patterns["confidence"] = 0.75
    
    # Pattern 4: Reading problem repeatedly (comprehension issue)
    if state.backtrack_frequency > 15 and state.canvas_strokes < 5:
        patterns["struggling"] = True
        patterns["pattern_type"] = "comprehension_difficulty"
        patterns["recommended_action"] = 2  # Activate TTS
        patterns["confidence"] = 0.80
    
    # Pattern 5: Attention dropping (ADHD pattern)
    if state.attention_score < 50 and state.time_on_task > 10:
        patterns["struggling"] = True
        patterns["pattern_type"] = "attention_fatigue"
        patterns["recommended_action"] = 3  # Insert break
        patterns["confidence"] = 0.90
    
    # Pattern 6: Many hints requested (needs step-by-step)
    if state.hint_requests >= 3:
        patterns["struggling"] = True
        patterns["pattern_type"] = "needs_scaffolding"
        patterns["recommended_action"] = 7  # Show step-by-step
        patterns["confidence"] = 0.88
    
    return patterns


def calculate_math_reward(
    previous_state: MathStudentState,
    current_state: MathStudentState,
    action_taken: int
) -> float:
    """
    Calculate reward for math-specific RL training
    
    Rewards positive behaviors:
    - Increased canvas engagement
    - Reduced erasing (more confident)
    - Successful problem completion
    - Appropriate hint usage
    """
    reward = 0.0
    
    # Reward increased engagement
    if current_state.canvas_strokes > previous_state.canvas_strokes:
        reward += 0.1
    
    # Reward reduced erasing (more confidence)
    if current_state.eraser_usage < previous_state.eraser_usage:
        reward += 0.15
    
    # Reward comprehension improvement
    comp_improvement = current_state.comprehension_score - previous_state.comprehension_score
    reward += comp_improvement * 0.01
    
    # Reward attention maintenance
    attention_improvement = current_state.attention_score - previous_state.attention_score
    reward += attention_improvement * 0.005
    
    # Penalize excessive hint requests (encourage independence)
    if current_state.hint_requests > 5:
        reward -= 0.2
    
    # Reward successful problem completion
    if current_state.comprehension_score >= 70:
        reward += 1.0
    
    return reward
