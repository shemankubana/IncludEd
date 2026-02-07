const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/math/save-work
 * Save student's canvas work
 */
router.post('/save-work', verifyToken, requireRole('student'), async (req, res) => {
    try {
        const { lessonId, problemId, canvasData, timestamp } = req.body;
        const { uid } = req.user;

        // Get student ID
        const studentResult = await pool.query(
            `SELECT s.id FROM students s 
             JOIN users u ON s.user_id = u.id 
             WHERE u.firebase_uid = $1`,
            [uid]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const studentId = studentResult.rows[0].id;

        // Save canvas data (store in file system or cloud storage in production)
        // For now, we'll store the base64 data in the database
        await pool.query(
            `INSERT INTO math_work_sessions (
                student_id, lesson_id, problem_id, canvas_data, saved_at
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (student_id, problem_id) 
            DO UPDATE SET canvas_data = $3, saved_at = $5`,
            [studentId, lessonId, problemId, canvasData, timestamp]
        );

        res.json({ message: 'Work saved successfully' });
    } catch (error) {
        console.error('Error saving work:', error);
        res.status(500).json({ error: 'Failed to save work' });
    }
});

/**
 * POST /api/math/submit-solution
 * Submit and evaluate student's solution
 */
router.post('/submit-solution', verifyToken, requireRole('student'), async (req, res) => {
    try {
        const { lessonId, problemId, solution } = req.body;
        const { uid } = req.user;

        // Get student ID
        const studentResult = await pool.query(
            `SELECT s.id FROM students s 
             JOIN users u ON s.user_id = u.id 
             WHERE u.firebase_uid = $1`,
            [uid]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const studentId = studentResult.rows[0].id;

        // Get problem details
        const problemResult = await pool.query(
            `SELECT * FROM math_problems WHERE id = $1`,
            [problemId]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const problem = problemResult.rows[0];

        // For canvas submissions, we'll need OCR or manual grading
        // For now, store the submission and mark for teacher review
        const submissionResult = await pool.query(
            `INSERT INTO assessment_submissions (
                student_id, assessment_id, submission_type, submission_url, 
                answers, submitted_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id`,
            [
                studentId,
                problem.assessment_id,
                solution.type,
                solution.data,
                JSON.stringify({ canvas_submission: true })
            ]
        );

        // Update telemetry
        await pool.query(
            `UPDATE lesson_progress 
             SET time_spent_minutes = time_spent_minutes + 1,
                 last_accessed_at = NOW()
             WHERE student_id = $1 AND lesson_id = $2`,
            [studentId, lessonId]
        );

        res.json({
            message: 'Solution submitted successfully',
            submissionId: submissionResult.rows[0].id,
            correct: null, // Will be graded by teacher or OCR
            requiresReview: true
        });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({ error: 'Failed to submit solution' });
    }
});

/**
 * GET /api/math/telemetry
 * Get math-specific telemetry for RL model
 */
router.get('/telemetry/:lessonId/:problemId', verifyToken, requireRole('student'), async (req, res) => {
    try {
        const { lessonId, problemId } = req.params;
        const { uid } = req.user;

        // Get student ID
        const studentResult = await pool.query(
            `SELECT s.id FROM students s 
             JOIN users u ON s.user_id = u.id 
             WHERE u.firebase_uid = $1`,
            [uid]
        );

        const studentId = studentResult.rows[0].id;

        // Get canvas activity metrics
        const telemetryResult = await pool.query(
            `SELECT 
                canvas_strokes,
                eraser_usage,
                problem_attempts,
                hint_requests,
                time_spent_seconds
             FROM math_telemetry
             WHERE student_id = $1 AND problem_id = $2
             ORDER BY timestamp DESC
             LIMIT 1`,
            [studentId, problemId]
        );

        if (telemetryResult.rows.length === 0) {
            return res.json({
                canvas_strokes: 0,
                eraser_usage: 0,
                problem_attempts: 0,
                hint_requests: 0,
                time_spent_seconds: 0
            });
        }

        res.json(telemetryResult.rows[0]);
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

/**
 * POST /api/math/track-action
 * Track math-specific actions (canvas strokes, eraser, hints)
 */
router.post('/track-action', verifyToken, requireRole('student'), async (req, res) => {
    try {
        const { lessonId, problemId, actionType, actionData } = req.body;
        const { uid } = req.user;

        // Get student ID
        const studentResult = await pool.query(
            `SELECT s.id FROM students s 
             JOIN users u ON s.user_id = u.id 
             WHERE u.firebase_uid = $1`,
            [uid]
        );

        const studentId = studentResult.rows[0].id;

        // Update or insert telemetry
        await pool.query(
            `INSERT INTO math_telemetry (
                student_id, lesson_id, problem_id, 
                canvas_strokes, eraser_usage, problem_attempts, hint_requests,
                timestamp
            ) VALUES ($1, $2, $3, 
                CASE WHEN $4 = 'stroke' THEN 1 ELSE 0 END,
                CASE WHEN $4 = 'erase' THEN 1 ELSE 0 END,
                CASE WHEN $4 = 'attempt' THEN 1 ELSE 0 END,
                CASE WHEN $4 = 'hint' THEN 1 ELSE 0 END,
                NOW()
            )
            ON CONFLICT (student_id, problem_id, timestamp)
            DO UPDATE SET
                canvas_strokes = math_telemetry.canvas_strokes + 
                    CASE WHEN $4 = 'stroke' THEN 1 ELSE 0 END,
                eraser_usage = math_telemetry.eraser_usage + 
                    CASE WHEN $4 = 'erase' THEN 1 ELSE 0 END,
                problem_attempts = math_telemetry.problem_attempts + 
                    CASE WHEN $4 = 'attempt' THEN 1 ELSE 0 END,
                hint_requests = math_telemetry.hint_requests + 
                    CASE WHEN $4 = 'hint' THEN 1 ELSE 0 END`,
            [studentId, lessonId, problemId, actionType]
        );

        res.json({ message: 'Action tracked' });
    } catch (error) {
        console.error('Error tracking action:', error);
        res.status(500).json({ error: 'Failed to track action' });
    }
});

module.exports = router;
