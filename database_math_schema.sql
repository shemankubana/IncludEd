-- Mathematics-Specific Tables for IncludEd Platform
-- Add to existing database schema

-- Math problems table
CREATE TABLE math_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id),
    
    question TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    
    -- Visual aids
    image_url TEXT,
    diagram_type VARCHAR(50), -- 'geometry', 'graph', 'chart', etc.
    
    -- Hints and scaffolding
    hints TEXT[], -- Array of progressive hints
    step_by_step TEXT[], -- Step-by-step solution
    
    -- Answer validation
    correct_answer TEXT,
    answer_type VARCHAR(20) CHECK (answer_type IN ('numeric', 'expression', 'canvas', 'multiple_choice')),
    
    -- Metadata
    topic VARCHAR(100), -- 'fractions', 'geometry', 'algebra', etc.
    skills_required TEXT[], -- ['addition', 'multiplication', 'problem_solving']
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_math_problems_lesson ON math_problems(lesson_id);
CREATE INDEX idx_math_problems_topic ON math_problems(topic);

-- Student canvas work sessions
CREATE TABLE math_work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES math_problems(id) ON DELETE CASCADE,
    
    -- Canvas data (base64 PNG or URL to cloud storage)
    canvas_data TEXT,
    
    -- Session metadata
    saved_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, problem_id)
);

CREATE INDEX idx_work_sessions_student ON math_work_sessions(student_id);

-- Math-specific telemetry for RL model
CREATE TABLE math_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES math_problems(id) ON DELETE CASCADE,
    
    -- Canvas interaction metrics
    canvas_strokes INT DEFAULT 0,
    eraser_usage INT DEFAULT 0,
    
    -- Problem-solving behavior
    problem_attempts INT DEFAULT 0,
    hint_requests INT DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, problem_id, timestamp)
);

CREATE INDEX idx_math_telemetry_student ON math_telemetry(student_id);
CREATE INDEX idx_math_telemetry_timestamp ON math_telemetry(timestamp DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_math_problems_updated_at BEFORE UPDATE ON math_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample math problems (for testing)
INSERT INTO math_problems (lesson_id, question, difficulty, hints, step_by_step, correct_answer, answer_type, topic, skills_required)
VALUES (
    (SELECT id FROM lessons LIMIT 1), -- Replace with actual lesson ID
    'Sarah has 24 apples. She wants to share them equally among 6 friends. How many apples will each friend get?',
    'easy',
    ARRAY[
        'Think about division: sharing equally means dividing',
        'You need to divide 24 by 6',
        'Draw 6 groups and put apples in each group equally'
    ],
    ARRAY[
        'Step 1: Identify what we know - 24 apples total, 6 friends',
        'Step 2: We need to divide: 24 ÷ 6',
        'Step 3: Calculate: 24 ÷ 6 = 4',
        'Step 4: Answer: Each friend gets 4 apples'
    ],
    '4',
    'numeric',
    'division',
    ARRAY['division', 'problem_solving', 'equal_sharing']
);

COMMENT ON TABLE math_problems IS 'Mathematics problems with hints, step-by-step solutions, and visual aids';
COMMENT ON TABLE math_work_sessions IS 'Student canvas work for math problem solving';
COMMENT ON TABLE math_telemetry IS 'Extended telemetry for mathematics-specific RL optimization';
