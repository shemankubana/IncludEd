// Mathematics Lesson Component with Interactive Problem Solving
import React, { useState, useEffect } from 'react';
import MathCanvas from '../../components/MathCanvas';
import { useAuth } from '../../contexts/AuthContext';

const MathLesson = ({ lessonId }) => {
    const { getToken } = useAuth();
    const [lesson, setLesson] = useState(null);
    const [currentProblem, setCurrentProblem] = useState(0);
    const [problems, setProblems] = useState([]);
    const [showHints, setShowHints] = useState(false);
    const [stepByStep, setStepByStep] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLesson();
    }, [lessonId]);

    const fetchLesson = async () => {
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/lessons/${lessonId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setLesson(data);
                setProblems(data.math_problems || []);
            }
        } catch (error) {
            console.error('Error fetching lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSolutionSubmit = async (solution) => {
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/math/submit-solution`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        lessonId,
                        problemId: problems[currentProblem].id,
                        solution
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();
                
                // Show feedback
                if (result.correct) {
                    alert('🎉 Correct! Great work!');
                    // Move to next problem
                    if (currentProblem < problems.length - 1) {
                        setCurrentProblem(currentProblem + 1);
                    }
                } else {
                    alert('Not quite right. Try again or check the hints!');
                }
            }
        } catch (error) {
            console.error('Error submitting solution:', error);
        }
    };

    const toggleHints = () => {
        setShowHints(!showHints);
    };

    const nextStep = () => {
        if (currentStep < stepByStep.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    const problem = problems[currentProblem];

    return (
        <div className="math-lesson-container">
            <div className="lesson-header">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    📐 {lesson?.title}
                </h1>
                <div className="progress-bar">
                    <div 
                        className="progress-fill"
                        style={{ width: `${((currentProblem + 1) / problems.length) * 100}%` }}
                    />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Problem {currentProblem + 1} of {problems.length}
                </p>
            </div>

            <div className="lesson-content">
                {/* Problem Statement */}
                <div className="problem-card">
                    <div className="problem-header">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Problem {currentProblem + 1}
                        </h2>
                        <span className="difficulty-badge">
                            {problem?.difficulty || 'Medium'}
                        </span>
                    </div>
                    
                    <div className="problem-text">
                        {problem?.question}
                    </div>

                    {/* Visual Aid (if available) */}
                    {problem?.image_url && (
                        <div className="problem-image">
                            <img src={problem.image_url} alt="Problem visual" />
                        </div>
                    )}

                    {/* Hints Section */}
                    <div className="hints-section">
                        <button
                            onClick={toggleHints}
                            className="btn btn-secondary"
                        >
                            {showHints ? '🙈 Hide Hints' : '💡 Show Hints'}
                        </button>

                        {showHints && (
                            <div className="hints-content">
                                <h3 className="font-semibold mb-2">Hints:</h3>
                                <ul className="hints-list">
                                    {problem?.hints?.map((hint, idx) => (
                                        <li key={idx} className="hint-item">
                                            <span className="hint-number">{idx + 1}</span>
                                            {hint}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Step-by-Step Solution (for review) */}
                    {problem?.step_by_step && (
                        <div className="step-by-step">
                            <h3 className="font-semibold mb-3">
                                📝 Step-by-Step Solution
                            </h3>
                            <div className="steps-container">
                                <div className="step-content">
                                    <div className="step-number">
                                        Step {currentStep + 1} of {problem.step_by_step.length}
                                    </div>
                                    <p className="step-text">
                                        {problem.step_by_step[currentStep]}
                                    </p>
                                </div>
                                <div className="step-navigation">
                                    <button
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                        className="btn btn-secondary"
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        disabled={currentStep === problem.step_by_step.length - 1}
                                        className="btn btn-secondary"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Interactive Canvas */}
                <div className="workspace-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        ✏️ Your Workspace
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Use the canvas below to work out your solution. Draw diagrams, 
                        show your work, and submit when ready!
                    </p>
                    
                    <MathCanvas
                        lessonId={lessonId}
                        problemId={problem?.id}
                        onSolutionSubmit={handleSolutionSubmit}
                    />
                </div>
            </div>

            <style jsx>{`
                .math-lesson-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .lesson-header {
                    margin-bottom: 32px;
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 16px;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    transition: width 0.3s ease;
                }

                .lesson-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                .problem-card,
                .workspace-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .problem-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .difficulty-badge {
                    padding: 4px 12px;
                    background: #fef3c7;
                    color: #92400e;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .problem-text {
                    font-size: 18px;
                    line-height: 1.8;
                    color: #333;
                    margin-bottom: 24px;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #6366f1;
                }

                .problem-image {
                    margin: 24px 0;
                    text-align: center;
                }

                .problem-image img {
                    max-width: 100%;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .hints-section {
                    margin-top: 24px;
                }

                .hints-content {
                    margin-top: 16px;
                    padding: 16px;
                    background: #fef9e7;
                    border-radius: 8px;
                    border: 1px solid #f9e79f;
                }

                .hints-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .hint-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                    align-items: flex-start;
                }

                .hint-number {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    background: #f39c12;
                    color: white;
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .step-by-step {
                    margin-top: 24px;
                    padding: 20px;
                    background: #e8f5e9;
                    border-radius: 8px;
                    border: 1px solid #a5d6a7;
                }

                .steps-container {
                    margin-top: 12px;
                }

                .step-content {
                    background: white;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }

                .step-number {
                    font-size: 12px;
                    font-weight: 600;
                    color: #2e7d32;
                    margin-bottom: 8px;
                }

                .step-text {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #333;
                }

                .step-navigation {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                @media (max-width: 968px) {
                    .lesson-content {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default MathLesson;
